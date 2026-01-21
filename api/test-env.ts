// TEMPORARY DEBUG ENDPOINT - DELETE AFTER TESTING
export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pinCode = process.env.PINGATE_CODE;

  // Return masked PIN (for security, only show first and last char)
  const maskedPin = pinCode
    ? `${pinCode[0]}${'*'.repeat(pinCode.length - 2)}${pinCode[pinCode.length - 1]}`
    : 'NOT SET';

  return res.status(200).json({
    pinCodeSet: !!pinCode,
    pinLength: pinCode?.length || 0,
    maskedPin: maskedPin,
    environment: process.env.VERCEL_ENV || 'unknown'
  });
}
