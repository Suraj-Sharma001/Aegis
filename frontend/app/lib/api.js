const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('aegis_jwt');
}

export function setToken(token) {
  localStorage.setItem('aegis_jwt', token);
}

export function clearToken() {
  localStorage.removeItem('aegis_jwt');
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('aegis_user');
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user) {
  localStorage.setItem('aegis_user', JSON.stringify(user));
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/auth/me'),

  listApplications: () => request('/applications'),
  createApplication: (name) => request('/applications', { method: 'POST', body: JSON.stringify({ name }) }),
  createApiKey: (appId, label) =>
    request(`/applications/${appId}/keys`, { method: 'POST', body: JSON.stringify({ label }) }),
  getAnalytics: (appId) => request(`/applications/${appId}/analytics`),

  // Direct gateway call — needs an x-api-key, not a JWT, so this bypasses
  // the standard request() helper's auth header.
  testCompletion: async ({ gatewayKey, model, prompt }) => {
    const res = await fetch(`${API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': gatewayKey },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  },
};
