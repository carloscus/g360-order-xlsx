import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadFromStorage, setTareaPendiente } from '../hooks/usePedido'
import { ProductTable } from './ProductTable'
import { SubtotalCard, TotalIGVCard, AvailableTotalCard } from './TotalsPanel'
import { PaymentSplit } from './PaymentSplit'
import catalogoData from '../data/catalogo_productos.json'

const CHART_COLORS = [
  '#00d084', '#f43f5e', '#8b5cf6', '#f59e0b', '#06b6d4',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#eab308', '#06b6d4', '#a855f7', '#ef4444', '#22c55e',
  '#3b82f6', '#d946ef', '#14b8a6', '#f97316', '#a3e635'
]

const IVA = 1.18

const catalogoMap = new Map()
catalogoData.productos.forEach(p => {
  catalogoMap.set(p.sku, p)
})

const calcularProducto = (p) => {
  const subtotal = p.cantidad * p.precioUnitario
  const valorVenta = subtotal * (1 - p.descuento1 / 100) * (1 - p.descuento2 / 100)
  const stock = p.stock || 0
  const estadoStock = stock >= p.cantidad * 1.1 ? 'OK' : stock >= p.cantidad * 0.9 ? 'AJ' : 'Agotado'
  const prodCatalogo = catalogoMap.get(p.codigo)
  const linea = prodCatalogo?.linea || p.linea || p.descripcion?.split(' ')[0] || 'Sin Línea'
  return { 
    ...p, 
    valorVenta, 
    precioVenta: valorVenta * IVA, 
    estadoStock, 
    linea,
    pesoKg: prodCatalogo?.peso_kg || 0,
    unBx: prodCatalogo?.un_bx || 1
  }
}

