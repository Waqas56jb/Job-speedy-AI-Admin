import { Router } from 'express';
import { getDbPool } from './pg.js';

const router = Router();
const pool = getDbPool();

// GET /api/clients - list clients with jobs count
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `select 
         c.id, c.company, c.contact_person, c.email, c.created_at,
         (
            select count(1)
            from jobs j
            where j.client_id = c.id
               or j.company = c.company
         ) as jobs_count
       from clients c
       order by c.created_at desc`
    );
    res.json({ clients: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clients - create client
router.post('/', async (req, res) => {
  const { company, contact_person, email } = req.body || {};
  if (!company) return res.status(400).json({ error: 'company is required' });
  try {
    const r = await pool.query(
      `insert into clients (company, contact_person, email)
       values ($1, $2, $3)
       returning *`,
      [company, contact_person || null, email || null]
    );
    res.status(201).json({ client: r.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'company already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/clients/:id - update client
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { company, contact_person, email } = req.body || {};
  try {
    const r = await pool.query(
      `update clients
          set company = coalesce($1, company),
              contact_person = coalesce($2, contact_person),
              email = coalesce($3, email)
        where id = $4
        returning *`,
      [company, contact_person, email, id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
    res.json({ client: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/clients/:id - delete client
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const r = await pool.query('delete from clients where id = $1 returning id', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;


