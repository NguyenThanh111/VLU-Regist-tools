#!/usr/bin/env node
/**
 * Local capture + proxy server cho tool ĐKHP VLU.
 *
 * Mục đích:
 *  - Giữ VLU_API_KEY cục bộ (không nhúng vào bundle frontend).
 *  - Nhận token tự động từ bookmarklet trên regist.vlu.edu.vn (/capture).
 *  - Proxy mọi gọi API tới regist-api.vlu.edu.vn.
 *  - Chỉ bind 127.0.0.1 — không lộ ra mạng ngoài.
 *
 * Endpoints:
 *  GET  /health          -> { ok: true }
 *  POST /capture         -> { token } (từ bookmarklet)
 *  GET  /token           -> { hasToken, token }
 *  POST /clear           -> xoá token
 *  GET|POST /api/*       -> proxy tới regist-api.vlu.edu.vn
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- env loader tối giản (không cần dotenv) ----
const ENV_PATH = path.join(__dirname, '.env.local');
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const PORT = Number(process.env.PORT || 8787);
const HOST = '127.0.0.1';
const VLU_API_KEY = process.env.VLU_API_KEY || '';
const VLU_CLIENT_ID = process.env.VLU_CLIENT_ID || 'dtl';
const VLU_API_BASE = (process.env.VLU_API_BASE || 'https://regist-api.vlu.edu.vn/api/').replace(/\/+$/, '/');
const TOKEN_FILE = path.join(__dirname, '.local', 'token.json');

const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://regist.vlu.edu.vn',
]);

let capturedToken = '';
try {
  if (fs.existsSync(TOKEN_FILE)) {
    capturedToken = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8')).token || '';
  }
} catch {
  capturedToken = '';
}

function saveToken(token) {
  capturedToken = token;
  try {
    fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true });
    fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token, savedAt: new Date().toISOString() }));
  } catch (err) {
    console.warn('[vlu-local] Không lưu được token xuống file:', err.message);
  }
}

function clearToken() {
  capturedToken = '';
  try {
    fs.rmSync(TOKEN_FILE, { force: true });
  } catch {}
}

function setCors(res, req) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
  }
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function proxyRequest(req, res) {
  if (!VLU_API_KEY) {
    sendJson(res, 500, { message: 'Chưa cấu hình VLU_API_KEY trong server/.env.local' });
    return;
  }

  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const apiPath = url.pathname.replace(/^\/api\/?/, '');
  const target = VLU_API_BASE + apiPath + url.search;

  const headers = {
    'content-type': 'application/json',
    apiKey: VLU_API_KEY,
    clientId: VLU_CLIENT_ID,
  };
  const clientAuth = req.headers.authorization;
  if (clientAuth) {
    headers.Authorization = clientAuth;
  } else if (capturedToken) {
    headers.Authorization = 'Bearer ' + capturedToken;
  } else {
    sendJson(res, 401, {
      message: 'Chưa có token. Đăng nhập regist.vlu.edu.vn rồi bấm bookmarklet để bắt token.',
    });
    return;
  }

  const body = req.method === 'POST' ? await readBody(req) : undefined;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: body || undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const text = await upstream.text();
    res.writeHead(upstream.status, {
      'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
    });
    res.end(text);
  } catch (err) {
    clearTimeout(timeout);
    const msg =
      err.name === 'AbortError'
        ? 'Máy chủ VLU phản hồi quá chậm, vui lòng thử lại.'
        : 'Không kết nối được máy chủ VLU. Kiểm tra mạng.';
    sendJson(res, 502, { message: msg });
  }
}

const server = http.createServer(async (req, res) => {
  setCors(res, req);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const urlPath = url.pathname;

  if (req.method === 'GET' && urlPath === '/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && urlPath === '/capture') {
    let token = '';
    try {
      token = (JSON.parse((await readBody(req)) || '{}').token || '').trim();
    } catch {}
    if (!token) {
      sendJson(res, 400, { message: 'Thiếu token trong body.' });
      return;
    }
    saveToken(token);
    console.log('[vlu-local] Đã nhận token mới từ regist.vlu.edu.vn');
    sendJson(res, 200, { ok: true, message: 'Đã bắt token thành công.' });
    return;
  }

  if (req.method === 'GET' && urlPath === '/token') {
    sendJson(res, 200, { hasToken: !!capturedToken, token: capturedToken || null });
    return;
  }

  if (req.method === 'POST' && urlPath === '/clear') {
    clearToken();
    console.log('[vlu-local] Đã xoá token');
    sendJson(res, 200, { ok: true, message: 'Đã xoá token.' });
    return;
  }

  if (urlPath.startsWith('/api/')) {
    await proxyRequest(req, res);
    return;
  }

  sendJson(res, 404, { message: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`[vlu-local] Server chạy tại http://${HOST}:${PORT}`);
  if (!VLU_API_KEY) {
    console.warn('[vlu-local] CẢNH BÁO: chưa có VLU_API_KEY. Tạo server/.env.local (xem .env.local.example).');
  }
  console.log(`[vlu-local] clientId=${VLU_CLIENT_ID}`);
});
