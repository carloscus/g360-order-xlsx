/**
 * =====================================================================
 * G360 Skill Agentes - Calculations Engine
 * =====================================================================
 * Skill especializado para cálculos de pedidos, métricas y analytics
 * 
 * @skill agentes
 * @description Motor de cálculos para análisis de pedidos, métricas
 * financieras, logística y proyecciones.
 * 
 * @author Carlos Cusi (CCUSI)
 * @version 1.0.0
 * @created 2026-04-10
 * =====================================================================
 */

import { createMemo, createSignal } from 'solid-js'

// =====================================================================
// CONSTANTES DE CÁLCULO
// =====================================================================

export const CALC_CONFIG = {
  IVA: 1.18,
  IGV_PORCENTAJE: 0.18,

  // Configuración de stock
  STOCK_OK_RATIO: 1.1,      // Stock >= 110% de cantidad
  STOCK_AJ_RATIO: 0.9,      // Stock >= 90% de cantidad
  STOCK_AGOTADO: 0,   // Stock < 90%
  
  // Configuración de descuentos
  DESC_ALTO: 50,
  DESC_MUY_ALTO: 70,
  
  // Configuración de márgenes
  MARGEN_MINIMO: 0.05, // Usar como ratio
  MARGEN_ÓPTIMO: 20,
  MARGEN_EXCELENTE: 30
}

// =====================================================================
// FUNCIONES DE CÁLCULO BÁSICO
// =====================================================================

export const calcularSubtotal = (cantidad, precio) => cantidad * precio

export const calcularValorVenta = (cantidad, precio, descuento1 = 0, descuento2 = 0) => {
  const subtotal = cantidad * precio
  return subtotal * (1 - descuento1 / 100) * (1 - descuento2 / 100)
}

export const calcularPrecioVenta = (valorVenta) => valorVenta * CALC_CONFIG.IVA

export const calcularIGV = (subtotal) => subtotal * CALC_CONFIG.IGV_PORCENTAJE

export const calcularTotalIGV = (subtotal) => subtotal * CALC_CONFIG.IVA

// =====================================================================
// CÁLCULOS DE STOCK
// =====================================================================

export const calcularEstadoStock = (stock, cantidad) => {
  if (!stock || stock === 0) return 'Agotado'
  const ratio = stock / cantidad
  if (ratio >= CALC_CONFIG.STOCK_OK_RATIO) return 'OK'
  if (ratio >= CALC_CONFIG.STOCK_AJ_RATIO) return 'AJ'
  return 'Agotado'
}

export const calcularCoberturaStock = (stock, cantidad) => {
  if (!cantidad || cantidad === 0) return 0
  return stock / cantidad
}

export const calcularRiesgoRuptura = (stock, cantidad) => {
  if (!stock || stock === 0) return 'ALTO'
  const ratio = stock / cantidad
  if (ratio < 0.5) return 'ALTO'
  if (ratio < 1.0) return 'MEDIO'
  return 'BAJO'
}

// =====================================================================
// CÁLCULOS LOGÍSTICOS
// =====================================================================

export const calcularCajas = (cantidad, unPorCaja) => {
  const unBx = unPorCaja || 1
  return Math.ceil(cantidad / unBx)
}

export const calcularPesoTotal = (cantidad, pesoKg) => {
  return cantidad * (pesoKg || 0)
}

export const calcularVolumenCaja = (largo, ancho, alto) => {
  return (largo || 0) * (ancho || 0) * (alto || 0)
}

// =====================================================================
// CÁLCULOS DE RIESGO Y RECOMENDACIONES
// =====================================================================

export const getNivelRiesgo = (cobertura) => {
  if (cobertura >= 1.5) return 'bajo'
  if (cobertura >= 1) return 'medio'
  if (cobertura >= 0.5) return 'alto'
  return 'critico'
}

export const getRecomendacionSustituto = (producto, catalogo) => {
  if (!catalogo || !catalogo.productos) return null
  
  const mismaLinea = catalogo.productos.filter(p => 
    p.linea === producto.linea && 
    p.sku !== producto.codigo &&
    p.stock > 0
  )
  
  return mismaLinea.length > 0 ? mismaLinea[0] : null
}

