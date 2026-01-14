import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local first (Vite convention), then .env as fallback
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for images
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Generic Gemini Proxy (Text/Vision)
app.post('/api/gemini', async (req, res) => {
  try {
    let { contents, config, prompt, image, model: modelName } = req.body;

    // Log input simplified for debugging
    console.log('📥 Proxy Input:', {
      hasContents: !!contents,
      hasPrompt: !!prompt,
      hasImage: !!image,
      modelName
    });

    // Validar e construir contents se vier no formato simplificado (prompt + image)
    if (!contents && prompt) {
      const parts = [{ text: prompt }];

      if (image) {
        // Ensure clean base64
        const cleanData = image.data && image.data.includes('base64,')
          ? image.data.split('base64,')[1]
          : image.data;

        if (cleanData) {
          parts.push({
            inlineData: {
              mimeType: image.mimeType,
              data: cleanData
            }
          });
        }
      }
      contents = [{ role: 'user', parts }];
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: modelName || "gemini-3-flash-preview",
      generationConfig: config
    });

    console.log('📝 Proxying request to model:', model.model);

    // Validate contents exists
    if (!contents) {
      return res.status(400).json({ error: 'Contents is required' });
    }

    // NORMALIZE CONTENTS - Critical Fix for "request is not iterable"
    // Ensure contents is ALWAYS an array of Content objects
    let contentsArray = [];
    if (Array.isArray(contents)) {
      contentsArray = contents;
    } else {
      // If single object, wrap in array
      contentsArray = [contents];
    }

    // Explicitly handle the call with deep logging if it fails
    try {
      // SDK always expects { contents: Content[] } structure for consistency
      const result = await model.generateContent({ contents: contentsArray });
      const response = await result.response;

      // Return compatible structure
      res.json({
        candidates: [
          {
            content: {
              parts: [{ text: response.text() }]
            }
          }
        ]
      });
    } catch (sdkError) {
      console.error('❌ SDK Error:', sdkError);
      console.error('   Request Payload (first item):', JSON.stringify(contentsArray[0]).substring(0, 200) + '...');

      // Return a cleaner error to frontend
      res.status(500).json({
        error: 'Gemini SDK Error',
        message: sdkError.message,
        details: sdkError.toString()
      });
    }

  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(error.status || 500).json({
      error: 'Gemini Proxy Error',
      message: error.message
    });
  }
});

