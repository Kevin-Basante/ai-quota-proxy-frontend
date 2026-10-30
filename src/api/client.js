const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(status, body, retryAfter) {
    super(body?.message || `Request failed with status ${status}`)
    this.status = status
    this.body = body
    this.retryAfter = retryAfter
  }
}

async function request(path, { method = 'GET', userId, body } = {}) {
  const headers = { Accept: 'application/json' }
  if (userId) headers['X-User-Id'] = userId
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, { message: 'The server is unreachable. It may be waking up, try again in a few seconds.' })
  }
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) {
    const retryHeader = Number(response.headers.get('Retry-After'))
    const retryAfter = Number.isFinite(retryHeader) && retryHeader > 0 ? retryHeader : data?.details?.retryAfterSeconds
    throw new ApiError(response.status, data, retryAfter)
  }
  return data
}

export const api = {
  baseUrl: API_URL,
  health: () => request('/api/health'),
  users: () => request('/api/users'),
  plans: () => request('/api/plans'),
  resetDemo: () => request('/api/demo/reset', { method: 'POST' }),
  generate: (userId, prompt) => request('/api/ai/generate', { method: 'POST', userId, body: { prompt } }),
  status: (userId) => request('/api/quota/status', { userId }),
  history: (userId) => request('/api/quota/history', { userId }),
  upgrade: (userId, payload) => request('/api/quota/upgrade', { method: 'POST', userId, body: payload }),
}
