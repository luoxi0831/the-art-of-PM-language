export async function onRequestPost(context) {
  const { request, env } = context;

  const AI_KEY = env.AI_KEY;
  const AI_MODEL = env.AI_MODEL || 'glm-4.7-flash';

  if (!AI_KEY) {
    return new Response(JSON.stringify({ error: 'AI_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const { messages } = await request.json();

  if (!messages || !messages.length) {
    return new Response(JSON.stringify({ error: 'Missing messages' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
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

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'AI request failed', status: res.status }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
