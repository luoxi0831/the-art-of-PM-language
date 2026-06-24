const { polishText } = require('./_utils');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, tone, extra_note } = req.body;

    if (!text || !tone) {
      return res.status(400).json({ error: 'Missing text or tone' });
    }

    const result = await polishText(text, tone, extra_note);
    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error('Polish error:', err.message);
    return res.status(500).json({ error: 'AI service error', detail: err.message });
  }
};
