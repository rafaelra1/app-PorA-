import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'], // Vite dev and preview ports
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Get API key from environment (server-side only)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('WARNING: GEMINI_API_KEY not found in environment variables');
}

// Gemini API proxy endpoint
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt, image, tools, responseMimeType } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    // Build request body
    const parts = [{ text: prompt }];

    if (image) {
      parts.push({
        inline_data: {
          mime_type: image.mimeType,
          data: image.data
        }
      });
    }

    const body = {
      contents: [{ parts }]
    };

    if (tools) {
      body.tools = tools;
    }

    if (responseMimeType) {
      body.generationConfig = { response_mime_type: responseMimeType };
    }

    // Call Gemini API
    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return res.status(response.status).json({
        error: `Gemini API error: ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Imagen API proxy endpoint
app.post('/api/gemini/imagen', async (req, res) => {
  try {
    const { prompt, aspectRatio, negativePrompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Using gemini-3-pro-image-preview compliant with user request (Attempt 2)
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

    const body = {
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspectRatio || '16:9',
        negativePrompt: negativePrompt || 'blurry, low quality, distorted, ugly, watermark, text',
        safetySetting: 'block_some',
        personGeneration: 'allow_adult'
      }
    };

    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Imagen API error:', errorText);
      return res.status(response.status).json({
        error: `Imagen API error: ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
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
