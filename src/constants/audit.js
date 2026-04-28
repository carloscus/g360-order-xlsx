/**
 * =====================================================================
 * G360-ORDER-XLSX - Audit System
 * =====================================================================
 * Sistema de validación y auditoría de pedidos
 * 
 * @author Carlos Cusi (CCUSI)
 * @created 2026-04-10
 * =====================================================================
 */

import { calcularEstadoStock } from '../core/g360-skill-agentes'
import { createSignal, createMemo } from 'solid-js'

// =====================================================================
// TIPOS DE AUDITORÍA
// =====================================================================

export const TIPO_AUDITORIA = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success'
}

export const CATEGORIA_AUDITORIA = {
  STOCK: 'stock',
  PRECIO: 'precio',
  DESCUENTO: 'descuento',
  CANTIDAD: 'cantidad',
  CATALOGO: 'catalogo',
  VALIDACION: 'validacion',
  LOGISTICA: 'logistica'
}

// =====================================================================
// REGLAS DE AUDITORÍA
// =====================================================================

export const REGLAS_AUDITORIA = {
  // Stock
  PRODUCTO_AGOTADO: {
    id: 'PRODUCTO_AGOTADO',
    tipo: TIPO_AUDITORIA.ERROR,
    categoria: CATEGORIA_AUDITORIA.STOCK,
    mensaje: 'Producto agotado',
    evaluar: (p) => p.estadoStock === 'Agotado'
  },
  STOCK_INSUFICIENTE: {
    id: 'STOCK_INSUFICIENTE',
    tipo: TIPO_AUDITORIA.WARNING,
    categoria: CATEGORIA_AUDITORIA.STOCK,
    mensaje: 'Stock menor al 50% de la cantidad pedida',
    evaluar: (p) => p.stock > 0 && p.cantidad > p.stock * 2
  },
  STOCK_BAJO: {
    id: 'STOCK_BAJO',
    tipo: TIPO_AUDITORIA.WARNING,
    categoria: CATEGORIA_AUDITORIA.STOCK,
    mensaje: 'Stock bajo (menor al 110% de la cantidad pedida)',
    evaluar: (p) => calcularEstadoStock(p.stock, p.cantidad) === 'AJ'
  },
  
  // Precio
  PRECIO_CERO: {
    id: 'PRECIO_CERO',
    tipo: TIPO_AUDITORIA.ERROR,
    categoria: CATEGORIA_AUDITORIA.PRECIO,
    mensaje: 'Precio unitario en cero',
    evaluar: (p) => !p.precioUnitario || p.precioUnitario === 0
  },
  PRECIO_NEGATIVO: {
    id: 'PRECIO_NEGATIVO',
    tipo: TIPO_AUDITORIA.ERROR,
    categoria: CATEGORIA_AUDITORIA.PRECIO,
    mensaje: 'Precio unitario negativo',
    evaluar: (p) => p.precioUnitario < 0
  },
  PRECIO_MUY_BAJO: {
    id: 'PRECIO_MUY_BAJO',
    tipo: TIPO_AUDITORIA.WARNING,
    categoria: CATEGORIA_AUDITORIA.PRECIO,
    mensaje: 'Precio suspiciously bajo vs lista',
    evaluar: (p) => p.precioLista && p.precioUnitario < p.precioLista * 0.5
  },
  
  // Descuento
  DESC_TOTAL_ALTO: {
    id: 'DESC_TOTAL_ALTO',
    tipo: TIPO_AUDITORIA.WARNING,
    categoria: CATEGORIA_AUDITORIA.DESCUENTO,
    mensaje: 'Descuento total mayor al 50%',
    evaluar: (p) => ((p.descuento1 || 0) + (p.descuento2 || 0)) > 50
  },
  DESC_TOTAL_MUY_ALTO: {
    id: 'DESC_TOTAL_MUY_ALTO',
    tipo: TIPO_AUDITORIA.ERROR,
    categoria: CATEGORIA_AUDITORIA.DESCUENTO,
    mensaje: 'Descuento total mayor al 70%',
    evaluar: (p) => ((p.descuento1 || 0) + (p.descuento2 || 0)) > 70
  },
  
  // Cantidad
  CANTIDAD_CERO: {
    id: 'CANTIDAD_CERO',
    tipo: TIPO_AUDITORIA.ERROR,
    categoria: CATEGORIA_AUDITORIA.CANTIDAD,
    mensaje: 'Cantidad en cero',
    evaluar: (p) => !p.cantidad || p.cantidad === 0
  },
  CANTIDAD_NEGATIVA: {
    id: 'CANTIDAD_NEGATIVA',
    tipo: TIPO_AUDITORIA.ERROR,
    categoria: CATEGORIA_AUDITORIA.CANTIDAD,
    mensaje: 'Cantidad negativa',
    evaluar: (p) => p.cantidad < 0
  },
  CANTIDAD_MUY_ALTA: {
    id: 'CANTIDAD_MUY_ALTA',
    tipo: TIPO_AUDITORIA.WARNING,
    categoria: CATEGORIA_AUDITORIA.CANTIDAD,
    mensaje: 'Cantidad > 10x stock disponible',
    evaluar: (p) => p.stock > 0 && p.cantidad > p.stock * 10
  },
  
  // Catalogo
  PRODUCTO_SIN_CATALOGO: {
    id: 'PRODUCTO_SIN_CATALOGO',
    tipo: TIPO_AUDITORIA.INFO,
    categoria: CATEGORIA_AUDITORIA.CATALOGO,
    mensaje: 'Producto no encontrado en catálogo',
    evaluar: (p) => !p.tieneCatalogo
  },
  SKU_INVALIDO: {
    id: 'SKU_INVALIDO',
    tipo: TIPO_AUDITORIA.ERROR,
    categoria: CATEGORIA_AUDITORIA.CATALOGO,
    mensaje: 'SKU inválido o vacío',
    evaluar: (p) => !p.codigo || p.codigo.length < 3
  },
  
  // Logística
  PESO_CERO: {
    id: 'PESO_CERO',
    tipo: TIPO_AUDITORIA.INFO,
    categoria: CATEGORIA_AUDITORIA.LOGISTICA,
    mensaje: 'Peso no disponible en catálogo',
    evaluar: (p) => p.pesoKg === 0
  },
  UN_BX_CERO: {
    id: 'UN_BX_CERO',
    tipo: TIPO_AUDITORIA.INFO,
    categoria: CATEGORIA_AUDITORIA.LOGISTICA,
    mensaje: 'Unidades por caja no disponibles',
    evaluar: (p) => !p.unBx || p.unBx === 1
  }
}

