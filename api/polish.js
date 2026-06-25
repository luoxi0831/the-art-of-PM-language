const axios = require('axios');

const AI_URL = process.env.AI_URL || 'https://open.bigmodel.cn/api/paas/v4';
const AI_KEY = process.env.AI_KEY || '70fcf4d493464c86a4426323b9fd9c39.vuTEEqoUXobAtBUs';
const AI_MODEL = process.env.AI_MODEL || 'glm-4.7-flash';

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

  const { text, tone, extra_note } = req.body;

  if (!text || !tone) {
    return res.status(400).json({ error: 'Missing text or tone' });
  }

  const toneMap = {
    'leader': '对领导说（语气恭敬、专业、简洁，体现尊重和汇报感）',
    'colleague': '对同事说（语气友好、平等、协作感强）',
    'business': '对业务方说（语气专业、耐心、有服务意识，避免技术术语）',
    'developer': '对开发说（语气清晰、精确、有条理，可以使用技术术语）',
    'tester': '对测试说（语气清晰、详细、注重逻辑和边界条件说明）',
    'direct': '直白地说（去掉所有客套话，直接表达核心意思）'
  };

  const toneDesc = toneMap[tone] || toneMap['colleague'];
  let prompt = `你是一位资深互联网产品经理的写作助手。请将以下内容润色成适合"${toneDesc}"的表达方式。

要求：
1. 保持原意不变
2. 符合职场语境
3. 自然流畅，不要过度修饰
4. 直接输出润色后的结果，不要解释
5. 只输出润色后要发出去的话，不要输出分析过程`;

  if (extra_note) {
    prompt += `\n\n背景信息（用户提供的前因后果，帮助你理解语境，但不要在润色结果中直接暴露这些内容）：\n${extra_note}`;
  }

  async function makeRequest(retries = 2) {
    for (let i = 0; i < retries; i++) {
      try {
        return await axios.post(`${AI_URL}/chat/completions`, {
          model: AI_MODEL,
          stream: true,
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: text }
          ]
        }, {
          headers: {
            'Authorization': `Bearer ${AI_KEY}`,
            'Content-Type': 'application/json'
          },
          responseType: 'stream',
          timeout: 30000
        });
      } catch (err) {
        if (err.response && err.response.status === 429 && i < retries - 1) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        throw err;
      }
    }
  }

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const response = await makeRequest();

    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim());
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {}
        }
      }
    });

    response.data.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    response.data.on('error', (err) => {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });

  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'AI service error', detail: err.message });
  }
};