export const DistributionPage = ({ darkTheme = true, toggleTheme }) => {
  const isDark = darkTheme !== false
  const navigate = useNavigate()
  const [pedidoData, setPedidoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cuotas, setCuotas] = useState([])
  const [filterStock, setFilterStock] = useState(false)

  useEffect(() => {
    const data = loadFromStorage()
    setPedidoData(data)
    setLoading(false)
  }, [])

  const getCliente = () => pedidoData?.cliente || ''
  const getRuc = () => pedidoData?.ruc || ''
  const getNumeroPedido = () => pedidoData?.numeroPedido || ''
  const getVendedor = () => pedidoData?.vendedor || ''
  const getEmailVendedor = () => pedidoData?.emailVendedor || ''
  const getTelefonoVendedor = () => pedidoData?.telefonoVendedor || ''
  const getProductos = () => pedidoData?.productos || []

  const handleCuotasChange = (nuevasCuotas) => {
    setCuotas(nuevasCuotas)
  }

  const handleVolver = () => {
    setTareaPendiente(true)
    navigate('/')
  }

  const handleFinalizar = () => {
    setTareaPendiente(false)
    navigate('/')
  }

  // Calcular productos siempre
  const productos = pedidoData?.productos || []
  const productosCalculados = productos.map(calcularProducto)

  // Datos originales (siempre completos, para HTML descargado)
  const datosOriginales = useMemo(() => {
    if (productosCalculados.length === 0) {
      return { subtotal: 0, totales: { subtotal: 0, totalIGV: 0, totalDisponible: 0 }, datosLinea: [], datosCategoria: [], totalGeneral: { cajas: 0, peso: 0 } }
    }
    
    const subtotal = productosCalculados.reduce((sum, p) => sum + p.valorVenta, 0)
    const totales = {
      subtotal,
      totalIGV: subtotal * IVA,
      totalDisponible: productosCalculados
        .filter(p => p.estadoStock !== 'Agotado')
        .reduce((sum, p) => sum + p.precioVenta, 0)
    }

    const datosLinea = Object.entries(
      productosCalculados.reduce((acc, p) => {
        const prodCatalogo = catalogoMap.get(p.codigo)
        const categoria = prodCatalogo?.categoria || 'SIN CATEGORÍA'
        if (!acc[p.linea]) {
          acc[p.linea] = { monto: 0, cajas: 0, peso: 0, categoria }
        }
        acc[p.linea].monto += p.valorVenta
        acc[p.linea].cajas += Math.ceil(p.cantidad / (p.unBx || 1))
        acc[p.linea].peso += p.cantidad * (p.pesoKg || 0)
        return acc
      }, {})
    ).map(([linea, data], index) => ({
      linea,
      monto: data.monto,
      cajas: data.cajas,
      peso: data.peso,
      categoria: data.categoria,
      porcentaje: subtotal > 0 ? (data.monto / subtotal) * 100 : 0,
      color: CHART_COLORS[index % CHART_COLORS.length]
    })).sort((a, b) => b.monto - a.monto)

    const datosCategoria = Object.entries(
      productosCalculados.reduce((acc, p) => {
        const prodCatalogo = catalogoMap.get(p.codigo)
        const categoria = prodCatalogo?.categoria || 'SIN CATEGORÍA'
        if (!acc[categoria]) {
          acc[categoria] = { monto: 0, lineas: {}, cajas: 0, peso: 0 }
        }
        acc[categoria].monto += p.valorVenta
        acc[categoria].cajas += Math.ceil(p.cantidad / (p.unBx || 1))
        acc[categoria].peso += p.cantidad * (p.pesoKg || 0)
        
        if (!acc[categoria].lineas[p.linea]) {
          acc[categoria].lineas[p.linea] = { monto: 0, cajas: 0, peso: 0 }
        }
        acc[categoria].lineas[p.linea].monto += p.valorVenta
        acc[categoria].lineas[p.linea].cajas += Math.ceil(p.cantidad / (p.unBx || 1))
        acc[categoria].lineas[p.linea].peso += p.cantidad * (p.pesoKg || 0)
        return acc
      }, {})
    ).map(([categoria, data]) => ({
      categoria,
      monto: data.monto,
      cajas: data.cajas,
      peso: data.peso,
      porcentaje: subtotal > 0 ? (data.monto / subtotal) * 100 : 0,
      lineas: Object.entries(data.lineas).map(([linea, ld], idx) => ({
        linea,
        monto: ld.monto,
        cajas: ld.cajas,
        peso: ld.peso,
        porcentaje: data.monto > 0 ? (ld.monto / data.monto) * 100 : 0,
        color: CHART_COLORS[idx % CHART_COLORS.length]
      })).sort((a, b) => b.monto - a.monto)
    })).sort((a, b) => b.monto - a.monto)

    const totalGeneral = {
      cajas: datosLinea.reduce((sum, d) => sum + d.cajas, 0),
      peso: datosLinea.reduce((sum, d) => sum + d.peso, 0)
    }

    return { subtotal, totales, datosLinea, datosCategoria, totalGeneral }
  }, [productosCalculados])

  // Datos filtrados (para UI según filterStock)
  const datosFiltrados = useMemo(() => {
    if (!filterStock || productosCalculados.length === 0) return datosOriginales

    const productosFiltrados = productosCalculados.filter(p => p.estadoStock !== 'Agotado')
    const subtotal = productosFiltrados.reduce((sum, p) => sum + p.valorVenta, 0)
    const totales = {
      subtotal,
      totalIGV: subtotal * IVA,
      totalDisponible: productosFiltrados.reduce((sum, p) => sum + p.precioVenta, 0)
    }

    const datosLinea = Object.entries(
      productosFiltrados.reduce((acc, p) => {
        const prodCatalogo = catalogoMap.get(p.codigo)
        const categoria = prodCatalogo?.categoria || 'SIN CATEGORÍA'
        if (!acc[p.linea]) {
          acc[p.linea] = { monto: 0, cajas: 0, peso: 0, categoria }
        }
        acc[p.linea].monto += p.valorVenta
        acc[p.linea].cajas += Math.ceil(p.cantidad / (p.unBx || 1))
        acc[p.linea].peso += p.cantidad * (p.pesoKg || 0)
        return acc
      }, {})
    ).map(([linea, data], index) => ({
      linea,
      monto: data.monto,
      cajas: data.cajas,
      peso: data.peso,
      categoria: data.categoria,
      porcentaje: subtotal > 0 ? (data.monto / subtotal) * 100 : 0,
      color: CHART_COLORS[index % CHART_COLORS.length]
    })).sort((a, b) => b.monto - a.monto)

    const datosCategoria = Object.entries(
      productosFiltrados.reduce((acc, p) => {
        const prodCatalogo = catalogoMap.get(p.codigo)
        const categoria = prodCatalogo?.categoria || 'SIN CATEGORÍA'
        if (!acc[categoria]) {
          acc[categoria] = { monto: 0, lineas: {}, cajas: 0, peso: 0 }
        }
        acc[categoria].monto += p.valorVenta
        acc[categoria].cajas += Math.ceil(p.cantidad / (p.unBx || 1))
        acc[categoria].peso += p.cantidad * (p.pesoKg || 0)
        
        if (!acc[categoria].lineas[p.linea]) {
          acc[categoria].lineas[p.linea] = { monto: 0, cajas: 0, peso: 0 }
        }
        acc[categoria].lineas[p.linea].monto += p.valorVenta
        acc[categoria].lineas[p.linea].cajas += Math.ceil(p.cantidad / (p.unBx || 1))
        acc[categoria].lineas[p.linea].peso += p.cantidad * (p.pesoKg || 0)
        return acc
      }, {})
    ).map(([categoria, data]) => ({
      categoria,
      monto: data.monto,
      cajas: data.cajas,
      peso: data.peso,
      porcentaje: subtotal > 0 ? (data.monto / subtotal) * 100 : 0,
      lineas: Object.entries(data.lineas).map(([linea, ld], idx) => ({
        linea,
        monto: ld.monto,
        cajas: ld.cajas,
        peso: ld.peso,
        porcentaje: data.monto > 0 ? (ld.monto / data.monto) * 100 : 0,
        color: CHART_COLORS[idx % CHART_COLORS.length]
      })).sort((a, b) => b.monto - a.monto)
    })).sort((a, b) => b.monto - a.monto)

    const totalGeneral = {
      cajas: datosLinea.reduce((sum, d) => sum + d.cajas, 0),
      peso: datosLinea.reduce((sum, d) => sum + d.peso, 0)
    }

    return { subtotal, totales, datosLinea, datosCategoria, totalGeneral }
  }, [filterStock, datosOriginales, productosCalculados])

  // Para la UI usar datos filtrados
  const { subtotal, totales, datosLinea, datosCategoria, totalGeneral } = datosFiltrados

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  if (!pedidoData || !pedidoData.productos || pedidoData.productos.length === 0) {
    return (
      <div className="distribution-page">
        <div className="empty-state">
          <h2>No hay datos del pedido</h2>
          <p>Primero carga los datos del RPE en la página principal</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Ir a Página Principal
          </button>
        </div>
      </div>
    )
  }

  const cliente = getCliente()
  const ruc = getRuc()
  const numeroPedido = getNumeroPedido()
  const vendedor = getVendedor()
  const emailVendedor = getEmailVendedor()
  const telefonoVendedor = getTelefonoVendedor()

  const formatSoles = (n) => 'S/ ' + (n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleDownloadHTML = () => {
    const cliente = getCliente()
    const ruc = getRuc()
    const numeroPedido = getNumeroPedido()
    
    if (!cliente && !ruc && !numeroPedido) {
      alert('Faltan datos del cliente. Complete los datos en la página principal.')
      navigate('/')
      return
    }

    const productos = getProductos()
    if (!productos || productos.length === 0) {
      alert('No hay productos para generar el cronograma.')
      navigate('/')
      return
    }

    const respuesta = prompt('¿Qué tema deseas para el HTML?\n1 = Oscuro\n2 = Claro\n(Presiona Enter para por defecto - Oscuro)', '1')
    let htmlDarkTheme = isDark
    if (respuesta === '2') {
      htmlDarkTheme = false
    } else if (respuesta !== '1') {
      return
    }

    const vendedor = getVendedor()
    const emailVendedor = getEmailVendedor()
    const telefonoVendedor = getTelefonoVendedor()
    
    const now = new Date()
    const dia = String(now.getDate()).padStart(2, '0')
    const mes = String(now.getMonth() + 1).padStart(2, '0')
    const anio = now.getFullYear()
    const fechaArchivo = `${dia}${mes}${anio}`
    
    const rucLimpio = ruc ? ruc.replace(/\D/g, '') : ''
    const documentoValido = (rucLimpio.length === 8 || rucLimpio.length === 11) ? rucLimpio : 'DOC'
    
    const pedidoLimpio = numeroPedido 
      ? numeroPedido.replace(/[^a-zA-Z0-9\-_]/g, '').trim().substring(0, 12)
      : 'PEDIDO'
    
    const nombreArchivo = `cronograma_${documentoValido}_${pedidoLimpio}_${fechaArchivo}.html`

    const bgColor = htmlDarkTheme ? '#0f172a' : '#f8fafc'
    const surfaceColor = htmlDarkTheme ? '#1e293b' : '#ffffff'
    const textColor = htmlDarkTheme ? '#e2e8f0' : '#1e293b'
    const mutedColor = htmlDarkTheme ? '#94a3b8' : '#64748b'
    const borderColor = htmlDarkTheme ? '#334155' : '#e2e8f0'
    const accentColor = '#00d084'

    // Usar datos originales (siempre completos)
    const datosLineaOriginales = datosOriginales.datosLinea
    const subtotalOriginal = datosOriginales.subtotal
    const totalGeneralOriginal = datosOriginales.totalGeneral
    const datosCategoriaOriginales = datosOriginales.datosCategoria
    const totalesOriginales = datosOriginales.totales
    // Generar HTML de cuotas por mes si existen
    let cuotasHTML = ''
    if (cuotas && cuotas.length > 0) {
      const cuotasPorMes = {}
      
      cuotas.forEach(c => {
        const montoNumerico = parseFloat(c.monto) || 0
        if (montoNumerico <= 0) return
        
        const fecha = new Date(c.fecha)
        if (isNaN(fecha.getTime())) return
        
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
        const mesNombre = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'][fecha.getMonth()]
        
        if (!cuotasPorMes[mesKey]) {
          cuotasPorMes[mesKey] = { nombre: mesNombre, anio: fecha.getFullYear(), cuotas: [], total: 0 }
        }
        cuotasPorMes[mesKey].cuotas.push({ ...c, monto: montoNumerico })
        cuotasPorMes[mesKey].total += montoNumerico
      })
      
        const mesesOrdenados = Object.entries(cuotasPorMes)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, mes]) => mes)
        
        const totalPedido = totalesOriginales.totalIGV || 1

        cuotasHTML = `
    <div class="section">
      <div class="section-title">📅 Distribución por Fecha</div>
      <div class="psf-container">
        <div class="psf-meses-grid">
          ${mesesOrdenados.map(mes => {
            return `
          <div class="psf-mes-card">
            <div class="psf-mes-header">
              <span class="psf-mes-nombre">${mes.nombre} ${mes.anio}</span>
              <span class="psf-mes-pct">${(totalPedido > 0 ? (mes.total / totalPedido) * 100 : 0).toFixed(2)}%</span>
            </div>
            <div class="psf-mes-cuotas">
              ${mes.cuotas.map(c => `
              <div class="psf-mes-cuota">
                <span class="psf-mes-fecha">${new Date(c.fecha).toLocaleDateString('es-PE')}</span>
                <span class="psf-mes-monto">S/ ${(c.monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>`).join('')}
            </div>
            <div class="psf-mes-total">Total: S/ ${(mes.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>`
          }).join('')}
        </div>
      </div>
    </div>`
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido ${numeroPedido || ''} - Distribución</title>
  <style>
    :root { 
      --bg: ${bgColor}; --surface: ${surfaceColor}; --text: ${textColor}; --muted: ${mutedColor}; --border: ${borderColor}; --accent: ${accentColor};
      --text-2xs: 0.5625rem; --text-xs: 0.6875rem; --text-sm: 0.75rem; --text-base: 0.875rem;
      --text-lg: 1rem; --text-xl: 1.125rem; --text-2xl: 1.25rem; --text-3xl: 1.5rem;
      --fw-normal: 400; --fw-medium: 500; --fw-semibold: 600; --fw-bold: 700; --fw-extrabold: 800;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); padding: 24px; line-height: 1.5; }
    .container { max-width: 1100px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid var(--accent); }
    .header h1 { font-size: calc(var(--text-3xl) + 2px); color: var(--accent); margin-bottom: 4px; }
    .header-meta { font-size: var(--text-sm); color: var(--muted); display: flex; gap: 16px; flex-wrap: wrap; margin-top: 4px; }
    .badge { background: var(--accent); color: var(--bg); padding: 6px 16px; border-radius: 20px; font-size: var(--text-sm); font-weight: var(--fw-bold); text-transform: uppercase; letter-spacing: 1px; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: var(--text-lg); font-weight: var(--fw-bold); color: var(--accent); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
    .client-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
    .client-item { background: var(--surface); padding: 14px 16px; border-radius: 10px; border: 1px solid var(--border); }
    .client-item label { color: var(--muted); font-size: var(--text-2xs); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px; font-weight: var(--fw-semibold); }
    .client-item span { font-size: var(--text-base); font-weight: var(--fw-semibold); }
    .kpis { display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; }
    .kpi-card { flex: 0 0 auto; min-width: 140px; background: var(--surface); border-radius: 8px; padding: 12px 16px; border: 1px solid var(--border); text-align: center; }
    .kpi-label { font-size: var(--text-2xs); color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .kpi-value { font-size: var(--text-lg); font-weight: var(--fw-bold); color: var(--accent); }
    .totals-row { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .total-card { background: var(--surface); padding: 18px; border-radius: 12px; flex: 1; min-width: 160px; text-align: center; border: 1px solid var(--border); }
    .total-card.main { background: linear-gradient(135deg, ${accentColor}20, ${accentColor}10); border: 2px solid var(--accent); }
    .total-card h4 { color: var(--muted); font-size: var(--text-2xs); text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px; }
    .total-card .value { font-size: var(--text-xl); font-weight: var(--fw-bold); color: var(--accent); }
    .butterfly-chart { background: var(--surface); border-radius: 12px; padding: 20px; border: 1px solid var(--border); }
    .butterfly-header { display: flex; align-items: center; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
    .butterfly-col-left { flex: 1; text-align: right; padding-right: 10px; font-size: var(--text-xs); color: var(--accent); font-weight: var(--fw-bold); }
    .butterfly-col-center { width: 140px; text-align: center; font-size: var(--text-xs); color: var(--muted); font-weight: var(--fw-bold); }
    .butterfly-col-right { flex: 1; padding-left: 10px; font-size: var(--text-xs); color: var(--muted); font-weight: var(--fw-bold); }
    .butterfly-row { display: flex; align-items: center; margin-bottom: 8px; padding: 6px 8px; border-radius: 8px; }
    .butterfly-row:nth-child(even) { background: rgba(128,128,128,0.05); }
    .butterfly-left { flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
    .butterfly-monto { font-size: var(--text-sm); color: var(--accent); font-weight: var(--fw-bold); text-align: right; }
    .butterfly-pct { font-size: var(--text-2xs); color: var(--muted); }
    .butterfly-bar-left { height: 24px; border-radius: 0 4px 4px 0; opacity: 0.9; }
    .butterfly-center { width: 140px; text-align: center; padding: 0 12px; }
    .butterfly-name { display: inline-block; padding: 6px 10px; border-radius: 8px; font-size: var(--text-xs); font-weight: var(--fw-bold); color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
    .butterfly-right { flex: 1; display: flex; align-items: center; gap: 8px; }
    .butterfly-bar-right { height: 24px; border-radius: 4px 0 0 4px; opacity: 0.7; }
    .butterfly-cajas { font-size: var(--text-sm); color: var(--text); font-weight: var(--fw-bold); }
    .butterfly-peso { font-size: var(--text-2xs); color: var(--muted); }
    .butterfly-total { display: flex; align-items: center; margin-top: 12px; padding: 10px 8px; background: linear-gradient(135deg, var(--accent)20, var(--accent)10); border-radius: 10px; border: 2px solid var(--accent); }
    .butterfly-total-left { flex: 1; text-align: right; padding-right: 10px; }
    .butterfly-total-center { width: 140px; text-align: center; }
    .butterfly-total-right { flex: 1; padding-left: 10px; }
    .total-value { font-size: var(--text-base); font-weight: var(--fw-bold); color: var(--text); display: block; }
    .total-label { font-size: var(--text-2xs); color: var(--muted); display: block; }
    .total-badge { display: inline-block; padding: 4px 12px; background: var(--accent); color: var(--bg); border-radius: 8px; font-size: var(--text-xs); font-weight: var(--fw-bold); }
    .categories-compact { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; background: var(--surface); border-radius: 10px; padding: 14px 18px; border: 1px solid var(--border); }
    .cat-label { font-size: var(--text-sm); color: var(--muted); font-weight: var(--fw-semibold); }
    .cat-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: var(--text-sm); }
    .cat-badge .cat-dot { width: 8px; height: 8px; border-radius: 50%; }
    .cat-badge .cat-name { font-weight: var(--fw-semibold); color: var(--text); }
    .cat-badge .cat-pct { font-weight: var(--fw-bold); }
    .cat-badge .cat-separator { color: var(--muted); }
    .cat-badge .cat-monto { font-weight: var(--fw-bold); color: var(--accent); }
    .cat-badge .cat-bx { font-weight: var(--fw-semibold); color: var(--text); }
    .cat-total-badge { display: inline-flex; align-items: center; padding: 6px 14px; background: linear-gradient(135deg, var(--accent)20, var(--accent)10); border: 2px solid var(--accent); border-radius: 20px; font-size: var(--text-sm); font-weight: var(--fw-bold); color: var(--text); margin-left: auto; }
    .footer { text-align: center; padding: 24px 0 8px; color: var(--muted); font-size: var(--text-xs); border-top: 1px solid var(--border); margin-top: 32px; }
    .print-btn { background: var(--accent); color: var(--bg); border: none; padding: 12px 28px; border-radius: 8px; font-size: var(--text-base); font-weight: var(--fw-bold); cursor: pointer; margin-bottom: 20px; display: inline-flex; align-items: center; gap: 8px; }
    .print-btn:hover { opacity: 0.9; }
    
    /* Table Styles */
    .table-container { overflow-x: auto; margin-top: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
    thead { background: var(--surface); }
    thead th { padding: 12px 8px; text-align: left; font-size: var(--text-xs); font-weight: var(--fw-bold); color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--accent); white-space: nowrap; }
    tbody td { padding: 10px 8px; border-bottom: 1px solid var(--border); color: var(--text); }
    tbody tr:hover { background: rgba(0, 208, 132, 0.05); }
    tbody tr:nth-child(even) { background: rgba(128, 128, 128, 0.03); }
    tfoot td { padding: 12px 8px; border-top: 2px solid var(--accent); font-weight: var(--fw-bold); }
    .tf-label { color: var(--muted); text-transform: uppercase; font-size: var(--text-xs); letter-spacing: 0.5px; }
    .tf-value { color: var(--accent); font-size: var(--text-base); }
    .stock-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
    .stock-ok { background: #22c55e; }
    .stock-aj { background: #f59e0b; }
    .stock-agotado { background: #ef4444; }
    
    /* Payment Split / Distribution by Month */
    .psf-container { background: var(--surface); border: 2px solid var(--accent); border-radius: 12px; padding: 16px; margin-top: 12px; }
    .psf-meses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
    .psf-mes-card { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px; }
    .psf-mes-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 2px solid var(--accent); }
    .psf-mes-nombre { font-size: var(--text-sm); font-weight: var(--fw-bold); color: var(--accent); text-transform: uppercase; }
    .psf-mes-pct { font-size: var(--text-xs); font-weight: var(--fw-bold); color: white; background: var(--accent); padding: 2px 8px; border-radius: 10px; }
    .psf-mes-cuotas { display: flex; flex-direction: column; gap: 4px; }
    .psf-mes-cuota { display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; font-size: var(--text-xs); }
    .psf-mes-fecha { color: var(--text); font-weight: var(--fw-medium); }
    .psf-mes-monto { color: var(--accent); font-weight: var(--fw-bold); }
    .psf-mes-total { text-align: right; font-size: var(--text-sm); font-weight: var(--fw-bold); color: var(--accent); padding-top: 6px; margin-top: 6px; border-top: 1px dashed var(--border); }
    
    @media (max-width: 768px) {
      .header { flex-direction: column; gap: 12px; }
      .kpis { flex-direction: column; }
      .client-grid { grid-template-columns: 1fr; }
      .totals-row { flex-direction: column; }
      .psf-meses-grid { grid-template-columns: 1fr; }
    }
    
    @media print {
      @page { size: A4; margin: 15mm 12mm 15mm 12mm; }
      body { background: white !important; color: #000 !important; padding: 0 !important; font-size: var(--text-base); }
      .container { max-width: 100% !important; }
      .print-btn { display: none !important; }
      * { color: #000 !important; box-shadow: none !important; text-shadow: none !important; }
      .header { border-bottom-color: #000 !important; }
      .header h1 { color: #000 !important; font-size: var(--text-3xl) !important; }
      .header-meta { color: #555 !important; }
      .badge { border: 1px solid #000 !important; color: white !important; background: #000 !important; }
      .section-title { color: #000 !important; border-bottom-color: #000 !important; font-size: var(--text-xl) !important; }
      .client-item { border-color: #ccc !important; background: #f9f9f9 !important; }
      .client-item label { color: #555 !important; }
      .client-item span { color: #000 !important; }
      .kpi-card { border-color: #ccc !important; background: #f9f9f9 !important; }
      .kpi-label { color: #555 !important; }
      .kpi-value { color: #000 !important; }
      .total-card { border-color: #ccc !important; background: #f9f9f9 !important; }
      .total-card.main { background: #e8f5e9 !important; border-color: #4caf50 !important; }
      .total-card h4 { color: #555 !important; }
      .total-card .value { color: #000 !important; }
      .butterfly-chart { border-color: #ccc !important; background: white !important; }
      .butterfly-header { border-bottom-color: #ccc !important; }
      .butterfly-col-left { color: #2e7d32 !important; }
      .butterfly-col-center { color: #333 !important; }
      .butterfly-col-right { color: #555 !important; }
      .butterfly-row:nth-child(even) { background: #f5f5f5 !important; }
      .butterfly-monto { color: #2e7d32 !important; }
      .butterfly-pct { color: #666 !important; }
      .butterfly-bar-left { height: 24px !important; border-radius: 0 4px 4px 0 !important; opacity: 1 !important; }
      .butterfly-bar-right { height: 24px !important; border-radius: 4px 0 0 4px !important; opacity: 1 !important; }
      .print-color { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
      .butterfly-name { color: white !important; padding: 6px 10px !important; border-radius: 8px !important; font-weight: var(--fw-bold) !important; }
      .butterfly-cajas { color: #000 !important; }
      .butterfly-peso { color: #666 !important; }
      .butterfly-total { border-color: #000 !important; background: #f0f0f0 !important; }
      .total-value { color: #000 !important; }
      .total-label { color: #555 !important; }
      .total-badge { background: #000 !important; color: white !important; }
      .categories-compact { border-color: #ccc !important; background: #f9f9f9 !important; }
      .cat-label { color: #555 !important; }
      .cat-badge { border-color: #999 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
      .cat-badge .cat-dot { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .cat-badge .cat-name { color: #000 !important; }
      .cat-badge .cat-pct { }
      .cat-badge .cat-monto { color: #2e7d32 !important; }
      .cat-total-badge { border-color: #000 !important; color: #000 !important; background: #f0f0f0 !important; }
      .stock-dot { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .stock-dot.stock-ok { background: #4caf50 !important; }
      .stock-dot.stock-aj { background: #ff9800 !important; }
      .stock-dot.stock-agotado { background: #f44336 !important; }
      .psf-container { border: 2px solid #333 !important; background: #fff !important; }
      .psf-mes-card { border: 1px solid #ccc !important; background: #fff !important; }
      .psf-mes-header { border-bottom: 2px solid #333 !important; }
      .psf-mes-pct { background: #333 !important; color: white !important; }
      .psf-mes-cuota { background: #f9f9f9 !important; border: 1px solid #ddd !important; }
      .psf-mes-fecha { color: #333 !important; }
      .psf-mes-monto { color: #000 !important; }
      .psf-mes-total { color: #000 !important; border-top: 1px dashed #333 !important; }
      table { font-size: var(--text-xs) !important; }
      thead th { background: #333 !important; color: white !important; font-size: var(--text-2xs) !important; }
      tbody td { border-color: #ccc !important; }
      tbody tr:nth-child(even) { background: #f5f5f5 !important; }
      tfoot td { border-color: #000 !important; }
      tfoot .tf-label { color: #555 !important; }
      tfoot .tf-value { color: #000 !important; }
      .footer { color: #666 !important; border-color: #ccc !important; }
      .section { page-break-inside: avoid; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; }
      h3, h4 { page-break-after: avoid; }
      .butterfly-chart { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
    <div class="header">
      <div>
        <h1>📊 ${cliente || 'Pedido'}</h1>
        <div class="header-meta">
          ${ruc ? '<span>RUC: ' + ruc + '</span>' : ''}
          ${numeroPedido ? '<span>Pedido: ' + numeroPedido + '</span>' : ''}
          ${vendedor ? '<span>Vendedor: ' + vendedor + '</span>' : ''}
          ${emailVendedor ? '<span>Email: ' + emailVendedor + '</span>' : ''}
          ${telefonoVendedor ? '<span>Tel: ' + telefonoVendedor + '</span>' : ''}
          <span>Fecha: ${now.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
      <span class="badge">Distribución</span>
    </div>
    
    <div class="section">
      <div class="section-title">💰 Totales del Pedido</div>
      <div class="totals-row">
        <div class="total-card"><h4>Subtotal</h4><div class="value">S/ ${totalesOriginales.subtotal > 0 ? totalesOriginales.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</div></div>
        <div class="total-card main"><h4>Total + IGV (18%)</h4><div class="value">S/ ${totalesOriginales.totalIGV > 0 ? totalesOriginales.totalIGV.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</div></div>
        <div class="total-card"><h4>Total Disponible</h4><div class="value">S/ ${totalesOriginales.totalDisponible > 0 ? totalesOriginales.totalDisponible.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</div></div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">📈 Análisis por Línea de Productos</div>
      <div class="kpis">
        <div class="kpi-card"><div class="kpi-label">💰 Ventas Totales</div><div class="kpi-value">S/ ${(subtotalOriginal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
        <div class="kpi-card"><div class="kpi-label">📦 Cajas Totales</div><div class="kpi-value">${totalGeneralOriginal.cajas > 0 ? totalGeneralOriginal.cajas : '0'}</div></div>
        <div class="kpi-card"><div class="kpi-label">⚖️ Peso Total</div><div class="kpi-value">${totalGeneralOriginal.peso > 0 ? totalGeneralOriginal.peso.toFixed(0) + ' kg' : '0 kg'}</div></div>
        <div class="kpi-card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;"><div class="kpi-label" style="color: rgba(255,255,255,0.9)">💳 Total + IGV</div><div class="kpi-value" style="color: white">S/ ${totalesOriginales.totalIGV > 0 ? totalesOriginales.totalIGV.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</div></div>
        <div class="kpi-card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;"><div class="kpi-label" style="color: rgba(255,255,255,0.9)">✅ Total Disponible</div><div class="kpi-value" style="color: white">S/ ${totalesOriginales.totalDisponible > 0 ? totalesOriginales.totalDisponible.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</div></div>
        <div class="kpi-card"><div class="kpi-label">📊 Líneas</div><div class="kpi-value">${datosLineaOriginales.length > 0 ? datosLineaOriginales.length : '0'}</div></div>
        <div class="kpi-card"><div class="kpi-label">📂 Categorías</div><div class="kpi-value">${datosCategoriaOriginales.length > 0 ? datosCategoriaOriginales.length : '0'}</div></div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">📊 Distribución por Línea</div>
      <div class="butterfly-chart">
        <div class="butterfly-header">
          <span class="butterfly-col-left">💰 VALOR (S/)</span>
          <span class="butterfly-col-center">LÍNEA</span>
          <span class="butterfly-col-right">📦 VOLUMEN (BX - KG)</span>
        </div>
         ${datosLineaOriginales.sort((a, b) => b.monto - a.monto).map((d) => {
          const maxMonto = Math.max(...datosLineaOriginales.map(x => x.monto), 1)
          const maxCajas = Math.max(...datosLineaOriginales.map(x => x.cajas), 1)
          const montoBarWidth = Math.max((d.monto / maxMonto) * 180, 20)
          const cajasBarWidth = Math.max((d.cajas / maxCajas) * 180, 20)
          return '<div class="butterfly-row"><div class="butterfly-left"><span class="butterfly-monto">S/ ' + (d.monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</span><span class="butterfly-pct">(' + (d.porcentaje || 0).toFixed(2) + '%)</span><div class="butterfly-bar-left print-color" style="width:' + montoBarWidth + 'px;background:' + d.color + ' !important"></div></div><div class="butterfly-center"><span class="butterfly-name print-color" style="background:' + d.color + ' !important">' + d.linea + '</span></div><div class="butterfly-right"><div class="butterfly-bar-right print-color" style="width:' + cajasBarWidth + 'px;background:' + d.color + ' !important"></div><span class="butterfly-cajas">' + (d.cajas || 0) + ' BX</span><span class="butterfly-peso">' + (d.peso || 0).toFixed(1) + ' kg (' + (totalGeneralOriginal.cajas > 0 ? ((d.cajas / totalGeneralOriginal.cajas) * 100).toFixed(2) : '0.00') + '%)</span></div></div>'
        }).join('')}
        <div class="butterfly-total">
          <div class="butterfly-total-left"><span class="total-value">S/ ${(subtotalOriginal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><span class="total-label">Total S/ (100%)</span></div>
          <div class="butterfly-total-center"><span class="total-badge">TOTAL</span></div>
          <div class="butterfly-total-right"><span class="total-value">${totalGeneralOriginal.cajas || 0} BX / ${(totalGeneralOriginal.peso || 0).toFixed(1)} kg</span><span class="total-label">Total Volumen (100%)</span></div>
        </div>
      </div>
    </div>
    
    <div class="section" style="margin-top: 20px;">
      <div class="categories-compact">
        <span class="cat-label">📂 CATEGORÍAS:</span>
        ${datosCategoriaOriginales.map((cat, idx) => '<span class="cat-badge" style="background:' + CHART_COLORS[idx % CHART_COLORS.length] + '15;border:1px solid ' + CHART_COLORS[idx % CHART_COLORS.length] + '40"><span class="cat-dot" style="background:' + CHART_COLORS[idx % CHART_COLORS.length] + '"></span><span class="cat-name">' + cat.categoria + '</span><span class="cat-pct" style="color:' + CHART_COLORS[idx % CHART_COLORS.length] + '">' + (cat.porcentaje || 0).toFixed(2) + '%</span><span class="cat-separator">•</span><span class="cat-monto">S/ ' + (cat.monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</span><span class="cat-separator">•</span><span class="cat-bx">' + (cat.cajas || 0) + ' BX</span></span>').join('')}
        <span class="cat-total-badge">TOTAL: S/ ${(subtotalOriginal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | ${totalGeneralOriginal.cajas || 0} BX | ${(totalGeneralOriginal.peso || 0).toFixed(1)} kg</span>
      </div>
    </div>
    
    ${cuotasHTML}
    
    <div class="section">
      <div class="section-title">📦 Detalle de Productos (${productosCalculados.length})</div>
      <div class="table-container">
        <table>
          <thead><tr>
            <th style="width: 30px">#</th>
            <th style="width: 80px">SKU</th>
            <th style="min-width: 200px">Descripción</th>
            <th style="width: 60px; text-align: right">Cant.</th>
            <th style="width: 70px">U/M</th>
            <th style="width: 90px; text-align: right">P. Lista (S/.)</th>
            <th style="width: 70px; text-align: center">Desc 01 (%)</th>
            <th style="width: 70px; text-align: center">Desc 02 (%)</th>
            <th style="width: 90px; text-align: right">P. Neto (S/.)</th>
            <th style="width: 110px; text-align: right">Total Neto (S/.)</th>
            <th style="width: 50px; text-align: center">Stock</th>
          </tr></thead>
          <tbody>
            ${productosCalculados.map((p, i) => '<tr><td>' + (i + 1) + '</td><td style="font-family: monospace; font-size: var(--text-xs)">' + p.codigo + '</td><td title="' + (p.descripcion || '') + '">' + (p.descripcion ? (p.descripcion.length > 45 ? p.descripcion.substring(0, 45) + '...' : p.descripcion) : '-') + '</td><td style="text-align: right">' + p.cantidad + '</td><td>' + (p.unidadMedida || '-') + '</td><td style="text-align: right">' + p.precioUnitario.toFixed(2) + '</td><td style="text-align: center">' + p.descuento1.toFixed(1) + '</td><td style="text-align: center">' + p.descuento2.toFixed(1) + '</td><td style="text-align: right">' + ((p.valorVenta / p.cantidad) || 0).toFixed(2) + '</td><td style="text-align: right; font-weight: var(--fw-bold)">' + p.valorVenta.toFixed(2) + '</td><td style="text-align: center"><span class="stock-dot stock-' + (p.estadoStock === 'OK' ? 'ok' : p.estadoStock === 'AJ' ? 'aj' : 'agotado') + '" title="' + p.estadoStock + '"></span></td></tr>').join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="tf-label">TOTALES (${productosCalculados.length} productos)</td>
              <td style="text-align: right; font-weight: var(--fw-bold)">${productosCalculados.reduce((s, p) => s + p.cantidad, 0)}</td>
              <td></td><td></td><td></td><td></td><td></td>
              <td class="tf-value" style="text-align: right">S/ ${(subtotalOriginal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    
    <div class="footer">
      G360 Order System — Generado el ${now.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — ${cliente || 'Pedido'}
    </div>
  </div>
</body>
</html>`
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

   return (
    <div className={`distribution-page ${darkTheme ? 'dark-mode' : 'light-mode'}`}>
      <div className="distribution-header">
        <button onClick={handleVolver} className="back-btn">
          ← Volver
        </button>
        <h1>📊 Dashboard de Distribución</h1>
        <div style={{display: 'flex', gap: '8px'}}>
          <button onClick={toggleTheme} className="back-btn" style={{background: isDark ? '#f59e0b' : '#374151'}}>{isDark ? '☀️' : '🌙'}</button>
          <button onClick={handleDownloadHTML} className="back-btn" style={{background: '#8b5cf6'}}>📤</button>
          <button onClick={handleFinalizar} className="btn-primary">✓ Finalizar</button>
        </div>
      </div>

      <div className="distribution-content">
        <div className="preview-client-section">
          <h3>📋 Datos del Cliente</h3>
          <div className="client-info-grid">
            <div className="info-item">
              <label>Cliente:</label>
              <span>{cliente || 'No especificado'}</span>
            </div>
            <div className="info-item">
              <label>RUC/DNI:</label>
              <span>{ruc || 'No especificado'}</span>
            </div>
            <div className="info-item">
              <label>N° Pedido:</label>
              <span>{numeroPedido || 'No especificado'}</span>
            </div>
            <div className="info-item">
              <label>Vendedor:</label>
              <span>{vendedor || 'No especificado'}</span>
            </div>
            {emailVendedor && (
              <div className="info-item">
                <label>Email:</label>
                <span>{emailVendedor}</span>
              </div>
            )}
            {telefonoVendedor && (
              <div className="info-item">
                <label>Teléfono:</label>
                <span>{telefonoVendedor}</span>
              </div>
            )}
          </div>
        </div>

        <div className="preview-totals-section">
          <h3>💰 Totales del Pedido</h3>
          <div className="totals-cards-preview">
            <SubtotalCard subtotal={totales.subtotal} />
            <TotalIGVCard totalIGV={totales.totalIGV} />
            <AvailableTotalCard totalDisponible={totales.totalDisponible} totalIGV={totales.totalIGV} />
          </div>
        </div>

        <PaymentSplit totalAmount={totales.totalIGV} onChange={handleCuotasChange} />

        <div className="preview-analytics-section">
          <h3>📈 Análisis por Línea de Productos</h3>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 140px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '8px', padding: '12px 16px', textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: 'var(--text-2xs)', marginBottom: '4px', textTransform: 'uppercase', opacity: 0.9 }}>💰 Ventas Netas</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-bold)' }}>{formatSoles(subtotal)}</div>
            </div>
            <div style={{ flex: '1 1 100px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '8px', padding: '12px 16px', textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: 'var(--text-2xs)', marginBottom: '4px', textTransform: 'uppercase', opacity: 0.9 }}>📦 Cajas</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-bold)' }}>{totalGeneral.cajas}</div>
            </div>
            <div style={{ flex: '1 1 120px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius: '8px', padding: '12px 16px', textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: 'var(--text-2xs)', marginBottom: '4px', textTransform: 'uppercase', opacity: 0.9 }}>⚖️ Peso</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-bold)' }}>{totalGeneral.peso.toFixed(0)} kg</div>
            </div>
            <div style={{ flex: '1 1 140px', background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', borderRadius: '8px', padding: '12px 16px', textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: 'var(--text-2xs)', marginBottom: '4px', textTransform: 'uppercase', opacity: 0.9 }}>💳 Total + IGV</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-bold)' }}>{formatSoles(totales.totalIGV)}</div>
            </div>
          </div>

          {/* Stock Filter Toggle */}
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterStock(!filterStock)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: filterStock ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'var(--g360-surface)',
                color: filterStock ? 'white' : 'var(--g360-text)',
                border: `1px solid ${filterStock ? '#10b981' : 'var(--g360-border)'}`,
                borderRadius: '8px',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--fw-semibold)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {filterStock ? '✅ Solo con stock' : '📦 Todo el pedido'}
            </button>
            {filterStock && (
              <span style={{
                fontSize: 'var(--text-2xs)',
                color: 'var(--g360-muted)',
                fontStyle: 'italic',
                background: 'var(--g360-surface)',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px dashed var(--g360-border)'
              }}>
                ⓘ Solo aplica a estadísticas (KPIs, gráficos). La tabla muestra todo el pedido.
              </span>
            )}
          </div>

          {/* Butterfly Chart */}
          <div style={{ marginTop: '10px', maxWidth: '1200px', background: 'var(--g360-surface)', borderRadius: '12px', padding: '16px', border: '1px solid var(--g360-border)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--text-base)', color: 'var(--g360-muted)', textAlign: 'center' }}>📊 Distribución por Línea</h4>
            
            {(() => {
              const sortedByMonto = [...datosLinea].sort((a, b) => b.monto - a.monto)
              const maxMonto = Math.max(...datosLinea.map(d => d.monto), 1)
              const maxCajas = Math.max(...datosLinea.map(d => d.cajas), 1)
              const barMaxWidth = 200
              
              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', padding: '0 10px' }}>
                    <div style={{ flex: '1', textAlign: 'right', paddingRight: '10px' }}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--g360-accent)', fontWeight: 'var(--fw-bold)' }}>💰 VALOR (S/)</span>
                    </div>
                    <div style={{ width: '140px', textAlign: 'center' }}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--g360-muted)', fontWeight: 'var(--fw-bold)' }}>LÍNEA</span>
                    </div>
                    <div style={{ flex: '1', paddingLeft: '10px' }}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--g360-muted)', fontWeight: 'var(--fw-bold)' }}>📦 VOLUMEN (BX - KG)</span>
                    </div>
                  </div>
                  
                  {sortedByMonto.map((d, idx) => {
                    const montoBarWidth = (d.monto / maxMonto) * barMaxWidth
                    const cajasBarWidth = (d.cajas / maxCajas) * barMaxWidth
                    
                    return (
                      <div key={d.linea} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', padding: '6px 10px', background: idx % 2 === 0 ? 'var(--g360-bg)' : 'transparent', borderRadius: '8px' }}>
                        <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 'var(--text-base)', color: 'var(--g360-accent)', fontWeight: 'var(--fw-bold)' }}>{formatSoles(d.monto)}</div>
                            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--g360-muted)' }}>({d.porcentaje.toFixed(2)}%)</div>
                          </div>
                          <div style={{ width: `${montoBarWidth}px`, height: '24px', background: `linear-gradient(90deg, transparent, ${d.color})`, borderRadius: '0 4px 4px 0', opacity: 0.9 }}></div>
                        </div>
                        
                        <div style={{ width: '140px', textAlign: 'center', padding: '0 12px' }}>
                          <div style={{ 
                            fontSize: 'var(--text-sm)', 
                            fontWeight: 'var(--fw-bold)',
                            background: d.color,
                            color: 'white',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {d.linea}
                          </div>
                        </div>
                        
                        <div style={{ flex: '1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: `${cajasBarWidth}px`, height: '24px', background: `linear-gradient(90deg, ${d.color}, transparent)`, borderRadius: '4px 0 0 4px', opacity: 0.7 }}></div>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 'var(--text-base)', color: 'var(--g360-text)', fontWeight: 'var(--fw-bold)' }}>{d.cajas} BX</div>
                            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--g360-muted)' }}>{d.peso.toFixed(1)} kg ({((d.cajas / totalGeneral.cajas) * 100).toFixed(2)}%)</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', padding: '10px 10px', background: 'linear-gradient(135deg, var(--g360-accent)20, var(--g360-accent)10)', borderRadius: '10px', border: '2px solid var(--g360-accent)' }}>
                    <div style={{ flex: '1', textAlign: 'right', paddingRight: '10px' }}>
                      <div style={{ fontSize: 'var(--text-lg)', color: 'var(--g360-text)', fontWeight: 'var(--fw-bold)' }}>{formatSoles(subtotal)}</div>
                      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--g360-muted)' }}>Total S/ (100%)</div>
                    </div>
                    <div style={{ width: '140px', textAlign: 'center' }}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--g360-accent)', fontWeight: 'var(--fw-bold)' }}>TOTAL</span>
                    </div>
                    <div style={{ flex: '1', paddingLeft: '10px' }}>
                      <div style={{ fontSize: 'var(--text-lg)', color: 'var(--g360-text)', fontWeight: 'var(--fw-bold)' }}>{totalGeneral.cajas} BX / {totalGeneral.peso.toFixed(1)} kg</div>
                      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--g360-muted)' }}>Total Volumen (100%)</div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          <div style={{ marginTop: '12px', maxWidth: '1200px', background: 'var(--g360-surface)', borderRadius: '12px', padding: '14px 20px', border: '1px solid var(--g360-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--g360-muted)', fontWeight: 'var(--fw-semibold)' }}>📂 CATEGORÍAS:</span>
              
              {datosCategoria.map((cat, idx) => {
                const color = CHART_COLORS[idx % CHART_COLORS.length]
                return (
                  <span key={cat.categoria} style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    padding: '6px 12px',
                    background: `${color}15`,
                    border: `1px solid ${color}40`,
                    borderRadius: '20px',
                    fontSize: 'var(--text-sm)'
                  }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }}></span>
                    <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--g360-text)' }}>{cat.categoria}</span>
                    <span style={{ fontWeight: 'var(--fw-bold)', color: color }}>{cat.porcentaje.toFixed(2)}%</span>
                    <span style={{ color: 'var(--g360-muted)' }}>•</span>
                    <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--g360-accent)' }}>{formatSoles(cat.monto)}</span>
                    <span style={{ color: 'var(--g360-muted)' }}>•</span>
                    <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--g360-text)' }}>{cat.cajas} BX</span>
                  </span>
                )
              })}
              
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '6px 14px',
                background: 'linear-gradient(135deg, var(--g360-accent)20, var(--g360-accent)10)',
                border: '2px solid var(--g360-accent)',
                borderRadius: '20px',
                fontSize: 'var(--text-sm)',
                marginLeft: 'auto'
              }}>
                <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--g360-text)' }}>TOTAL</span>
                <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--g360-accent)' }}>{formatSoles(subtotal)}</span>
                <span style={{ color: 'var(--g360-muted)' }}>|</span>
                <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--g360-text)' }}>{totalGeneral.cajas} BX</span>
                <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--g360-text)' }}>{totalGeneral.peso.toFixed(1)} kg</span>
              </span>
            </div>
          </div>
        </div>

        <div className="preview-table-section">
          <h3>📦 Detalle de Productos ({productosCalculados.length})</h3>
          <div className="table-wrapper">
            <ProductTable productos={productosCalculados} totales={totales} />
          </div>
        </div>
      </div>
    </div>
  )
}
