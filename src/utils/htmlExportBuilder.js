/**
 * Construye el string HTML completo para el reporte de cronograma
 * con el diseño profesional del sample de referencia
 */

const renderClientInfo = (data) => `
<div class="section">
  <div class="section-title">📋 PERFIL DEL CLIENTE</div>
  <div class="client-grid">
    <div class="client-item"><label>Razón Social</label><span>${data.cliente}</span></div>
    <div class="client-item"><label>RUC</label><span>${data.ruc}</span></div>
    <div class="client-item"><label>Pedido</label><span>${data.numeroPedido}</span></div>
    <div class="client-item"><label>Vendedor</label><span>${data.vendedor}</span></div>
    <div class="client-item"><label>Email</label><span>${data.emailVendedor || '-'}</span></div>
    <div class="client-item"><label>Teléfono</label><span>${data.telefonoVendedor || '-'}</span></div>
  </div>
</div>`

const renderTotales = (consolidado) => {
  const sub = redondear2(consolidado.totales?.subtotal || 0)
  const total = redondear2(consolidado.totales?.totalIGV || 0)
  const disp = redondear2(consolidado.totales?.totalDisponible || 0)
  return `
<div class="section">
  <div class="section-title">📊 VALORIZACIÓN Y STOCK</div>
  <div class="totals-row">
    <div class="total-card"><h4>Subtotal</h4><div class="value">S/ ${formatear(sub)}</div></div>
    <div class="total-card main"><h4>Total + IGV (18%)</h4><div class="value">S/ ${formatear(total)}</div></div>
    <div class="total-card"><h4>Total Disponible</h4><div class="value">S/ ${formatear(disp)}</div></div>
  </div>
</div>`
}

const renderKPIs = (consolidado, htmlDarkTheme) => {
  const sub = redondear2(consolidado.subtotal || 0)
  const total = redondear2(consolidado.totales?.totalIGV || 0)
  const disp = redondear2(consolidado.totales?.totalDisponible || 0)
  const cajas = consolidado.totalGeneral?.cajas || 0
  const peso = redondear2(consolidado.totalGeneral?.peso || 0)
  const nLineas = consolidado.datosLinea?.length || 0
  const nCats = consolidado.datosCategoria?.length || 0
  return `
<div class="section">
  <div class="section-title">📊 ANÁLISIS Y SEGMENTACIÓN</div>
  <div class="kpis">
    <div class="kpi-card"><div class="kpi-label">💰 Ventas Totales</div><div class="kpi-value">S/ ${formatear(sub)}</div></div>
    <div class="kpi-card"><div class="kpi-label">📦 Cajas Totales</div><div class="kpi-value">${cajas}</div></div>
    <div class="kpi-card"><div class="kpi-label">⚖️ Peso Total</div><div class="kpi-value">${peso} kg</div></div>
    <div class="kpi-card" style="background:linear-gradient(135deg,${htmlDarkTheme ? '#10b981' : '#059669'} 0%,${htmlDarkTheme ? '#059669' : '#047857'} 100%);color:white"><div class="kpi-label" style="color:rgba(255,255,255,0.9)">💳 Total + IGV</div><div class="kpi-value" style="color:white">S/ ${formatear(total)}</div></div>
    <div class="kpi-card" style="background:linear-gradient(135deg,${htmlDarkTheme ? '#f59e0b' : '#d97706'} 0%,${htmlDarkTheme ? '#d97706' : '#b45309'} 100%);color:white"><div class="kpi-label" style="color:rgba(255,255,255,0.9)">✅ Total Disponible</div><div class="kpi-value" style="color:white">S/ ${formatear(disp)}</div></div>
    <div class="kpi-card"><div class="kpi-label">📊 Líneas</div><div class="kpi-value">${nLineas}</div></div>
    <div class="kpi-card"><div class="kpi-label">📂 Categorías</div><div class="kpi-value">${nCats}</div></div>
  </div>
</div>`
}

import { CHART_COLORS as CHART_COLORS_HEX } from '../constants/sharedConstants'

