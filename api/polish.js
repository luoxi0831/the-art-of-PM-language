const axios = require('axios');

const AI_URL = process.env.AI_URL || 'https://open.bigmodel.cn/api/paas/v4';
const AI_KEY = process.env.AI_KEY || '70fcf4d493464c86a4426323b9fd9c39.vuTEEqoUXobAtBUs';
const AI_MODEL = process.env.AI_MODEL || 'glm-4.7-flash';

const toneMap = {
  'leader': '对领导说（语气恭敬、专业、简洁，体现尊重和汇报感）',
  'colleague': '对同事说（语气友好、平等、协作感强）',
  'business': '对业务方说（语气专业、耐心、有服务意识，避免技术术语）',
  'developer': '对开发说（语气清晰、精确、有条理，可以使用技术术语）',
  'tester': '对测试说（语气清晰、详细、注重逻辑和边界条件说明）',
  'direct': '直白地说（去掉所有客套话，直接表达核心意思）'
};

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

  try {
    const response = await axios.post(`${AI_URL}/chat/completions`, {
      model: AI_MODEL,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: text }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${AI_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const result = response.data.choices[0].message.content;
    return res.status(200).json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ error: 'AI service error', detail: err.message });
  }
};
