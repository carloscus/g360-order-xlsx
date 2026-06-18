const DB_NAME = 'g360_html_historial'
const DB_VERSION = 1
const STORE_NAME = 'html_snapshots'

const abrirDB = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, DB_VERSION)
  req.onupgradeneeded = () => {
    const db = req.result
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      store.createIndex('timestamp', 'timestamp', { unique: false })
      store.createIndex('cliente', 'cliente', { unique: false })
    }
  }
  req.onsuccess = () => resolve(req.result)
  req.onerror = () => reject(req.error)
})

export const guardarHTMLSnapshot = async ({ cliente, ruc, numeroPedido, html }) => {
  const db = await abrirDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  const entry = {
    id: `html_${Date.now()}`,
    timestamp: Date.now(),
    fecha: new Date().toLocaleString('es-PE'),
    cliente: cliente || 'Sin cliente',
    ruc: ruc || '',
    numeroPedido: numeroPedido || '',
    html
  }
  store.add(entry)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(entry)
    tx.onerror = () => reject(tx.error)
  })
}

export const listarHTMLSnapshots = async () => {
  const db = await abrirDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const index = store.index('timestamp')
  const items = []
  return new Promise((resolve, reject) => {
    const cursor = index.openCursor(null, 'prev')
    cursor.onsuccess = () => {
      if (cursor.result) {
        items.push(cursor.result.value)
        cursor.result.continue()
      } else {
        resolve(items)
      }
    }
    cursor.onerror = () => reject(cursor.error)
  })
}

export const eliminarHTMLSnapshot = async (id) => {
  const db = await abrirDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.delete(id)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export const descargarHTML = (entry) => {
  const rucLimpio = (entry.ruc || '').replace(/\D/g, '')
  const doc = (rucLimpio.length === 8 || rucLimpio.length === 11) ? rucLimpio : 'DOC'
  const pedido = (entry.numeroPedido || '').replace(/[^a-zA-Z0-9\-_]/g, '').trim().substring(0, 12) || 'PEDIDO'
  const fecha = new Date(entry.timestamp).toISOString().split('T')[0].replace(/-/g, '')
  const nombre = `cronograma_${doc}_${pedido}_${fecha}.html`

  const blob = new Blob([entry.html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
