import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || ''}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'jobspeedy'}`,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
});

async function runSchema() {
  try {
    const schemaPath = path.join(__dirname, 'sql', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    await pool.query(schema);
    console.log('✅ Schema executed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error running schema:', err.message);
    process.exit(1);
  }
}

runSchema();

