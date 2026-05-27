// localStorage-based data store — matches the Whacka db API shape so all
// existing page code works without changes. Data is namespaced per collection
// under the key "scriptlyst_db_{collection}".

function _read(collection) {
  try {
    return JSON.parse(localStorage.getItem(`scriptlyst_db_${collection}`) || '[]')
  } catch {
    return []
  }
}

function _write(collection, rows) {
  try {
    localStorage.setItem(`scriptlyst_db_${collection}`, JSON.stringify(rows))
  } catch {}
}

function _newId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

function _match(row, filters) {
  return Object.entries(filters).every(([k, v]) => row[k] === v)
}

export const db = {
  async insert(tableName, data, id) {
    const rows = _read(tableName)
    const newRow = { ...data, id: id || _newId(), created_at: new Date().toISOString() }
    rows.push(newRow)
    _write(tableName, rows)
    return newRow
  },

  async select(tableName, filters = {}, options = {}) {
    let rows = _read(tableName).filter(r => _match(r, filters))
    if (options.order) {
      const [field, dir] = options.order.split(':')
      rows.sort((a, b) => {
        const av = a[field] ?? ''
        const bv = b[field] ?? ''
        return dir === 'desc' ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1)
      })
    } else {
      rows.sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
    }
    const offset = options.offset || 0
    const limit = options.limit || rows.length
    return rows.slice(offset, offset + limit)
  },

  async get(tableName, id) {
    return _read(tableName).find(r => r.id === id) || null
  },

  async update(tableName, id, data) {
    const rows = _read(tableName)
    const idx = rows.findIndex(r => r.id === id)
    if (idx === -1) throw new Error(`Record ${id} not found in ${tableName}`)
    rows[idx] = { ...rows[idx], ...data, updated_at: new Date().toISOString() }
    _write(tableName, rows)
    return rows[idx]
  },

  async delete(tableName, id) {
    _write(tableName, _read(tableName).filter(r => r.id !== id))
    return true
  },

  async upsert(tableName, data, id) {
    if (!id) throw new Error('db.upsert() requires an id')
    const rows = _read(tableName)
    const idx = rows.findIndex(r => r.id === id)
    if (idx === -1) {
      const newRow = { ...data, id, created_at: new Date().toISOString() }
      rows.push(newRow)
      _write(tableName, rows)
      return newRow
    }
    rows[idx] = { ...rows[idx], ...data, updated_at: new Date().toISOString() }
    _write(tableName, rows)
    return rows[idx]
  },

  async count(tableName, filters = {}) {
    return _read(tableName).filter(r => _match(r, filters)).length
  },

  async search(tableName, query, options = {}) {
    const q = query.toLowerCase()
    let rows = _read(tableName).filter(r =>
      JSON.stringify(r).toLowerCase().includes(q)
    )
    const offset = options.offset || 0
    const limit = options.limit || rows.length
    return rows.slice(offset, offset + limit)
  },

  async increment(tableName, id, field, by = 1) {
    const rows = _read(tableName)
    const idx = rows.findIndex(r => r.id === id)
    if (idx === -1) throw new Error(`Record ${id} not found in ${tableName}`)
    rows[idx][field] = (rows[idx][field] || 0) + by
    _write(tableName, rows)
    return rows[idx]
  },

  // Shared variants — same store, no cross-user isolation in localStorage
  async insertShared(tableName, data, id) { return db.insert(tableName, data, id) },
  async selectShared(tableName, filters = {}, options = {}) { return db.select(tableName, filters, options) },
  async getShared(tableName, id) { return db.get(tableName, id) },
  async updateShared(tableName, id, data) { return db.update(tableName, id, data) },
  async deleteShared(tableName, id) { return db.delete(tableName, id) },
  async upsertShared(tableName, data, id) { return db.upsert(tableName, data, id) },
  async countShared(tableName, filters = {}) { return db.count(tableName, filters) },
  async searchShared(tableName, query, options = {}) { return db.search(tableName, query, options) },
  async incrementShared(tableName, id, field, by = 1) { return db.increment(tableName, id, field, by) },
  async groupBy() { return [] },
  async groupByShared() { return [] },
  async sum() { return 0 },
  async sumShared() { return 0 },
  async avg() { return 0 },
  async avgShared() { return 0 },
  async migrateSharedToGroup() { return { results: [] } },

  subscribe(_tableName, _callback) {
    return { unsubscribe: () => {} }
  },

  subscribeShared(_tableName, _callback) {
    return { unsubscribe: () => {} }
  },
}
