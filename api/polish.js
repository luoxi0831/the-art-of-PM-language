const https = require('https');

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

  const AI_KEY = process.env.AI_KEY;
  const AI_MODEL = process.env.AI_MODEL || 'glm-4.7-flash';

  if (!AI_KEY) {
    return res.status(500).json({ error: 'AI_KEY not configured' });
  }

  const { messages } = req.body;

  if (!messages || !messages.length) {
    return res.status(400).json({ error: 'Missing messages' });
  }

  const postData = JSON.stringify({
    model: AI_MODEL,
    stream: false,
    messages: messages
  });

  const options = {
    hostname: 'open.bigmodel.cn',
    path: '/api/paas/v4/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_KEY}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  try {
    const data = await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => {
          if (response.statusCode !== 200) {
            reject({ status: response.statusCode, body });
          } else {
            resolve(JSON.parse(body));
          }
        });
      });
      request.on('error', reject);
      request.write(postData);
      request.end();
    });

    return res.status(200).json(data);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: 'AI request failed', status });
  }
};
