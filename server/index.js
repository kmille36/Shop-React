// ============================================================
// Shop-React server — in-RAM database + periodic file persistence
// + image storage on disk. No external dependencies (Node >= 18).
//
//  - All shared data lives in `db` (an in-memory object).
//  - On startup it is loaded from data/db.json (if present).
//  - Whenever a mutation happens, the DB is marked dirty and is
//    written to disk on an interval (default 2s) and on shutdown.
//  - Uploaded images are saved to data/uploads/<id>.<ext> and
//    served at /uploads/<id>.<ext>.
// ============================================================
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.SHOP_DATA_DIR || path.join(__dirname, '..', 'data')
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads')
const DB_FILE = path.join(DATA_DIR, 'db.json')
const PORT = Number(process.env.PORT || 3001)
const SAVE_INTERVAL = Number(process.env.SAVE_INTERVAL_MS || 2000)
const MAX_IMAGE_BYTES = 8 * 1024 * 1024 // 8MB

// ---------- in-RAM database ----------
const db = {
  meta: { createdAt: Date.now(), updatedAt: null },
  // shared keys (synced with the browser via /api/db)
  keys: {},
}

let dirty = false
let saving = false

const log = (...a) => console.log('[shop-server]', ...a)

// ---------- persistence ----------
function saveDb() {
  if (!dirty) return
  saving = true
  try {
    db.meta.updatedAt = Date.now()
    fs.mkdirSync(DATA_DIR, { recursive: true })
    const tmp = DB_FILE + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(db))
    fs.renameSync(tmp, DB_FILE)
    dirty = false
    log('DB persisted ->', DB_FILE)
  } catch (e) {
    log('DB save failed:', e.message)
  } finally {
    saving = false
  }
}

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
      if (raw && typeof raw === 'object') {
        db.keys = raw.keys || {}
        db.meta = { ...db.meta, ...raw.meta }
        log('DB loaded from', DB_FILE, `(${Object.keys(db.keys).length} keys)`)
      }
    } else {
      log('No existing DB file — starting with an empty in-RAM DB.')
    }
  } catch (e) {
    log('DB load failed (starting empty):', e.message)
  }
}

// ---------- tiny helpers ----------
function sendJson(res, code, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
  })
  res.end(body)
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > limit) { reject(new Error('too-large')); req.destroy(); return }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
}

// ---------- image upload ----------
async function handleUpload(req, res) {
  let body
  try { body = await readBody(req, MAX_IMAGE_BYTES) }
  catch { return sendJson(res, 413, { ok: false, error: 'file-too-large' }) }

  const ct = (req.headers['content-type'] || '').toLowerCase()
  let ext = '.bin'
  if (ct.includes('png')) ext = '.png'
  else if (ct.includes('jpeg') || ct.includes('jpg')) ext = '.jpg'
  else if (ct.includes('gif')) ext = '.gif'
  else if (ct.includes('webp')) ext = '.webp'
  else if (ct.includes('svg')) ext = '.svg'
  else if (ct.includes('avif')) ext = '.avif'
  else if (ct.startsWith('image/')) ext = '.' + ct.split('/')[1].split(';')[0]

  const id = Date.now().toString(36) + '-' + crypto.randomBytes(4).toString('hex')
  const fname = id + ext
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
    fs.writeFileSync(path.join(UPLOAD_DIR, fname), body)
  } catch (e) {
    return sendJson(res, 500, { ok: false, error: 'save-failed', message: e.message })
  }
  log('Image saved:', fname, `(${body.length} bytes)`)
  sendJson(res, 200, { ok: true, url: '/uploads/' + fname })
}

// ---------- static uploads ----------
function serveUpload(res, name) {
  const safe = path.basename(name) // prevent path traversal
  const fpath = path.join(UPLOAD_DIR, safe)
  if (!fs.existsSync(fpath)) { res.writeHead(404); res.end('Not found'); return }
  const ext = path.extname(safe).toLowerCase()
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': fs.statSync(fpath).size,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Access-Control-Allow-Origin': '*',
  })
  fs.createReadStream(fpath).pipe(res)
}

// ---------- HTTP server ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const p = url.pathname

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    return res.end()
  }

  try {
    // health
    if (p === '/api/health' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, uptime: process.uptime(), dirty, keys: Object.keys(db.keys).length })
    }

    // full DB snapshot
    if (p === '/api/db' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, db })
    }

    // upsert a single shared key (value === null deletes the key)
    if (p === '/api/db/key' && req.method === 'POST') {
      const body = await readBody(req, 50 * 1024 * 1024)
      let data
      try { data = JSON.parse(body.toString('utf8')) }
      catch { return sendJson(res, 400, { ok: false, error: 'bad-json' }) }
      if (!data || typeof data.key !== 'string' || (!data.key.startsWith('shop_') && data.key !== 'cart')) {
        return sendJson(res, 400, { ok: false, error: 'bad-key' })
      }
      if (data.value === null) delete db.keys[data.key]
      else db.keys[data.key] = data.value
      db.meta.updatedAt = Date.now()
      dirty = true
      return sendJson(res, 200, { ok: true, key: data.key })
    }

    // upsert many shared keys at once (used by the beforeunload beacon)
    if (p === '/api/db/bulk' && req.method === 'POST') {
      const body = await readBody(req, 100 * 1024 * 1024)
      let data
      try { data = JSON.parse(body.toString('utf8')) }
      catch { return sendJson(res, 400, { ok: false, error: 'bad-json' }) }
      const keys = data && data.keys
      if (!keys || typeof keys !== 'object') return sendJson(res, 400, { ok: false, error: 'bad-keys' })
      for (const [k, v] of Object.entries(keys)) {
        if (typeof k !== 'string' || (!k.startsWith('shop_') && k !== 'cart')) continue
        if (v === null) delete db.keys[k]
        else db.keys[k] = v
      }
      db.meta.updatedAt = Date.now()
      dirty = true
      return sendJson(res, 200, { ok: true, count: Object.keys(keys).length })
    }

    // image upload
    if (p === '/api/upload' && req.method === 'POST') {
      return await handleUpload(req, res)
    }

    // serve uploaded images
    if (p.startsWith('/uploads/')) {
      return serveUpload(res, decodeURIComponent(p.slice('/uploads/'.length)))
    }

    // simple API index
    if (p === '/api' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, endpoints: ['GET /api/health', 'GET /api/db', 'POST /api/db/key', 'POST /api/upload', 'GET /uploads/<file>'] })
    }

    res.writeHead(404, { 'Access-Control-Allow-Origin': '*' })
    res.end('Not found')
  } catch (e) {
    log('request error:', e.message)
    try { sendJson(res, 500, { ok: false, error: e.message }) } catch {}
  }
})

// ---------- lifecycle ----------
loadDb()
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const interval = setInterval(saveDb, SAVE_INTERVAL)
const shutdown = () => {
  log('Shutting down — final DB save...')
  saveDb()
  clearInterval(interval)
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 1500).unref()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

server.listen(PORT, () => {
  log(`listening on http://localhost:${PORT}`)
  log(`DB file: ${DB_FILE}`)
  log(`Uploads: ${UPLOAD_DIR}`)
  log(`Auto-save every ${SAVE_INTERVAL}ms when dirty`)
})
