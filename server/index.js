import { GoogleGenAI } from "@google/genai";
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json());

// Imagen API proxy endpoint (Updated to use Gemini 2.5 Flash Image via SDK)
app.post('/api/gemini/imagen', async (req, res) => {
  try {
    const { prompt, aspectRatio } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('📸 Generating image with prompt:', prompt.substring(0, 100) + '...');
    console.log('🤖 Model: gemini-2.5-flash-image');

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Add "generate an image" context to the prompt mostly for safety/clarity
    // The specific model usage is what triggers image generation
    const contents = [
      { text: prompt }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: contents,
      config: {
        responseMimeType: 'application/json'
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No candidates returned from Gemini');
    }

    const parts = response.candidates[0].content.parts;
    let base64Image = null;

    // Search for image data in the response parts
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) {
      // If no image found, check if there's a text refusal
      const textPart = parts.find(p => p.text);
      if (textPart) {
        console.warn('⚠️ Model returned text instead of image:', textPart.text);

        // Check for common policy violation messages
        if (textPart.text.includes('policy') || textPart.text.includes('violates')) {
          return res.status(400).json({
            error: 'Image generation blocked by safety policy',
            details: textPart.text
          });
        }
      }
      throw new Error('No image data found in response');
    }

    console.log('✅ Image generated successfully via SDK');

    // Return in the format expected by the frontend
    // Use the exact structure the frontend expects or specific predictions format
    res.json({
      predictions: [
        {
          bytesBase64Encoded: base64Image,
          mimeType: 'image/png'
        }
      ]
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