// =====================================================================
// CÁLCULOS FINANCIEROS
// =====================================================================

export const calcularMargen = (precioLista, precioUnitario) => {
  if (!precioLista || precioLista === 0) return 0
  return ((precioLista - precioUnitario) / precioLista) * 100
}

export const calcularMargenNeto = (precioVenta, costo) => {
  if (!precioVenta || precioVenta === 0) return 0
  return ((precioVenta - costo) / precioVenta) * 100
}

export const calcularRentabilidad = (valorVenta, costoUnitario, cantidad) => {
  const ingreso = valorVenta
  const egreso = costoUnitario * cantidad
  if (egreso === 0) return 0
  return ((ingreso - egreso) / egreso) * 100
}

// =====================================================================
// CÁLCULOS DE DESCUENTO
// =====================================================================

export const calcularDescuentoTotal = (descuento1 = 0, descuento2 = 0) => {
  return descuento1 + descuento2
}

export const calcularDescuentoEquivalente = (descuento1, descuento2) => {
  return (1 - (1 - descuento1 / 100) * (1 - descuento2 / 100)) * 100
}

export const aplicarDescuento = (monto, descuento1 = 0, descuento2 = 0) => {
  return monto * (1 - descuento1 / 100) * (1 - descuento2 / 100)
}

// =====================================================================
// CÁLCULOS DE PEDIDO
// =====================================================================

export const calcularTotalesPedido = (productos) => {
  const subtotal = productos.reduce((sum, p) => sum + (p.valorVenta || 0), 0)
  const igv = subtotal * CALC_CONFIG.IGV_PORCENTAJE
  const totalIGV = subtotal * CALC_CONFIG.IVA
  
  const disponibles = productos.filter(p => p.estadoStock !== 'Agotado')
  const totalDisponible = disponibles.reduce((sum, p) => sum + (p.precioVenta || 0), 0)
  
  const totalCajas = productos.reduce((sum, p) => sum + (p.cajas || 0), 0)
  const totalPeso = productos.reduce((sum, p) => sum + (p.pesoTotal || 0), 0)

  return {
    subtotal,
    igv,
    totalIGV,
    totalDisponible,
    totalCajas,
    totalPeso,
    productosTotal: productos.length,
    productosDisponibles: disponibles.length,
    productosAgotados: productos.length - disponibles.length
  }
}

export const calcularMetricasPorLinea = (productos) => {
  const lineas = {}
  
  productos.forEach(p => {
    const linea = p.linea || 'SIN LÍNEA'
    if (!lineas[linea]) {
      lineas[linea] = {
        nombre: linea,
        cantidadProductos: 0,
        cantidadTotal: 0,
        valorTotal: 0,
        pesoTotal: 0,
        cajasEstimadas: 0,
        productosAgotados: 0,
        productosOK: 0,
        productosAJ: 0
      }
    }
    
    lineas[linea].cantidadProductos++
    lineas[linea].cantidadTotal += p.cantidad || 0
    lineas[linea].valorTotal += p.precioVenta || 0
    lineas[linea].pesoTotal += p.pesoTotal || 0
    lineas[linea].cajasEstimadas += p.cajas || 0
    
    if (p.estadoStock === 'Agotado') lineas[linea].productosAgotados++
    else if (p.estadoStock === 'OK') lineas[linea].productosOK++
    else lineas[linea].productosAJ++
  })
  
  return Object.values(lineas).sort((a, b) => b.valorTotal - a.valorTotal)
}

export const calcularMetricasGenerales = (productos) => {
  const totalValor = productos.reduce((sum, p) => sum + (p.precioVenta || 0), 0)
  const promedioValor = productos.length > 0 ? totalValor / productos.length : 0
  
  const productosEnRiesgo = productos.filter(p => 
    p.stock && p.cantidad && p.stock < p.cantidad
  )
  
  return {
    totalValor,
    promedioValor,
    maxValor: Math.max(...productos.map(p => p.precioVenta || 0), 0),
    minValor: Math.min(...productos.map(p => p.precioVenta || Infinity), 0),
    diversidadLineas: new Set(productos.map(p => p.linea)).size,
    productosUnicos: new Set(productos.map(p => p.codigo)).size,
    productosEnRiesgo: productosEnRiesgo.length,
    listaRiesgo: productosEnRiesgo
  }
}

