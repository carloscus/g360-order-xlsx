/**
 * =====================================================================
 * G360-ORDER-XLSX - Hook useCatalogo (SolidJS)
 * =====================================================================
 * Manejo del catálogo de productos con mapa de búsqueda
 * 
 * @author Carlos Cusi (CCUSI)
 * @created 2026-04-10
 * =====================================================================
 */

import dataEstatica from '../data/catalogo_productos.json'
import { createSignal, createMemo } from 'solid-js'

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
      if (p.codigo || p.sku) {
        const estadoLinea = mapearEstadoLinea(p.estado_linea)
        mapa.set(p.codigo || p.sku, {
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

export const useCatalogo = () => {
  const [catalogo, setCatalogo] = createSignal(dataEstatica)
  const [cargando, setCargando] = createSignal(false)
  const [error, setError] = createSignal(null)

  // Mapa de productos para búsqueda rápida
  const productosMap = createMemo(() => {
    const data = catalogo()
    const prods = data.productos || data
    return crearMapaCatalogo(prods)
  })

  // Buscar producto en catálogo
  const buscarProducto = (sku) => {
    return productosMap().get(sku) || null
  }

  // Enriquecer producto con datos del catálogo
  // Los datos del ERP (campos extendidos) tienen prioridad sobre el catálogo local
  const enriquecerProducto = (productoRPE) => {
    const info = buscarProducto(productoRPE.codigo)
    
    const lineaERP = (productoRPE.linea || '').trim();
    const erpTieneLineaValida = lineaERP && lineaERP.length > 1 && lineaERP.length < 50 && !lineaERP.includes('\t');
    
    const pesoKgERP = productoRPE.pesoKg && productoRPE.pesoKg > 0 ? productoRPE.pesoKg : 0
    
    const base = {
      ...productoRPE,
      linea: erpTieneLineaValida ? lineaERP.toUpperCase() : (info?.linea || 'SIN LÍNEA'),
      pesoKg: pesoKgERP > 0 ? pesoKgERP : (info?.pesoKg || 0),
      unBx: info?.unBx || 0,
      categoria: info?.categoria || 'SIN CATEGORÍA',
      tieneDatosCatalogo: !!info,
      estadoLinea: info?.estadoLinea || 'PENDIENTE',
      colorEstadoLinea: info?.colorEstadoLinea || null,
    }
    
    return base
  }

  // Obtener todas las líneas únicas
  const lineas = createMemo(() => {
    const lineasSet = new Set()
    productosMap().forEach((info, sku) => {
      if (info.linea) lineasSet.add(info.linea)
    })
    return Array.from(lineasSet).sort()
  })

  // Obtener todas las categorías únicas
  const categorias = createMemo(() => {
    const catsSet = new Set()
    productosMap().forEach((info, sku) => {
      if (info.categoria) catsSet.add(info.categoria)
    })
    return Array.from(catsSet).sort()
  })

  // Estadísticas del catálogo
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
    productosMap,
    buscarProducto,
    enriquecerProducto,
    lineas,
    categorias,
    stats
  }
}

export default useCatalogo