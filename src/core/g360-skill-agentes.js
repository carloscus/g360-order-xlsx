import { IVA } from '../constants/sharedConstants'

const CALC_CONFIG = {
  IVA,
  IGV_PORCENTAJE: 0.18,
  STOCK_OK_RATIO: 1.1,
  STOCK_AJ_RATIO: 0.9,
  DESC_ALTO: 50,
  DESC_MUY_ALTO: 70,
  MARGEN_MINIMO: 0.05,
  MARGEN_OPTIMO: 20,
  MARGEN_EXCELENTE: 30
}

const calcularValorVenta = (cantidad, precio, descuento1 = 0, descuento2 = 0) => {
  const subtotal = cantidad * precio
  return subtotal * (1 - descuento1 / 100) * (1 - descuento2 / 100)
}

const calcularPrecioVenta = (valorVenta) => valorVenta * CALC_CONFIG.IVA

export const calcularEstadoStock = (stock, cantidad) => {
  if (!stock || stock === 0) return 'Agotado'
  const ratio = stock / cantidad
  if (ratio >= CALC_CONFIG.STOCK_OK_RATIO) return 'OK'
  if (ratio >= CALC_CONFIG.STOCK_AJ_RATIO) return 'AJ'
  return 'Agotado'
}

const desgloseCajas = (unidades, unBx) => {
  const uBx = unBx || 0
  if (!uBx) return { cajas: 0, cajasCompletas: 0, unidadesSueltas: unidades }
  return {
    cajas: Math.ceil(unidades / uBx),
    cajasCompletas: Math.floor(unidades / uBx),
    unidadesSueltas: unidades % uBx
  }
}

const calcularCajas = (cantidad, unPorCaja) => desgloseCajas(cantidad, unPorCaja).cajas

const calcularCajasDetalle = (cantidad, unPorCaja) => {
  const d = desgloseCajas(cantidad, unPorCaja)
  return `${d.cajasCompletas}/${d.unidadesSueltas}`
}

const calcularPesoTotal = (cantidad, pesoKg) => {
  return cantidad * (pesoKg || 0)
}

const calcularTotalesPedido = (productos) => {
  const subtotal = productos.reduce((sum, p) => sum + (p.valorVenta || 0), 0)
  const igv = subtotal * CALC_CONFIG.IGV_PORCENTAJE
  const totalIGV = subtotal * CALC_CONFIG.IVA

  const disponibles = productos.filter(p => p.estadoStock !== 'Agotado')
  const totalDisponible = disponibles.reduce((sum, p) => sum + (p.precioVenta || 0), 0)

  const totalCajas = productos.reduce((sum, p) => sum + (p.cajas || 0), 0)
  const totalUnidadesSueltas = productos.reduce((sum, p) => sum + (p.unidadesSueltas || 0), 0)
  const totalPeso = productos.reduce((sum, p) => sum + (p.pesoTotal || 0), 0)

  return {
    subtotal,
    igv,
    totalIGV,
    totalDisponible,
    totalCajas,
    totalUnidadesSueltas,
    totalPeso,
    productosTotal: productos.length,
    productosDisponibles: disponibles.length,
    productosAgotados: productos.length - disponibles.length
  }
}

const calcularMetricasPorLinea = (productos) => {
  const lineas = {}

  productos.forEach(p => {
    const linea = p.linea || 'SIN LINEA'
    if (!lineas[linea]) {
      lineas[linea] = {
        nombre: linea,
        cantidadProductos: 0,
        cantidadTotal: 0,
        valorTotal: 0,
        pesoTotal: 0,
        cajasEstimadas: 0,
        cajasCompletas: 0,
        unidadesSueltas: 0
      }
    }

    lineas[linea].cantidadProductos++
    lineas[linea].cantidadTotal += p.cantidad || 0
    lineas[linea].valorTotal += p.precioVenta || 0
    lineas[linea].pesoTotal += p.pesoTotal || 0
    lineas[linea].cajasEstimadas += p.cajas || 0
    lineas[linea].cajasCompletas += p.cajasCompletas || 0
    lineas[linea].unidadesSueltas += p.unidadesSueltas || 0
  })

  return Object.values(lineas).sort((a, b) => b.valorTotal - a.valorTotal)
}

const calcularDistribucionPorLinea = (productos) => {
  const lineas = {}
  let totalValor = 0

  productos.forEach(p => {
    const linea = p.linea || 'SIN LINEA'
    if (!lineas[linea]) {
      lineas[linea] = { monto: 0, cajas: 0, peso: 0, cajasCompletas: 0, unidadesSueltas: 0 }
    }
    lineas[linea].monto += p.valorVenta || 0
    lineas[linea].cajas += p.cajas || 0
    lineas[linea].peso += p.pesoTotal || 0
    lineas[linea].cajasCompletas += p.cajasCompletas || 0
    lineas[linea].unidadesSueltas += p.unidadesSueltas || 0
    totalValor += p.valorVenta || 0
  })

  return Object.entries(lineas).map(([linea, data]) => ({
    linea,
    monto: data.monto,
    cajas: data.cajas,
    peso: data.peso,
    cajasCompletas: data.cajasCompletas,
    unidadesSueltas: data.unidadesSueltas,
    porcentaje: totalValor > 0 ? (data.monto / totalValor) * 100 : 0
  })).sort((a, b) => b.monto - a.monto)
}

const calcularMetricasPorCategoria = (productos) => {
  const categorias = {}
  const subtotalTotal = productos.reduce((sum, p) => sum + (p.valorVenta || 0), 0)

  productos.forEach(p => {
    const cat = p.categoria || 'SIN CATEGORIA'
    if (!categorias[cat]) categorias[cat] = { categoria: cat, monto: 0, cajas: 0, peso: 0, cajasCompletas: 0, unidadesSueltas: 0 }
    categorias[cat].monto += p.valorVenta || 0
    categorias[cat].cajas += p.cajas || 0
    categorias[cat].peso += p.pesoTotal || 0
    categorias[cat].cajasCompletas += p.cajasCompletas || 0
    categorias[cat].unidadesSueltas += p.unidadesSueltas || 0
  })

  return Object.values(categorias).map(c => ({
    ...c,
    porcentaje: subtotalTotal > 0 ? (c.monto / subtotalTotal) * 100 : 0
  })).sort((a, b) => b.monto - a.monto)
}

const calcularConsolidadoPedido = (productos) => {
  const totales = calcularTotalesPedido(productos)
  return {
    subtotal: totales.subtotal,
    totales: totales,
    datosLinea: calcularDistribucionPorLinea(productos),
    datosCategoria: calcularMetricasPorCategoria(productos),
    totalGeneral: { cajas: totales.totalCajas, unidadesSueltas: totales.totalUnidadesSueltas, peso: totales.totalPeso }
  }
}

export const getAgentesSkill = () => ({
  skill: 'agentes',
  version: '1.0.0',

  config: CALC_CONFIG,

  calculos: {
    basic: {
      valorVenta: calcularValorVenta,
      precioVenta: calcularPrecioVenta
    },
    stock: {
      estado: calcularEstadoStock
    },
    logistica: {
      cajas: calcularCajas,
      cajasDetalle: calcularCajasDetalle,
      pesoTotal: calcularPesoTotal,
      desglose: desgloseCajas
    },
    pedido: {
      totales: calcularTotalesPedido,
      metricasLinea: calcularMetricasPorLinea,
      distribucion: calcularDistribucionPorLinea,
      metricasCategoria: calcularMetricasPorCategoria,
      consolidado: calcularConsolidadoPedido
    }
  }
})

export default getAgentesSkill