import { getStoredToken } from './auth.jsx'

// Базовый URL для API: локально напрямую к Node.js, в продакшене через PHP прокси
const API_BASE = import.meta.env.DEV ? 'http://localhost:3000/api' : '/api.php'

async function request(url, options = {}) {
  const token = getStoredToken()
  const res = await fetch(url, {
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })

  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    const message = (data && data.error) ? data.error : `HTTP ${res.status}`
    throw new Error(message)
  }

  return data
}

export const api = {
  login: ({ email, password }) => request(`${API_BASE}/users/login`, { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: ({ name, email, password }) => request(`${API_BASE}/users/register`, { method: 'POST', body: JSON.stringify({ name, email, password }) }),
 
  getUsers: () => request(`${API_BASE}/users`),
  getWishes: () => request(`${API_BASE}/wishes`),
  getPublicWishesByUserId: (userId) => request(`${API_BASE}/public/wishes/${encodeURIComponent(userId)}`),
  createWish: (wish) => request(`${API_BASE}/wishes`, { method: 'POST', body: JSON.stringify(wish) }),
  updateWish: (id, patch) => request(`${API_BASE}/wishes/${encodeURIComponent(id)}`, { method: 'POST', body: JSON.stringify({ ...patch, _method: 'PUT' }) }),
  deleteWish: (id) => request(`${API_BASE}/wishes/${encodeURIComponent(id)}`, { method: 'POST', body: JSON.stringify({ _method: 'DELETE' }) }),
  completeWish: (id, completed) => request(`${API_BASE}/wishes/${encodeURIComponent(id)}/complete`, { method: 'POST', body: JSON.stringify({ completed, _method: 'PUT' }) }),
 
  uploadBase64: ({ image, fileName, mimeType }) => request(`${API_BASE}/upload-base64`, { method: 'POST', body: JSON.stringify({ image, fileName, mimeType }) }),
  imageUrl: (imageUrlFromApi) => {
    const raw = imageUrlFromApi || ''
    if (!raw) return ''
    
    // Локально: прямой путь к /uploads
    if (import.meta.env.DEV) {
      return raw.startsWith('/uploads/') ? raw : `/uploads/${raw}`
    }
    
    // Продакшен: через PHP прокси
    if (raw.startsWith('/api.php?file=')) return raw
    if (raw.startsWith('/api_upload.php?file=')) return raw.replace('/api_upload.php?file=', '/api.php?file=')
    
    const file = raw.startsWith('/uploads/') ? raw.slice('/uploads/'.length) : raw
    return `/api.php/upload?file=${encodeURIComponent(file)}`
  },
}
