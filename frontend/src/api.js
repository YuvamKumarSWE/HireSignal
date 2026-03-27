import { auth } from './firebase';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function authHeaders(extra = {}) {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  };
}

export async function apiFetch(path, options = {}) {
  const headers = await authHeaders(options.headers || {});
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  return res;
}

// Multipart (audio upload) — no Content-Type so browser sets boundary
export async function apiFetchMultipart(path, options = {}) {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  return res;
}

export { BASE };
