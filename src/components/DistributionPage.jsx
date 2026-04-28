import { createSignal, createEffect, createMemo, onMount, For, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { loadFromStorage, setTareaPendiente } from '../hooks/usePedido'
import { ProductTable } from './ProductTable'
import { SubtotalCard, TotalIGVCard, AvailableTotalCard } from './TotalsPanel' // Assuming these are still needed for UI
import { PaymentSplit } from './PaymentSplit'
import { useTheme } from '../context/ThemeContext'
import { useCatalogo } from '../hooks/useCatalogo'
import { getAgentesSkill } from '../core/g360-skill-agentes'
import { CHART_COLORS, IVA } from '../constants/sharedConstants'

// Helper para enriquecer y calcular un producto usando los agentes de skill
const procesarProducto = (p, enriquecerProductoFn, calculos) => {
  const enrichedP = enriquecerProductoFn(p) // Obtener datos de catálogo
  const valorVenta = calculos.basic.valorVenta(p.cantidad, p.precioUnitario, p.descuento1, p.descuento2)
  const precioVenta = calculos.basic.precioVenta(valorVenta)
  const estadoStock = calculos.stock.estado(p.stock, p.cantidad)
  const cajas = calculos.logistica.cajas(p.cantidad, enrichedP.unBx)
  const pesoTotal = calculos.logistica.pesoTotal(p.cantidad, enrichedP.pesoKg)
  return { 
    ...p, 
    ...enrichedP, // Incluir datos enriquecidos del catálogo
    valorVenta,
    precioVenta,
    estadoStock, 
    cajas,
    pesoTotal
  }
}

export const DistributionPage = () => {
  const { darkTheme, toggleTheme } = useTheme()
  const isDark = () => darkTheme()
  const { enriquecerProducto } = useCatalogo()
  const { calculos } = getAgentesSkill()
  const navigate = useNavigate()
  const [pedidoData, setPedidoData] = createSignal(null)
  const [loading, setLoading] = createSignal(true)
  const [cuotas, setCuotas] = createSignal([])
  const [filterStock, setFilterStock] = createSignal(false)

  // onMount para cargar datos del pedido
  onMount(() => {
    const data = loadFromStorage()
    setPedidoData(data)
    setLoading(false)
  })

  const getCliente = () => pedidoData()?.cliente || ''
  const getRuc = () => pedidoData()?.ruc || ''
  const getNumeroPedido = () => pedidoData()?.numeroPedido || ''
  const getVendedor = () => pedidoData()?.vendedor || ''
  const getEmailVendedor = () => pedidoData()?.emailVendedor || ''
  const getTelefonoVendedor = () => pedidoData()?.telefonoVendedor || ''
  const getProductos = () => pedidoData()?.productos || []

  const handleCuotasChange = (nuevasCuotas) => {
    setCuotas(nuevasCuotas)
  }

  const handleVolver = () => {
    setTareaPendiente(true)
    navigate('/')
  }

  // Calcular productos siempre
  const productosCalculados = createMemo(() => {
    const prods = getProductos()
    return prods.map(p => procesarProducto(p, enriquecerProducto, calculos))
  })

  // Datos originales (siempre completos, para HTML descargado)
  const datosOriginales = createMemo(() => {
    const prods = productosCalculados()
    if (prods.length === 0) {
      return { subtotal: 0, totales: { subtotal: 0, igv: 0, totalIGV: 0, totalDisponible: 0, productosTotal: 0, productosDisponibles: 0, productosAgotados: 0 }, datosLinea: [], datosCategoria: [], totalGeneral: { cajas: 0, peso: 0 } }
    }
    
    const totalesPedido = calculos.pedido.totales(prods)
    const distribucionLineas = calculos.pedido.distribucion(prods)
    const datosLinea = distribucionLineas.map((d, index) => ({
      ...d,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }))

    // Para datosCategoria, se puede adaptar una función en g360-skill-agentes o mantener la lógica aquí
    const datosCategoria = Object.values(prods.reduce((acc, p) => {
      const categoria = p.categoria || 'SIN CATEGORÍA'
      if (!acc[categoria]) acc[categoria] = { categoria, monto: 0, cajas: 0, peso: 0 }
      acc[categoria].monto += p.valorVenta
      acc[categoria].cajas += p.cajas
      acc[categoria].peso += p.pesoTotal
      return acc
    }, {})).map(cat => ({
      ...cat,
      porcentaje: totalesPedido.subtotal > 0 ? (cat.monto / totalesPedido.subtotal) * 100 : 0
    })).sort((a, b) => b.monto - a.monto)

    const totalGeneral = { cajas: totalesPedido.totalCajas, peso: totalesPedido.totalPeso }

    return { subtotal: totalesPedido.subtotal, totales: totalesPedido, datosLinea, datosCategoria, totalGeneral }
  })

  // Datos filtrados (para UI según filterStock)
  const datosFiltrados = createMemo(() => {
    const prods = productosCalculados()
    const orig = datosOriginales()
    if (!filterStock() || prods.length === 0) return orig

    const productosFiltrados = prods.filter(p => p.estadoStock !== 'Agotado')
    const totalesPedido = calculos.pedido.totales(productosFiltrados)
    const distribucionLineas = calculos.pedido.distribucion(productosFiltrados)
    const datosLinea = distribucionLineas.map((d, index) => ({
      ...d,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }))

    const datosCategoria = Object.values(productosFiltrados.reduce((acc, p) => {
      const categoria = p.categoria || 'SIN CATEGORÍA'
      if (!acc[categoria]) acc[categoria] = { categoria, monto: 0, cajas: 0, peso: 0 }
      acc[categoria].monto += p.valorVenta
      acc[categoria].cajas += p.cajas
      acc[categoria].peso += p.pesoTotal
      return acc
    }, {})).map(cat => ({
      ...cat,
      porcentaje: totalesPedido.subtotal > 0 ? (cat.monto / totalesPedido.subtotal) * 100 : 0
    })).sort((a, b) => b.monto - a.monto)

    const totalGeneral = { cajas: totalesPedido.totalCajas, peso: totalesPedido.totalPeso }

    return { subtotal: totalesPedido.subtotal, totales: totalesPedido, datosLinea, datosCategoria, totalGeneral }
  })

  const formatSoles = (n) => 'S/ ' + (n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleDownloadHTML = async () => { // Marcado como async
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
    let htmlDarkTheme = isDark()
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

    const orig = datosOriginales() // Usar datosOriginales para el HTML completo
    const prodsCalculados = productosCalculados()

    let cuotasHTML = ''
    if (cuotas() && cuotas().length > 0) {
      const cuotasPorMes = {}
      
      cuotas().forEach(c => {
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
      
      const totalPedido = orig.totales.totalIGV || 1

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
    .kpi-card .kpi-value { font-size: var(--text-lg); font-weight: var(--fw-bold); color: var(--accent); }
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
    @media (max-width: 768px) { .header { flex-direction: column; gap: 12px; } .kpis { flex-direction: column; } .client-grid { grid-template-columns: 1fr; } .totals-row { flex-direction: column; } .psf-meses-grid { grid-template-columns: 1fr; } }
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
        <div class="total-card"><h4>Subtotal</h4><div class="value">S/ ${orig.totales.subtotal > 0 ? orig.totales.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</div></div>
        <div class="total-card main"><h4>Total + IGV (18%)</h4><div class="value">S/ ${orig.totales.totalIGV > 0 ? orig.totales.totalIGV.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</div></div>
        <div class="total-card"><h4>Total Disponible</h4><div class="value">S/ ${orig.totales.totalDisponible > 0 ? orig.totales.totalDisponible.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">📈 Análisis por Línea de Productos</div>
      <div class="kpis">
        <div class="kpi-card"><div class="kpi-label">💰 Ventas Totales</div><div class="kpi-value">S/ ${(orig.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
        <div class="kpi-card"><div class="kpi-label">📦 Cajas Totales</div><div class="kpi-value">${orig.totalGeneral.cajas > 0 ? orig.totalGeneral.cajas : '0'}</div></div>
        <div class="kpi-card"><div class="kpi-label">⚖️ Peso Total</div><div class="kpi-value">${orig.totalGeneral.peso > 0 ? orig.totalGeneral.peso.toFixed(0) + ' kg' : '0 kg'}</div></div>
        <div class="kpi-card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;"><div class="kpi-label" style="color: rgba(255,255,255,0.9)">💳 Total + IGV</div><div class="kpi-value" style="color: white">S/ ${orig.totales.totalIGV > 0 ? orig.totales.totalIGV.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</div></div>
        <div class="kpi-card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;"><div class="kpi-label" style="color: rgba(255,255,255,0.9)">✅ Total Disponible</div><div class="kpi-value" style="color: white">S/ ${orig.totales.totalDisponible > 0 ? orig.totales.totalDisponible.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</div></div>
        <div class="kpi-card"><div class="kpi-label">📊 Líneas</div><div class="kpi-value">${orig.datosLinea.length > 0 ? orig.datosLinea.length : '0'}</div></div>
        <div class="kpi-card"><div class="kpi-label">📂 Categorías</div><div class="kpi-value">${orig.datosCategoria.length > 0 ? orig.datosCategoria.length : '0'}</div></div>
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
         ${orig.datosLinea.sort((a, b) => b.monto - a.monto).map((d) => {
          const maxMonto = Math.max(...orig.datosLinea.map(x => x.monto), 1)
          const maxCajas = Math.max(...orig.datosLinea.map(x => x.cajas), 1)
          const montoBarWidth = Math.max((d.monto / maxMonto) * 180, 20)
          const cajasBarWidth = Math.max((d.cajas / maxCajas) * 180, 20)
          return '<div class="butterfly-row"><div class="butterfly-left"><span class="butterfly-monto">S/ ' + (d.monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</span><span class="butterfly-pct">(' + (d.porcentaje || 0).toFixed(2) + '%)</span><div class="butterfly-bar-left" style="width:' + montoBarWidth + 'px;background:' + d.color + '"></div></div><div class="butterfly-center"><span class="butterfly-name" style="background:' + d.color + '">' + d.linea + '</span></div><div class="butterfly-right"><div class="butterfly-bar-right" style="width:' + cajasBarWidth + 'px;background:' + d.color + '"></div><span class="butterfly-cajas">' + (d.cajas || 0) + ' BX</span><span class="butterfly-peso">' + (d.peso || 0).toFixed(1) + ' kg (' + (orig.totalGeneral.cajas > 0 ? ((d.cajas / orig.totalGeneral.cajas) * 100).toFixed(2) : '0.00') + '%)</span></div></div>'
        }).join('')}
        <div class="butterfly-total">
          <div class="butterfly-total-left"><span class="total-value">S/ ${(orig.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><span class="total-label">Total S/ (100%)</span></div>
          <div class="butterfly-total-center"><span class="total-badge">TOTAL</span></div>
          <div class="butterfly-total-right"><span class="total-value">${orig.totalGeneral.cajas || 0} BX / ${(orig.totalGeneral.peso || 0).toFixed(1)} kg</span><span class="total-label">Total Volumen (100%)</span></div>
        </div>
      </div>
    </div>
    <div class="section" style="margin-top: 20px;">
      <div class="categories-compact">
        <span class="cat-label">📂 CATEGORÍAS:</span>
        ${orig.datosCategoria.map((cat, idx) => '<span class="cat-badge" style="background:' + CHART_COLORS[idx % CHART_COLORS.length] + '15;border:1px solid ' + CHART_COLORS[idx % CHART_COLORS.length] + '40"><span class="cat-dot" style="background:' + CHART_COLORS[idx % CHART_COLORS.length] + '"></span><span class="cat-name">' + cat.categoria + '</span><span class="cat-pct" style="color:' + CHART_COLORS[idx % CHART_COLORS.length] + '">' + (cat.porcentaje || 0).toFixed(2) + '%</span><span class="cat-separator">•</span><span class="cat-monto">S/ ' + (cat.monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</span><span class="cat-separator">•</span><span class="cat-bx">' + (cat.cajas || 0) + ' BX</span></span>').join('')}
        <span class="cat-total-badge">TOTAL: S/ ${(orig.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | ${orig.totalGeneral.cajas || 0} BX | ${(orig.totalGeneral.peso || 0).toFixed(1)} kg</span>
      </div>
    </div>
    ${cuotasHTML}
    <div class="section">
      <div class="section-title">📦 Detalle de Productos (${prodsCalculados.length})</div>
      <div class="table-container">
        <table>
           <thead><tr>
             <th style="width: 30px; text-align: center">#</th>
             <th style="width: 80px; text-align: left">SKU</th>
             <th style="min-width: 200px; text-align: left">Descripción</th>
             <th style="width: 70px; text-align: right">Cant.</th>
             <th style="width: 70px; text-align: left">U/M</th>
             <th style="width: 90px; text-align: right">P. Lista (S/.)</th>
             <th style="width: 70px; text-align: right">Desc 01 (%)</th>
             <th style="width: 70px; text-align: right">Desc 02 (%)</th>
             <th style="width: 90px; text-align: right">P. Neto (S/.)</th>
             <th style="width: 110px; text-align: right">Total Neto (S/.)</th>
           </tr></thead>
           <tbody>
             ${prodsCalculados.map((p, i) => '<tr><td style="text-align: center">' + (i + 1) + '</td><td style="font-family: monospace; font-size: var(--text-xs); text-align: left">' + p.codigo + '</td><td style="text-align: left" title="' + (p.descripcion || '') + '">' + (p.descripcion ? (p.descripcion.length > 45 ? p.descripcion.substring(0, 45) + '...' : p.descripcion) : '-') + '</td><td style="text-align: right">' + p.cantidad + '<span class="stock-dot stock-' + (p.estadoStock === 'OK' ? 'ok' : p.estadoStock === 'AJ' ? 'aj' : 'agotado') + '" title="' + p.estadoStock + '" style="margin-left: 8px"></span></td><td style="text-align: left">' + (p.unidadMedida || '-') + '</td><td style="text-align: right">' + (p.precioLista || 0).toFixed(2) + '</td><td style="text-align: right">' + (p.descuento1 || 0).toFixed(2) + '</td><td style="text-align: right">' + (p.descuento2 || 0).toFixed(2) + '</td><td style="text-align: right">' + ((p.valorVenta / p.cantidad) || 0).toFixed(2) + '</td><td style="text-align: right; font-weight: var(--fw-bold); color: ' + accentColor + '">' + p.valorVenta.toFixed(2) + '</td></tr>').join('')}
           </tbody>
          <tfoot>
             <tr><td colspan="3" class="tf-label">TOTALES (${prodsCalculados.length} productos)</td><td style="text-align: right; font-weight: var(--fw-bold)">${prodsCalculados.reduce((s, p) => s + p.cantidad, 0)}</td><td></td><td></td><td></td><td></td><td></td><td class="tf-value" style="text-align: right">S/ ${(orig.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
          </tfoot>
        </table>
      </div>
    </div>
    <div class="footer">
      G360 Order System — Generado el ${now.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — ${cliente || 'Pedido'}
    </div>
  </div>
</body>
</html>`;
    
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

  const filtradosData = createMemo(() => datosFiltrados())

  // UX: Memorizar máximos para el gráfico de barras fuera del bucle For
  const maxMonto = createMemo(() => 
    Math.max(...filtradosData().datosLinea.map(x => x.monto || 0), 1)
  )
  const maxCajas = createMemo(() => 
    Math.max(...filtradosData().datosLinea.map(x => x.cajas || 0), 1)
  )

  return (
    <Show when={!loading()} fallback={<div class="loading">Cargando...</div>}>
      <Show when={pedidoData() && pedidoData().productos && pedidoData().productos.length > 0} 
        fallback={
          <div class="distribution-page">
            <div class="empty-state">
              <h2>No hay datos del pedido</h2>
              <p>Primero carga los datos del RPE en la página principal</p>
              <button onClick={() => navigate('/')} class="btn-primary">
                Ir a Página Principal
              </button>
            </div>
          </div>
        }
      >
        <div class={`distribution-page ${darkTheme() ? '' : 'light'}`}>
          <div class="distribution-header">
            <h1>📊 ÓRDENES Y SEGMENTACIÓN G360</h1>
          </div>

          <div class="distribution-content">
            <div class="preview-client-section">
              <h2>📋 PERFIL DEL CLIENTE</h2>
              <div class="client-info-grid">
                <div class="info-item">
                  <label>Razón Social:</label>
                  <span>{getCliente() || 'No especificado'}</span>
                </div>
                <div class="info-item">
                  <label>RUC/DNI:</label>
                  <span>{getRuc() || 'No especificado'}</span>
                </div>
                <div class="info-item">
                  <label>ID Pedido:</label>
                  <span>{getNumeroPedido() || 'No especificado'}</span>
                </div>
                <div class="info-item">
                  <label>Consultor Comercial:</label>
                  <span>{getVendedor() || 'No especificado'}</span>
                </div>
                <Show when={getEmailVendedor()}>
                  <div class="info-item">
                    <label>Contacto Email:</label>
                    <span>{getEmailVendedor()}</span>
                  </div>
                </Show>
                <Show when={getTelefonoVendedor()}>
                  <div class="info-item">
                    <label>Contacto Teléfono:</label>
                    <span>{getTelefonoVendedor()}</span>
                  </div>
                </Show>
              </div>
            </div>

            <div class="preview-totals-section">
              <h2>📊 VALORIZACIÓN Y STOCK</h2>
              <div class="totals-cards-preview">
                <SubtotalCard subtotal={filtradosData().totales.subtotal} />
                <TotalIGVCard totalIGV={filtradosData().totales.totalIGV} />
                <AvailableTotalCard totalDisponible={filtradosData().totales.totalDisponible} totalIGV={filtradosData().totales.totalIGV} />
              </div>
            </div>

            <PaymentSplit totalAmount={filtradosData().totales.totalIGV} onChange={handleCuotasChange} />

            <div class="preview-analytics-section">
              <h2>📊 ANÁLISIS Y SEGMENTACIÓN</h2>
              
              <div style={{ display: 'flex', gap: '10px', "margin-top": '10px', "flex-wrap": 'wrap' }}>
                <div style={{ flex: '1 1 140px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', "border-radius": '8px', padding: '12px 16px', "text-align": 'center', color: 'white' }}>
                  <div style={{ "font-size": 'var(--text-2xs)', "margin-bottom": '4px', "text-transform": 'uppercase', opacity: 0.9 }}>💰 Valor Neto Est.</div>
                  <div style={{ "font-size": 'var(--text-xl)', "font-weight": 'var(--fw-bold)' }}>{formatSoles(filtradosData().subtotal)}</div>
                </div>
                <div style={{ flex: '1 1 100px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', "border-radius": '8px', padding: '12px 16px', "text-align": 'center', color: 'white' }}>
                  <div style={{ "font-size": 'var(--text-2xs)', "margin-bottom": '4px', "text-transform": 'uppercase', opacity: 0.9 }}>📦 Unidades Caja</div>
                  <div style={{ "font-size": 'var(--text-xl)', "font-weight": 'var(--fw-bold)' }}>{filtradosData().totalGeneral.cajas}</div>
                </div>
                <div style={{ flex: '1 1 120px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', "border-radius": '8px', padding: '12px 16px', "text-align": 'center', color: 'white' }}>
                  <div style={{ "font-size": 'var(--text-2xs)', "margin-bottom": '4px', "text-transform": 'uppercase', opacity: 0.9 }}>⚖️ Masa Logística</div>
                  <div style={{ "font-size": 'var(--text-xl)', "font-weight": 'var(--fw-bold)' }}>{(filtradosData().totalGeneral.peso || 0).toFixed(0)} kg</div>
                </div>
                <div style={{ flex: '1 1 140px', background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', "border-radius": '8px', padding: '12px 16px', "text-align": 'center', color: 'white' }}>
                  <div style={{ "font-size": 'var(--text-2xs)', "margin-bottom": '4px', "text-transform": 'uppercase', opacity: 0.9 }}>💳 Total Proyectado</div>
                  <div style={{ "font-size": 'var(--text-xl)', "font-weight": 'var(--fw-bold)' }}>{formatSoles(filtradosData().totales.totalIGV)}</div>
                </div>
              </div>

              <div style={{ "margin-top": '12px', display: 'flex', "align-items": 'center', gap: '12px', "flex-wrap": 'wrap' }}>
                <button
                  onClick={() => setFilterStock(!filterStock())}
                  style={{
                    display: 'inline-flex',
                    "align-items": 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: filterStock() ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'var(--g360-surface)',
                    color: filterStock() ? 'white' : 'var(--g360-text)',
                    border: `1px solid ${filterStock() ? '#10b981' : 'var(--g360-border)'}`,
                    "border-radius": '8px',
                    "font-size": 'var(--text-sm)',
                    "font-weight": 'var(--fw-semibold)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {filterStock() ? '✅ Solo con stock' : '📦 Todo el pedido'}
                </button>
                <Show when={filterStock()}>
                  <span style={{
                    "font-size": 'var(--text-2xs)',
                    color: 'var(--g360-muted)',
                    "font-style": 'italic',
                    background: 'var(--g360-surface)',
                    padding: '4px 8px',
                    "border-radius": '4px',
                    border: '1px dashed var(--g360-border)'
                  }}>
                    ⓘ Solo aplica a estadísticas (KPIs, gráficos). La tabla muestra todo el pedido.
                  </span>
                </Show>
              </div>

              <div style={{ "margin-top": '10px', "max-width": '1200px', background: 'var(--g360-surface)', "border-radius": '12px', padding: '16px', border: '1px solid var(--g360-border)' }}>
                <h4 style={{ margin: '0 0 12px 0', "font-size": 'var(--text-base)', color: 'var(--g360-muted)', "text-align": 'center' }}>📊 Distribución por Línea</h4>
                
                <div>
                  <div style={{ display: 'flex', "align-items": 'center', "margin-bottom": '10px', padding: '0 10px' }}>
                    <div style={{ flex: '1', "text-align": 'right', "padding-right": '10px' }}>
                      <span style={{ "font-size": 'var(--text-sm)', color: 'var(--g360-accent)', "font-weight": 'var(--fw-bold)' }}>💰 VALOR (S/)</span>
                    </div>
                    <div style={{ width: '140px', "text-align": 'center' }}>
                      <span style={{ "font-size": 'var(--text-sm)', color: 'var(--g360-muted)', "font-weight": 'var(--fw-bold)' }}>LÍNEA</span>
                    </div>
                    <div style={{ flex: '1', "padding-left": '10px' }}>
                      <span style={{ "font-size": 'var(--text-sm)', color: 'var(--g360-muted)', "font-weight": 'var(--fw-bold)' }}>📦 VOLUMEN (BX - KG)</span>
                    </div>
                  </div>
                  
                  <For each={filtradosData().datosLinea}>
                    {(d, idx) => {
                      const barMaxWidth = 200
                      const montoBarWidth = () => (d.monto / maxMonto()) * barMaxWidth
                      const cajasBarWidth = () => (d.cajas / maxCajas()) * barMaxWidth
                      
                      return (
                        <div style={{ display: 'flex', "align-items": 'center', "margin-bottom": '8px', padding: '6px 10px', background: idx() % 2 === 0 ? 'var(--g360-bg)' : 'transparent', "border-radius": '8px' }}>
                          <div style={{ flex: '1', display: 'flex', "align-items": 'center', "justify-content": 'flex-end', gap: '8px' }}>
                            <div style={{ "text-align": 'right' }}>
                              <div style={{ "font-size": 'var(--text-base)', color: 'var(--g360-accent)', "font-weight": 'var(--fw-bold)' }}>{formatSoles(d.monto)}</div>
                              <div style={{ "font-size": 'var(--text-2xs)', color: 'var(--g360-muted)' }}>({d.porcentaje.toFixed(2)}%)</div>
                            </div>
                            <div style={{ width: `${montoBarWidth()}px`, height: '24px', background: `linear-gradient(90deg, transparent, ${d.color})`, "border-radius": '0 4px 4px 0', opacity: 0.9 }}></div>
                          </div>
                          
                          <div style={{ width: '140px', "text-align": 'center', padding: '0 12px' }}>
                            <div style={{ 
                              "font-size": 'var(--text-sm)', 
                              "font-weight": 'var(--fw-bold)',
                              background: d.color,
                              color: 'white',
                              padding: '6px 10px',
                              "border-radius": '8px',
                              "white-space": 'nowrap',
                              overflow: 'hidden',
                              "text-overflow": 'ellipsis'
                            }}>
                              {d.linea}
                            </div>
                          </div>
                          
                          <div style={{ flex: '1', display: 'flex', "align-items": 'center', gap: '8px' }}>
                            <div style={{ width: `${cajasBarWidth()}px`, height: '24px', background: `linear-gradient(90deg, ${d.color}, transparent)`, "border-radius": '4px 0 0 4px', opacity: 0.7 }}></div>
                            <div style={{ "text-align": 'left' }}>
                              <div style={{ "font-size": 'var(--text-base)', color: 'var(--g360-text)', "font-weight": 'var(--fw-bold)' }}>{d.cajas} BX</div>
                              <div style={{ "font-size": 'var(--text-2xs)', color: 'var(--g360-muted)' }}>{d.peso.toFixed(1)} kg ({((d.cajas / filtradosData().totalGeneral.cajas) * 100).toFixed(2)}%)</div>
                            </div>
                          </div>
                        </div>
                      )
                    }}
                  </For>
                  
                  <div style={{ display: 'flex', "align-items": 'center', "margin-top": '10px', padding: '10px 10px', background: 'linear-gradient(135deg, var(--g360-accent)20, var(--g360-accent)10)', "border-radius": '10px', border: '2px solid var(--g360-accent)' }}>
                    <div style={{ flex: '1', "text-align": 'right', "padding-right": '10px' }}>
                      <div style={{ "font-size": 'var(--text-lg)', color: 'var(--g360-text)', "font-weight": 'var(--fw-bold)' }}>{formatSoles(filtradosData().subtotal)}</div>
                      <div style={{ "font-size": 'var(--text-2xs)', color: 'var(--g360-muted)' }}>Total S/ (100%)</div>
                    </div>
                    <div style={{ width: '140px', "text-align": 'center' }}>
                      <span style={{ "font-size": 'var(--text-sm)', color: 'var(--g360-accent)', "font-weight": 'var(--fw-bold)' }}>TOTAL</span>
                    </div>
                    <div style={{ flex: '1', "padding-left": '10px' }}>
                      <div style={{ "font-size": 'var(--text-lg)', color: 'var(--g360-text)', "font-weight": 'var(--fw-bold)' }}>{filtradosData().totalGeneral.cajas} BX / {filtradosData().totalGeneral.peso.toFixed(1)} kg</div>
                      <div style={{ "font-size": 'var(--text-2xs)', color: 'var(--g360-muted)' }}>Total Volumen (100%)</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ "margin-top": '12px', "max-width": '1200px', background: 'var(--g360-surface)', "border-radius": '12px', padding: '14px 20px', border: '1px solid var(--g360-border)' }}>
                <div style={{ display: 'flex', "align-items": 'center', "flex-wrap": 'wrap', gap: '10px' }}>
                  <span style={{ "font-size": 'var(--text-sm)', color: 'var(--g360-muted)', "font-weight": 'var(--fw-semibold)' }}>📂 CATEGORÍAS:</span>
                  
                  <For each={filtradosData().datosCategoria}>
                    {(cat, idx) => {
                      const color = CHART_COLORS[idx() % CHART_COLORS.length]
                      return (
                        <span style={{ 
                          display: 'inline-flex', 
                          "align-items": 'center', 
                          gap: '6px',
                          padding: '6px 12px',
                          background: `${color}15`,
                          border: `1px solid ${color}40`,
                          "border-radius": '20px',
                          "font-size": 'var(--text-sm)'
                        }}>
                          <span style={{ width: '8px', height: '8px', "border-radius": '50%', background: color }}></span>
                          <span style={{ "font-weight": 'var(--fw-semibold)', color: 'var(--g360-text)' }}>{cat.categoria}</span>
                          <span style={{ "font-weight": 'var(--fw-bold)', color: color }}>{cat.porcentaje.toFixed(2)}%</span>
                          <span style={{ color: 'var(--g360-muted)' }}>•</span>
                          <span style={{ "font-weight": 'var(--fw-bold)', color: 'var(--g360-accent)' }}>{formatSoles(cat.monto)}</span>
                          <span style={{ color: 'var(--g360-muted)' }}>•</span>
                          <span style={{ "font-weight": 'var(--fw-semibold)', color: 'var(--g360-text)' }}>{cat.cajas} BX</span>
                        </span>
                      )
                    }}
                  </For>
                  
                  <span style={{ 
                    display: 'inline-flex', 
                    "align-items": 'center', 
                    gap: '8px',
                    padding: '6px 14px',
                    background: 'linear-gradient(135deg, var(--g360-accent)20, var(--g360-accent)10)',
                    border: '2px solid var(--g360-accent)',
                    "border-radius": '20px',
                    "font-size": 'var(--text-sm)',
                    "margin-left": 'auto'
                  }}>
                    <span style={{ "font-weight": 'var(--fw-bold)', color: 'var(--g360-text)' }}>TOTAL</span>
                    <span style={{ "font-weight": 'var(--fw-bold)', color: 'var(--g360-accent)' }}>{formatSoles(filtradosData().subtotal)}</span>
                    <span style={{ color: 'var(--g360-muted)' }}>|</span>
                    <span style={{ "font-weight": 'var(--fw-semibold)', color: 'var(--g360-text)' }}>{filtradosData().totalGeneral.cajas} BX</span>
                    <span style={{ "font-weight": 'var(--fw-semibold)', color: 'var(--g360-text)' }}>{filtradosData().totalGeneral.peso.toFixed(1)} kg</span>
                  </span>
                </div>
              </div>
            </div>

            <div class="preview-table-section">
              <h3>📦 DETALLE DE PARTIDAS ({productosCalculados().length})</h3>
              <div class="table-wrapper">
                <ProductTable productos={productosCalculados()} totales={filtradosData().totales} />
              </div>
            </div>
          </div>
        </div>
      </Show>
    </Show>
  )
}
