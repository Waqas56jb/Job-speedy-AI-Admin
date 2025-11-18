import pg from 'pg';

let poolInstance = null;

export function getDbPool() {
  if (poolInstance) return poolInstance;

  const {
    DATABASE_URL,
    PGHOST,
    PGPORT,
    PGDATABASE,
    PGUSER,
    PGPASSWORD,
    PGSSLMODE,
  } = process.env;

  let connectionString = DATABASE_URL;

  if (!connectionString) {
    // Fallback to individual env vars if DATABASE_URL is not set
    const host = (PGHOST ?? 'localhost').toString();
    const port = Number(PGPORT ?? 5432);
    const database = (PGDATABASE ?? 'jobspeedy').toString();
    const user = (PGUSER ?? 'postgres').toString();
    const password = String(PGPASSWORD ?? '');
    const useSsl = (PGSSLMODE ?? '').toLowerCase() === 'require';

    if (!password || password.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('[pg] PGPASSWORD is empty or missing. Set it in server/.env');
    }

    const encodedUser = encodeURIComponent(user);
    const encodedPass = encodeURIComponent(password);
    const encodedHost = host; // host usually does not need encoding
    connectionString = `postgresql://${encodedUser}:${encodedPass}@${encodedHost}:${port}/${database}`;
  }

  const config = {
    connectionString,
    ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
  };

  poolInstance = new pg.Pool(config);
  return poolInstance;
}


