const API_URL = window.location.origin + '/api/polish';

const TONE_MAP = {
  'leader': '对领导说（恭敬专业简洁）',
  'colleague': '对同事说（友好平等协作）',
  'business': '对业务方说（耐心有服务意识，不讲技术）',
  'developer': '对开发说（清晰精确有条理，可用技术术语）',
  'tester': '对测试说（详细注重逻辑和边界）',
  'direct': '直白地说（去掉客套直击要点）'
};

let selectedTone = '';

function buildPrompt(toneDesc, extraNote, polishReq) {
  let prompt = `你是一位互联网产品经理的私人秘书，深谙互联网职场文化和人情世故。你的老板（用户）是一名产品经理，有时候不知道怎么回复别人，有时候情绪上来了说话不得体。你的工作是揣摩老板的真实想法，帮老板把话说得体面、到位。

老板会告诉你：
- 原始想法：老板内心想说的（可能是气话、可能词不达意、可能不知道怎么说）
- 要说给谁听：${toneDesc}
- 当前遭遇：老板正在经历什么，为什么想说这些

你要做的：
1. 揣摩老板真正想表达什么、想达到什么目的
2. 判断当前局面下，说什么话能既表达老板的意思，又保住双方体面
3. 针对"要说给谁听"，选择最合适的表达方式

你的表达风格：
- 像真正的互联网人说话：自然、简洁，可以用"对齐""同步""拉会""排期""方案""风险""优先级""兜底"等行业惯用语
- 不要太书面、不要太官方、不要像AI生成的
- 适合在飞书聊天中直接发送

针对不同的人，你的策略：
- 对领导：帮老板汇报风险、给出方案、表明态度。如果老板跟领导有分歧，你要高情商地表达不同看法（不直接否定，而是补充视角、提供数据支撑）
- 对开发：帮老板推动执行、明确责任。不卑不亢，就事论事，必要时礼貌施压
- 对业务方：帮老板管理预期、给足情绪价值。让对方感到被重视，同时把边界说清楚
- 对测试：帮老板明确分工和责任边界，推动协作，必要时把责任划清楚
- 对同事：平等沟通、就事论事、轻松自然
- 直白：去掉所有包装，一句话说完核心意思

输出要求：
- 直接输出你帮老板写好的话，不要解释
- 不要加引号、不要说"你可以这样回复"之类的前缀`;

  if (extraNote) {
    prompt += `\n\n【老板当前的遭遇】${extraNote}`;
  }
  if (polishReq) {
    prompt += `\n\n【老板对回复的倾向】${polishReq}`;
  }
  return prompt;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function updatePolishBtn() {
  const text = document.getElementById('inputText').value.trim();
  document.getElementById('polishBtn').disabled = !(text && selectedTone);
}

async function doPolish() {
  const text = document.getElementById('inputText').value.trim();
  const extraNote = document.getElementById('extraNote').value.trim();
  const polishReq = document.getElementById('polishReq').value.trim();

  if (!text || !selectedTone) return;

  const btn = document.getElementById('polishBtn');
  const resultSection = document.getElementById('resultSection');
  const resultText = document.getElementById('resultText');

  btn.disabled = true;
  btn.textContent = '润色中...';
  resultText.innerHTML = '<span class="loading-text">正在思考措辞中</span>';
  resultSection.classList.add('show');

  const toneDesc = TONE_MAP[selectedTone] || TONE_MAP['colleague'];
  const prompt = buildPrompt(toneDesc, extraNote, polishReq);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: text }
          ]
        })
      });

      if (!res.ok) {
        if (attempt < 2) { await sleep(1000); continue; }
        showToast('润色失败(code:' + res.status + ')，请重试');
        resultSection.classList.remove('show');
        break;
      }

      const data = await res.json();
      const result = data.choices?.[0]?.message?.content;
      if (result) {
        resultText.innerHTML = '';
        resultText.textContent = result;
      }
      break;
    } catch (err) {
      if (attempt < 2) { await sleep(1000); continue; }
      showToast('网络错误，请重试');
      resultSection.classList.remove('show');
    }
  }

  btn.disabled = false;
  btn.textContent = '开始润色';
}

function copyResult() {
  const text = document.getElementById('resultText').textContent;
  navigator.clipboard.writeText(text).then(() => {
    showToast('已复制');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('已复制');
  });
}

function init() {
  document.querySelectorAll('.tone-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTone = btn.dataset.tone;
      updatePolishBtn();
    });
  });

  document.getElementById('inputText').addEventListener('input', updatePolishBtn);
  document.getElementById('polishBtn').addEventListener('click', doPolish);
  document.getElementById('copyBtn').addEventListener('click', copyResult);
  document.getElementById('repolishBtn').addEventListener('click', doPolish);

  const preText = new URLSearchParams(location.search).get('text');
  if (preText) {
    document.getElementById('inputText').value = decodeURIComponent(preText);
    updatePolishBtn();
  }
}

document.addEventListener('DOMContentLoaded', init);
