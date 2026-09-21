/**
 * =====================================================================
 * G360-ORDER-XLSX - Hook useCatalogo (SolidJS)
 * =====================================================================
 * Manejo del catálogo de productos con mapa de búsqueda
 * Fuente: API /api/v1/stock (prioridad) + fallback a JSON local
 * 
 * @author Carlos Cusi (CCUSI)
 * @created 2026-04-10
 * @updated 2026-08-19 — Integración API stock
 * =====================================================================
 */

import dataEstatica from '../data/catalogo_productos.json'
import { createSignal, createMemo, onMount } from 'solid-js'
import { apiClient } from '../services/apiClient'

const PALETA_ESTADOS = [
  { raw: 'NACIONAL', color: '#059669' },
  { raw: 'NUEVO', color: '#0891b2' },
  { raw: 'IMPORTADO', color: '#d97706' },
  { raw: 'TRADICIONAL', color: '#7c3aed' },
  { raw: 'PENDIENTE', color: '#6b7280' },
  { raw: '__RESERVA_1__', color: '#dc2626' },
  { raw: '__RESERVA_2__', color: '#2563eb' },
  { raw: '__RESERVA_3__', color: '#db2777' },
]

const MAPA_ESTADO_POR_RAW = new Map(PALETA_ESTADOS.map((e, i) => [e.raw, { posicion: i, color: e.color }]))

const mapearEstadoLinea = (raw) => {
  if (raw === undefined || raw === null) return null
  const info = MAPA_ESTADO_POR_RAW.get(raw)
  if (info) return { estado: raw, color: info.color }
  return { estado: raw, color: '#6b7280' }
}

const crearMapaCatalogo = (productos) => {
  const mapa = new Map()
  if (productos && Array.isArray(productos)) {
    productos.forEach(p => {
      const sku = p.codigo || p.sku
      if (sku) {
        const estadoLinea = mapearEstadoLinea(p.estado_linea)
        mapa.set(sku, {
          linea: p.linea || 'SIN LÍNEA',
          categoria: p.categoria || 'SIN CATEGORÍA',
          pesoKg: p.peso_kg || 0,
          unBx: p.un_bx || 0,
          estadoLinea: estadoLinea?.estado || null,
          colorEstadoLinea: estadoLinea?.color || null,
        })
      }
    })
  }
  return mapa
}

const normalizarItemApi = (item) => {
  const estadoLinea = mapearEstadoLinea(item.estado_linea)
  return {
    linea: (item.linea || 'SIN LÍNEA').replace(/^\d+\s*-\s*/, ''),
    categoria: item.categoria || 'SIN CATEGORÍA',
    pesoKg: item.peso_kg || 0,
    unBx: item.un_bx || 0,
    estadoLinea: estadoLinea?.estado || null,
    colorEstadoLinea: estadoLinea?.color || null,
  }
}

const CACHE_KEY = 'g360_catalogo_lookup_cache'

// Leer cache de lookups individuales desde localStorage
const loadLookupCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

// Guardar cache de lookups individuales
const saveLookupCache = (cache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch { /* quota exceeded, ignorar */ }
}