// =====================================================================
// CÁLCULOS DE DISTRIBUCIÓN
// =====================================================================

export const calcularDistribucionPorLinea = (productos) => {
  const lineas = {}
  let totalValor = 0
  
  productos.forEach(p => {
    const linea = p.linea || 'SIN LÍNEA'
    if (!lineas[linea]) {
      lineas[linea] = { monto: 0, cajas: 0, peso: 0 }
    }
    lineas[linea].monto += p.valorVenta || 0
    lineas[linea].cajas += p.cajas || 0
    lineas[linea].peso += p.pesoTotal || 0
    totalValor += p.valorVenta || 0
  })
  
  return Object.entries(lineas).map(([linea, data]) => ({
    linea,
    monto: data.monto,
    cajas: data.cajas,
    peso: data.peso,
    porcentaje: totalValor > 0 ? (data.monto / totalValor) * 100 : 0
  })).sort((a, b) => b.monto - a.monto)
}

// =====================================================================
// PROYECCIONES
// =====================================================================

export const proyectarVenta = (valorActual, meses, tasaCrecimiento = 0.05) => {
  let proyectado = valorActual
  for (let i = 0; i < meses; i++) {
    proyectado *= (1 + tasaCrecimiento)
  }
  return proyectado
}

export const proyectarStock = (stockActual, ventasMensuales, mesesStock = 3) => {
  const consumoMensual = ventasMensuales / mesesStock
  return stockActual - (consumoMensual * mesesStock)
}

// =====================================================================
// COMPARACIONES
// =====================================================================

export const compararConCatalogo = (producto, catalogo) => {
  const infoCatalogo = catalogo.get(producto.codigo)
  if (!infoCatalogo) return null
  
  const diferencias = []
  
  if (producto.precioUnitario !== infoCatalogo.precioLista) {
    diferencias.push({
      campo: 'precio',
      valorProducto: producto.precioUnitario,
      valorCatalogo: infoCatalogo.precioLista,
      diferencia: producto.precioUnitario - infoCatalogo.precioLista
    })
  }
  
  return diferencias.length > 0 ? diferencias : null
}

// =====================================================================
// SKILL FACTORY
// =====================================================================

export const getAgentesSkill = () => ({
  skill: 'agentes',
  version: '1.0.0',
  
  config: CALC_CONFIG,
  
  // Funciones exportadas
  calculos: {
    basic: {
      subtotal: calcularSubtotal,
      valorVenta: calcularValorVenta,
      precioVenta: calcularPrecioVenta,
      igv: calcularIGV,
      totalIGV: calcularTotalIGV
    },
    stock: {
      estado: calcularEstadoStock,
      cobertura: calcularCoberturaStock,
      nivelRiesgo: getNivelRiesgo,
      recomendacionSustituto: getRecomendacionSustituto,
      riesgo: calcularRiesgoRuptura
    },
    logistica: {
      cajas: calcularCajas,
      pesoTotal: calcularPesoTotal,
      volumen: calcularVolumenCaja
    },
    financiero: {
      margen: calcularMargen,
      margenNeto: calcularMargenNeto,
      rentabilidad: calcularRentabilidad
    },
    descuento: {
      total: calcularDescuentoTotal,
      equivalente: calcularDescuentoEquivalente,
      aplicar: aplicarDescuento
    },
    pedido: {
      totales: calcularTotalesPedido,
      metricasLinea: calcularMetricasPorLinea,
      metricasGenerales: calcularMetricasGenerales,
      distribucion: calcularDistribucionPorLinea
    },
    proyecciones: {
      venta: proyectarVenta,
      stock: proyectarStock
    }
  }
})

export default getAgentesSkill