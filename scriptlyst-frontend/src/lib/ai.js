import { handleRateLimit } from './_rate-limit'
import { getHeaders } from './_headers'

const API_BASE = import.meta.env.VITE_API_BASE || ''
const PROJECT_ID = import.meta.env.VITE_PROJECT_ID

export const ai = {
  /**
   * Run an AI prompt and get a response with text and optional images.
   *
   * Modes based on options:
   *   - text       (default)                 → 1 credit, returns { text }
   *   - vision     (images, no image:true)   → 2 credits, reads images, returns { text }
   *   - image gen  (image:true)              → 2 credits, generates/edits images, returns { text, images }
   *   - pdf        (pdfs)                    → 2 credits, reads PDFs, returns { text }
   *   - csv        (csvs OR csvText)         → 2 credits, reads CSV data, returns { text }
   *
   * @param {string} prompt - The prompt to send
   * @param {object} [options] - Optional config
   * @param {boolean} [options.image] - Set true to generate or edit images
   * @param {string[]} [options.images] - Input image URLs. Without image:true → vision read.
   *                                      With image:true → edit the given images.
   * @param {string[]} [options.pdfs] - PDF URLs to read (max 32MB each, vision-quality extraction)
   * @param {string[]} [options.csvs] - CSV URLs to fetch and inline as data (max 200KB each)
   * @param {string} [options.csvText] - Raw CSV text to inline directly (no fetch)
   * @param {'fast'|'high'} [options.quality] - Image quality: 'fast' (default) or 'high'
   * @param {string} [options.aspectRatio] - Aspect ratio: '1:1', '16:9', '9:16', '4:3', '3:4', '5:4'
   * @param {string} [options.resolution] - Resolution: '1K' (default), '2K' (high quality only)
   * @returns {Promise<{ text: string, images: string[] }>}
   * @example const result = await ai.run("Suggest a healthy dinner recipe")
   * @example const result = await ai.run("a cute cat", { image: true, quality: 'high' })
   * @example const result = await ai.run("remove background", { image: true, images: [photoUrl] })
   * @example // Vision: extract structured data from a photo
   * const { text } = await ai.run(
   *   "Extract this recipe as JSON with fields: title, ingredients[], steps[]. Return ONLY JSON.",
   *   { images: [photoUrl] }
   * )
   * const recipe = JSON.parse(text)
   * @example // PDF: extract questions from a sample exam
   * const { text } = await ai.run(
   *   "Extract every question into JSON array {q, choices, answer}. Return ONLY JSON.",
   *   { pdfs: [pdfUrl] }
   * )
   * @example // CSV from URL: import roster and auto-assign
   * const { text } = await ai.run(
   *   "Read this student roster and return JSON [{name, grade, section}]. Return ONLY JSON.",
   *   { csvs: [csvUrl] }
   * )
   * @example // CSV from string: parsed locally already, pass raw text
   * const csv = "name,age\\nAlice,30\\nBob,25"
   * const { text } = await ai.run("Summarize this data", { csvText: csv })
   */
  async run(prompt, options = {}) {
    console.log('[ai] run called:', prompt.substring(0, 80) + (prompt.length > 80 ? '...' : ''))
    const res = await fetch(`${API_BASE}/api/app/${PROJECT_ID}/ai`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ prompt, stream: false, ...options })
    })
    if (!res.ok) {
      if (res.status === 429) await handleRateLimit(res)
      const err = await res.text()
      console.error('[ai] run error:', res.status, err)
      throw new Error('AI request failed: ' + res.status)
    }
    const data = await res.json()
    console.log('[ai] run result: text=' + (data.text?.length || 0) + ' chars, images=' + (data.images?.length || 0))
    return data
  },

  /**
   * Stream an AI response for progressive text display.
   * @param {string} prompt - The prompt to send
   * @param {object} [options] - Optional config
   * @returns {Promise<ReadableStream>}
   * @example const stream = await ai.stream("Tell me a story")
   */
  stream(prompt, options = {}) {
    console.log('[ai] stream called:', prompt.substring(0, 80) + (prompt.length > 80 ? '...' : ''))
    return fetch(`${API_BASE}/api/app/${PROJECT_ID}/ai`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ prompt, stream: true, ...options })
    }).then(async res => {
      if (!res.ok) {
        if (res.status === 429) await handleRateLimit(res)
        console.error('[ai] stream error:', res.status)
        throw new Error('AI stream failed: ' + res.status)
      }
      console.log('[ai] stream connected')
      return res.body
    })
  },

  /**
   * Multi-turn conversation with a persistent persona.
   * Use this when the app's core loop is a running conversation with a
   * consistent "it" across turns (character chat, AI companion, tutor, NPC).
   * For one-shot generation, use ai.run() instead.
   *
   * @param {object} options
   * @param {string} [options.system] - Persona system prompt (stays the same across turns)
   * @param {Array<{role: 'user'|'assistant', content: string}>} options.messages - Conversation history, text-only
   * @returns {Promise<{ text: string }>}
   * @example
   *   const reply = await ai.chat({
   *     system: "You are Mira, a patient Spanish teacher from Madrid.",
   *     messages: [
   *       { role: 'user', content: 'hola' },
   *       { role: 'assistant', content: '¡Hola! ¿Cómo estás hoy?' },
   *       { role: 'user', content: 'bien, y tú?' },
   *     ],
   *   })
   *   // reply.text === "Muy bien, gracias por preguntar ..."
   */
  async chat({ system, messages } = {}) {
    const msgCount = Array.isArray(messages) ? messages.length : 0
    console.log('[ai] chat called: system=' + (system?.length || 0) + ' chars, messages=' + msgCount)
    const res = await fetch(`${API_BASE}/api/app/${PROJECT_ID}/ai`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ system, messages })
    })
    if (!res.ok) {
      if (res.status === 429) await handleRateLimit(res)
      const err = await res.text()
      console.error('[ai] chat error:', res.status, err)
      throw new Error('AI chat failed: ' + res.status)
    }
    const data = await res.json()
    console.log('[ai] chat result: text=' + (data.text?.length || 0) + ' chars')
    return data
  }
}
