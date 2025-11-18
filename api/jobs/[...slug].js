import { Router } from 'express';
import { getDbPool } from '../../server/src/pg.js';
import OpenAI from 'openai';

const router = Router();
const pool = getDbPool();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Generate job ad using OpenAI
router.post('/generate-ad', async (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional HR assistant that creates complete job postings.
          Return output strictly as a JSON object with this structure:
          {
            "title": "string",
            "company": "string",
            "description": "string",
            "required_skills": "string (comma-separated)",
            "location": "string",
            "job_type": "string",
            "category": "string",
            "language": "string"
          }`
        },
        {
          role: "user",
          content: `Generate a professional job post based on this input: ${description}`
        }
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    let jobData;

    try {
      jobData = JSON.parse(content);
    } catch (e) {
      // Fallback if JSON is wrapped in code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jobData = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Invalid JSON format from OpenAI response');
      }
    }

    // Fill missing fields with default empty strings to avoid undefined values
    const job = {
      title: jobData.title || "",
      company: jobData.company || "",
      description: jobData.description || "",
      required_skills: jobData.required_skills || "",
      location: jobData.location || "",
      job_type: jobData.job_type || "",
      category: jobData.category || "",
      language: jobData.language || "",
    };

    res.json({ success: true, jobAd: job });
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ error: `Failed to generate job ad: ${err.message}` });
  }
});

// ✅ Get all jobs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC');
    res.json({ success: true, jobs: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Post a new job — used when clicking "Post Job"
router.post('/', async (req, res) => {
  const { title, company, description, required_skills, location, job_type, category, language } = req.body;

  if (!title || !company) {
    return res.status(400).json({ error: 'Title and company are required' });
  }

  // Convert required_skills string to array if it's a string
  let skillsArray = [];
  if (typeof required_skills === 'string') {
    skillsArray = required_skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
  } else if (Array.isArray(required_skills)) {
    skillsArray = required_skills;
  }

  try {
    const result = await pool.query(
      `INSERT INTO jobs (title, company, description, required_skills, location, job_type, category, language, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [title, company, description, skillsArray, location, job_type, category, language]
    );

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      job: result.rows[0],
    });
  } catch (err) {
    console.error('Database insert error:', err);
    res.status(500).json({ error: 'Failed to post job' });
  }
});

