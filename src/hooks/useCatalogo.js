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
import { createSignal, createMemo } from 'solid-js'
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

/**
 * Extrae el ID de línea del prefijo del nombre ("01 - PELOTAS" → "01",
 * "MA - MASCOTAS" → "MA"). El API lo confirma como linea_id, así que este
 * fallback cubre fuentes sin el campo (JSON estático, cache viejo).
 * Líneas sin prefijo ("OTROS") no tienen ID → null.
 */
export const extraerIdLinea = (linea) => {
  if (!linea) return null
  const m = String(linea).match(/^([A-Z0-9]+)\s*-\s*/)
  return m ? m[1] : null
}

/**
 * Índice de líneas canónicas a partir de los items del catálogo: para cada
 * nombre normalizado y para cada id conserva la variante CON prefijo más
 * frecuente. La frecuencia resuelve códigos legacy ("CB - ESCRITURA" x4
 * pierde contra "76 - ESCRITURA" x172) y cubre snapshots sin linea_id.
 */
export const crearIndiceLineas = (items) => {
  const registrar = (indice, clave, linea) => {
    if (!indice.has(clave)) indice.set(clave, new Map())
    const variantes = indice.get(clave)
    variantes.set(linea, (variantes.get(linea) || 0) + 1)
  }
  const canonizar = (variantes) => {
    let mejor = null
    let mejorCuenta = -1
    variantes.forEach((cuenta, linea) => {
      if (cuenta > mejorCuenta) { mejorCuenta = cuenta; mejor = linea }
    })
    return { linea: mejor, lineaId: extraerIdLinea(mejor) }
  }

  const porNombre = new Map()
  const porId = new Map()
  ;(items || []).forEach((it) => {
    const id = extraerIdLinea(it.linea)
    if (!id) return
    const nombre = it.linea.replace(/^([A-Z0-9]+)\s*-\s*/, '').trim().toUpperCase()
    if (!nombre) return
    registrar(porNombre, nombre, it.linea)
    registrar(porId, id, it.linea)
  })

  const indice = { porNombre: new Map(), porId: new Map() }
  porNombre.forEach((variantes, nombre) => indice.porNombre.set(nombre, canonizar(variantes)))
  porId.forEach((variantes, id) => indice.porId.set(id, canonizar(variantes)))
  return indice
}

/**
 * Resuelve una línea cruda (catálogo o ERP) contra la variante canónica del
 * índice. Acepta nombre ("ESCRITURA"), nombre con prefijo ("CB - ESCRITURA")
 * o solo id ("76"). Devuelve { linea, lineaId } o null si no hay match.
 */
export const resolverLineaCanonica = (cruda, indice) => {
  if (!cruda || typeof cruda !== 'string' || !indice) return null
  const limpio = cruda.trim()
  if (!limpio) return null
  const sinPrefijo = limpio.replace(/^([A-Z0-9]+)\s*-\s*/, '').trim().toUpperCase()
  return indice.porNombre.get(sinPrefijo)
    || indice.porId.get(limpio.toUpperCase())
    || null
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
          lineaId: p.linea_id ?? p.lineaId ?? p.id_linea ?? p.idLinea ?? extraerIdLinea(p.linea),
          categoria: p.categoria || 'SIN CATEGORÍA',
          pesoKg: p.peso_kg || 0,
          unBx: p.un_bx || 0,
          sinCatalogo: !!p.sin_catalogo,
          estadoLinea: estadoLinea?.estado || null,
          colorEstadoLinea: estadoLinea?.color || null,
          descontinuado: !!p.descontinuado,
          categoriaVenta: p.categoria_venta || '',
          enGuia: p.en_guia !== undefined ? !!p.en_guia : null,
          compromiso: p.compromiso !== undefined ? !!p.compromiso : null,
          cotizable: p.cotizable !== undefined ? !!p.cotizable : null,
          porActivar: !!p.por_activar,
          vigente: p.vigente !== undefined ? !!p.vigente : null,
          origen: p.origen || '',
          revision: p.revision || '',
          derivadoDe: p.derivado_de || '',
        })
      }
    })
  }
  return mapa
}