const renderButterflyChart = (consolidado) => {
  const lineas = consolidado.datosLinea || []
  const maxMonto = Math.max(...lineas.map(l => l.monto || 0), 1)
  const maxCajas = Math.max(...lineas.map(l => l.cajas || 0), 1)
  const barMax = 200

  const rows = lineas.map((d, i) => {
    const color = CHART_COLORS_HEX[i % CHART_COLORS_HEX.length]
    const montoBar = Math.max(20, (d.monto / maxMonto) * barMax)
    const cajasBar = Math.max(20, (d.cajas / maxCajas) * barMax)
    const monto = redondear2(d.monto || 0)
    const pct = redondear2(d.porcentaje || 0)
    const cajasCompletas = d.cajasCompletas || Math.floor(d.cajas)
    const unidadesSueltas = d.unidadesSueltas || 0
    const peso = redondear2(d.peso || 0)
    const cajasTotal = consolidado.totalGeneral?.cajas || 1
    const pesoPct = redondear2((d.cajas / cajasTotal) * 100)
    return `<div class="butterfly-row"><div class="butterfly-left"><span class="butterfly-monto">S/ ${formatear(monto)}</span><span class="butterfly-pct">(${pct}%)</span><div class="butterfly-bar-left print-color" style="width:${montoBar}px;background:${color} !important"></div></div><div class="butterfly-center"><span class="butterfly-name print-color" style="background:${color} !important">${d.linea}</span></div><div class="butterfly-right"><div class="butterfly-bar-right print-color" style="width:${cajasBar}px;background:${color} !important"></div><span class="butterfly-cajas">${cajasCompletas} BX</span><span class="butterfly-peso">${peso} kg (${pesoPct}%)</span></div></div>`
  }).join('')

  const sub = redondear2(consolidado.subtotal || 0)
  const cajas = consolidado.totalGeneral?.cajas || 0
  const peso = redondear2(consolidado.totalGeneral?.peso || 0)

  return `
<div class="section">
  <div class="section-title">📊 Distribución por Línea</div>
  <div class="butterfly-chart">
    <div class="butterfly-header">
      <span class="butterfly-col-left">💰 VALOR (S/)</span>
      <span class="butterfly-col-center">LÍNEA</span>
      <span class="butterfly-col-right">📦 VOLUMEN (BX - KG)</span>
    </div>
    ${rows}
    <div class="butterfly-total">
      <div class="butterfly-total-left"><span class="total-value">S/ ${formatear(sub)}</span><span class="total-label">Total S/ (100%)</span></div>
      <div class="butterfly-total-center"><span class="total-badge">TOTAL</span></div>
      <div class="butterfly-total-right"><span class="total-value">${cajas} BX / ${peso} kg</span><span class="total-label">Total Volumen (100%)</span></div>
    </div>
  </div>
</div>`
}

const renderCategorias = (consolidado) => {
  const cats = consolidado.datosCategoria || []
  const badges = cats.map((cat, i) => {
    const color = CHART_COLORS_HEX[i % CHART_COLORS_HEX.length]
    const monto = redondear2(cat.monto || 0)
    return `<span class="cat-badge" style="background:${color}15;border:1px solid ${color}40"><span class="cat-dot" style="background:${color}"></span><span class="cat-name">${cat.categoria}</span><span class="cat-pct" style="color:${color}">${redondear2(cat.porcentaje || 0)}%</span><span class="cat-separator">•</span><span class="cat-monto">S/ ${formatear(monto)}</span><span class="cat-separator">•</span><span class="cat-bx">${cat.cajasCompletas || 0} BX</span></span>`
  }).join('')

  const sub = redondear2(consolidado.subtotal || 0)
  const cajas = consolidado.totalGeneral?.cajas || 0
  const peso = redondear2(consolidado.totalGeneral?.peso || 0)

  return `
<div class="section" style="margin-top:20px">
  <div class="categories-compact">
    <span class="cat-label">📂 CATEGORÍAS:</span>
    ${badges}
    <span class="cat-total-badge">TOTAL: S/ ${formatear(sub)} | ${cajas} BX | ${peso} kg</span>
  </div>
</div>`
}

const NOMBRES_MES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SETIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']

