import { Router } from 'express';
import { getDbPool } from './pg.js';
import PDFDocument from 'pdfkit';

const router = Router();
const pool = getDbPool();

// GET /api/users/candidates - get all users (candidates) with their application counts
router.get('/candidates', async (req, res) => {
  const { search } = req.query;
  try {
    let query = `
      select 
        u.id,
        u.full_name,
        u.email,
        u.created_at,
        count(a.id) as application_count
      from users u
      left join applications a on u.id = a.user_id
    `;
    const params = [];
    
    if (search) {
      query += ` where u.full_name ilike $1 or u.email ilike $1`;
      params.push(`%${search}%`);
    }
    
    query += ` group by u.id, u.full_name, u.email, u.created_at order by u.created_at desc`;
    
    const result = await pool.query(query, params);
    res.json({ candidates: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/candidates/:id - get single user with all their applications
router.get('/candidates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const userResult = await pool.query(
      'select * from users where id = $1',
      [id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    // Get phone number from the most recent application
    const phoneResult = await pool.query(
      'select phone from applications where user_id = $1 and phone is not null order by created_at desc limit 1',
      [id]
    );
    
    const candidate = userResult.rows[0];
    if (phoneResult.rows.length > 0) {
      candidate.phone = phoneResult.rows[0].phone;
    }
    
    const applicationsResult = await pool.query(
      `select 
        a.id as application_id,
        a.status as application_status,
        a.ai_parsed_data,
        a.resume_filename,
        a.resume_mime,
        a.created_at as application_date,
        j.id as job_id,
        j.title as job_title,
        j.description as job_description
      from applications a
      inner join jobs j on a.job_id = j.id
      where a.user_id = $1
      order by a.created_at desc`,
      [id]
    );
    
    res.json({ 
      candidate: candidate,
      applications: applicationsResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/candidates/:id - delete user and all their applications
router.delete('/candidates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('delete from users where id = $1 returning id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    res.json({ message: 'Candidate and all their applications deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/resume/:applicationId - download/view resume PDF
router.get('/resume/:applicationId', async (req, res) => {
  const { applicationId } = req.params;
  try {
    const result = await pool.query(
      'select resume_data, resume_filename, resume_mime from applications where id = $1',
      [applicationId]
    );
    
    if (result.rows.length === 0 || !result.rows[0].resume_data) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    const { resume_data, resume_filename, resume_mime } = result.rows[0];
    
    res.setHeader('Content-Type', resume_mime || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${resume_filename || 'resume.pdf'}"`);
    res.send(resume_data);
  } catch (err) {
    console.error('Error fetching resume:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/candidates/:id/anonymized-pdf - generate anonymized PDF
router.get('/candidates/:id/anonymized-pdf', async (req, res) => {
  const { id } = req.params;
  try {
    const userResult = await pool.query(
      'select id, full_name, email from users where id = $1',
      [id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    const applicationsResult = await pool.query(
      `select 
        a.ai_parsed_data,
        j.title as job_title
      from applications a
      inner join jobs j on a.job_id = j.id
      where a.user_id = $1
      order by a.created_at desc
      limit 1`,
      [id]
    );
    
    const candidate = userResult.rows[0];
    const app = applicationsResult.rows[0] || {};
    const parsed = app.ai_parsed_data || {};
    
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="anonymized_profile_${id}.pdf"`);
    doc.pipe(res);
    
    doc.fontSize(20).text('Anonymized Candidate Profile', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(14).text('Candidate ID:', { continued: true }).fontSize(12).text(` #CND-${String(id).padStart(3, '0')}`);
    doc.moveDown();
    
    if (parsed.experience_years) {
      doc.fontSize(14).text('Experience:', { continued: true }).fontSize(12).text(` ${parsed.experience_years} years`);
      doc.moveDown();
    }
    
    if (parsed.education) {
      doc.fontSize(14).text('Education:', { continued: true }).fontSize(12).text(` ${parsed.education}`);
      doc.moveDown();
    }
    
    if (parsed.summary) {
      doc.fontSize(14).text('Summary:');
      doc.fontSize(12).text(parsed.summary, { align: 'justify' });
      doc.moveDown();
    }
    
    if (parsed.skills && Array.isArray(parsed.skills) && parsed.skills.length > 0) {
      doc.fontSize(14).text('Skills:');
      doc.fontSize(12).text(parsed.skills.join(', '));
      doc.moveDown();
    }
    
    doc.end();
  } catch (err) {
    console.error('Error generating anonymized PDF:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