export const normalizarItemApi = (item) => {
  const estadoLinea = mapearEstadoLinea(item.estado_linea)
  return {
    linea: item.linea || 'SIN LÍNEA',
    lineaId: item.linea_id ?? item.lineaId ?? item.id_linea ?? item.idLinea ?? extraerIdLinea(item.linea),
    categoria: item.categoria || 'SIN CATEGORÍA',
    pesoKg: item.peso_kg || 0,
    unBx: item.un_bx || 0,
    sinCatalogo: !!item.sin_catalogo,
    estadoLinea: estadoLinea?.estado || null,
    colorEstadoLinea: estadoLinea?.color || null,
    descontinuado: !!item.descontinuado,
    categoriaVenta: item.categoria_venta || '',
    enGuia: item.en_guia !== undefined ? !!item.en_guia : null,
    compromiso: item.compromiso !== undefined ? !!item.compromiso : null,
    cotizable: item.cotizable !== undefined ? !!item.cotizable : null,
    porActivar: !!item.por_activar,
    vigente: item.vigente !== undefined ? !!item.vigente : null,
    origen: item.origen || '',
    revision: item.revision || '',
    derivadoDe: item.derivado_de || '',
  }
}

export const esItemApiValido = (item) =>
  item != null &&
  typeof item === 'object' &&
  typeof item.sku === 'string' &&
  item.sku.trim().length > 0 &&
  typeof item.linea === 'string' &&
  item.linea.trim().length > 0;

const CACHE_KEY = 'g360_catalogo_lookup_cache'

const loadLookupCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

const saveLookupCache = (cache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch { }
}

// Estado global compartido
const [catalogo, setCatalogo] = createSignal(dataEstatica)
const [cargando, setCargando] = createSignal(false)
const [error, setError] = createSignal(null)
const [fuente, setFuente] = createSignal('local')
const [skusEnriched, setSkusEnriched] = createSignal(new Map())
let initialized = false
let initPromise = null

const initCatalogo = async () => {
  if (initialized || initPromise) return initPromise
  initialized = true
  initPromise = (async () => {
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
        const localData = dataEstatica.productos || dataEstatica
        const productosFusionados = [...localData]
        items.forEach(item => {
          if (item.sku && !localData.some(p => p.sku === item.sku)) {
            productosFusionados.push({ sku: item.sku, ...item })
          }
        })
        setCatalogo({ productos: productosFusionados })
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
    }
  })()
  return initPromise
}

