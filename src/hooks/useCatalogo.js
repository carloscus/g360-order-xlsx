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
    try {
      setCargando(true)
      const response = await apiClient.fetchStock({ fuente: 'todas', limit: 5000 })
      const items = response.items || []
      if (items.length > 0) {
        const mapaApi = new Map()
        items.forEach(item => {
          if (item.sku) mapaApi.set(item.sku, normalizarItemApi(item))
        })
        setCatalogo({ productos: items.map(i => ({ sku: i.sku, ...i })) })
        setSkusEnriched(mapaApi)
        setFuente('api')
        setError(null)
      }
    } catch (err) {
      console.warn('[useCatalogo] API no disponible, usando catálogo local:', err.message)
      setFuente('local_fallback')
      setError(err.message)
    } finally {
      setCargando(false)
    }
  })

  const buscarProducto = (sku) => {
    return productosMap().get(sku) || null
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

  return {
    catalogo,
    cargando,
    error,
    fuente,
    productosMap,
    buscarProducto,
    buscarProductoApi,
    enriquecerProducto,
    lineas,
    categorias,
    stats
  }
}

export default useCatalogo