export const useCatalogo = () => {
  const [catalogo, setCatalogo] = createSignal(dataEstatica)
  const [cargando, setCargando] = createSignal(false)
  const [error, setError] = createSignal(null)
  const [fuente, setFuente] = createSignal('local')
  const [skusEnriched, setSkusEnriched] = createSignal(new Map())

  const productosMap = createMemo(() => {
    const data = catalogo()
    const prods = data.productos || data
    const baseMap = crearMapaCatalogo(prods)
    skusEnriched().forEach((val, key) => baseMap.set(key, val))
    return baseMap
  })

  onMount(async () => {
    // Cargar cache persistente de lookups individuales primero
    const lookupCache = loadLookupCache()
    const cacheSize = Object.keys(lookupCache).length
    if (cacheSize > 0) {
      const cacheMap = new Map()
      Object.entries(lookupCache).forEach(([sku, info]) => cacheMap.set(sku, info))
      setSkusEnriched(cacheMap)
      console.log(`[useCatalogo] Cache local cargado: ${cacheSize} SKUs`)
    }

    try {
      setCargando(true)
      console.log('[useCatalogo] Cargando catálogo desde API...')
      const response = await apiClient.fetchStock({ fuente: 'todas', limit: 5000 })
      const items = response.items || []
      if (items.length > 0) {
        const mapaApi = new Map()
        items.forEach(item => {
          if (item.sku) mapaApi.set(item.sku, normalizarItemApi(item))
        })
        // FUSIONAR: catálogo local + API (la API tiene prioridad)
        const localData = dataEstatica.productos || dataEstatica
        const productosFusionados = [...localData]
        items.forEach(item => {
          if (item.sku && !localData.some(p => p.sku === item.sku)) {
            productosFusionados.push({ sku: item.sku, ...item })
          }
        })
        setCatalogo({ productos: productosFusionados })
        // Merge: API + cache (cache tiene prioridad para SKUs no en API)
        setSkusEnriched(prev => {
          const next = new Map(prev)
          mapaApi.forEach((v, k) => next.set(k, v))
          return next
        })
        setFuente('api')
        setError(null)
        console.log('[useCatalogo] API cargada:', items.length, 'productos | Fusionados:', productosFusionados.length)
      } else {
        console.warn('[useCatalogo] API sin datos, usando catálogo local')
        setFuente('local_fallback')
      }
    } catch (err) {
      console.warn('[useCatalogo] API no disponible, usando catálogo local:', err.message)
      setFuente('local_fallback')
      setError(err.message)
    } finally {
      setCargando(false)
      console.log('[useCatalogo] Fuente final:', fuente(), '| Productos en mapa:', productosMap().size)
    }
  })

  const buscarProducto = (sku) => {
    return productosMap().get(sku) || null
  }

  // Lookup individual con límite de concurrencia
  const lookupQueue = []
  let lookupRunning = 0
  const MAX_CONCURRENT = 3
  const skusEnCola = new Set() // Evitar duplicar SKUs en la cola

  const procesarLookup = async () => {
    if (lookupRunning >= MAX_CONCURRENT || lookupQueue.length === 0) return
    lookupRunning++
    const { sku, resolve } = lookupQueue.shift()
    skusEnCola.delete(sku)
    try {
      const response = await apiClient.fetchStockBySku(sku)
      if (response && response.sku) {
        const enriched = normalizarItemApi(response)
        setSkusEnriched(prev => {
          const next = new Map(prev)
          next.set(sku, enriched)
          return next
        })
        // Persistir en cache localStorage
        const cache = loadLookupCache()
        cache[sku] = enriched
        saveLookupCache(cache)
        console.log(`[useCatalogo] SKU ${sku} encontrado: un_bx=${enriched.unBx} (guardado en cache)`)
        resolve(enriched)
      } else {
        resolve(null)
      }
    } catch (e) {
      resolve(null)
    } finally {
      lookupRunning--
      procesarLookup()
    }
  }

  const buscarProductoIndividual = (sku) => {
    // Si ya está en skusEnriched, no buscar de nuevo
    if (skusEnriched().has(sku)) {
      return Promise.resolve(skusEnriched().get(sku))
    }
    // Si ya está en la cola, no duplicar
    if (skusEnCola.has(sku)) {
      return Promise.resolve(null)
    }
    skusEnCola.add(sku)
    return new Promise((resolve) => {
      lookupQueue.push({ sku, resolve })
      procesarLookup()
    })
  }

  const buscarProductoApi = async (sku) => {
    const local = buscarProducto(sku)
    if (local) return local
    try {
      const item = await apiClient.fetchStockBySku(sku)
      if (item && item.sku) {
        const enriched = normalizarItemApi(item)
        setSkusEnriched(prev => {
          const next = new Map(prev)
          next.set(sku, enriched)
          return next
        })
        return enriched
      }
    } catch (err) {
      console.warn(`[useCatalogo] SKU ${sku} no encontrado en API:`, err.message)
    }
    return null
  }

  const enriquecerProducto = (productoRPE) => {
    const info = buscarProducto(productoRPE.codigo)

    const lineaERP = (productoRPE.linea || '').trim()
    const erpTieneLineaValida = lineaERP && lineaERP.length > 1 && lineaERP.length < 50 && !lineaERP.includes('\t')

    const pesoKgERP = productoRPE.pesoKg && productoRPE.pesoKg > 0 ? productoRPE.pesoKg : 0

    // Si no se encontró en el catálogo, intentar lookup individual (async)
    if (!info && productoRPE.codigo) {
      console.warn(`[useCatalogo] SKU ${productoRPE.codigo} no en catálogo, intentando lookup individual...`)
      buscarProductoIndividual(productoRPE.codigo).then(enriched => {
        if (enriched) {
          console.log(`[useCatalogo] SKU ${productoRPE.codigo} encontrado: un_bx=${enriched.unBx}`)
        }
      })
    }

    return {
      ...productoRPE,
      linea: erpTieneLineaValida ? lineaERP.toUpperCase() : (info?.linea || 'SIN LÍNEA'),
      pesoKg: pesoKgERP > 0 ? pesoKgERP : (info?.pesoKg || 0),
      unBx: info?.unBx || 0,
      categoria: info?.categoria || 'SIN CATEGORÍA',
      tieneDatosCatalogo: !!info,
      estadoLinea: info?.estadoLinea || 'PENDIENTE',
      colorEstadoLinea: info?.colorEstadoLinea || null,
    }
  }

  const lineas = createMemo(() => {
    const lineasSet = new Set()
    productosMap().forEach((info) => {
      if (info.linea) lineasSet.add(info.linea)
    })
    return Array.from(lineasSet).sort()
  })

  const categorias = createMemo(() => {
    const catsSet = new Set()
    productosMap().forEach((info) => {
      if (info.categoria) catsSet.add(info.categoria)
    })
    return Array.from(catsSet).sort()
  })

  const stats = createMemo(() => {
    const map = productosMap()
    return {
      totalProductos: map.size,
      lineas: lineas().length,
      categorias: categorias().length
    }
  })

  // Pre-fetch: buscar SKUs faltantes en lote y esperar resultado
  const prefetchSkus = async (skus) => {
    const map = productosMap()
    const faltantes = [...new Set(skus)].filter(sku => sku && !map.has(sku) && !skusEnCola.has(sku))
    if (faltantes.length === 0) return 0
    console.log(`[useCatalogo] Pre-fetch de ${faltantes.length} SKUs faltantes...`)
    await Promise.all(faltantes.map(sku => buscarProductoIndividual(sku)))
    console.log(`[useCatalogo] Pre-fetch completado`)
    return faltantes.length
  }

  return {
    catalogo,
    cargando,
    error,
    fuente,
    productosMap,
    buscarProducto,
    buscarProductoApi,
    buscarProductoIndividual,
    prefetchSkus,
    enriquecerProducto,
    lineas,
    categorias,
    stats
  }
}

export default useCatalogo
