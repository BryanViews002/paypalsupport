export default function handler(req, res) {
  const keySet = !!process.env.SENDGRID_API_KEY;
  const keyPreview = process.env.SENDGRID_API_KEY
    ? process.env.SENDGRID_API_KEY.substring(0, 10) + '...'
    : 'NOT SET';

  res.status(200).json({
    status: 'API is reachable',
    sendgridKeySet: keySet,
    keyPreview: keyPreview,
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
}
