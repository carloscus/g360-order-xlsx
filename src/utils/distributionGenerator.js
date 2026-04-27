export async function generateDistribution(data) {
  const { cliente, documento, numeroPedido, productos, totales } = data
  const fecha = new Date().toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Cargar feriados
  let feriados = []
  try {
    const res = await fetch('/feriados.json')
    feriados = await res.json()
  } catch (e) {
    console.log('Sin feriados')
  }

  // Generar calendario del mes actual
  const hoy = new Date()
  const año = hoy.getFullYear()
  const mes = hoy.getMonth()
  const primerDia = new Date(año, mes, 1).getDay()
  const diasMes = new Date(año, mes + 1, 0).getDate()
  
  const mesNombre = hoy.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase()
  
  const isFeriado = (dia) => {
    const fecha = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return feriados.find(f => f.date === fecha)
  }
  
  const isDomingo = (dia) => new Date(año, mes, dia).getDay() === 0
  const isSábado = (dia) => new Date( año, mes, dia).getDay() === 6

  const calendarHTML = `
    <div class="calendar-section">
      <div class="calendar-header">${mesNombre} ${año}</div>
      <div class="calendar-grid">
        <div class="cal-day-name">DOM</div>
        <div class="cal-day-name">LUN</div>
        <div class="cal-day-name">MAR</div>
        <div class="cal-day-name">MIÉ</div>
        <div class="cal-day-name">JUE</div>
        <div class="cal-day-name">VIE</div>
        <div class="cal-day-name">SÁB</div>
        ${Array(primerDia).fill().map(() => '<div class="cal-day empty"></div>').join('')}
        ${Array(diasMes).fill().map((_, i) => {
          const dia = i + 1
          const fer = isFeriado(dia)
          const dom = isDomingo(dia)
          const sáb = isSábado(dia)
          let clase = 'cal-day'
          let estilo = ''
          if (fer) {
            clase += ' feriado'
            estilo = 'background: #ef4444; color: white;'
          } else if (dom) {
            clase += ' domingo'
            estilo = 'background: #ef4444; color: white;'
          } else if (sáb) {
            clase += ' sabado'
            estilo = 'background: #3b82f6; color: white;'
          }
          return `<div class="${clase}" style="${estilo}">${dia}</div>`
        }).join('')}
      </div>
      <div class="calendar-legend">
        <span class="leyenda"><span class="dot-red"></span> Feriado/Domingo</span>
        <span class="leyenda"><span class="dot-blue"></span> Sábado</span>
      </div>
    </div>
  `

  const lineas = {}
  let totalCajas = 0
  productos.forEach(p => {
    const linea = p.linea || p.categoria || 'SIN LÍNEA'
    if (!lineas[linea]) lineas[linea] = { cantidad: 0, valor: 0, porcentaje: 0 }
    const qty = p.cantidad || 1
    lineas[linea].cantidad += qty
    lineas[linea].valor += p.valorVenta
    totalCajas += qty
  })

  const totalValor = Object.values(lineas).reduce((s, l) => s + l.valor, 0)
  Object.values(lineas).forEach(l => {
    l.porcentaje = totalValor > 0 ? (l.valor / totalValor) * 100 : 0
  })

  const lineasData = Object.entries(lineas)
    .map(([nombre, datos]) => ({ nombre, ...datos }))
    .sort((a, b) => b.valor - a.valor)

  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))]
  const totalIGV = totales.subtotal * 0.18
  const totalConIGV = totales.subtotal + totalIGV

  return `
    <div class="dist-container">
      <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
      <div class="header">
        <div>
          <h1>📊 ${cliente || 'CLIENTE'}</h1>
          <div class="header-meta">
            <span>Documento: ${documento || '---'}</span>
            <span>Pedido: ${numeroPedido || 'CC000000'}</span>
            <span>Fecha: ${fecha}</span>
          </div>
        </div>
        <span class="badge">Distribución</span>
      </div>
      
      <div class="section">
        <div class="section-title">💰 Totales del Pedido</div>
        <div class="totals-row">
          <div class="total-card">
            <h4>Subtotal</h4>
            <div class="value">S/ ${totales.subtotal.toLocaleString('es-PE', {minimumFractionDigits: 2})}</div>
          </div>
          <div class="total-card main">
            <h4>Total + IGV (18%)</h4>
            <div class="value">S/ ${totalConIGV.toLocaleString('es-PE', {minimumFractionDigits: 2})}</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">📈 Resumen</div>
        <div class="kpis">
          <div class="kpi-card">
            <div class="kpi-label">💰 Ventas Totales</div>
            <div class="kpi-value">S/ ${totales.subtotal.toLocaleString('es-PE', {minimumFractionDigits: 2})}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">📦 Cajas Totales</div>
            <div class="kpi-value">${totalCajas}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">📊 Líneas</div>
            <div class="kpi-value">${lineasData.length}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">📂 Categorías</div>
            <div class="kpi-value">${categorias.length}</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">📊 Distribución por Línea</div>
        <div class="butterfly-chart">
          <div class="butterfly-header">
            <div class="butterfly-col-left">Monto</div>
            <div class="butterfly-col-center">Línea</div>
            <div class="butterfly-col-right">Cantidad</div>
          </div>
          ${lineasData.map((l, idx) => {
            const color = ['#00d084', '#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'][idx % 10]
            return `
              <div class="butterfly-row">
                <div class="butterfly-left">
                  <div class="butterfly-monto">S/ ${l.valor.toLocaleString('es-PE', {minimumFractionDigits: 2})}</div>
                  <div class="butterfly-pct">${l.porcentaje.toFixed(1)}%</div>
                </div>
                <div class="butterfly-center">
                  <span class="butterfly-name" style="background: ${color}">${l.nombre}</span>
                </div>
                <div class="butterfly-right">
                  <div class="butterfly-cajas">${l.cantidad}</div>
                  <div class="butterfly-peso">unds</div>
                </div>
              </div>
            `
          }).join('')}
          <div class="butterfly-total">
            <div class="butterfly-total-left">
              <div class="total-value">S/ ${totales.subtotal.toLocaleString('es-PE', {minimumFractionDigits: 2})}</div>
              <div class="total-label">Total</div>
            </div>
            <div class="butterfly-total-center">
              <span class="total-badge">${lineasData.length} líneas</span>
            </div>
            <div class="butterfly-total-right">
              <div class="total-value">${totalCajas}</div>
              <div class="total-label">Total unds</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        Generado por G360 - Sistema de Gestión de Pedidos
      </div>
    </div>
  `
}