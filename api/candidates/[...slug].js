import { Router } from 'express';
import { getDbPool } from '../../server/src/pg.js';

const router = Router();
const pool = getDbPool();

// NOTE: This router now proxies "candidates" to the users/applications/jobs model.

// GET /api/candidates - list users with application counts (search by name/email)
router.get('/', async (req, res) => {
  const { search } = req.query;
  try {
    const params = [];
    let query = `
      select
        u.id,
        u.full_name,
        u.email,
        u.created_at,
        count(a.id) as application_count
      from users u
      left join applications a on a.user_id = u.id
    `;

    if (search) {
      params.push(`%${search}%`);
      query += ` where u.full_name ilike $1 or u.email ilike $1`;
    }

    query += ` group by u.id, u.full_name, u.email, u.created_at order by u.created_at desc`;

    const result = await pool.query(query, params);
    res.json({ candidates: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/candidates/:id - user details with applications joined to jobs
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const userResult = await pool.query('select id, full_name, email, created_at from users where id = $1', [id]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'Candidate not found' });

    const appsResult = await pool.query(
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
       inner join jobs j on j.id = a.job_id
       where a.user_id = $1
       order by a.created_at desc`,
      [id]
    );

    res.json({ candidate: userResult.rows[0], applications: appsResult.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// All write operations are not supported in this model
const methodNotAllowed = (_req, res) => res.status(405).json({ error: 'Not supported with users/applications model' });
router.post('/', methodNotAllowed);
router.put('/:id', methodNotAllowed);
router.patch('/:id/status', methodNotAllowed);
router.delete('/:id', methodNotAllowed);

export default function handler(req, res) {
  return router(req, res);
}
