import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDbPool } from '../../server/src/pg.js';
import dns from 'node:dns/promises';

const router = Router();
const pool = getDbPool();

// POST /api/auth/register - registers an admin user
router.post('/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  try {
    const normalized = String(email).trim().toLowerCase();
    // Basic email format check
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(normalized)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    // Domain MX check (verifies domain can receive email; not mailbox existence)
    const domain = normalized.split('@')[1];
    try {
      const mx = await dns.resolveMx(domain);
      if (!mx || mx.length === 0) {
        return res.status(400).json({ error: 'Email domain has no MX records' });
      }
    } catch (_) {
      return res.status(400).json({ error: 'Email domain is not reachable (no MX)' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'insert into admin_users (email, password_hash) values ($1, $2) returning id, email',
      [normalized, hashed]
    );
    res.status(201).json({ user: { id: result.rows[0].id, email: result.rows[0].email } });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login - login for admin users only
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  try {
    const lower = email.toLowerCase();
    // Check admin users
    const adminRes = await pool.query('select id, email, password_hash from admin_users where email = $1', [lower]);
    if (adminRes.rowCount === 1) {
      const ok = await bcrypt.compare(password, adminRes.rows[0].password_hash || '');
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      return res.json({ role: 'admin', user: { id: adminRes.rows[0].id, email: adminRes.rows[0].email } });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password - reset password for admin user
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body || {};
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'email and newPassword are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const normalized = String(email).trim().toLowerCase();

    // Check if admin user exists
    const userResult = await pool.query(
      'select id, email from admin_users where email = $1',
      [normalized]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Admin user not found with this email' });
    }

    // Hash the new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update password
    const updateResult = await pool.query(
      'update admin_users set password_hash = $1 where email = $2 returning id, email',
      [hashed, normalized]
    );

    res.json({
      message: 'Password successfully updated',
      user: { id: updateResult.rows[0].id, email: updateResult.rows[0].email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DEV: seed or update an admin user easily
router.post('/seed-admin', async (req, res) => {
  if ((process.env.NODE_ENV || 'development') === 'production') {
    return res.status(403).json({ error: 'Disabled in production' });
  }
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const upsert = await pool.query(
      `insert into admin_users (email, password_hash)
       values ($1, $2)
       on conflict (email) do update set password_hash = excluded.password_hash
       returning id, email`,
      [email.toLowerCase(), hashed]
    );
    res.json({ ok: true, admin: upsert.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default function handler(req, res) {
  return router(req, res);
}
