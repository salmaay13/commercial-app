const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const TOKEN_KEY = 'commercialapp.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('Serveur injoignable. Vérifiez que le backend est démarré.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login') onUnauthorized();
    throw new ApiError(data.error || `Erreur ${res.status}`, res.status);
  }
  return data;
}

export const api = {
  login: (login, password) => request('/auth/login', { method: 'POST', body: { login, password } }),
  me: () => request('/auth/me'),
  clients: () => request('/clients'),
  client: (id) => request(`/clients/${id}`),
  products: (clientId) => request(`/clients/${clientId}/products`),
  product: (clientId, productId) => request(`/clients/${clientId}/products/${productId}`),
  quote: (clientId, lines) => request(`/clients/${clientId}/quote`, { method: 'POST', body: { lines } }),
  stats: () => request('/orders/stats'),
  orders: () => request('/orders'),
  order: (id) => request(`/orders/${id}`),
  createOrder: (clientId, lines) => request('/orders', { method: 'POST', body: { clientId, lines } }),
};
