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
  
  // Estados de stock
  STOCK_OK: 'OK',
  STOCK_AJ: 'AJ',
  STOCK_AGOTADO: 'Agotado',
  
  // LocalStorage keys
  STORAGE_KEY: 'g360_pedido_actual',
  PENDIENTE_KEY: 'g360_tarea_pendiente',
  
  // Configuración de tabla
  ITEMS_PER_PAGE: 75,
  
  // Colores para gráficos
  CHART_COLORS: [
    '#00d084', '#f43f5e', '#8b5cf6', '#f59e0b', '#06b6d4',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
    '#eab308', '#a855f7', '#ef4444', '#22c55e', '#3b82f6'
  ],
  
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

// Calcular estado de stock
export const calcularEstadoStock = (stock, cantidad) => {
  if (!stock || stock === 0) return CONSTANTS.STOCK_AGOTADO
  if (stock >= cantidad * 1.1) return CONSTANTS.STOCK_OK
  if (stock >= cantidad * 0.9) return CONSTANTS.STOCK_AJ
  return CONSTANTS.STOCK_AGOTADO
}

// Calcular cobertura de stock
export const calcularCoberturaStock = (stock, cantidad) => {
  if (!cantidad || cantidad === 0) return 0
  return stock / cantidad
}

// Determinar nivel de riesgo
export const getNivelRiesgo = (cobertura) => {
  if (cobertura >= 1.5) return 'bajo'
  if (cobertura >= 1) return 'medio'
  if (cobertura >= 0.5) return 'alto'
  return 'critico'
}

// Generar recomendación de sustitución
export const getRecomendacionSustituto = (producto, catalogo) => {
  if (!catalogo || !catalogo.productos) return null
  
  const mismaLinea = catalogo.productos.filter(p => 
    p.linea === producto.linea && 
    p.sku !== producto.codigo &&
    p.stock > 0
  )
  
  if (mismaLinea.length === 0) return null
  
  // Devolver primer producto disponible en misma línea
  return mismaLinea[0]
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