// Gemini 3 Pro Image Generation endpoint
app.post('/api/gemini/imagen', async (req, res) => {
  try {
    const { prompt, aspectRatio, imageSize, useGoogleSearch } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('📸 Generating image with prompt:', prompt.substring(0, 100) + '...');
    console.log('🤖 Model: gemini-3-pro-image-preview');
    console.log('📐 Aspect Ratio:', aspectRatio || '16:9', '| Size:', imageSize || '2K');

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Use Gemini 3 Pro Image for high-quality image generation
    const model = genAI.getGenerativeModel({
      model: "gemini-3-pro-image-preview",
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      }
    });

    const contents = [
      { role: "user", parts: [{ text: prompt }] }
    ];

    const response = await model.generateContent({ contents });

    if (!response.response?.candidates || response.response.candidates.length === 0) {
      throw new Error('No candidates returned from Gemini');
    }

    const parts = response.response.candidates[0].content.parts;
    let base64Image = null;
    let imageMimeType = 'image/png';

    // Search for image data in the response parts
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        base64Image = part.inlineData.data;
        imageMimeType = part.inlineData.mimeType || 'image/png';
        break;
      }
    }

    if (!base64Image) {
      // If no image found, check if there's a text refusal
      const textPart = parts.find(p => p.text);
      if (textPart) {
        console.warn('⚠️ Model returned text instead of image:', textPart.text);

        // Check for common policy violation messages
        if (textPart.text.includes('policy') || textPart.text.includes('violates') || textPart.text.includes('cannot')) {
          return res.status(400).json({
            error: 'Image generation blocked by safety policy',
            details: textPart.text
          });
        }
      }
      throw new Error('No image data found in response');
    }

    console.log('✅ Image generated successfully with Gemini 3 Pro Image');

    // Return in the format expected by the frontend
    res.json({
      predictions: [
        {
          bytesBase64Encoded: base64Image,
          mimeType: imageMimeType
        }
      ],
      groundingMetadata: response.response.candidates[0].groundingMetadata
    });

  } catch (error) {
    console.error('❌ Server error:', error);

    // Handle SDK specific errors
    if (error.response) {
      console.error('SDK Response Error:', error.response);
      if (error.status === 400 || error.status === 404) {
        return res.status(error.status).json({
          error: 'Gemini API Error',
          details: error.message
        });
      }
    }

    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Gemini 3 with Thinking Level support
app.post('/api/gemini/v3', async (req, res) => {
  try {
    const { prompt, image, tools, responseMimeType, thinkingLevel, mediaResolution, model: modelName } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('🧠 V3 Request - Thinking Level:', thinkingLevel || 'default');

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Build generation config with thinking level
    const generationConfig = {};
    if (thinkingLevel) {
      generationConfig.thinkingConfig = { thinkingLevel };
    }
    if (responseMimeType) {
      generationConfig.responseMimeType = responseMimeType;
    }

    const model = genAI.getGenerativeModel({
      model: modelName || "gemini-3-flash-preview",
      generationConfig
    });

    // Build request parts
    const parts = [{ text: prompt }];

    if (image) {
      // Ensure clean base64
      const cleanData = image.data && image.data.includes('base64,')
        ? image.data.split('base64,')[1]
        : image.data;

      if (cleanData) {
        parts.push({
          inlineData: {
            mimeType: image.mimeType,
            data: cleanData
          }
        });
      }
    }

    const contents = [{ role: 'user', parts }];

    console.log('📝 V3 Proxying request to model:', modelName || 'gemini-3-flash-preview');

    const result = await model.generateContent({ contents });
    const response = await result.response;

    // Return compatible structure
    res.json({
      candidates: [
        {
          content: {
            parts: [{ text: response.text() }]
          },
          thoughtsText: response.candidates?.[0]?.content?.parts?.find(p => p.thought)?.text
        }
      ]
    });

  } catch (error) {
    console.error('❌ V3 Proxy error:', error);
    res.status(error.status || 500).json({
      error: 'Gemini V3 Proxy Error',
      message: error.message
    });
  }
});

// Fallback image proxy - avoids CORS issues with external image services
app.get('/api/fallback-image', async (req, res) => {
  try {
    const { query } = req.query;
    const searchTerm = encodeURIComponent(query || 'travel');
    const unsplashUrl = `https://source.unsplash.com/random/1920x1080/?${searchTerm}`;

    console.log('🖼️ Fetching fallback image for:', searchTerm);

    const response = await fetch(unsplashUrl, { redirect: 'follow' });
    const finalUrl = response.url; // Unsplash redirects to actual image

    console.log('✅ Fallback image URL:', finalUrl);
    res.json({ url: finalUrl });

  } catch (error) {
    console.error('❌ Fallback image error:', error);
    res.status(500).json({ error: 'Failed to fetch fallback image' });
  }
});

// Generic Image Proxy to bypass CORS/403
app.get('/api/proxy-image', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const decodedUrl = decodeURIComponent(url);
    console.log('🔄 Proxying image:', decodedUrl);

    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('❌ Proxy Image Error:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

// =============================================================================
// Document Processing Pipeline
// =============================================================================

// Multer configuration for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

// Document type classification prompt
const classifyDocumentPrompt = `
Analise esta imagem e classifique o tipo de documento.
Categorias possíveis:
- flight (Passagens aéreas, cartões de embarque, e-tickets)
- hotel (Reservas de hotel, confirmações de Airbnb/Booking)
- car (Comprovantes de aluguel de carro)
- train (Bilhetes de trem/metrô)
- bus (Passagens de ônibus)
- insurance (Apólices de seguro viagem)
- passport (Página de identificação do passaporte)
- visa (Vistos de viagem)
- activity (Ingressos, tickets de passeios)
- other (Outros documentos não listados)

Retorne APENAS um JSON: {"type": "categoria", "confidence": 0.0-1.0}
`;

// Document analysis prompts by type
const getExtractionPrompt = (docType) => {
  const fieldsByType = {
    flight: `
    - airline (Nome da companhia aérea)
    - flightNumber (Número do voo. IMPORTANTE: Deve ter código da cia + 3 ou 4 dígitos, ex: LA3040, G31234)
    - pnr (Código de Reserva / Localizador. Geralmente 6 caracteres alfanuméricos)
    - ticketNumber (Número do E-Ticket / Bilhete. Geralmente 13 dígitos)
    - departureAirport (Código IATA da origem, ex: GRU)
    - arrivalAirport (Código IATA do destino, ex: JFK)
    - departureDate (Data de partida YYYY-MM-DD)
    - arrivalDate (Data de chegada YYYY-MM-DD)
    - departureTime (Horário de partida HH:MM)
    - arrivalTime (Horário de chegada HH:MM)
    - terminal (Terminal de embarque)
    - gate (Portão de embarque)
    - seat (Assento)
    - class (Classe, ex: Econômica)
    `,
    hotel: `
    - hotelName (Nome do hotel)
    - address (Endereço completo)
    - checkInDate (Data de entrada YYYY-MM-DD)
    - checkInTime (Horário de check-in)
    - checkOutDate (Data de saída YYYY-MM-DD)
    - checkOutTime (Horário de check-out)
    - roomType (Tipo de quarto)
    - confirmationNumber (Número da confirmação)
    - guestName (Nome do hóspede)
    `,
    car: `
    - company (Empresa locadora)
    - pickupLocation (Local de retirada)
    - pickupDate (Data de retirada YYYY-MM-DD)
    - pickupTime (Horário de retirada)
    - dropoffLocation (Local de devolução)
    - dropoffDate (Data de devolução YYYY-MM-DD)
    - dropoffTime (Horário de devolução)
    - vehicleModel (Modelo do carro)
    - confirmationNumber (Número da reserva)
    `,
    insurance: `
    - provider (Seguradora)
    - policyNumber (Número da apólice)
    - insuredName (Nome do segurado)
    - coverageStart (Início da vigência YYYY-MM-DD)
    - coverageEnd (Fim da vigência YYYY-MM-DD)
    - emergencyPhone (Telefone de emergência)
    `,
    other: `
    - name (Nome principal do serviço/entidade)
    - date (Data principal YYYY-MM-DD)
    - reference (Código de referência)
    - details (Descrição curta)
    `
  };

  const fields = fieldsByType[docType] || fieldsByType.other;

  return `Analise esta imagem de um documento do tipo "${docType}".
Extraia os seguintes campos específicos para CADA item encontrado:
${fields}

IMPORTANTE: Se houver múltiplos itens (ex: vários voos em um itinerário), extraia TODOS eles.

Retorne um JSON com a seguinte estrutura:
{
  "type": "${docType}",
  "items": [
    {
      "fields": {
        "nomeDoCampo": { "value": "valor extraído", "confidence": 0.0-1.0 },
        ...
      },
      "overallConfidence": 0.0-1.0
    }
  ]
}

Regras:
1. Se um campo não for encontrado, NÃO o inclua ou retorne null no value.
2. Para datas, use SEMPRE o formato YYYY-MM-DD.
3. Confidence deve refletir sua certeza sobre a leitura (1.0 = certeza absoluta, 0.5 = incerto).
4. Se houver múltiplos itens, inclua TODOS no array "items".
5. Se houver apenas 1 item, retorne um array com 1 elemento.
`;
};

// Helper to clean JSON from markdown blocks
const parseJsonResponse = (text) => {
  const cleanText = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  return JSON.parse(cleanText);
};

// Document Processing Endpoint
app.post('/api/process-document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const { buffer, mimetype, originalname } = req.file;
    console.log(`📄 Processing document: ${originalname} (${mimetype})`);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    let contentParts = [];
    let extractedText = null;

    // Handle PDFs
    if (mimetype === 'application/pdf') {
      console.log('📑 Extracting text from PDF...');
      try {
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
        console.log(`   Extracted ${extractedText.length} characters from PDF`);

        // For text-based PDFs, use text extraction
        if (extractedText && extractedText.trim().length > 100) {
          contentParts = [
            { text: `Aqui está o conteúdo extraído de um documento PDF:\n\n${extractedText}\n\n` }
          ];
        } else {
          // Fallback: treat PDF as image (first page) - not ideal without additional deps
          console.warn('   PDF has little text, sending as base64...');
          contentParts = [
            { inlineData: { mimeType: 'application/pdf', data: buffer.toString('base64') } }
          ];
        }
      } catch (pdfError) {
        console.error('   PDF parsing error:', pdfError.message);
        // Fallback to sending raw PDF
        contentParts = [
          { inlineData: { mimeType: 'application/pdf', data: buffer.toString('base64') } }
        ];
      }
    } else {
      // Handle images
      contentParts = [
        { inlineData: { mimeType: mimetype, data: buffer.toString('base64') } }
      ];
    }

    // Step 1: Classify document type
    console.log('🔍 Step 1: Classifying document type...');
    const classifyResult = await model.generateContent({
      contents: [{ parts: [...contentParts, { text: classifyDocumentPrompt }] }]
    });
    const classifyResponse = await classifyResult.response;
    const classifyText = classifyResponse.text();

    let classification;
    try {
      classification = parseJsonResponse(classifyText);
    } catch (e) {
      console.error('   Classification parse error:', e.message);
      classification = { type: 'other', confidence: 0.5 };
    }

    console.log(`   Document classified as: ${classification.type} (confidence: ${classification.confidence})`);

    // Step 2: Extract data based on document type
    console.log(`🔍 Step 2: Extracting data for type "${classification.type}"...`);
    const extractionPrompt = getExtractionPrompt(classification.type);

    const extractResult = await model.generateContent({
      contents: [{ parts: [...contentParts, { text: extractionPrompt }] }]
    });
    const extractResponse = await extractResult.response;
    const extractText = extractResponse.text();

    let extractedData;
    try {
      extractedData = parseJsonResponse(extractText);
    } catch (e) {
      console.error('   Extraction parse error:', e.message);
      return res.status(422).json({
        error: 'Failed to parse extraction response',
        rawResponse: extractText.substring(0, 500),
        classification
      });
    }

    console.log(`   Extracted ${extractedData.items?.length || 0} item(s)`);

    // Step 3: Basic validation (Zod is TypeScript, so we do basic JS validation here)
    const validatedItems = (extractedData.items || []).map((item, idx) => {
      const warnings = [];
      const fields = item.fields || {};

      // Date format validation
      for (const [key, fieldData] of Object.entries(fields)) {
        if (key.toLowerCase().includes('date') && fieldData?.value) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(fieldData.value)) {
            warnings.push(`${key}: Invalid date format (expected YYYY-MM-DD)`);
          }
        }
        if (key.toLowerCase().includes('time') && fieldData?.value) {
          if (!/^\d{2}:\d{2}$/.test(fieldData.value)) {
            warnings.push(`${key}: Invalid time format (expected HH:MM)`);
          }
        }
      }

      // IATA code validation for flights
      if (classification.type === 'flight') {
        for (const key of ['departureAirport', 'arrivalAirport']) {
          if (fields[key]?.value && fields[key].value.length !== 3) {
            warnings.push(`${key}: Should be 3-letter IATA code`);
          }
        }
      }

      return {
        ...item,
        itemIndex: idx + 1,
        validationWarnings: warnings,
        isValid: warnings.length === 0
      };
    });

    const response = {
      success: true,
      classification,
      data: {
        type: extractedData.type || classification.type,
        items: validatedItems
      },
      metadata: {
        filename: originalname,
        mimetype,
        processedAt: new Date().toISOString(),
        hasValidationWarnings: validatedItems.some(i => i.validationWarnings.length > 0)
      },
      // Include raw text if PDF was parsed
      ...(extractedText && { rawText: extractedText.substring(0, 2000) })
    };

    console.log('✅ Document processing complete');
    res.json(response);

  } catch (error) {
    console.error('❌ Document processing error:', error);
    res.status(500).json({
      error: 'Document processing failed',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    apiKeyConfigured: !!GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`   Gemini API Key: ${GEMINI_API_KEY ? '✓ Configured' : '✗ Missing'}`);
});
