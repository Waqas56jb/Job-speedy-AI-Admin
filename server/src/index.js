import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import express from 'express';
import cors from 'cors';
import { getDbPool } from './pg.js';
import authRoutes from './authRoutes.js';
import candidateRoutes from './candidateRoutes.js';
import userRoutes from './userRoutes.js';
import jobRoutes from './jobRoutes.js';
import clientRoutes from './clientRoutes.js';
import toolsRoutes from './toolsRoutes.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tools', toolsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'jobspeedy-ai-server', time: new Date().toISOString() });
});

app.get('/api/db-health', async (req, res) => {
  const pool = getDbPool();
  try {
    const result = await pool.query('select 1 as ok');
    res.json({ status: 'ok', result: result.rows[0] });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${port}`);
});


