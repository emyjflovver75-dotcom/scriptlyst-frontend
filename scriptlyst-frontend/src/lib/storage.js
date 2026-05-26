/**
 * Storage helper — fetch remote files and upload local files to
 * project-scoped persistent storage. Returns permanent public URLs.
 */

import { getAuthHeaders, getHeaders } from './_headers'

const API_BASE = import.meta.env.VITE_API_BASE || ''
const PROJECT_ID = import.meta.env.VITE_PROJECT_ID

export const storage = {
  /**
   * Fetch a file from a remote URL and save it to project storage.
   * This uses a server-side proxy to avoid CORS restrictions.
   *
   * @param {string} url - The remote URL to fetch
   * @param {object} [options]
   * @param {string} [options.filename] - Custom filename (e.g. "hero.jpg"). Auto-generated if omitted.
   * @returns {Promise<{ url: string }>} Permanent public URL of the stored file
   */
  async fromUrl(url, options = {}) {
    console.log('[storage] fromUrl:', url.substring(0, 80))

    const body = { url }
    if (options.filename) body.filename = options.filename

    const res = await fetch(`${API_BASE}/api/app/${PROJECT_ID}/storage/from-url`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[storage] fromUrl error:', res.status, err)
      throw new Error(`Failed to fetch and store URL (${res.status})`)
    }

    const data = await res.json()
    console.log('[storage] fromUrl done:', data.url)
    return data
  },

  /**
   * Upload a local file (Blob, File, or canvas data) to project storage.
   *
   * @param {Blob|File} blob - The file data to upload
   * @param {string} [filename] - Filename with extension (e.g. "photo.png"). Defaults to "file.bin".
   * @returns {Promise<{ url: string }>} Permanent public URL of the stored file
   */
  async upload(blob, filename = 'file.bin') {
    console.log('[storage] upload:', filename, `(${blob.size} bytes)`)

    const formData = new FormData()
    formData.append('file', blob, filename)

    const res = await fetch(`${API_BASE}/api/app/${PROJECT_ID}/storage/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[storage] upload error:', res.status, err)
      throw new Error(`Upload failed (${res.status})`)
    }

    const data = await res.json()
    console.log('[storage] upload done:', data.url)
    return data
  },
}
