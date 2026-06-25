const http = require('http');
const fs = require('fs');
const path = require('path');

const polishHandler = require('./polish');
const feishuEventHandler = require('./feishu-event');

const PORT = 3000;

function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { resolve({}); }
    });
  });
}

function createRes(res) {
  return {
    statusCode: 200,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; res.setHeader(k, v); },
    status(code) { this.statusCode = code; return this; },
    json(data) { res.writeHead(this.statusCode, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); },
    end() { res.writeHead(this.statusCode); res.end(); }
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // API routes
  if (url.pathname === '/api/polish') {
    const body = await parseBody(req);
    req.body = body;
    const fakeRes = {
      setHeader(k, v) { res.setHeader(k, v); },
      status(code) { res.statusCode = code; return this; },
      json(data) { res.writeHead(res.statusCode || 200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); },
      write(chunk) { res.write(chunk); },
      end() { res.end(); }
    };
    return polishHandler(req, fakeRes);
  }

  if (url.pathname === '/api/feishu-event') {
    const body = await parseBody(req);
    req.body = body;
    return feishuEventHandler(req, createRes(res));
  }

  // Static files
  let filePath = path.join(__dirname, '..', 'public', url.pathname === '/' ? 'index.html' : url.pathname);
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain; charset=utf-8' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
