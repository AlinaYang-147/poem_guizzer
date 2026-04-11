const usersByEmail = new Map();
const usersByUsername = new Map();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function errorJson(message, status = 400, extra = {}) {
  return json({ success: false, error: message, ...extra }, status);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeUsername(username) {
  return String(username || '').trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username) {
  return /^[A-Za-z0-9_]{3,30}$/.test(username);
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function handleRegister(request) {
  if (request.method !== 'POST') {
    return errorJson('Method not allowed', 405);
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return errorJson('Content-Type must be application/json', 415);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return errorJson('Invalid JSON body', 400);
  }

  const email = normalizeEmail(payload?.email);
  const username = normalizeUsername(payload?.username);
  const password = String(payload?.password || '');

  if (!email || !username || !password) {
    return errorJson('邮箱、用户名和密码均为必填项', 400);
  }

  if (!isValidEmail(email)) {
    return errorJson('请输入有效的邮箱地址', 400);
  }

  if (!isValidUsername(username)) {
    return errorJson('用户名需为 3 到 30 位字母、数字或下划线', 400);
  }

  if (password.length < 8) {
    return errorJson('密码至少需要 8 个字符', 400);
  }

  if (usersByEmail.has(email)) {
    return errorJson('该邮箱已注册', 409);
  }

  const usernameKey = username.toLowerCase();
  if (usersByUsername.has(usernameKey)) {
    return errorJson('该用户名已存在', 409);
  }

  const now = new Date().toISOString();
  const user = {
    id: crypto.randomUUID(),
    email,
    username,
    createdAt: now,
  };

  const storedUser = {
    ...user,
    passwordHash: await hashPassword(password),
  };

  usersByEmail.set(email, storedUser);
  usersByUsername.set(usernameKey, storedUser);

  return json({ success: true, user }, 201);
}

async function handleApi(request, url) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (url.pathname === '/api/health') {
    return json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
  }

  if (url.pathname === '/api/auth/register') {
    return handleRegister(request);
  }

  return errorJson('API route not found', 404);
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, url);
    }

    return errorJson('Function route not found', 404);
  },
};
