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
  createApplication: (name, teamId) =>
    request('/applications', { method: 'POST', body: JSON.stringify({ name, teamId }) }),
  createApiKey: (appId, label) =>
    request(`/applications/${appId}/keys`, { method: 'POST', body: JSON.stringify({ label }) }),
  listApiKeys: (appId) => request(`/applications/${appId}/keys`),
  getAnalytics: (appId) => request(`/applications/${appId}/analytics`),
  listAuditLogs: (appId, limit = 50) => request(`/applications/${appId}/logs?limit=${limit}`),

  listProviderKeys: () => request('/provider-keys'),
  addProviderKey: (payload) => request('/provider-keys', { method: 'POST', body: JSON.stringify(payload) }),
  deleteProviderKey: (id) => request(`/provider-keys/${id}`, { method: 'DELETE' }),

  listTeams: () => request('/teams'),
  createTeam: (name) => request('/teams', { method: 'POST', body: JSON.stringify({ name }) }),
  listTeamMembers: (teamId) => request(`/teams/${teamId}/members`),
  addTeamMember: (teamId, payload) =>
    request(`/teams/${teamId}/members`, { method: 'POST', body: JSON.stringify(payload) }),
  removeTeamMember: (teamId, userId) => request(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' }),

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

export const SUPPORTED_MODELS = [
  { provider: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano'] },
  { provider: 'Claude', models: ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5-20251001'] },
  { provider: 'Gemini', models: ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.1-pro'] },
  { provider: 'Ollama (local)', models: ['llama3', 'mistral'] },
];

export const PROVIDER_OPTIONS = ['OPENAI', 'GEMINI', 'CLAUDE', 'OLLAMA'];
