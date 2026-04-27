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

import { createSignal, createMemo, onMount } from 'solid-js'

const CATALOGO_PATH = '/catalogo_productos.json'

// Crear mapa de productos del catálogo: sku -> datos completos
const crearMapaCatalogo = (productos) => {
  const mapa = new Map()
  if (productos && Array.isArray(productos)) {
    productos.forEach(p => {
      if (p.codigo || p.sku) {
        mapa.set(p.codigo || p.sku, {
          linea: p.linea || 'SIN LÍNEA',
          categoria: p.categoria || 'SIN CATEGORÍA',
          grupo: p.grupo || '',
          familia: p.familia || '',
          pesoKg: p.peso_kg || p.can_kg_um || 0,
          unBx: p.un_bx || p.u_por_caja || 1,
          precioLista: p.precio_lista || p.precio || 0,
          stock: p.stock || p.stock_referencial || 0,
        })
      }
    })
  }
  return mapa
}

export const useCatalogo = () => {
  const [catalogo, setCatalogo] = createSignal({})
  const [cargando, setCargando] = createSignal(true)
  const [error, setError] = createSignal(null)

  // Mapa de productos para búsqueda rápida
  const productosMap = createMemo(() => {
    const data = catalogo()
    const prods = data.productos || data
    return crearMapaCatalogo(prods)
  })

  // Cargar catálogo al inicio
  onMount(async () => {
    try {
      const res = await fetch('/catalogo_productos.json')
      if (!res.ok) throw new Error('Error cargando catálogo')
      const data = await res.json()
      setCatalogo(data)
    } catch (e) {
      console.error('Error cargando catálogo:', e)
      setError(e.message)
    } finally {
      setCargando(false)
    }
  })

  // Buscar producto en catálogo
  const buscarProducto = (sku) => {
    return productosMap().get(sku) || null
  }

  // Enriquecer producto con datos del catálogo
  const enriquecerProducto = (productoRPE) => {
    const info = buscarProducto(productoRPE.codigo)
    
    if (info) {
      return {
        ...productoRPE,
        linea: info.linea,
        categoria: info.categoria,
        grupo: info.grupo,
        familia: info.familia,
        pesoKg: info.pesoKg,
        unBx: info.unBx,
        precioLista: info.precioLista,
        tieneDatosCatalogo: true
      }
    }
    
    // Si no está en catálogo, inferir desde descripción
    return {
      ...productoRPE,
      linea: productoRPE.descripcion?.split(' ')[0] || 'SIN LÍNEA',
      categoria: 'SIN CATEGORÍA',
      pesoKg: 0,
      unBx: 1,
      precioLista: 0,
      tieneDatosCatalogo: false
    }
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