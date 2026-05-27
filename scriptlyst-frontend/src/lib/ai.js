const API_URL = import.meta.env.VITE_API_URL || 'https://scriptlyst-backend.onrender.com'

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  try {
    const token = localStorage.getItem('scriptlyst_token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  } catch {}
  return headers
}

export const ai = {
  async run(prompt, options = {}) {
    const res = await fetch(`${API_URL}/api/ai`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ prompt, ...options }),
    })
    if (!res.ok) throw new Error('AI request failed: ' + res.status)
    return res.json()
  },

  async stream(prompt, options = {}) {
    const res = await fetch(`${API_URL}/api/ai`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ prompt, ...options }),
    })
    if (!res.ok) throw new Error('AI stream failed: ' + res.status)
    return res.body
  },

  async chat({ system, messages } = {}) {
    const res = await fetch(`${API_URL}/api/ai`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ system, messages }),
    })
    if (!res.ok) throw new Error('AI chat failed: ' + res.status)
    return res.json()
  },
}