const agruparCuotasPorMes = (cuotas) => {
  const mapa = {}
  cuotas.forEach(c => {
    const monto = parseFloat(c.monto) || 0
    if (monto <= 0) return
    const anio = c.anio
    const mes = c.mes
    const k = `${anio}-${String(mes).padStart(2, '0')}`
    if (!mapa[k]) mapa[k] = { nombre: NOMBRES_MES[mes] || '', anio, mes, cuotas: [], total: 0 }
    mapa[k].cuotas.push({ ...c, monto })
    mapa[k].total += monto
  })
  return Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b)).map(([, m]) => m)
}

const renderDistribucionFecha = (cuotas, totalPedido) => {
  if (!cuotas || cuotas.length === 0) return ''
  const meses = agruparCuotasPorMes(cuotas)
  const cards = meses.map(m => {
    const pct = totalPedido > 0 ? ((m.total / totalPedido) * 100).toFixed(2) : 0
    const cuotasHtml = m.cuotas.map(c => {
      const fecha = `${String(c.dia).padStart(2, '0')}/${String(c.mes + 1).padStart(2, '0')}/${c.anio}`
      return `<div class="psf-mes-cuota"><span class="psf-mes-fecha">${fecha}</span><span class="psf-mes-monto">S/ ${formatear(c.monto)}</span></div>`
    }).join('')
    return `<div class="psf-mes-card"><div class="psf-mes-header"><span class="psf-mes-nombre">${m.nombre} ${m.anio}</span><span class="psf-mes-pct">${pct}%</span></div><div class="psf-mes-cuotas">${cuotasHtml}</div><div class="psf-mes-total">Total: S/ ${formatear(m.total)}</div></div>`
  }).join('')

  return `
<div class="section">
  <div class="section-title">📅 Programación de Letras</div>
  <div class="psf-container">
    <div class="psf-meses-grid">${cards}</div>
  </div>
</div>`
}

