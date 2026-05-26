/**
 * Database helper — secure data persistence for generated apps.
 * All CRUD operations go through the Whacka API (service-role access).
 * Realtime subscriptions use Supabase client (read-only) as a transitional measure.
 */

import { createClient } from '@supabase/supabase-js'
import { getAppUserId } from './user'
import { getHeaders } from './_headers'
import { getSupabaseToken } from './_supabase-token'

const API_BASE = import.meta.env.VITE_API_BASE || ''
const PROJECT_ID = import.meta.env.VITE_PROJECT_ID

async function apiCall(action, params) {
  const res = await fetch(`${API_BASE}/api/app/${PROJECT_ID}/data`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ action, ...params }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Data request failed (${res.status})`)
  }

  return res.json()
}

// ─────────────────────────────────────────────
// Supabase client — lazy-loaded, realtime only
// ─────────────────────────────────────────────
//
// Realtime needs setAuth(jwt) BEFORE any subscribe, otherwise RLS sees the
// anon role and the subscriber misses every visibility=group event. We can't
// make subscribe() itself async (existing AI-generated code depends on the
// sync return shape), so the pattern is:
//   1. subscribe() returns a defer-stub immediately
//   2. internally we await getRealtimeClient() which awaits the token fetch
//   3. once the client is auth'd, we attach the real listener and route
//      unsubscribe() through to the actual channel cleanup

let _realtimeClientPromise = null

function getRealtimeClient() {
  if (_realtimeClientPromise) return _realtimeClientPromise
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.warn('[db] Supabase not configured — realtime disabled')
    _realtimeClientPromise = Promise.resolve(null)
    return _realtimeClientPromise
  }
  _realtimeClientPromise = (async () => {
    const client = createClient(url, key)
    const token = await getSupabaseToken()
    if (token) {
      try { await client.realtime.setAuth(token) }
      catch (e) { console.warn('[db] setAuth failed, falling back to anon context:', e) }
    }
    return client
  })()
  return _realtimeClientPromise
}

// Reference-counted shared channels. Keyed by channel name so multiple
// subscribers to the same table reuse one physical channel — avoids the
// Supabase-realtime footgun where calling `.on('postgres_changes', ...)`
// on an already-subscribed channel throws "cannot add callbacks after subscribe()".
// Cleanup is deferred one tick so React 18 StrictMode's unmount→remount
// doesn't tear down and recreate the channel.
const _sharedChannels = new Map()

function _joinSharedChannel(client, name, buildChannel, listener) {
  let entry = _sharedChannels.get(name)
  if (entry) {
    if (entry.cleanupTimer) {
      clearTimeout(entry.cleanupTimer)
      entry.cleanupTimer = null
    }
    entry.listeners.add(listener)
  } else {
    entry = { channel: null, listeners: new Set([listener]), cleanupTimer: null }
    _sharedChannels.set(name, entry)
    entry.channel = buildChannel((payload) => {
      for (const fn of entry.listeners) {
        try { fn(payload) } catch (e) { console.error('[db] listener error:', e) }
      }
    }).subscribe()
  }
  return () => {
    const cur = _sharedChannels.get(name)
    if (!cur) return
    cur.listeners.delete(listener)
    if (cur.listeners.size === 0 && !cur.cleanupTimer) {
      cur.cleanupTimer = setTimeout(() => {
        if (cur.listeners.size === 0) {
          client.removeChannel(cur.channel)
          _sharedChannels.delete(name)
        }
      }, 0)
    }
  }
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

export const db = {
  /**
   * Insert data. Optionally pass a custom id (string) as the third argument;
   * if omitted, a UUID is auto-generated. Pass options.expiresAt (ISO date) to
   * make the record self-delete after that timestamp.
   *
   * @example await db.insert('transactions', { amount: 100 })
   * @example await db.insert('settings', { theme: 'dark' }, 'user-settings')
   * @example await db.insert('codes', { value: 'X' }, undefined, { expiresAt: '2026-05-01T00:00:00Z' })
   */
  async insert(tableName, data, id, options) {
    const params = { collection: tableName, data }
    if (id !== undefined) params.id = id
    if (options?.expiresAt) params.expiresAt = options.expiresAt
    return apiCall('insert', params)
  },

  /**
   * Query data
   * @example const list = await db.select('transactions', { type: 'income' })
   * @example const page = await db.select('transactions', {}, { limit: 20, offset: 40 })
   */
  async select(tableName, filters = {}, options = {}) {
    return apiCall('select', {
      collection: tableName,
      filters,
      limit: options.limit,
      order: options.order,
      offset: options.offset,
    })
  },

  /**
   * Get a single record by ID, returns the object or null.
   * @example const txn = await db.get('transactions', 'uuid-123')
   */
  async get(tableName, id) {
    return apiCall('get', { collection: tableName, id })
  },

  /**
   * Update data — SHALLOW merge (nested objects are replaced wholesale).
   * To update one field of a nested object, pass the full updated object.
   * @example await db.update('transactions', 'uuid-123', { amount: 200 })
   */
  async update(tableName, id, data) {
    return apiCall('update', { collection: tableName, id, data })
  },

  /**
   * Delete data
   * @example await db.delete('transactions', 'uuid-123')
   */
  async delete(tableName, id) {
    await apiCall('delete', { collection: tableName, id })
    return true
  },

  /**
   * Insert or update (upsert) a record by custom id.
   * Pass options.expiresAt only when creating; ignored when updating an existing row.
   * @example await db.upsert('settings', { theme: 'dark' }, 'user-settings')
   * @example await db.upsert('session', { token: 't' }, 'current', { expiresAt: in15Min })
   */
  async upsert(tableName, data, id, options) {
    if (!id) throw new Error('db.upsert() requires an id')
    const params = { collection: tableName, data, id }
    if (options?.expiresAt) params.expiresAt = options.expiresAt
    return apiCall('upsert', params)
  },

  // ─────────────────────────────────────────────
  // Shared data (cross-user) — for social features, feeds, public content
  // ─────────────────────────────────────────────

  /**
   * Insert shared data. Adds _createdBy automatically.
   *
   * options.groupId — bind the row to a social group. Group admins/owners
   *   can then edit/delete it, even if they're not the creator.
   *
   * options.visibleTo — controls who can READ the row (server-enforced).
   *   'public' (default)        — anyone can read.
   *   'group'                   — symmetric: all members of options.groupId read.
   *                               Requires the caller to be signed in and a member.
   *   'creator-and-admin'       — asymmetric: the creator sees their own row;
   *                               admins/owners of options.groupId see all rows.
   *                               Submitters need not be members. Use for "user
   *                               submits to a service" patterns (tickets,
   *                               applications, inquiries, anonymous feedback).
   *
   * @example await db.insertShared('posts', { title: 'Hello' })  // public
   * @example await db.insertShared('rooms', { name: 'Game' }, 'room-1', { expiresAt: in1Hour })
   * @example // Tenant-scoped private record (e.g. class roster, club shuttle):
   *   await db.insertShared('rosters', studentData, undefined, {
   *     groupId: classGroupId, visibleTo: 'group'
   *   })
   */
  async insertShared(tableName, data, id, options) {
    const params = { collection: tableName, data }
    if (id !== undefined) params.id = id
    if (options?.expiresAt) params.expiresAt = options.expiresAt
    if (options?.groupId) params.groupId = options.groupId
    if (options?.visibleTo) params.visibleTo = options.visibleTo
    return apiCall('insertShared', params)
  },

  /**
   * Query shared data across all users.
   * @example const posts = await db.selectShared('posts')
   */
  async selectShared(tableName, filters = {}, options = {}) {
    return apiCall('selectShared', {
      collection: tableName,
      filters,
      limit: options.limit,
      order: options.order,
      offset: options.offset,
    })
  },

  /**
   * Get a single shared record by ID, returns the object or null.
   * @example const post = await db.getShared('posts', 'uuid-123')
   */
  async getShared(tableName, id) {
    return apiCall('getShared', { collection: tableName, id })
  },

  /**
   * Update shared data — SHALLOW merge. Pass groupId to allow group members to edit.
   * @example await db.updateShared('posts', 'uuid-123', { title: 'Updated' })
   * @example await db.updateShared('products', 'item-1', { qty: 5 }, groupId)
   */
  async updateShared(tableName, id, data, groupId) {
    const params = { collection: tableName, id, data }
    if (groupId) params.groupId = groupId
    return apiCall('updateShared', params)
  },

  /**
   * Delete shared data. Pass groupId to allow group members to delete.
   * @example await db.deleteShared('posts', 'uuid-123')
   */
  async deleteShared(tableName, id, groupId) {
    const params = { collection: tableName, id }
    if (groupId) params.groupId = groupId
    await apiCall('deleteShared', params)
    return true
  },

  /**
   * Insert or update (upsert) a shared record. Pass groupId to allow group editing.
   * options.expiresAt and options.visibleTo only apply on create — existing rows
   * keep their visibility. visibleTo can be 'public' | 'group' | 'creator-and-admin';
   * see insertShared() for the difference.
   * @example await db.upsertShared('config', { open: true }, 'site-config')
   * @example await db.upsertShared('groceries', { name: 'Milk' }, 'milk', groupId)
   * @example await db.upsertShared('rooms', { name: 'Game' }, 'r-1', undefined, { expiresAt: in1Hour })
   * @example await db.upsertShared('team-cfg', data, 'c1', groupId, { visibleTo: 'group' })
   */
  async upsertShared(tableName, data, id, groupId, options) {
    if (!id) throw new Error('db.upsertShared() requires an id')
    const params = { collection: tableName, data, id }
    if (groupId) params.groupId = groupId
    if (options?.expiresAt) params.expiresAt = options.expiresAt
    if (options?.visibleTo) params.visibleTo = options.visibleTo
    return apiCall('upsertShared', params)
  },

  // ─────────────────────────────────────────────
  // Aggregations — server-side, scale to millions of rows
  // ─────────────────────────────────────────────

  /**
   * Count records matching filters.
   * @example const total = await db.count('expenses')
   * @example const open = await db.count('tasks', { status: 'open' })
   */
  async count(tableName, filters = {}) {
    const { count } = await apiCall('count', { collection: tableName, filters })
    return count
  },

  async countShared(tableName, filters = {}) {
    const { count } = await apiCall('countShared', { collection: tableName, filters })
    return count
  },

  /**
   * Sum a numeric field across matching records. Field path supports nested via dot.
   * @example const spent = await db.sum('expenses', 'amount', { month: '2026-04' })
   * @example const totalKg = await db.sum('weighIns', 'weight.kg')
   */
  async sum(tableName, field, filters = {}) {
    const { value } = await apiCall('sum', { collection: tableName, field, filters })
    return value
  },

  async sumShared(tableName, field, filters = {}) {
    const { value } = await apiCall('sumShared', { collection: tableName, field, filters })
    return value
  },

  /**
   * Average a numeric field across matching records.
   * @example const avgScore = await db.avg('runs', 'score')
   */
  async avg(tableName, field, filters = {}) {
    const { value } = await apiCall('avg', { collection: tableName, field, filters })
    return value
  },

  async avgShared(tableName, field, filters = {}) {
    const { value } = await apiCall('avgShared', { collection: tableName, field, filters })
    return value
  },

  /**
   * Group records by a field, returning [{ key, count, value? }].
   * options.agg: 'sum' | 'avg' (requires options.field)
   * options.order: '-count' (default) | 'count' | '-value' | 'value' | 'key' | '-key'
   * options.limit: max buckets (default 100)
   * options.filters: equality filters
   *
   * @example await db.groupBy('expenses', 'category')
   *   // → [{ key: 'food', count: 23 }, { key: 'rent', count: 1 }, ...]
   * @example await db.groupBy('expenses', 'category', { agg: 'sum', field: 'amount' })
   *   // → [{ key: 'food', count: 23, value: 412.5 }, ...]
   */
  async groupBy(tableName, groupField, options = {}) {
    return apiCall('groupBy', {
      collection: tableName,
      groupField,
      agg: options.agg,
      field: options.field,
      filters: options.filters || {},
      order: options.order,
      limit: options.limit,
    })
  },

  async groupByShared(tableName, groupField, options = {}) {
    return apiCall('groupByShared', {
      collection: tableName,
      groupField,
      agg: options.agg,
      field: options.field,
      filters: options.filters || {},
      order: options.order,
      limit: options.limit,
    })
  },

  // ─────────────────────────────────────────────
  // Text search — case-insensitive substring match
  // ─────────────────────────────────────────────

  /**
   * Substring search across record JSON values. Case-insensitive (ILIKE).
   * options.fields: array of field paths to restrict the search
   * options.limit, options.offset, options.order: same as select()
   *
   * @example const hits = await db.search('notes', 'birthday')
   * @example const hits = await db.search('products', 'red shoes', { fields: ['name', 'description'] })
   */
  async search(tableName, query, options = {}) {
    return apiCall('search', {
      collection: tableName,
      query,
      fields: options.fields,
      limit: options.limit,
      offset: options.offset,
      order: options.order,
    })
  },

  async searchShared(tableName, query, options = {}) {
    return apiCall('searchShared', {
      collection: tableName,
      query,
      fields: options.fields,
      limit: options.limit,
      offset: options.offset,
      order: options.order,
    })
  },

  // ─────────────────────────────────────────────
  // Atomic counters — race-safe increment/decrement
  // ─────────────────────────────────────────────

  /**
   * Atomically add `by` to a numeric field. Missing field is treated as 0.
   * For decrement, pass a negative number.
   * @example await db.increment('posts', postId, 'likes')          // +1
   * @example await db.increment('inventory', sku, 'qty', -1)       // -1
   */
  async increment(tableName, id, field, by = 1) {
    return apiCall('increment', { collection: tableName, id, field, by })
  },

  /**
   * Atomic increment on a shared record. Permission follows READ access:
   * if the caller can see the row, they can bump a numeric field on it.
   * This is intentionally more permissive than updateShared — supports
   * "anyone can like / view-count" patterns without client-side bypass.
   * @example await db.incrementShared('post-stats', postId, 'views')
   * @example await db.incrementShared('post-stats', postId, 'likes', 1)
   */
  async incrementShared(tableName, id, field, by = 1) {
    return apiCall('incrementShared', { collection: tableName, id, field, by })
  },

  /**
   * Retrofit legacy shared rows (created before group existed) into a group.
   * Only the ORIGINAL creator of each row can migrate it. Rows with different
   * creators are skipped and returned in `results` with `ok: false`.
   * After migration the row's _groupId is set, so group admins can edit it.
   *
   * options.visibleTo='group' also flips visibility on each migrated row,
   * so non-members lose READ access. Use when an app shipped as public-shared
   * but should have been private all along.
   *
   * @param {string} tableName
   * @param {string[]} ids - doc_ids of the shared rows to migrate
   * @param {string} groupId - target group to bind these rows to
   * @param {object} [options]
   * @param {'public'|'group'} [options.visibleTo]
   * @returns {Promise<{ results: Array<{ id: string, ok: boolean, reason?: string }> }>}
   * @example await db.migrateSharedToGroup('clubs', ['club-a', 'club-b'], clubAGroupId)
   * @example await db.migrateSharedToGroup('rosters', oldIds, classGroupId, { visibleTo: 'group' })
   */
  async migrateSharedToGroup(tableName, ids, groupId, options) {
    const params = { collection: tableName, ids, groupId }
    if (options?.visibleTo) params.visibleTo = options.visibleTo
    return apiCall('migrateSharedToGroup', params)
  },

  // ─────────────────────────────────────────────
  // Real-time subscriptions (Supabase Realtime, read-only)
  // ─────────────────────────────────────────────

  /**
   * Subscribe to real-time updates for user-scoped data.
   * @example
   * const sub = db.subscribe('tasks', (event) => {
   *   console.log(event.type, event.data)  // type: 'INSERT' | 'UPDATE' | 'DELETE'
   * })
   * sub.unsubscribe()
   */
  subscribe(tableName, callback) {
    let stopped = false
    let cleanup = null

    ;(async () => {
      const client = await getRealtimeClient()
      if (stopped || !client) return

      let userId
      try { userId = getAppUserId() } catch { userId = null }

      const name = `${PROJECT_ID}:${tableName}:${userId || 'anon'}`
      const listener = (payload) => {
        const row = payload.new ?? payload.old
        if (row?.collection !== tableName) return
        if (userId && row.owner_id && row.owner_id !== userId) return
        callback({
          type: payload.eventType,
          data: { id: row.doc_id || row.id, ...(row.data || {}) },
        })
      }
      const unsubscribe = _joinSharedChannel(client, name, (fanout) =>
        client.channel(name).on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'app_data', filter: `project_id=eq.${PROJECT_ID}` },
          fanout,
        ),
      listener)

      if (stopped) unsubscribe()
      else cleanup = unsubscribe
    })()

    return {
      unsubscribe: () => {
        stopped = true
        if (cleanup) cleanup()
      },
    }
  },

  /**
   * Subscribe to real-time updates for shared (cross-user) data.
   * @example
   * const sub = db.subscribeShared('posts', (event) => {
   *   if (event.type === 'INSERT') addPost(event.data)
   * })
   */
  subscribeShared(tableName, callback) {
    let stopped = false
    let cleanup = null

    ;(async () => {
      const client = await getRealtimeClient()
      if (stopped || !client) return

      const name = `${PROJECT_ID}:${tableName}:shared`
      const listener = (payload) => {
        const row = payload.new ?? payload.old
        if (row?.collection !== tableName || row?.owner_id !== null) return
        callback({
          type: payload.eventType,
          data: { id: row.doc_id || row.id, ...(row.data || {}) },
        })
      }
      const unsubscribe = _joinSharedChannel(client, name, (fanout) =>
        client.channel(name).on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'app_data', filter: `project_id=eq.${PROJECT_ID}` },
          fanout,
        ),
      listener)

      if (stopped) unsubscribe()
      else cleanup = unsubscribe
    })()

    return {
      unsubscribe: () => {
        stopped = true
        if (cleanup) cleanup()
      },
    }
  },
}
