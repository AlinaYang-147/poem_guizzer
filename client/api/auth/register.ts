const globalStore = globalThis as typeof globalThis & {
  __poemGuizzerUsersByEmail__?: Map<string, StoredUser>;
  __poemGuizzerUsersByUsername__?: Map<string, StoredUser>;
};

type StoredUser = {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  passwordHash: string;
};

const usersByEmail =
  globalStore.__poemGuizzerUsersByEmail__ ??
  (globalStore.__poemGuizzerUsersByEmail__ = new Map<string, StoredUser>());

const usersByUsername =
  globalStore.__poemGuizzerUsersByUsername__ ??
  (globalStore.__poemGuizzerUsersByUsername__ = new Map<string, StoredUser>());

function sendJson(res: any, status: number, data: Record<string, unknown>) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.json(data);
}

function normalizeEmail(email: unknown) {
  return String(email || '').trim().toLowerCase();
}

function normalizeUsername(username: unknown) {
  return String(username || '').trim();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string) {
  return /^[A-Za-z0-9_]{3,30}$/.test(username);
}

async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  }

  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return sendJson(res, 415, {
      success: false,
      error: 'Content-Type must be application/json',
    });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const email = normalizeEmail(body.email);
  const username = normalizeUsername(body.username || body.name);
  const password = String(body.password || '');

  if (!email || !username || !password) {
    return sendJson(res, 400, {
      success: false,
      error: '邮箱、用户名和密码均为必填项',
    });
  }

  if (!isValidEmail(email)) {
    return sendJson(res, 400, {
      success: false,
      error: '请输入有效的邮箱地址',
    });
  }

  if (!isValidUsername(username)) {
    return sendJson(res, 400, {
      success: false,
      error: '用户名需为 3 到 30 位字母、数字或下划线',
    });
  }

  if (password.length < 8) {
    return sendJson(res, 400, {
      success: false,
      error: '密码至少需要 8 个字符',
    });
  }

  if (usersByEmail.has(email)) {
    return sendJson(res, 409, {
      success: false,
      error: '该邮箱已注册',
    });
  }

  const usernameKey = username.toLowerCase();
  if (usersByUsername.has(usernameKey)) {
    return sendJson(res, 409, {
      success: false,
      error: '该用户名已存在',
    });
  }

  const now = new Date().toISOString();
  const user = {
    id: crypto.randomUUID(),
    email,
    username,
    createdAt: now,
  };

  const storedUser: StoredUser = {
    ...user,
    passwordHash: await hashPassword(password),
  };

  usersByEmail.set(email, storedUser);
  usersByUsername.set(usernameKey, storedUser);

  return sendJson(res, 201, {
    success: true,
    user,
  });
}
