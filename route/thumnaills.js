import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import { upload, cloudinary } from '../config/cloudinary.js';
import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';

dotenv.config();

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY_T;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${GEMINI_API_KEY}`;

// Helper to wrap text for canvas
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lines = [];

  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + ' ';
    let metrics = ctx.measureText(testLine);
    let testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  return lines;
}

// -----------------------------
// POST /api/thumbnails/generate
// -----------------------------
router.post('/generate', upload.single('image'), async (req, res) => {
  try {
    const { prompt, thumbnailText, promptStrength = 0.75 } = req.body;
    const file = req.file;

    if (!prompt || !file?.path) {
      return res.status(400).json({
        success: false,
        error: 'Prompt and image are required',
      });
    }

    console.log('📝 User Prompt:', prompt);
    console.log('✍️ Thumbnail Text:', thumbnailText);
    console.log('🖼 Image URL:', file.path);
    console.log('🤖 Model: gemini-3-pro-preview');

    // -----------------------------
    // Enhance prompt (professional thumbnails)
    // -----------------------------
    const enhancedPrompt = `
      Create a professional high-impact YouTube thumbnail background based on the attached image.
      Style: ${prompt}
      Visual Requirements:
      - Cinematic lighting, ultra-detailed, sharp focus, high contrast.
      - Studio quality, vibrant colors, realistic textures.
      - Dramatic composition, professional photography style.
      - Keep the subject recognizable but enhance the overall look.
    `.replace(/\s+/g, ' ').trim();

    console.log('🖌 Enhanced Prompt:', enhancedPrompt);

    // -----------------------------
    // Gemini-3-Pro-Preview Multimodal Generation
    // -----------------------------
    let imageBase64;
    // Handle Cloudinary URLs
    if (file.path.startsWith('http')) {
      const imgResp = await axios.get(file.path, { responseType: 'arraybuffer' });
      imageBase64 = Buffer.from(imgResp.data).toString('base64');
    } else {
      imageBase64 = fs.readFileSync(file.path).toString('base64');
    }

    console.log('🚀 Sending request to Gemini-3-Pro-Preview...');

    // Using generative content multimodal input to prompt generation
    const geminiResponse = await axios.post(
      GEMINI_URL,
      {
        contents: [
          {
            parts: [
              { text: enhancedPrompt },
              {
                inline_data: {
                  mime_type: "image/png",
                  data: imageBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
        }
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    // Extract generated image (In 2026, Gemini outputs image parts directly)
    const outputPart = geminiResponse.data.candidates?.[0]?.content?.parts?.find(p => p.inline_data || p.file_data);
    let generatedImageBuffer;

    if (outputPart?.inline_data) {
      generatedImageBuffer = Buffer.from(outputPart.inline_data.data, 'base64');
    } else {
      console.error('❌ Gemini Response:', JSON.stringify(geminiResponse.data, null, 2));
      throw new Error('Gemini-3-Pro-Preview did not return a generated image part.');
    }

    console.log('✅ AI Background generated via Gemini-3');

    // -----------------------------
    // Professional YouTuber Text Styling (Reference Match)
    // -----------------------------
    const canvas = createCanvas(1024, 1024);
    const ctx = canvas.getContext('2d');

    // Load AI Image
    const baseImage = await loadImage(generatedImageBuffer);
    ctx.drawImage(baseImage, 0, 0, 1024, 1024);

    if (thumbnailText && thumbnailText.trim().length > 0) {
      console.log('🎨 Applying Premium Text Compositing...');

      const words = thumbnailText.toUpperCase().split(/\s+/);

      // Setup Base Text Properties
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const startX = 60;
      let currentY = 80;

      words.forEach((word, index) => {
        if (!word) return;

        // Dynamic Font Size
        const fontSize = word.length > 8 ? 140 : 180;
        ctx.font = `bold ${fontSize}px sans-serif`;

        // Create Premium Gradient based on index
        let gradient = ctx.createLinearGradient(0, currentY, 0, currentY + fontSize);
        if (index % 3 === 0) {
          gradient.addColorStop(0, '#FFD700'); // Yellow
          gradient.addColorStop(1, '#FF8C00'); // Orange
        } else if (index % 3 === 1) {
          gradient.addColorStop(0, '#00CCFF'); // Sky Blue
          gradient.addColorStop(1, '#0066FF'); // Deep Blue
        } else {
          gradient.addColorStop(0, '#00FF88'); // Spring Green
          gradient.addColorStop(1, '#009944'); // Dark Green
        }

        // 1. Draw Massive Shadow/Glow (Bottom Layer)
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 10;

        // 2. Draw Thick Outer White Stroke
        ctx.lineWidth = 22;
        ctx.strokeStyle = 'white';
        ctx.strokeText(word, startX, currentY);

        // 3. Draw Inner Black Border for contrast
        ctx.shadowBlur = 0; // Turn off shadow for inner stroke
        ctx.lineWidth = 8;
        ctx.strokeStyle = 'black';
        ctx.strokeText(word, startX, currentY);

        // 4. Draw Final Gradient Fill
        ctx.fillStyle = gradient;
        ctx.fillText(word, startX, currentY);

        // Move to next line
        currentY += fontSize * 0.95;
      });
    }

    // Convert Canvas to Buffer
    const buffer = canvas.toBuffer('image/png');

    // Upload final result to Cloudinary
    console.log('☁️ Uploading final thumbnail to Cloudinary...');
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'aiinsight/thumbnails' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    console.log('✅ Final Thumbnail URL:', uploadResult.secure_url);

    // Upload AI Background to Cloudinary first
    const bgUploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'aiinsight/backgrounds' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(generatedImageBuffer);
    });

    // -----------------------------
    // Response
    // -----------------------------
    res.json({
      success: true,
      tool: 'Gemini-3-Pro-Preview + Canvas',
      output: {
        originalImageUrl: file.path,
        aiBackgroundUrl: bgUploadResult.secure_url,
        thumbnailUrl: uploadResult.secure_url,
        caption: enhancedPrompt,
        thumbnailText: thumbnailText,
      },
    });
  } catch (err) {
    console.error('🔥 Error:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      error: 'Thumbnail generation failed',
      details: err.response?.data || err.message,
    });
  } finally {
    // Clean up local file if it exists
    if (req.file?.path && !req.file.path.startsWith('http') && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

export default router;