// =====================================================================
// FUNCIONES DE AUDITORÍA
// =====================================================================

export const auditarProducto = (producto) => {
  const hallazgos = []
  
  Object.values(REGLAS_AUDITORIA).forEach(regla => {
    if (regla.evaluar(producto)) {
      hallazgos.push({
        reglaId: regla.id,
        tipo: regla.tipo,
        categoria: regla.categoria,
        mensaje: regla.mensaje,
        productoId: producto.id,
        sku: producto.codigo,
        descripcion: producto.descripcion
      })
    }
  })
  
  return hallazgos
}

export const auditarPedido = (productos) => {
  const todosHallazgos = []
  const productosConProblemas = new Set()
  
  productos.forEach(producto => {
    const hallazgos = auditarProducto(producto)
    if (hallazgos.length > 0) {
      productosConProblemas.add(producto.id)
      todosHallazgos.push(...hallazgos)
    }
  })
  
  // Resumen por tipo
  const resumen = {
    errores: todosHallazgos.filter(h => h.tipo === TIPO_AUDITORIA.ERROR).length,
    advertencias: todosHallazgos.filter(h => h.tipo === TIPO_AUDITORIA.WARNING).length,
    infos: todosHallazgos.filter(h => h.tipo === TIPO_AUDITORIA.INFO).length,
    productosConErrores: productosConProblemas.size,
    totalProductos: productos.length
  }
  
  return {
    hallazgos: todosHallazgos,
    resumen,
    esValido: resumen.errores === 0,
    porcentajeValidos: productos.length > 0 
      ? ((productos.length - productosConProblemas.size) / productos.length) * 100 
      : 100
  }
}

export const getHallazgosPorCategoria = (hallazgos) => {
  const porCategoria = {}
  hallazgos.forEach(h => {
    if (!porCategoria[h.categoria]) {
      porCategoria[h.categoria] = []
    }
    porCategoria[h.categoria].push(h)
  })
  return porCategoria
}

export const getHallazgosPorTipo = (hallazgos) => {
  return {
    errores: hallazgos.filter(h => h.tipo === TIPO_AUDITORIA.ERROR),
    advertencias: hallazgos.filter(h => h.tipo === TIPO_AUDITORIA.WARNING),
    infos: hallazgos.filter(h => h.tipo === TIPO_AUDITORIA.INFO)
  }
}