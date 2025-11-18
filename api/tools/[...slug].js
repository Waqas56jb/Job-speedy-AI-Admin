import { Router } from 'express';
import { getDbPool } from '../../server/src/pg.js';
import OpenAI from 'openai';
import multer from 'multer';
import pdfParse from 'pdf-parse';

const router = Router();
const upload = multer(); // memory storage

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/tools/extract-skills - extract skills from uploaded PDF using OpenAI
router.post('/extract-skills', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const pdfBuffer = req.file.buffer;
    const pdfData = await pdfParse(pdfBuffer).catch(() => null);
    const text = pdfData?.text?.slice(0, 100000) || '';

    if (!text) {
      return res.status(400).json({ error: 'Could not read PDF text' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const prompt = `You are a resume parser. From the resume text below, extract a well-structured JSON object with the following schema ONLY (no extra commentary):
{
  "contact": { "name": "string", "email": "string", "phone": "string", "location": "string" },
  "summary": "string",
  "skills": ["string", "string"],
  "experience": [
    { "title": "string", "company": "string", "start_date": "string", "end_date": "string", "responsibilities": ["string"] }
  ],
  "education": [
    { "degree": "string", "institution": "string", "year": "string" }
  ],
  "certifications": ["string"],
  "languages": ["string"],
  "links": ["string"]
}
Fill missing values as empty strings/arrays. Keep lists concise and deduplicated.
Resume text:\n\n${text.substring(0, 12000)}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You extract skills from resumes and return clean JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      const m = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      if (m) {
        parsed = JSON.parse(m[1]);
      }
    }

    const skills = (parsed.skills || []).map(s => String(s).trim()).filter(Boolean);
    parsed.skills = skills;
    if (!parsed.contact) parsed.contact = { name: '', email: '', phone: '', location: '' };
    if (!Array.isArray(parsed.experience)) parsed.experience = [];
    if (!Array.isArray(parsed.education)) parsed.education = [];
    if (!Array.isArray(parsed.certifications)) parsed.certifications = [];
    if (!Array.isArray(parsed.languages)) parsed.languages = [];
    if (!Array.isArray(parsed.links)) parsed.links = [];

    return res.json({ parsed });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('extract-skills error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default function handler(req, res) {
  return router(req, res);
}
