const axios = require('axios');
const crypto = require('crypto');

const FEISHU_APP_ID = process.env.FEISHU_APP_ID || 'cli_aab24dc745b99bb5';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || '8tvomPlrkaKISrSes8aTeeGsezY1EkoN';
const AI_URL = process.env.AI_URL || 'https://open.bigmodel.cn/api/paas/v4';
const AI_KEY = process.env.AI_KEY || '70fcf4d493464c86a4426323b9fd9c39.vuTEEqoUXobAtBUs';
const AI_MODEL = process.env.AI_MODEL || 'GLM-4.7-Flash';

let tenantAccessToken = '';
let tokenExpireTime = 0;

async function getTenantAccessToken() {
  if (tenantAccessToken && Date.now() < tokenExpireTime) {
    return tenantAccessToken;
  }
  const res = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    app_id: FEISHU_APP_ID,
    app_secret: FEISHU_APP_SECRET
  });
  tenantAccessToken = res.data.tenant_access_token;
  tokenExpireTime = Date.now() + (res.data.expire - 300) * 1000;
  return tenantAccessToken;
}

async function polishText(text, tone, extraNote) {
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
4. 直接输出润色后的结果，不要解释`;

  if (extraNote) {
    prompt += `\n5. 额外要求：${extraNote}`;
  }

  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await axios.post(`${AI_URL}/chat/completions`, {
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
      return res.data.choices[0].message.content;
    } catch (err) {
      if (err.response && err.response.status === 429 && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, (i + 1) * 2000));
        continue;
      }
      throw err;
    }
  }
}

module.exports = {
  getTenantAccessToken,
  polishText,
  FEISHU_APP_ID,
  FEISHU_APP_SECRET
};
