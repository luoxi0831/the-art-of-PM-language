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

  const AI_URL = process.env.AI_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  const AI_KEY = process.env.AI_KEY;
  const AI_MODEL = process.env.AI_MODEL || 'glm-4.7-flash';

  if (!AI_KEY) {
    return res.status(500).json({ error: 'AI_KEY not configured' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !messages.length) {
      return res.status(400).json({ error: 'Missing messages' });
    }

    const response = await fetch(`${AI_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_KEY}`
      },
      body: JSON.stringify({
        model: AI_MODEL,
        stream: false,
        messages: messages
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'AI request failed', status: response.status });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
