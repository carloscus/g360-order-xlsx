/**
 * Construye el string HTML completo para el reporte de cronograma
 * con tema claro/oscuro interactivo (toggle dentro del HTML generado)
 */

import { CHART_COLORS as CHART_COLORS_HEX } from '../constants/sharedConstants'

const NOMBRES_MES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SETIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']

const formatear = (n) => (n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatear4 = (n) => (n || 0).toLocaleString('es-PE', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
const redondear2 = (n) => Math.round((n || 0) * 100) / 100
const formatearEntero = (n) => Math.round(n || 0).toLocaleString('es-PE')

const COLORES_ESTADO_FALLBACK = { 'NACIONAL': '#059669', 'NUEVO': '#0891b2', 'IMPORTADO': '#d97706', 'TRADICIONAL': '#7c3aed', 'PENDIENTE': '#6b7280', '': '#6b7280' }

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

const renderKPIs = (consolidado) => {
  const sub = redondear2(consolidado.subtotal || 0)
  const total = redondear2(consolidado.totales?.totalIGV || 0)
  const disp = redondear2(consolidado.totales?.totalDisponible || 0)
  const cajas = consolidado.totalGeneral?.cajas || 0
  const peso = redondear2(consolidado.totalGeneral?.peso || 0)
  const nLineas = consolidado.datosLinea?.length || 0
  return `
<div class="section">
  <div class="section-title">📊 ANÁLISIS Y SEGMENTACIÓN</div>
  <div class="kpis">
    <div class="kpi-card"><div class="kpi-label">💰 Ventas Totales</div><div class="kpi-value">S/ ${formatear(sub)}</div></div>
    <div class="kpi-card"><div class="kpi-label">📦 Cajas Totales</div><div class="kpi-value">${cajas}</div></div>
    <div class="kpi-card"><div class="kpi-label">⚖️ Peso Total</div><div class="kpi-value" title="Incluye 2% adicional por empaque/caja">${peso} kg</div></div>
    <div class="kpi-card accent"><div class="kpi-label">💳 Total + IGV</div><div class="kpi-value">S/ ${formatear(total)}</div></div>
    <div class="kpi-card warning"><div class="kpi-label">✅ Total Disponible</div><div class="kpi-value">S/ ${formatear(disp)}</div></div>
    <div class="kpi-card"><div class="kpi-label">📊 Líneas</div><div class="kpi-value">${nLineas}</div></div>
  </div>
</div>`
}

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

const renderEstadoLinea = (productos, subtotal) => {
  const prods = productos || []
  if (!prods.length) return ''

  const grupos = {}
  let totalValor = 0

  prods.forEach(p => {
    if (!p.estadoLinea) return
    const estado = p.estadoLinea
    if (!grupos[estado]) {
      grupos[estado] = { estado, color: p.colorEstadoLinea || '#6b7280', valorTotal: 0, cantidad: 0, cajas: 0, peso: 0 }
    }
    grupos[estado].valorTotal += p.valorVenta || 0
    grupos[estado].cantidad++
    grupos[estado].cajas += p.cajas || 0
    grupos[estado].peso += p.pesoTotal || 0
    totalValor += p.valorVenta || 0
  })

  if (Object.keys(grupos).length === 0) return ''

  const datos = Object.values(grupos).map(g => ({
    ...g,
    porcentaje: totalValor > 0 ? (g.valorTotal / totalValor) * 100 : 0
  })).sort((a, b) => b.valorTotal - a.valorTotal)

  const badges = datos.map(d => {
    const color = d.color || COLORES_ESTADO_FALLBACK[d.estado] || '#6b7280'
    return `<span class="cat-badge" style="background:${color}15;border:1px solid ${color}40">
      <span class="cat-dot" style="background:${color}"></span>
      <span class="cat-name" style="color:${color}">${d.estado}</span>
      <span class="cat-pct" style="color:${color}">${redondear2(d.porcentaje)}%</span>
      <span class="cat-separator">•</span>
      <span class="cat-monto">S/ ${formatear(d.valorTotal)}</span>
      <span class="cat-separator">•</span>
      <span class="cat-bx">${d.cantidad} prod.</span>
      <span class="cat-separator">•</span>
      <span class="cat-bx">${redondear2(d.cajas)} BX | ${redondear2(d.peso)} kg</span>
    </span>`
  }).join('')

  const sub = redondear2(subtotal || 0)
  const cajas = redondear2(Object.values(grupos).reduce((s, g) => s + g.cajas, 0))
  const peso = redondear2(Object.values(grupos).reduce((s, g) => s + g.peso, 0))

  return `
<div class="section" style="margin-top:20px">
  <div class="categories-compact">
    <span class="cat-label">🏷️ ESTADO LÍNEA:</span>
    ${badges}
    <span class="cat-total-badge">TOTAL: S/ ${formatear(sub)} | ${cajas} BX | ${peso} kg</span>
  </div>
</div>`
}

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

const renderTablaProductos = (productos) => {
  const rows = productos.map((p, idx) => {
    const stockClass = p.estadoStock === 'OK' ? 'stock-ok' : p.estadoStock === 'AJ' ? 'stock-aj' : 'stock-agotado'
    const stockFlag = p.estadoStock === 'Agotado' ? 'out' : 'ok'
    const cant = p.cantidad || 0
    const totalNeto = redondear2(p.valorVenta || 0)
    const precioUnitCIGV = redondear2((p.valorVenta || 0) / (cant || 1) * 1.18)
    const totalVenta = redondear2((p.valorVenta || 0) * 1.18)
    const _estado = p.estadoLinea
    const _colorEstado = p.colorEstadoLinea || COLORES_ESTADO_FALLBACK[_estado] || '#6b7280'
    const badgeTipo = _estado
      ? `<span class="badge" style="background:${_colorEstado}20;color:${_colorEstado};border:1px solid ${_colorEstado}40;padding:2px 6px;border-radius:3px;font-size:9px;font-weight:600;white-space:nowrap">${_estado}</span>`
      : ''
    const desc1 = p.descuento1 || 0
    const desc2 = p.descuento2 || 0
    // Cajas (usando valores ya calculados en usePedido)
    const cajasComp = p.cajasCompletas || 0
    const sueltas = p.unidadesSueltas || 0
    const cajasTxt = sueltas > 0
      ? `${cajasComp}<span class="cajas-sueltas">+${sueltas}</span>`
      : `${cajasComp}`
    const descFull = (p.descripcion || '')
    const descShort = descFull.length > 70 ? descFull.slice(0, 69).trimEnd() + '…' : descFull
    return `<tr data-stock="${stockFlag}">
<td class="td-center">${idx + 1}</td>
<td class="td-right" data-value="${cant}"><span class="stock-dot ${stockClass}" title="${p.estadoStock || ''}"></span> ${formatearEntero(cant)}</td>
<td class="td-center">${p.unidadMedida || 'UND'}</td>
<td class="td-mono" data-value="${p.codigo}">${p.codigo}</td>
<td class="td-desc" title="${descFull.replace(/"/g, '&quot;')}"><span class="desc-clamp">${descShort.replace(/"/g, '&quot;')}</span></td>
<td class="td-right" data-value="${p.precioUnitario || 0}">${formatear4(p.precioUnitario || 0)}</td>
<td class="td-center" data-value="${desc1}">${redondear2(desc1)}</td>
<td class="td-center" data-value="${desc2}">${redondear2(desc2)}</td>
<td class="td-right td-bold" data-value="${totalNeto}">${formatear(totalNeto)}</td>
<td class="td-right" data-value="${precioUnitCIGV}">${formatear4(precioUnitCIGV)}</td>
<td class="td-right td-total" data-value="${totalVenta}">${formatear(totalVenta)}</td>
<td class="td-center td-cajas">${cajasTxt}</td>
<td class="td-center">${badgeTipo}</td>
</tr>`
  }).join('')

  const totalLinea = redondear2(productos.reduce((s, p) => s + (p.valorVenta || 0), 0))
  const totalVentaFinal = redondear2(totalLinea * 1.18)
  const totalCant = productos.reduce((s, p) => s + (p.cantidad || 0), 0)
  const totalCajas = productos.reduce((s, p) => s + (p.cajas || 0), 0)

  return `
<div class="section">
  <div class="section-title">📦 DETALLE DE PARTIDAS (${productos.length})</div>
  <div class="table-toolbar no-print">
    <div class="filter-group">
      <button class="filter-btn active" data-filter="all" onclick="filtrarStock('all')">Todos</button>
      <button class="filter-btn" data-filter="ok" onclick="filtrarStock('ok')">Con stock</button>
      <button class="filter-btn" data-filter="out" onclick="filtrarStock('out')">Sin stock</button>
    </div>
    <span class="table-count" id="tableCount">Mostrando ${productos.length} de ${productos.length}</span>
  </div>
  <div class="table-container">
    <table id="tablaPartidas">
      <colgroup>
        <col class="col-narrow"><col class="col-cant"><col class="col-um"><col class="col-sku">
        <col class="col-desc"><col class="col-price"><col class="col-dto"><col class="col-dto">
        <col class="col-neto"><col class="col-unit"><col class="col-total"><col class="col-cajas">
        <col class="col-tipo">
      </colgroup>
      <thead>
        <tr>
          <th class="th-center">#</th>
          <th class="th-right" onclick="ordenarTabla(1,'num')">Cant.<span class="sort-ind"></span></th>
          <th class="th-center">U/M</th>
          <th class="th-center" onclick="ordenarTabla(3,'text')">SKU<span class="sort-ind"></span></th>
          <th class="th-left">Descripción</th>
          <th class="th-right" onclick="ordenarTabla(5,'num')">P. Lista<span class="sort-ind"></span></th>
          <th class="th-center" onclick="ordenarTabla(6,'num')">Dto1<span class="sort-ind"></span></th>
          <th class="th-center" onclick="ordenarTabla(7,'num')">Dto2<span class="sort-ind"></span></th>
          <th class="th-right" onclick="ordenarTabla(8,'num')">Neto<span class="sort-ind"></span></th>
          <th class="th-right" onclick="ordenarTabla(9,'num')">P.Unit<span class="sort-ind"></span></th>
          <th class="th-right" onclick="ordenarTabla(10,'num')">TOTAL<span class="sort-ind"></span></th>
          <th class="th-center">Cajas</th>
          <th class="th-center">Tipo</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="8" class="tf-label">TOTALES (${productos.length} productos)</td>
          <td class="tf-value">${formatear(totalLinea)}</td>
          <td></td>
          <td class="tf-value tf-total">${formatear(totalVentaFinal)}</td>
          <td class="tf-value">${formatearEntero(totalCajas)}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>`
}

/**
 * Construye el contenido HTML del reporte (sin <html>/<head>/<body>)
 */
function buildContent(data) {
  const { cliente, ruc, numeroPedido, idCliente, sucursal, vendedor, emailVendedor, telefonoVendedor, cuotas, consolidado, productosCalculados } = data
  const emailFull = emailVendedor ? (emailVendedor.includes('@') ? emailVendedor : `${emailVendedor}@cipsa.com.pe`) : ''
  const now = new Date()
  const fechaStr = now.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const totalPedido = consolidado.totales?.totalIGV || 1

  return `
    <div class="header">
      <div>
        <h1>📊 ${cliente || 'CHOPERS DISTRIBUCIONES'}</h1>
        <div class="header-meta">
          <span>RUC: ${ruc || ''}</span>
          <span>Pedido: ${numeroPedido || ''}</span>
          <span>ID: ${idCliente || '-'}</span>
          <span>Sucursal: ${sucursal || 'PRINCIPAL'}</span>
          <span>${fechaStr}</span>
          ${vendedor ? `<span>Vendedor: ${vendedor}</span>` : ''}
        </div>
      </div>
      <span class="badge">Distribución</span>
    </div>

    ${renderTotales(consolidado)}
    ${renderKPIs(consolidado)}
    ${renderButterflyChart(consolidado)}
    ${renderCategorias(consolidado)}
    ${renderEstadoLinea(productosCalculados, consolidado.subtotal)}
    ${renderDistribucionFecha(cuotas, totalPedido)}
    ${renderTablaProductos(productosCalculados)}

    <div class="footer">
      G360 Order System — Generado el ${fechaStr} — ${cliente || 'CHOPERS DISTRIBUCIONES'}
    </div>`
}

/**
 * Genera el bloque de variables CSS con ambos temas
 */
function getThemeStyles() {
  return `
:root {
  --g360-accent: #2563eb;
  --g360-accent-2: #1d4ed8;
  --g360-bg: #0f172a;
  --g360-surface: #1e293b;
  --g360-surface-2: #273449;
  --g360-text: #f1f5f9;
  --g360-muted: #cbd5e1;
  --g360-border: #475569;
  --g360-success: #10b981;
  --g360-warning: #f59e0b;
  --g360-error: #f87171;
  --g360-info: #60a5fa;
  --text-2xs:0.5625rem; --text-xs:0.6875rem; --text-sm:0.75rem; --text-base:0.875rem;
  --text-lg:1rem; --text-xl:1.125rem; --text-2xl:1.25rem; --text-3xl:1.5rem;
  --fw-normal:400; --fw-medium:500; --fw-semibold:600; --fw-bold:700; --fw-extrabold:800;
  --accent-rgb: 37,99,235;
}

.light {
  --g360-accent: #1d4ed8;
  --g360-accent-2: #1e40af;
  --g360-bg: #f8fafc;
  --g360-surface: #ffffff;
  --g360-surface-2: #f1f5f9;
  --g360-text: #1e293b;
  --g360-muted: #64748b;
  --g360-border: #e2e8f0;
  --g360-success: #059669;
  --g360-warning: #b45309;
  --g360-error: #dc2626;
  --g360-info: #2563eb;
  --accent-rgb: 29,78,216;
}`
}

/**
 * Genera el script de interactividad (toggle tema + imprimir)
 */
function getScripts() {
  return `
<script>
function toggleTheme() {
  document.body.classList.toggle('light');
  localStorage.setItem('g360_html_theme', document.body.classList.contains('light') ? 'light' : 'dark');
}
(function() {
  var saved = localStorage.getItem('g360_html_theme');
  if (saved === 'light') document.body.classList.add('light');
})();
function printDocument() {
  if (typeof filtrarStock === 'function') filtrarStock('all');
  setTimeout(function() { window.print(); }, 80);
}

// Ordenar tabla por columna
function ordenarTabla(colIndex, tipo) {
  var table = document.getElementById('tablaPartidas');
  if (!table) return;
  var tbody = table.tBodies[0];
  var headRow = table.tHead.rows[0];
  var th = headRow.cells[colIndex];
  var asc = th.getAttribute('data-dir') !== 'asc';

  // Limpiar indicadores previos
  Array.prototype.forEach.call(headRow.cells, function(c) {
    c.setAttribute('data-dir', '');
    var i = c.querySelector('.sort-ind');
    if (i) i.textContent = '';
  });

  th.setAttribute('data-dir', asc ? 'asc' : 'desc');
  var ind = th.querySelector('.sort-ind');
  if (ind) ind.textContent = asc ? '▲' : '▼';

  var rows = Array.prototype.slice.call(tbody.rows);
  rows.sort(function(a, b) {
    var va = a.cells[colIndex].getAttribute('data-value');
    var vb = b.cells[colIndex].getAttribute('data-value');
    if (tipo === 'num') {
      va = parseFloat(va) || 0;
      vb = parseFloat(vb) || 0;
      return asc ? va - vb : vb - va;
    }
    va = String(va || '').toLowerCase();
    vb = String(vb || '').toLowerCase();
    if (va === vb) return 0;
    if (asc) return va < vb ? -1 : 1;
    return va > vb ? -1 : 1;
  });

  rows.forEach(function(r, i) {
    tbody.appendChild(r);
    r.cells[0].textContent = i + 1;
  });
}

// Filtrar por disponibilidad de stock
function filtrarStock(modo) {
  var table = document.getElementById('tablaPartidas');
  if (!table) return;
  var rows = table.tBodies[0].rows;
  var visibles = 0;
  var total = rows.length;

  Array.prototype.forEach.call(rows, function(r) {
    var flag = r.getAttribute('data-stock');
    var show = modo === 'all' || (modo === 'ok' && flag === 'ok') || (modo === 'out' && flag === 'out');
    r.style.display = show ? '' : 'none';
    if (show) visibles++;
  });

  var btns = document.querySelectorAll('.filter-btn');
  Array.prototype.forEach.call(btns, function(b) {
    if (b.getAttribute('data-filter') === modo) b.classList.add('active');
    else b.classList.remove('active');
  });

  var cnt = document.getElementById('tableCount');
  if (cnt) cnt.textContent = 'Mostrando ' + visibles + ' de ' + total;

  // Renumerar filas visibles
  var n = 0;
  Array.prototype.forEach.call(rows, function(r) {
    if (r.style.display !== 'none') { n++; r.cells[0].textContent = n; }
  });
}
</script>`
}

/**
 * Genera estilos de impresión
 */
function getPrintStyles() {
  return `
@media print {
  @page { size:A4; margin:12mm 10mm; }
  body { background:white !important; color:#000 !important; padding:0 !important; font-size:10px !important; }
  .container { max-width:100% !important; width:100% !important; margin:0 !important; padding:0 !important; }
  .section { margin-bottom:12px; padding:8px !important; }
  .no-print { display:none !important; }
  * { color:#000 !important; box-shadow:none !important; text-shadow:none !important; }
  .header { border-bottom-color:#000 !important; padding-bottom:8px !important; margin-bottom:12px !important; }
  .header h1 { color:#000 !important; font-size:14px !important; }
  .header-meta { color:#555 !important; gap:8px !important; font-size:9px !important; flex-wrap:wrap !important; }
  .badge { border:1px solid #000 !important; color:white !important; background:#000 !important; }
  .badge-nueva { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; background:#059669 !important; color:white !important; border:1px solid #34d399 !important; }
  .badge-tradicional { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; background:#f59e0b !important; color:#1e293b !important; border:1px solid #fbbf24 !important; }
  .section-title { color:#000 !important; border-bottom-color:#000 !important; }
  .client-item { border-color:#ccc !important; background:#f9f9f9 !important; }
  .client-item label { color:#555 !important; }
  .client-item span { color:#000 !important; }
  .kpi-card { border-color:#ccc !important; background:#f9f9f9 !important; min-width:0 !important; padding:6px 8px !important; flex:1 !important; }
  .kpi-label { color:#555 !important; font-size:9px !important; }
  .kpi-value { color:#000 !important; font-size:12px !important; }
  .kpi-card.accent { background:#e8f5e9 !important; border-color:#4caf50 !important; }
  .kpi-card.warning { background:#fff3e0 !important; border-color:#ff9800 !important; }
  .kpi-card.info { background:#e3f2fd !important; border-color:#2196f3 !important; }
  .kpi-card.info .kpi-value { color:#1565c0 !important; }
  .total-card { border-color:#ccc !important; background:#f9f9f9 !important; }
  .total-card.main { background:#e8f5e9 !important; border-color:#4caf50 !important; }
  .total-card h4 { color:#555 !important; }
  .total-card .value { color:#000 !important; }
  .butterfly-chart { border-color:#ccc !important; background:white !important; padding:10px !important; }
  .butterfly-header { border-bottom-color:#ccc !important; padding-bottom:6px !important; margin-bottom:8px !important; }
  .butterfly-col-left { color:#2e7d32 !important; }
  .butterfly-col-center { color:#333 !important; width:90px !important; }
  .butterfly-col-right { color:#555 !important; }
  .butterfly-row { padding:3px 4px !important; margin-bottom:3px !important; }
  .butterfly-row:nth-child(even) { background:#f5f5f5 !important; }
  .butterfly-monto { color:#2e7d32 !important; font-size:10px !important; }
  .butterfly-pct { color:#666 !important; }
  .butterfly-name { padding:2px 6px !important; font-size:9px !important; max-width:none !important; }
  .butterfly-center { width:90px !important; padding:0 4px !important; }
  .print-color { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
  .butterfly-name { color:white !important; }
  .butterfly-cajas { color:#000 !important; }
  .butterfly-peso { color:#666 !important; }
  .butterfly-total { border-color:#000 !important; background:#f0f0f0 !important; }
  .total-value { color:#000 !important; }
  .total-label { color:#555 !important; }
  .total-badge { background:#000 !important; color:white !important; }
  .categories-compact { border-color:#ccc !important; background:#f9f9f9 !important; }
  .cat-badge { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
  .cat-total-badge { border-color:#000 !important; color:#000 !important; background:#f0f0f0 !important; }
  .stock-dot { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
  .psf-container { border:2px solid #333 !important; background:#fff !important; }
  .psf-mes-card { border:1px solid #ccc !important; background:#fff !important; }
  .psf-mes-header { border-bottom:2px solid #333 !important; }
  .psf-mes-pct { background:#333 !important; color:white !important; }
  .psf-mes-cuota { background:#f9f9f9 !important; border:1px solid #ddd !important; }
  .psf-mes-fecha { color:#333 !important; }
  .psf-mes-monto { color:#000 !important; }
  .psf-mes-total { color:#000 !important; border-top:1px dashed #333 !important; }
  table { font-size:7.5px !important; table-layout:fixed !important; width:100% !important; }
  colgroup .col-narrow { width:3% !important; }
  colgroup .col-cant { width:6% !important; }
  colgroup .col-um { width:4% !important; }
  colgroup .col-sku { width:7% !important; }
  colgroup .col-desc { width:24% !important; }
  colgroup .col-price { width:7% !important; }
  colgroup .col-dto { width:5% !important; }
  colgroup .col-neto { width:9% !important; }
  colgroup .col-unit { width:7% !important; }
  colgroup .col-total { width:10% !important; }
  colgroup .col-cajas { width:6% !important; }
  colgroup .col-tipo { width:7% !important; }
  thead th { background:#333 !important; color:white !important; padding:4px 3px !important; font-size:7px !important; }
  tbody td { border-color:#ccc !important; padding:4px 3px !important; font-size:7.5px !important; }
  tbody tr:nth-child(even) { background:#f5f5f5 !important; }
  tbody tr { display:table-row !important; }
  tfoot td { border-color:#000 !important; padding:5px 3px !important; font-size:9px !important; }
  .td-desc { white-space:normal !important; }
  /* En impresión: más líneas para que la descripción se vea completa (A4) */
  .desc-clamp {
    -webkit-line-clamp:3 !important;
    line-clamp:3 !important;
    min-height:3.9em !important;
  }
  .sort-ind { display:none !important; }
  .stock-dot { width:6px !important; height:6px !important; }
  .footer { color:#666 !important; border-color:#ccc !important; padding:8px 0 4px !important; margin-top:12px !important; font-size:8px !important; }
  .section { page-break-inside:avoid; margin-bottom:8px !important; padding:6px !important; }
  thead { display:table-header-group; }
  tr { page-break-inside:avoid; }
  h3,h4 { page-break-after:avoid; }
  .butterfly-chart { page-break-inside:avoid; }
  .snapshot-header { display:none !important; }
}
@media (max-width:768px) {
  .snapshot-header { flex-wrap:wrap; gap:8px; padding:10px !important; }
  .snapshot-header h2 { font-size:0.9rem !important; }
  .header { flex-direction:column; gap:12px; }
  .kpis { flex-direction:column; }
  .client-grid { grid-template-columns:1fr; }
  .totals-row { flex-direction:column; }
  .psf-meses-grid { grid-template-columns:1fr; }
}`
}

/**
 * Construye el string HTML completo para el reporte de cronograma
 * con tema claro/oscuro interactivo
 */
export const buildCronogramaHTML = (data) => {
  const { cliente, ruc, numeroPedido } = data
  const now = new Date()
  const fechaStr = now.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const fechaISO = now.toISOString().split('T')[0].replace(/-/g, '')
  const content = buildContent(data)

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="author" content="ccusi - G360 Order System">
  <meta name="generator" content="G360 Order XLSX">
  <title>Pedido ${numeroPedido || ''} - Distribución</title>
  <style>
    /* ===== TEMA CLARO/OSCURO ===== */
    ${getThemeStyles()}

    /* ===== RESET & BASE ===== */
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
      background:var(--g360-bg);
      color:var(--g360-text);
      padding:0;
      line-height:1.5;
      transition: background 0.3s, color 0.3s;
    }

    /* ===== SNAPSHOT HEADER ===== */
    .snapshot-header {
      position:sticky; top:0; z-index:1000;
      background:linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color:white;
      padding:12px 24px;
      display:flex;
      justify-content:space-between;
      align-items:center;
      box-shadow:0 2px 12px rgba(0,0,0,0.15);
    }
    .light .snapshot-header {
      background:linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
    }
    .snapshot-header h2 {
      font-size:1rem;
      font-weight:700;
      letter-spacing:-0.3px;
    }
    .snapshot-actions {
      display:flex;
      gap:8px;
    }
    .snapshot-btn {
      background:rgba(255,255,255,0.2);
      border:1px solid rgba(255,255,255,0.25);
      color:white;
      padding:8px 16px;
      border-radius:8px;
      cursor:pointer;
      font-size:0.8125rem;
      font-weight:600;
      transition:all 0.2s;
      display:inline-flex;
      align-items:center;
      gap:6px;
    }
    .snapshot-btn:hover {
      background:rgba(255,255,255,0.3);
    }

    /* ===== CONTENIDO ===== */
    .container { max-width:1100px; margin:0 auto; padding:24px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; padding-bottom:16px; border-bottom:2px solid var(--g360-accent); }
    .header h1 { font-size:calc(var(--text-3xl) + 2px); color:var(--g360-accent); margin-bottom:4px; }
    .header-meta { font-size:var(--text-sm); color:var(--g360-muted); display:flex; gap:16px; flex-wrap:wrap; margin-top:4px; }
    .badge { background:var(--g360-accent); color:white; padding:6px 16px; border-radius:20px; font-size:var(--text-sm); font-weight:var(--fw-bold); text-transform:uppercase; letter-spacing:1px; }
    .badge-nueva { background:#2563eb; color:white; border:1px solid #3b82f6; }
    .badge-tradicional { background:#f59e0b; color:#1e293b; border:1px solid #fbbf24; }
    .section { margin-bottom:28px; }
    .section-title { font-size:var(--text-lg); font-weight:var(--fw-bold); color:var(--g360-accent); text-transform:uppercase; letter-spacing:1px; margin-bottom:16px; padding-bottom:8px; border-bottom:1px solid var(--g360-border); }
    .client-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px; }
    .client-item { background:var(--g360-surface); padding:14px 16px; border-radius:10px; border:1px solid var(--g360-border); }
    .client-item label { color:var(--g360-muted); font-size:var(--text-2xs); text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:4px; font-weight:var(--fw-semibold); }
    .client-item span { font-size:var(--text-base); font-weight:var(--fw-semibold); }
    .kpis { display:flex; gap:8px; margin-bottom:20px; overflow-x:auto; }
    .kpi-card { flex:0 0 auto; min-width:140px; background:var(--g360-surface); border-radius:8px; padding:12px 16px; border:1px solid var(--g360-border); text-align:center; }
    .kpi-label { font-size:var(--text-2xs); color:var(--g360-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
    .kpi-value { font-size:var(--text-lg); font-weight:var(--fw-bold); color:var(--g360-accent); }
    .kpi-card.accent { background:linear-gradient(135deg,rgba(var(--accent-rgb),0.125),rgba(var(--accent-rgb),0.063)); border:2px solid var(--g360-accent); }
    .kpi-card.warning { background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(245,158,11,0.05)); border:2px solid var(--g360-warning); }
    .kpi-card.warning .kpi-value { color:var(--g360-warning); }
    .kpi-card.info { background:linear-gradient(135deg,rgba(96,165,250,0.1),rgba(96,165,250,0.05)); border:1px solid var(--g360-info); }
    .kpi-card.info .kpi-value { color:var(--g360-info); font-size:var(--text-xs); }
    .totals-row { display:flex; gap:12px; margin-bottom:24px; flex-wrap:wrap; }
    .total-card { background:var(--g360-surface); padding:18px; border-radius:12px; flex:1; min-width:160px; text-align:center; border:1px solid var(--g360-border); }
    .total-card.main { background:linear-gradient(135deg,rgba(var(--accent-rgb),0.125),rgba(var(--accent-rgb),0.063)); border:2px solid var(--g360-accent); }
    .total-card h4 { color:var(--g360-muted); font-size:var(--text-2xs); text-transform:uppercase; margin-bottom:6px; letter-spacing:1px; }
    .total-card .value { font-size:var(--text-xl); font-weight:var(--fw-bold); color:var(--g360-accent); }
    .butterfly-chart { background:var(--g360-surface); border-radius:12px; padding:20px; border:1px solid var(--g360-border); }
    .butterfly-header { display:flex; align-items:center; margin-bottom:16px; padding-bottom:10px; border-bottom:1px solid var(--g360-border); }
    .butterfly-col-left { flex:1; text-align:right; padding-right:10px; font-size:var(--text-xs); color:var(--g360-accent); font-weight:var(--fw-bold); }
    .butterfly-col-center { width:140px; text-align:center; font-size:var(--text-xs); color:var(--g360-muted); font-weight:var(--fw-bold); }
    .butterfly-col-right { flex:1; padding-left:10px; font-size:var(--text-xs); color:var(--g360-muted); font-weight:var(--fw-bold); }
    .butterfly-row { display:flex; align-items:center; margin-bottom:8px; padding:6px 8px; border-radius:8px; }
    .butterfly-row:nth-child(even) { background:rgba(128,128,128,0.05); }
    .butterfly-left { flex:1; display:flex; align-items:center; justify-content:flex-end; gap:8px; }
    .butterfly-monto { font-size:var(--text-sm); color:var(--g360-accent); font-weight:var(--fw-bold); text-align:right; }
    .butterfly-pct { font-size:var(--text-2xs); color:var(--g360-muted); }
    .butterfly-bar-left { height:24px; border-radius:0 4px 4px 0; opacity:0.9; }
    .butterfly-center { width:140px; text-align:center; padding:0 12px; }
    .butterfly-name { display:inline-block; padding:6px 10px; border-radius:8px; font-size:var(--text-xs); font-weight:var(--fw-bold); color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px; }
    .butterfly-right { flex:1; display:flex; align-items:center; gap:8px; }
    .butterfly-bar-right { height:24px; border-radius:4px 0 0 4px; opacity:0.7; }
    .butterfly-cajas { font-size:var(--text-sm); color:var(--g360-text); font-weight:var(--fw-bold); }
    .butterfly-peso { font-size:var(--text-2xs); color:var(--g360-muted); }
    .butterfly-total { display:flex; align-items:center; margin-top:12px; padding:10px 8px; background:linear-gradient(135deg,rgba(var(--accent-rgb),0.125),rgba(var(--accent-rgb),0.063)); border-radius:10px; border:2px solid var(--g360-accent); }
    .butterfly-total-left { flex:1; text-align:right; padding-right:10px; }
    .butterfly-total-center { width:140px; text-align:center; }
    .butterfly-total-right { flex:1; padding-left:10px; }
    .total-value { font-size:var(--text-base); font-weight:var(--fw-bold); color:var(--g360-text); display:block; }
    .total-label { font-size:var(--text-2xs); color:var(--g360-muted); display:block; }
    .total-badge { display:inline-block; padding:4px 12px; background:var(--g360-accent); color:white; border-radius:8px; font-size:var(--text-xs); font-weight:var(--fw-bold); }
    .categories-compact { display:flex; align-items:center; flex-wrap:wrap; gap:10px; background:var(--g360-surface); border-radius:10px; padding:14px 18px; border:1px solid var(--g360-border); }
    .cat-label { font-size:var(--text-sm); color:var(--g360-muted); font-weight:var(--fw-semibold); }
    .cat-badge { display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:20px; font-size:var(--text-sm); }
    .cat-badge .cat-dot { width:8px; height:8px; border-radius:50%; }
    .cat-badge .cat-name { font-weight:var(--fw-semibold); color:var(--g360-text); }
    .cat-badge .cat-pct { font-weight:var(--fw-bold); }
    .cat-badge .cat-separator { color:var(--g360-muted); }
    .cat-badge .cat-monto { font-weight:var(--fw-bold); color:var(--g360-accent); }
    .cat-badge .cat-bx { font-weight:var(--fw-semibold); color:var(--g360-text); }
    .cat-total-badge { display:inline-flex; align-items:center; padding:6px 14px; background:linear-gradient(135deg,rgba(var(--accent-rgb),0.125),rgba(var(--accent-rgb),0.063)); border:2px solid var(--g360-accent); border-radius:20px; font-size:var(--text-sm); font-weight:var(--fw-bold); color:var(--g360-text); margin-left:auto; }
    .psf-container { background:var(--g360-surface); border:2px solid var(--g360-accent); border-radius:12px; padding:16px; margin-top:12px; }
    .psf-meses-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:10px; }
    .psf-mes-card { background:var(--g360-bg); border:1px solid var(--g360-border); border-radius:8px; padding:10px; }
    .psf-mes-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding-bottom:6px; border-bottom:2px solid var(--g360-accent); }
    .psf-mes-nombre { font-size:var(--text-sm); font-weight:var(--fw-bold); color:var(--g360-accent); text-transform:uppercase; }
    .psf-mes-pct { font-size:var(--text-xs); font-weight:var(--fw-bold); color:white; background:var(--g360-accent); padding:2px 8px; border-radius:10px; }
    .psf-mes-cuotas { display:flex; flex-direction:column; gap:4px; }
    .psf-mes-cuota { display:flex; justify-content:space-between; align-items:center; padding:6px 8px; background:var(--g360-surface); border:1px solid var(--g360-border); border-radius:4px; font-size:var(--text-xs); }
    .psf-mes-fecha { color:var(--g360-text); font-weight:var(--fw-medium); }
    .psf-mes-monto { color:var(--g360-accent); font-weight:var(--fw-bold); }
    .psf-mes-total { text-align:right; font-size:var(--text-sm); font-weight:var(--fw-bold); color:var(--g360-accent); padding-top:6px; margin-top:6px; border-top:1px dashed var(--g360-border); }
    .table-container { margin-top:10px; overflow-x:auto; }
    table { width:100%; border-collapse:collapse; font-size:11px; table-layout:fixed; }
    colgroup .col-narrow { width:3%; }
    colgroup .col-cant { width:6%; }
    colgroup .col-um { width:4%; }
    colgroup .col-sku { width:7%; }
    colgroup .col-desc { width:24%; }
    colgroup .col-price { width:7%; }
    colgroup .col-dto { width:5%; }
    colgroup .col-neto { width:9%; }
    colgroup .col-unit { width:7%; }
    colgroup .col-total { width:10%; }
    colgroup .col-cajas { width:6%; }
    colgroup .col-tipo { width:7%; }
    thead { background:var(--g360-surface); }
    thead th { padding:8px 5px; font-size:9px; font-weight:700; color:var(--g360-muted); text-transform:uppercase; letter-spacing:0.4px; border-bottom:2px solid var(--g360-accent); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; vertical-align:middle; user-select:none; }
    thead th[onclick] { cursor:pointer; transition:color 0.15s, background 0.15s; }
    thead th[onclick]:hover { color:var(--g360-accent); background:rgba(0,208,132,0.08); }
    .th-center { text-align:center; }
    .th-right { text-align:right; }
    .th-left { text-align:left; }
    .sort-ind { font-size:7px; opacity:0.55; margin-left:3px; }
    tbody td { padding:7px 5px; border-bottom:1px solid var(--g360-border); color:var(--g360-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; vertical-align:middle; }
    .td-center { text-align:center; }
    .td-right { text-align:right; }
    .td-left { text-align:left; }
    .td-mono { font-family:monospace; font-size:9.5px; text-align:center; letter-spacing:0.2px; }
    /* Descripcion: 2 lineas (clamp en span interno, el td no corta) */
    .td-desc { white-space:normal; overflow:visible; }
    .desc-clamp {
      display:-webkit-box;
      -webkit-line-clamp:2;
      line-clamp:2;
      -webkit-box-orient:vertical;
      overflow:hidden;
      font-size:9.5px;
      line-height:1.3;
      min-height:2.6em;
    }
    .td-bold { font-weight:700; }
    .td-total { color:var(--g360-accent); font-weight:700; }
    .td-cajas { font-size:10px; font-weight:600; color:var(--g360-text); }
    .cajas-sueltas { color:var(--g360-warning); font-weight:700; font-size:9px; margin-left:1px; }
    tbody tr:hover { background:rgba(0,208,132,0.06); }
    tbody tr:nth-child(even) { background:rgba(128,128,128,0.035); }
    .table-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px; flex-wrap:wrap; }
    .filter-group { display:flex; gap:3px; background:var(--g360-surface); padding:3px; border-radius:8px; border:1px solid var(--g360-border); }
    .filter-btn { background:transparent; border:none; color:var(--g360-muted); padding:6px 14px; border-radius:6px; font-size:10px; font-weight:600; cursor:pointer; transition:all 0.15s; white-space:nowrap; font-family:inherit; letter-spacing:0.3px; text-transform:uppercase; }
    .filter-btn:hover { color:var(--g360-text); background:rgba(128,128,128,0.12); }
    .filter-btn.active { background:var(--g360-accent); color:#fff; }
    .table-count { font-size:10px; color:var(--g360-muted); font-weight:600; }
    tfoot td { padding:10px 5px; border-top:2px solid var(--g360-accent); font-weight:700; font-size:11px; }
    .tf-label { color:var(--g360-muted); text-transform:uppercase; font-size:9px; letter-spacing:0.5px; }
    .tf-value { color:var(--g360-accent); font-size:12px; text-align:right; }
    .tf-total { font-size:13px; }
    .stock-dot { display:inline-block; width:8px; height:8px; border-radius:50%; vertical-align:middle; }
    .stock-ok { background:#22c55e; }
    .stock-aj { background:#f59e0b; }
    .stock-agotado { background:#ef4444; }
    .footer { text-align:center; padding:24px 0 8px; color:var(--g360-muted); font-size:var(--text-xs); border-top:1px solid var(--g360-border); margin-top:32px; }
    .print-btn { background:var(--g360-accent); color:white; border:none; padding:12px 28px; border-radius:8px; font-size:var(--text-base); font-weight:var(--fw-bold); cursor:pointer; margin-bottom:20px; display:inline-flex; align-items:center; gap:8px; }
    .print-btn:hover { opacity:0.9; }

    ${getPrintStyles()}
  </style>
</head>
<body>
  <!-- Sticky header with theme toggle -->
  <header class="snapshot-header no-print">
    <h2>📊 G360 Order System — Reporte de Distribución</h2>
    <div class="snapshot-actions">
      <button class="snapshot-btn" onclick="toggleTheme()" title="Cambiar tema claro/oscuro">🌓 Tema</button>
      <button class="snapshot-btn" onclick="printDocument()" title="Imprimir o guardar como PDF">🖨️ Imprimir</button>
    </div>
  </header>

  <div class="container">
    ${content}
  </div>

  ${getScripts()}
</body>
</html>`
}
