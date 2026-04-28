/**
 * =====================================================================
 * G360-ORDER-XLSX - Constantes de Validación
 * =====================================================================
 * Sistema de validación en tiempo real para productos del pedido
 * 
 * @author Carlos Cusi (CCUSI)
 * @created 2026-04-10
 * =====================================================================
 */

import { calcularEstadoStock, calcularCoberturaStock, getNivelRiesgo, getRecomendacionSustituto } from '../core/g360-skill-agentes'

// Configuración de validaciones
export const VALIDACIONES = {
  precioCero: { 
    umbral: 0, 
    nivel: 'error', 
    mensaje: 'Precio en cero' 
  },
  stockAgotado: { 
    umbral: 0, 
    nivel: 'warning', 
    mensaje: 'Sin stock disponible' 
  },
  cantidadExcesiva: { 
    factor: 2, 
    nivel: 'warning', 
    mensaje: 'Cantidad > 2x stock' 
  },
  descuentoExcesivo: { 
    umbral: 50, 
    nivel: 'warning', 
    mensaje: 'Descuento > 50%' 
  },
  precioMinimo: { 
    umbral: 0.01, 
    nivel: 'error', 
    mensaje: 'Precio mínimo no válido' 
  },
  cantidadCero: {
    umbral: 0,
    nivel: 'error',
    mensaje: 'Cantidad en cero'
  }
}

// Constantes de negocio
export const CONSTANTS = {
  IVA: 1.18,
  IGV_PORCENTAJE: 0.18,

  // Estados de stock (referenciar desde g360-skill-agentes.js si es necesario)

  // LocalStorage keys
  STORAGE_KEY: 'g360_pedido_actual',
  PENDIENTE_KEY: 'g360_tarea_pendiente',
  
  // Configuración de tabla
  ITEMS_PER_PAGE: 75,
  
  // Colores para gráficos (importar de sharedConstants)
  // Feriados Perú
  FERIADOS_PERU: {
    '01-01': 'Año Nuevo',
    '05-01': 'Día del Trabajo',
    '06-29': 'San Pedro y San Pablo',
    '07-28': 'Día de la Independencia',
    '07-29': 'Día de la Independencia',
    '08-30': 'Santa Rosa de Lima',
    '10-08': 'Combate de Angamos',
    '11-01': 'Todos los Santos',
    '12-08': 'Inmaculada Concepción',
    '12-25': 'Navidad',
  }
}

// Validar un producto individual
export const validarProducto = (producto) => {
  const validaciones = []
  
  // Validar cantidad
  if (!producto.cantidad || producto.cantidad === 0) {
    validaciones.push({ 
      ...VALIDACIONES.cantidadCero, 
      producto: producto.codigo,
      tipo: 'cantidad'
    })
  }
  
  // Validar precio
  if (!producto.precioUnitario || producto.precioUnitario === 0) {
    validaciones.push({ 
      ...VALIDACIONES.precioCero, 
      producto: producto.codigo,
      tipo: 'precio'
    })
  }
  
  // Validar stock agotado
  if (!producto.stock || producto.stock === 0) {
    validaciones.push({ 
      ...VALIDACIONES.stockAgotado, 
      producto: producto.codigo,
      tipo: 'stock'
    })
  }
  
  // Validar cantidad excesiva vs stock
  if (producto.stock && producto.cantidad && producto.cantidad > producto.stock * VALIDACIONES.cantidadExcesiva.factor) {
    validaciones.push({ 
      ...VALIDACIONES.cantidadExcesiva, 
      producto: producto.codigo,
      tipo: 'cantidad'
    })
  }
  
  // Validar descuentos excesivos
  const descTotal = (producto.descuento1 || 0) + (producto.descuento2 || 0)
  if (descTotal > VALIDACIONES.descuentoExcesivo.umbral) {
    validaciones.push({ 
      ...VALIDACIONES.descuentoExcesivo, 
      producto: producto.codigo,
      tipo: 'descuento'
    })
  }
  
  return validaciones
}

// Obtener resumen de validaciones para todos los productos
export const getResumenValidaciones = (productos) => {
  const errores = []
  const advertencias = []
  
  if (!productos || productos.length === 0) {
    return { errores: [], advertencias: [], total: 0 }
  }
  
  productos.forEach(p => {
    const result = validarProducto(p)
    result.forEach(v => {
      if (v.nivel === 'error') {
        errores.push(v)
      } else {
        advertencias.push(v)
      }
    })
  })
  
  return { 
    errores, 
    advertencias, 
    total: errores.length + advertencias.length,
    productosConErrores: [...new Set(errores.map(e => e.producto))].length,
    productosConAdvertencias: [...new Set(advertencias.map(a => a.producto))].length
  }
}

// Exportar todo
export default {
  VALIDACIONES,
  CONSTANTS,
  validarProducto,
  getResumenValidaciones,
  calcularEstadoStock,
  calcularCoberturaStock,
  getNivelRiesgo
}