// ✅ Update job
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, company, description, required_skills, location, job_type, category, language } = req.body;

  // Convert required_skills string to array if it's a string
  let skillsArray = required_skills;
  if (typeof required_skills === 'string') {
    skillsArray = required_skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  try {
    const result = await pool.query(
      `UPDATE jobs
       SET title = COALESCE($1, title),
           company = COALESCE($2, company),
           description = COALESCE($3, description),
           required_skills = COALESCE($4, required_skills),
           location = COALESCE($5, location),
           job_type = COALESCE($6, job_type),
           category = COALESCE($7, category),
           language = COALESCE($8, language),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [title, company, description, skillsArray, location, job_type, category, language, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ success: true, job: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete job
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM jobs WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/:id/candidates - list users who applied to a given job
router.get('/:id/candidates', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `select
         u.id as user_id,
         coalesce(u.full_name, a.name) as full_name,
         coalesce(u.email, a.email) as email,
         a.id as application_id,
         a.status as application_status,
         a.ai_parsed_data,
         a.created_at as applied_at
       from applications a
       left join users u on (u.id = a.user_id) or (lower(u.email) = lower(a.email))
       where a.job_id = $1
       order by a.created_at desc`,
      [id]
    );
    res.json({ candidates: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/stats/weekly - get weekly application stats
router.get('/stats/weekly', async (req, res) => {
  try {
    const result = await pool.query(
      `select
        date_trunc('week', created_at) as week_start,
        count(*) as count
      from applications
      where created_at >= now() - interval '49 days'
      group by date_trunc('week', created_at)
      order by week_start`
    );
    res.json({ weekly: result.rows });
  } catch (err) {
    console.error('Error fetching weekly stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/:id/xml-feed/:portal - generate XML feed for specific job portal
router.get('/:id/xml-feed/:portal', async (req, res) => {
  const { id, portal } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM jobs WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = result.rows[0];
    let xml = '';

    // Generate XML based on portal type
    if (portal.toLowerCase() === 'indeed') {
      // Indeed XML Feed Format
      xml = `<?xml version="1.0" encoding="UTF-8"?>
<jobs>
  <job>
    <title><![CDATA[${job.title || ''}]]></title>
    <company><![CDATA[${job.company || ''}]]></company>
    <location><![CDATA[${job.location || ''}]]></location>
    <jobtype><![CDATA[${job.job_type || 'Full-time'}]]></jobtype>
    <category><![CDATA[${job.category || 'General'}]]></category>
    <description><![CDATA[${job.description || ''}]]></description>
    <required_skills><![CDATA[${Array.isArray(job.required_skills) ? job.required_skills.join(', ') : (job.required_skills || '')}]]></required_skills>
    <url><![CDATA[https://jobspeedy-ai.com/jobs/${job.id}]]></url>
    <date><![CDATA[${new Date(job.created_at).toISOString()}]]></date>
  </job>
</jobs>`;
    } else if (portal.toLowerCase() === 'glassdoor') {
      // Glassdoor XML Feed Format
      xml = `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisher>JobSpeedy AI</publisher>
  <publisherurl>https://jobspeedy-ai.com</publisherurl>
  <lastBuildDate>${new Date().toISOString()}</lastBuildDate>
  <job>
    <title><![CDATA[${job.title || ''}]]></title>
    <employer><![CDATA[${job.company || ''}]]></employer>
    <location><![CDATA[${job.location || ''}]]></location>
    <jobtype><![CDATA[${job.job_type || 'Full-time'}]]></jobtype>
    <description><![CDATA[${job.description || ''}]]></description>
    <skills><![CDATA[${Array.isArray(job.required_skills) ? job.required_skills.join(', ') : (job.required_skills || '')}]]></skills>
    <url><![CDATA[https://jobspeedy-ai.com/jobs/${job.id}]]></url>
    <date><![CDATA[${new Date(job.created_at).toISOString()}]]></date>
  </job>
</source>`;
    } else if (portal.toLowerCase() === 'linkedin') {
      // LinkedIn XML Feed Format
      xml = `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisherName>JobSpeedy AI</publisherName>
  <publisherUrl>https://jobspeedy-ai.com</publisherUrl>
  <lastBuildDate>${new Date().toISOString()}</lastBuildDate>
  <job>
    <jobId>${job.id}</jobId>
    <title><![CDATA[${job.title || ''}]]></title>
    <companyName><![CDATA[${job.company || ''}]]></companyName>
    <location><![CDATA[${job.location || ''}]]></location>
    <jobType><![CDATA[${job.job_type || 'FULL_TIME'}]]></jobType>
    <description><![CDATA[${job.description || ''}]]></description>
    <skills><![CDATA[${Array.isArray(job.required_skills) ? job.required_skills.join(', ') : (job.required_skills || '')}]]></skills>
    <url><![CDATA[https://jobspeedy-ai.com/jobs/${job.id}]]></url>
    <postedDate>${new Date(job.created_at).toISOString()}</postedDate>
  </job>
</source>`;
    } else {
      // Generic XML Feed Format
      xml = `<?xml version="1.0" encoding="UTF-8"?>
<jobfeed>
  <job>
    <id>${job.id}</id>
    <title><![CDATA[${job.title || ''}]]></title>
    <company><![CDATA[${job.company || ''}]]></company>
    <location><![CDATA[${job.location || ''}]]></location>
    <job_type><![CDATA[${job.job_type || 'Full-time'}]]></job_type>
    <category><![CDATA[${job.category || 'General'}]]></category>
    <description><![CDATA[${job.description || ''}]]></description>
    <required_skills><![CDATA[${Array.isArray(job.required_skills) ? job.required_skills.join(', ') : (job.required_skills || '')}]]></required_skills>
    <url>https://jobspeedy-ai.com/jobs/${job.id}</url>
    <created_at>${new Date(job.created_at).toISOString()}</created_at>
  </job>
</jobfeed>`;
    }

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="job_${job.id}_${portal}.xml"`);
    res.send(xml);
  } catch (err) {
    console.error('Error generating XML feed:', err);
    res.status(500).json({ error: err.message });
  }
});

export default function handler(req, res) {
  return router(req, res);
}