export const useCatalogo = () => {
  if (typeof window !== 'undefined') {
    initCatalogo()
  }

  const productosMap = createMemo(() => {
    const data = catalogo()
    const prods = data.productos || data
    const baseMap = crearMapaCatalogo(prods)
    skusEnriched().forEach((val, key) => baseMap.set(key, val))
    return baseMap
  })

  const buscarProducto = (sku) => {
    return productosMap().get(sku) || null
  }

  const lookupQueue = []
  let lookupRunning = 0
  const MAX_CONCURRENT = 3
  const skusEnCola = new Set()

  const procesarLookup = async () => {
    if (lookupRunning >= MAX_CONCURRENT || lookupQueue.length === 0) return
    lookupRunning++
    const { sku, resolve } = lookupQueue.shift()
    skusEnCola.delete(sku)
    try {
      const response = await apiClient.fetchStockBySku(sku)
      if (esItemApiValido(response)) {
        const enriched = normalizarItemApi(response)
        setSkusEnriched(prev => {
          const next = new Map(prev)
          next.set(sku, enriched)
          return next
        })
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
    if (skusEnriched().has(sku)) {
      return Promise.resolve(skusEnriched().get(sku))
    }
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
      if (item != null && esItemApiValido(item)) {
        const enriched = normalizarItemApi(item)
        setSkusEnriched(prev => {
          const next = new Map(prev)
          next.set(sku, enriched)
          return next
        })
        return enriched
      }
      console.warn('[useCatalogo] Respuesta de API inválida para SKU:', sku, item && item.sku)
    } catch (err) {
      console.warn(`[useCatalogo] SKU ${sku} no encontrado en API:`, err.message)
    }
    return null
  }

  const indiceLineas = createMemo(() => crearIndiceLineas(Array.from(productosMap().values())))

  const enriquecerProducto = (productoRPE) => {
    const info = buscarProducto(productoRPE.codigo)

    const lineaERP = (productoRPE.linea || '').trim()
    const erpTieneLineaValida = lineaERP && lineaERP.length > 1 && lineaERP.length < 50 && !lineaERP.includes('\t')

    const pesoKgERP = productoRPE.pesoKg && productoRPE.pesoKg > 0 ? productoRPE.pesoKg : 0

    let lineaResuelta = info?.linea
    let lineaIdResuelto = info?.lineaId ?? extraerIdLinea(lineaResuelta)
    if (!lineaResuelta && erpTieneLineaValida) {
      lineaResuelta = lineaERP.toUpperCase()
    }

    // Canonizar contra el catálogo cuando la línea no tiene prefijo (snapshot
    // legacy tipo "ESCRITURA" o ERP con nombre/id suelto) para no perder el ID.
    if (lineaResuelta && !extraerIdLinea(lineaResuelta)) {
      const canonica = resolverLineaCanonica(lineaResuelta, indiceLineas())
      if (canonica) {
        lineaResuelta = canonica.linea
        lineaIdResuelto = canonica.lineaId
      }
    }
    if (!lineaResuelta) lineaResuelta = 'SIN LÍNEA'
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
      linea: lineaResuelta,
      pesoKg: pesoKgERP > 0 ? pesoKgERP : (info?.pesoKg || 0),
      unBx: info?.unBx || 0,
      sinCatalogo: !!info?.sinCatalogo,
      categoria: info?.categoria || 'SIN CATEGORÍA',
      tieneDatosCatalogo: !!info,
      estadoLinea: info?.estadoLinea || 'PENDIENTE',
      colorEstadoLinea: info?.colorEstadoLinea || null,
      lineaId: lineaIdResuelto ?? null,
      descontinuado: info?.descontinuado ?? false,
      categoriaVenta: info?.categoriaVenta || '',
      en_guia: info?.enGuia ?? null,
      compromiso: info?.compromiso ?? null,
      cotizable: info?.cotizable ?? null,
      por_activar: info?.porActivar ?? false,
      vigente: info?.vigente ?? null,
      origen: info?.origen || '',
      revision: info?.revision || '',
      derivado_de: info?.derivadoDe || '',
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

  const refrescarCatalogo = async () => {
    try {
      setCargando(true)
      setError(null)
      console.log('[useCatalogo] Recargando catálogo desde API...')
      const response = await apiClient.fetchStock({ fuente: 'todas', limit: 5000 })
      const items = response.items || []
      if (items.length > 0) {
        const mapaApi = new Map()
        items.forEach((item) => {
          if (!esItemApiValido(item)) {
            console.warn('[useCatalogo] Item de API sin SKU o línea, omitido:', item && item.sku)
            return
          }
          mapaApi.set(item.sku, normalizarItemApi(item))
        })
        const localData = dataEstatica.productos || catalogo().productos || []
        const productosFusionados = [...localData]
        items.forEach(item => {
          if (item.sku && !localData.some(p => p.sku === item.sku)) {
            productosFusionados.push({ sku: item.sku, ...item })
          }
        })
        setCatalogo({ productos: productosFusionados })
        setSkusEnriched(prev => {
          const next = new Map(prev)
          mapaApi.forEach((v, k) => next.set(k, v))
          return next
        })
        setFuente('api')
        setError(null)
        console.log(`[useCatalogo] Recarga OK: ${items.length} productos`)
      } else {
        setFuente('local_fallback')
        console.warn('[useCatalogo] API sin datos, guardando estado local')
      }
    } catch (err) {
      console.warn('[useCatalogo] Error recargando catálogo:', err.message)
      setError('No se pudo conectar con el API. Se usará el catálogo local.')
    } finally {
      setCargando(false)
    }
  }

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
    refrescarCatalogo,
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
