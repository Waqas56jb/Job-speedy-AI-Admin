export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.json({ status: 'ok', service: 'jobspeedy-ai-server', time: new Date().toISOString() });
}
