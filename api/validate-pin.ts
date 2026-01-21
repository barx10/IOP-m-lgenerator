// Simple PIN validation endpoint
export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pin } = req.body;
  const validPin = process.env.PINGATE_CODE;

  // If no PIN is configured, allow all (backwards compatible)
  if (!validPin) {
    return res.status(200).json({ valid: true });
  }

  // Validate PIN
  if (pin === validPin) {
    return res.status(200).json({ valid: true });
  } else {
    return res.status(401).json({
      valid: false,
      error: 'Ugyldig PIN-kode'
    });
  }
}