const formatear = (n) => (n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const redondear2 = (n) => Math.round((n || 0) * 100) / 100

const renderTablaProductos = (productos, consolidado) => {
  const rows = productos.map((p, idx) => {
    const stockClass = p.estadoStock === 'OK' ? 'stock-ok' : p.estadoStock === 'AJ' ? 'stock-aj' : 'stock-agotado'
    const totalNeto = redondear2(p.valorVenta || 0)
    const pNeto = redondear2(p.precioVenta || p.valorVenta || 0)
    return `<tr><td>${idx + 1}</td><td style="font-family:monospace;font-size:var(--text-xs)">${p.codigo}</td><td title="${(p.descripcion || '').replace(/"/g, '"')}">${(p.descripcion || '').slice(0, 60)}${(p.descripcion || '').length > 60 ? '...' : ''}</td><td style="text-align:right">${p.cantidad}</td><td>${p.unidadMedida || p.unBx ? 'UND' : ''}</td><td style="text-align:right">${formatear(p.precioUnitario || 0)}</td><td style="text-align:center">${redondear2(p.descuento1 || 0)}</td><td style="text-align:center">${redondear2(p.descuento2 || 0)}</td><td style="text-align:right">${formatear(pNeto)}</td><td style="text-align:right;font-weight:var(--fw-bold)">${formatear(totalNeto)}</td><td style="text-align:center"><span class="stock-dot ${stockClass}" title="${p.estadoStock || ''}"></span></td></tr>`
  }).join('')

  const totalLinea = redondear2(productos.reduce((s, p) => s + (p.valorVenta || 0), 0))
  const totalCant = productos.reduce((s, p) => s + (p.cantidad || 0), 0)

  return `
<div class="section">
  <div class="section-title">📦 DETALLE DE PARTIDAS (${productos.length})</div>
  <div class="table-container">
    <table>
      <thead><tr>
        <th style="width:30px">#</th>
        <th style="width:80px">SKU</th>
        <th style="min-width:200px">Descripción</th>
        <th style="width:60px;text-align:right">Cant.</th>
        <th style="width:70px">U/M</th>
        <th style="width:90px;text-align:right">P. Lista (S/.)</th>
        <th style="width:70px;text-align:center">Desc 01 (%)</th>
        <th style="width:70px;text-align:center">Desc 02 (%)</th>
        <th style="width:90px;text-align:right">P. Neto (S/.)</th>
        <th style="width:110px;text-align:right">Total Neto (S/.)</th>
        <th style="width:50px;text-align:center">Stock</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="tf-label">TOTALES (${productos.length} productos)</td>
          <td style="text-align:right;font-weight:var(--fw-bold)">${totalCant}</td>
          <td></td><td></td><td></td><td></td><td></td>
          <td class="tf-value" style="text-align:right">S/ ${formatear(totalLinea)}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>`
}

/**
 * Construye el string HTML completo para el reporte de cronograma
 */
export const buildCronogramaHTML = (data) => {
  const { cliente, ruc, numeroPedido, vendedor, emailVendedor, telefonoVendedor, cuotas, consolidado, productosCalculados, htmlDarkTheme } = data

  const now = new Date()
  const fechaStr = now.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const fechaISO = now.toISOString().split('T')[0].replace(/-/g, '')
  const totalPedido = consolidado.totales?.totalIGV || 1

  const bg = htmlDarkTheme ? '#0f172a' : '#f8fafc'
  const surface = htmlDarkTheme ? '#1e293b' : '#ffffff'
  const text = htmlDarkTheme ? '#e2e8f0' : '#1e293b'
  const muted = htmlDarkTheme ? '#94a3b8' : '#64748b'
  const border = htmlDarkTheme ? '#334155' : '#e2e8f0'
  const accent = htmlDarkTheme ? '#00d084' : '#007a4d'

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido ${numeroPedido || ''} - Distribución</title>
  <style>
    :root { --bg:${bg}; --surface:${surface}; --text:${text}; --muted:${muted}; --border:${border}; --accent:${accent};
      --accent-rgb:${htmlDarkTheme ? '0,208,132' : '0,122,77'};
      --text-2xs:0.5625rem; --text-xs:0.6875rem; --text-sm:0.75rem; --text-base:0.875rem;
      --text-lg:1rem; --text-xl:1.125rem; --text-2xl:1.25rem; --text-3xl:1.5rem;
      --fw-normal:400; --fw-medium:500; --fw-semibold:600; --fw-bold:700; --fw-extrabold:800; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:var(--bg); color:var(--text); padding:24px; line-height:1.5; }
    .container { max-width:1100px; margin:0 auto; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; padding-bottom:16px; border-bottom:2px solid var(--accent); }
    .header h1 { font-size:calc(var(--text-3xl) + 2px); color:var(--accent); margin-bottom:4px; }
    .header-meta { font-size:var(--text-sm); color:var(--muted); display:flex; gap:16px; flex-wrap:wrap; margin-top:4px; }
    .badge { background:var(--accent); color:var(--bg); padding:6px 16px; border-radius:20px; font-size:var(--text-sm); font-weight:var(--fw-bold); text-transform:uppercase; letter-spacing:1px; }
    .section { margin-bottom:28px; }
    .section-title { font-size:var(--text-lg); font-weight:var(--fw-bold); color:var(--accent); text-transform:uppercase; letter-spacing:1px; margin-bottom:16px; padding-bottom:8px; border-bottom:1px solid var(--border); }
    .client-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px; }
    .client-item { background:var(--surface); padding:14px 16px; border-radius:10px; border:1px solid var(--border); }
    .client-item label { color:var(--muted); font-size:var(--text-2xs); text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:4px; font-weight:var(--fw-semibold); }
    .client-item span { font-size:var(--text-base); font-weight:var(--fw-semibold); }
    .kpis { display:flex; gap:8px; margin-bottom:20px; overflow-x:auto; }
    .kpi-card { flex:0 0 auto; min-width:140px; background:var(--surface); border-radius:8px; padding:12px 16px; border:1px solid var(--border); text-align:center; }
    .kpi-label { font-size:var(--text-2xs); color:var(--muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
    .kpi-value { font-size:var(--text-lg); font-weight:var(--fw-bold); color:var(--accent); }
    .totals-row { display:flex; gap:12px; margin-bottom:24px; flex-wrap:wrap; }
    .total-card { background:var(--surface); padding:18px; border-radius:12px; flex:1; min-width:160px; text-align:center; border:1px solid var(--border); }
    .total-card.main { background:linear-gradient(135deg,rgba(var(--accent-rgb),0.125),rgba(var(--accent-rgb),0.063)); border:2px solid var(--accent); }
    .total-card h4 { color:var(--muted); font-size:var(--text-2xs); text-transform:uppercase; margin-bottom:6px; letter-spacing:1px; }
    .total-card .value { font-size:var(--text-xl); font-weight:var(--fw-bold); color:var(--accent); }
    .butterfly-chart { background:var(--surface); border-radius:12px; padding:20px; border:1px solid var(--border); }
    .butterfly-header { display:flex; align-items:center; margin-bottom:16px; padding-bottom:10px; border-bottom:1px solid var(--border); }
    .butterfly-col-left { flex:1; text-align:right; padding-right:10px; font-size:var(--text-xs); color:var(--accent); font-weight:var(--fw-bold); }
    .butterfly-col-center { width:140px; text-align:center; font-size:var(--text-xs); color:var(--muted); font-weight:var(--fw-bold); }
    .butterfly-col-right { flex:1; padding-left:10px; font-size:var(--text-xs); color:var(--muted); font-weight:var(--fw-bold); }
    .butterfly-row { display:flex; align-items:center; margin-bottom:8px; padding:6px 8px; border-radius:8px; }
    .butterfly-row:nth-child(even) { background:rgba(128,128,128,0.05); }
    .butterfly-left { flex:1; display:flex; align-items:center; justify-content:flex-end; gap:8px; }
    .butterfly-monto { font-size:var(--text-sm); color:var(--accent); font-weight:var(--fw-bold); text-align:right; }
    .butterfly-pct { font-size:var(--text-2xs); color:var(--muted); }
    .butterfly-bar-left { height:24px; border-radius:0 4px 4px 0; opacity:0.9; }
    .butterfly-center { width:140px; text-align:center; padding:0 12px; }
    .butterfly-name { display:inline-block; padding:6px 10px; border-radius:8px; font-size:var(--text-xs); font-weight:var(--fw-bold); color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px; }
    .butterfly-right { flex:1; display:flex; align-items:center; gap:8px; }
    .butterfly-bar-right { height:24px; border-radius:4px 0 0 4px; opacity:0.7; }
    .butterfly-cajas { font-size:var(--text-sm); color:var(--text); font-weight:var(--fw-bold); }
    .butterfly-peso { font-size:var(--text-2xs); color:var(--muted); }
    .butterfly-total { display:flex; align-items:center; margin-top:12px; padding:10px 8px; background:linear-gradient(135deg,var(--accent)20,var(--accent)10); border-radius:10px; border:2px solid var(--accent); }
    .butterfly-total-left { flex:1; text-align:right; padding-right:10px; }
    .butterfly-total-center { width:140px; text-align:center; }
    .butterfly-total-right { flex:1; padding-left:10px; }
    .total-value { font-size:var(--text-base); font-weight:var(--fw-bold); color:var(--text); display:block; }
    .total-label { font-size:var(--text-2xs); color:var(--muted); display:block; }
    .total-badge { display:inline-block; padding:4px 12px; background:var(--accent); color:var(--bg); border-radius:8px; font-size:var(--text-xs); font-weight:var(--fw-bold); }
    .categories-compact { display:flex; align-items:center; flex-wrap:wrap; gap:10px; background:var(--surface); border-radius:10px; padding:14px 18px; border:1px solid var(--border); }
    .cat-label { font-size:var(--text-sm); color:var(--muted); font-weight:var(--fw-semibold); }
    .cat-badge { display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:20px; font-size:var(--text-sm); }
    .cat-badge .cat-dot { width:8px; height:8px; border-radius:50%; }
    .cat-badge .cat-name { font-weight:var(--fw-semibold); color:var(--text); }
    .cat-badge .cat-pct { font-weight:var(--fw-bold); }
    .cat-badge .cat-separator { color:var(--muted); }
    .cat-badge .cat-monto { font-weight:var(--fw-bold); color:var(--accent); }
    .cat-badge .cat-bx { font-weight:var(--fw-semibold); color:var(--text); }
    .cat-total-badge { display:inline-flex; align-items:center; padding:6px 14px; background:linear-gradient(135deg,var(--accent)20,var(--accent)10); border:2px solid var(--accent); border-radius:20px; font-size:var(--text-sm); font-weight:var(--fw-bold); color:var(--text); margin-left:auto; }
    .psf-container { background:var(--surface); border:2px solid var(--accent); border-radius:12px; padding:16px; margin-top:12px; }
    .psf-meses-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:10px; }
    .psf-mes-card { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px; }
    .psf-mes-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding-bottom:6px; border-bottom:2px solid var(--accent); }
    .psf-mes-nombre { font-size:var(--text-sm); font-weight:var(--fw-bold); color:var(--accent); text-transform:uppercase; }
    .psf-mes-pct { font-size:var(--text-xs); font-weight:var(--fw-bold); color:white; background:var(--accent); padding:2px 8px; border-radius:10px; }
    .psf-mes-cuotas { display:flex; flex-direction:column; gap:4px; }
    .psf-mes-cuota { display:flex; justify-content:space-between; align-items:center; padding:6px 8px; background:var(--surface); border:1px solid var(--border); border-radius:4px; font-size:var(--text-xs); }
    .psf-mes-fecha { color:var(--text); font-weight:var(--fw-medium); }
    .psf-mes-monto { color:var(--accent); font-weight:var(--fw-bold); }
    .psf-mes-total { text-align:right; font-size:var(--text-sm); font-weight:var(--fw-bold); color:var(--accent); padding-top:6px; margin-top:6px; border-top:1px dashed var(--border); }
    .table-container { overflow-x:auto; margin-top:16px; }
    table { width:100%; border-collapse:collapse; font-size:var(--text-sm); }
    thead { background:var(--surface); }
    thead th { padding:12px 8px; text-align:left; font-size:var(--text-xs); font-weight:var(--fw-bold); color:var(--muted); text-transform:uppercase; letter-spacing:0.5px; border-bottom:2px solid var(--accent); white-space:nowrap; }
    tbody td { padding:10px 8px; border-bottom:1px solid var(--border); color:var(--text); }
    tbody tr:hover { background:rgba(0,208,132,0.05); }
    tbody tr:nth-child(even) { background:rgba(128,128,128,0.03); }
    tfoot td { padding:12px 8px; border-top:2px solid var(--accent); font-weight:var(--fw-bold); }
    .tf-label { color:var(--muted); text-transform:uppercase; font-size:var(--text-xs); letter-spacing:0.5px; }
    .tf-value { color:var(--accent); font-size:var(--text-base); }
    .stock-dot { display:inline-block; width:10px; height:10px; border-radius:50%; }
    .stock-ok { background:#22c55e; }
    .stock-aj { background:#f59e0b; }
    .stock-agotado { background:#ef4444; }
    .footer { text-align:center; padding:24px 0 8px; color:var(--muted); font-size:var(--text-xs); border-top:1px solid var(--border); margin-top:32px; }
    .print-btn { background:var(--accent); color:var(--bg); border:none; padding:12px 28px; border-radius:8px; font-size:var(--text-base); font-weight:var(--fw-bold); cursor:pointer; margin-bottom:20px; display:inline-flex; align-items:center; gap:8px; }
    .print-btn:hover { opacity:0.9; }
    @media print {
      @page { size:A4; margin:15mm 12mm 15mm 12mm; }
      body { background:white !important; color:#000 !important; padding:0 !important; }
      .container { max-width:100% !important; }
      .print-btn { display:none !important; }
      * { color:#000 !important; box-shadow:none !important; text-shadow:none !important; }
      .header { border-bottom-color:#000 !important; }
      .header h1 { color:#000 !important; }
      .header-meta { color:#555 !important; }
      .badge { border:1px solid #000 !important; color:white !important; background:#000 !important; }
      .section-title { color:#000 !important; border-bottom-color:#000 !important; }
      .client-item { border-color:#ccc !important; background:#f9f9f9 !important; }
      .client-item label { color:#555 !important; }
      .client-item span { color:#000 !important; }
      .kpi-card { border-color:#ccc !important; background:#f9f9f9 !important; }
      .kpi-label { color:#555 !important; }
      .kpi-value { color:#000 !important; }
      .total-card { border-color:#ccc !important; background:#f9f9f9 !important; }
      .total-card.main { background:#e8f5e9 !important; border-color:#4caf50 !important; }
      .total-card h4 { color:#555 !important; }
      .total-card .value { color:#000 !important; }
      .butterfly-chart { border-color:#ccc !important; background:white !important; }
      .butterfly-header { border-bottom-color:#ccc !important; }
      .butterfly-col-left { color:#2e7d32 !important; }
      .butterfly-col-center { color:#333 !important; }
      .butterfly-col-right { color:#555 !important; }
      .butterfly-row:nth-child(even) { background:#f5f5f5 !important; }
      .butterfly-monto { color:#2e7d32 !important; }
      .butterfly-pct { color:#666 !important; }
      .print-color { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; color-adjust:exact !important; }
      .butterfly-name { color:white !important; }
      .butterfly-cajas { color:#000 !important; }
      .butterfly-peso { color:#666 !important; }
      .butterfly-total { border-color:#000 !important; background:#f0f0f0 !important; }
      .total-value { color:#000 !important; }
      .total-label { color:#555 !important; }
      .total-badge { background:#000 !important; color:white !important; }
      .categories-compact { border-color:#ccc !important; background:#f9f9f9 !important; }
      .cat-label { color:#555 !important; }
      .cat-badge { border-color:#999 !important; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
      .cat-badge .cat-dot { -webkit-print-color-adjust:exact !important; }
      .cat-badge .cat-name { color:#000 !important; }
      .cat-badge .cat-monto { color:#2e7d32 !important; }
      .cat-total-badge { border-color:#000 !important; color:#000 !important; background:#f0f0f0 !important; }
      .stock-dot { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
      .stock-ok { background:#4caf50 !important; }
      .stock-aj { background:#ff9800 !important; }
      .stock-agotado { background:#f44336 !important; }
      .psf-container { border:2px solid #333 !important; background:#fff !important; }
      .psf-mes-card { border:1px solid #ccc !important; background:#fff !important; }
      .psf-mes-header { border-bottom:2px solid #333 !important; }
      .psf-mes-pct { background:#333 !important; color:white !important; }
      .psf-mes-cuota { background:#f9f9f9 !important; border:1px solid #ddd !important; }
      .psf-mes-fecha { color:#333 !important; }
      .psf-mes-monto { color:#000 !important; }
      .psf-mes-total { color:#000 !important; border-top:1px dashed #333 !important; }
      table { font-size:var(--text-xs) !important; }
      thead th { background:#333 !important; color:white !important; }
      tbody td { border-color:#ccc !important; }
      tbody tr:nth-child(even) { background:#f5f5f5 !important; }
      tfoot td { border-color:#000 !important; }
      tfoot .tf-label { color:#555 !important; }
      tfoot .tf-value { color:#000 !important; }
      .footer { color:#666 !important; border-color:#ccc !important; }
      .section { page-break-inside:avoid; }
      thead { display:table-header-group; }
      tr { page-break-inside:avoid; }
      h3,h4 { page-break-after:avoid; }
      .butterfly-chart { page-break-inside:avoid; }
    }
    @media (max-width:768px) {
      .header { flex-direction:column; gap:12px; }
      .kpis { flex-direction:column; }
      .client-grid { grid-template-columns:1fr; }
      .totals-row { flex-direction:column; }
      .psf-meses-grid { grid-template-columns:1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
    <div class="header">
      <div>
        <h1>📊 CHOPERS DISTRIBUCIONES</h1>
        <div class="header-meta">
          <span>RUC: ${ruc || ''}</span>
          <span>Pedido: ${numeroPedido || ''}</span>
          <span>Fecha: ${fechaStr}</span>
        </div>
      </div>
      <span class="badge">Distribución</span>
    </div>

    ${renderClientInfo({ cliente, ruc, numeroPedido, vendedor, emailVendedor, telefonoVendedor })}
    ${renderTotales(consolidado)}
    ${renderKPIs(consolidado, htmlDarkTheme)}
    ${renderButterflyChart(consolidado)}
    ${renderCategorias(consolidado)}
    ${renderDistribucionFecha(cuotas, totalPedido)}
    ${renderTablaProductos(productosCalculados, consolidado)}

    <div class="footer">
      G360 Order System — Generado el ${fechaStr} — CHOPERS DISTRIBUCIONES
    </div>
  </div>
</body>
</html>`
}