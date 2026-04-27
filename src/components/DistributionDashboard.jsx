import { createSignal, createMemo, For, Show, createMemo as useMemo } from 'solid-js'
import { formatNumero } from '../utils/formatters'
import { G360Signature } from './G360Signature'
import { PaymentSplit } from './PaymentSplit'
import { productosCatalogoMap } from '../hooks/usePedido'

const CHART_COLORS = [
  '#00d084', '#f43f5e', '#8b5cf6', '#f59e0b', '#06b6d4',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#eab308', '#06b6d4', '#a855f7', '#ef4444', '#22c55e',
  '#3b82f6', '#d946ef', '#14b8a6', '#f97316', '#a3e635'
]

const generarPastelSVG = (datos) => {
  const radius = 80
  const cx = 110
  const cy = 110
  let startAngle = -90

  return datos.map((d) => {
    const endAngle = startAngle + (d.porcentaje / 100) * 360
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = cx + radius * Math.cos(startRad)
    const y1 = cy + radius * Math.sin(startRad)
    const x2 = cx + radius * Math.cos(endRad)
    const y2 = cy + radius * Math.sin(endRad)

    const largeArc = (d.porcentaje / 100) > 0.5 ? 1 : 0
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

    startAngle = endAngle
    return { path, color: d.color }
  })
}

const IVA = 1.18

export const DistributionDashboard = (props) => {
  const cliente = () => props.cliente || ''
  const ruc = () => props.documento || ''
  const numeroPedido = () => props.numeroPedido || ''
  const vendedor = () => props.vendedor || ''
  const emailVendedor = () => props.emailVendedor || ''
  const telefonoVendedor = () => props.telefonoVendedor || ''
  const productos = () => props.productos || []
  const totales = () => props.totales || { subtotal: 0, igv: 0, total: 0, totalIGV: 0, totalDisponible: 0 }
  const onClose = () => props.onClose
  const onCuotasChange = (e) => props.onCuotasChange?.(e)

  // Enhanced back handler: closes modal first, then browser back if needed
  const handleBack = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // If modal is open, close it first
    if (onClose) {
      onClose()
    } else {
      // Fallback: browser back navigation
      if (window.history.length > 1) {
        window.history.back()
      } else {
        // If no history, redirect to root (assuming single-page app)
        window.location.href = '/'
      }
    }
  }

  const productosCalculados = createMemo(() => {
    return productos().map(p => {
      const infoCatalogo = productosCatalogoMap.get(p.codigo) || {}
      const linea = infoCatalogo.linea || p.linea || p.descripcion?.split(' ')[0] || 'SIN LÍNEA'
      
      const subtotal = p.cantidad * p.precioUnitario
      const valorVenta = subtotal * (1 - (p.descuento1 || 0) / 100) * (1 - (p.descuento2 || 0) / 100)
      const stock = p.estadoStock || 'OK'
      const estadoStock = stock === 'OK' ? 'OK' : stock === 'AJ' ? 'AJ' : 'Agotado'
      
      const unBx = infoCatalogo.unBx || p.unBx || 1
      const pesoKg = infoCatalogo.pesoKg || p.pesoKg || 0
      
      return {
        ...p,
        ...infoCatalogo,
        linea,
        valorVenta,
        precioVenta: valorVenta * IVA,
        estadoStock,
        unBx,
        pesoKg
      }
    })
  })

  const datosOriginales = createMemo(() => {
    if (productosCalculados().length === 0) {
      return {
        subtotal: 0,
        totales: { subtotal: 0, totalIGV: 0, totalDisponible: 0 },
        datosLinea: [],
        datosCategoria: [],
        totalGeneral: { cajas: 0, peso: 0 }
      }
    }

    const prods = productosCalculados()
    const subtotal = prods.reduce((sum, p) => sum + p.valorVenta, 0)
    const totales = {
      subtotal,
      totalIGV: subtotal * IVA,
      totalDisponible: prods.filter(p => p.estadoStock !== 'Agotado').reduce((sum, p) => sum + p.precioVenta, 0)
    }

    const datosLinea = Object.entries(
      prods.reduce((acc, p) => {
        const linea = p.linea || 'SIN LÍNEA'
        if (!acc[linea]) {
          acc[linea] = { monto: 0, cajas: 0, peso: 0 }
        }
        acc[linea].monto += p.valorVenta
        acc[linea].cajas += Math.ceil(p.cantidad / (p.unBx || 1))
        acc[linea].peso += (p.pesoKg || 0) * p.cantidad
        return acc
      }, {})
    ).map(([linea, data], index) => ({
      linea,
      monto: data.monto,
      cajas: data.cajas,
      peso: data.peso,
      porcentaje: subtotal > 0 ? (data.monto / subtotal) * 100 : 0,
      color: CHART_COLORS[index % CHART_COLORS.length]
    })).sort((a, b) => b.monto - a.monto)

    const totalCajas = datosLinea.reduce((sum, d) => sum + d.cajas, 0)
    const totalPeso = datosLinea.reduce((sum, d) => sum + d.peso, 0)

    const datosCategoria = Object.entries(
      prods.reduce((acc, p) => {
        const prodCatalogo = productosCatalogoMap.get(p.codigo)
        const categoria = prodCatalogo?.categoria || 'SIN CATEGORÍA'
        if (!acc[categoria]) {
          acc[categoria] = { monto: 0, lineas: {}, cajas: 0, peso: 0 }
        }
        acc[categoria].monto += p.valorVenta
        acc[categoria].cajas += Math.ceil(p.cantidad / (p.unBx || 1))
        acc[categoria].peso += (p.pesoKg || 0) * p.cantidad
        if (!acc[categoria].lineas[p.linea]) {
          acc[categoria].lineas[p.linea] = { monto: 0, cajas: 0, peso: 0 }
        }
        acc[categoria].lineas[p.linea].monto += p.valorVenta
        acc[categoria].lineas[p.linea].cajas += Math.ceil(p.cantidad / (p.unBx || 1))
        acc[categoria].lineas[p.linea].peso += (p.pesoKg || 0) * p.cantidad
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
      cajas: totalCajas,
      peso: totalPeso
    }

    return { subtotal, totales, datosLinea, datosCategoria, totalGeneral }
  })

  const formatSoles = (n) => 'S/ ' + formatNumero(n || 0)
  const now = new Date()

  const datosLinea = () => datosOriginales().datosLinea
  const subtotal = () => datosOriginales().subtotal
  const totalesOriginales = () => datosOriginales().totales
  const totalGeneral = () => datosOriginales().totalGeneral
  const datosCategoria = () => datosOriginales().datosCategoria

  return (
    <div class="distribution-page">
      <div class="distribution-header">
        <button onClick={handleBack} className="back-btn" aria-label="Volver a la página principal">← Volver</button>
        <h1>📊 Dashboard de Distribución</h1>
        <div style={{display: 'flex', gap: '8px'}}>
          <button onClick={onClose} class="btn-primary">✓ Finalizar</button>
        </div>
      </div>

      <div class="distribution-content">
        {/* Datos del Cliente */}
        <div class="preview-client-section">
          <h3>📋 Datos del Cliente</h3>
          <div class="client-info-grid">
            <div class="info-item">
              <label>Cliente:</label>
              <span>{cliente() || 'No especificado'}</span>
            </div>
            <div class="info-item">
              <label>RUC/DNI:</label>
              <span>{ruc() || 'No especificado'}</span>
            </div>
            <div class="info-item">
              <label>N° Pedido:</label>
              <span>{numeroPedido() || 'No especificado'}</span>
            </div>
            <div class="info-item">
              <label>Vendedor:</label>
              <span>{vendedor() || 'No especificado'}</span>
            </div>
            <Show when={emailVendedor()}>
              <div class="info-item">
                <label>Email:</label>
                <span>{emailVendedor()}</span>
              </div>
            </Show>
            <Show when={telefonoVendedor()}>
              <div class="info-item">
                <label>Teléfono:</label>
                <span>{telefonoVendedor()}</span>
              </div>
            </Show>
          </div>
        </div>

        {/* Totales del Pedido */}
        <div class="preview-totals-section">
          <h3>💰 Totales del Pedido</h3>
          <div class="totals-cards-preview">
            <div class="total-card">
              <div class="total-label">Subtotal</div>
              <div class="total-value">S/ {formatNumero(totalesOriginales().subtotal)}</div>
            </div>
            <div class="total-card main">
              <div class="total-label">Total + IGV (18%)</div>
              <div class="total-value">S/ {formatNumero(totalesOriginales().totalIGV)}</div>
            </div>
            <div class="total-card">
              <div class="total-label">Total Disponible</div>
              <div class="total-value">S/ {formatNumero(totalesOriginales().totalDisponible)}</div>
            </div>
          </div>
        </div>

        {/* PaymentSplit */}
        <Show when={totalesOriginales().totalIGV > 0}>
          <PaymentSplit totalAmount={totalesOriginales().totalIGV} onChange={onCuotasChange} />
        </Show>

        {/* Análisis por Línea */}
        <div class="preview-analytics-section">
          <h3>📈 Análisis por Línea de Productos</h3>
          
          {/* KPIs */}
          <div class="kpis">
            <div class="kpi-card">
              <div class="kpi-label">💰 Ventas Totales</div>
              <div class="kpi-value">S/ {formatNumero(subtotal())}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">📦 Cajas Totales</div>
              <div class="kpi-value">{totalGeneral().cajas}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">⚖️ Peso Total</div>
              <div class="kpi-value">{totalGeneral().peso.toFixed(0)} kg</div>
            </div>
            <div class="kpi-card gradient-1">
              <div class="kpi-label">💳 Total + IGV</div>
              <div class="kpi-value">S/ {formatNumero(totalesOriginales().totalIGV)}</div>
            </div>
            <div class="kpi-card gradient-2">
              <div class="kpi-label">✅ Total Disponible</div>
              <div class="kpi-value">S/ {formatNumero(totalesOriginales().totalDisponible)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">📊 Líneas</div>
              <div class="kpi-value">{datosLinea().length}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">📂 Categorías</div>
              <div class="kpi-value">{datosCategoria().length}</div>
            </div>
          </div>

          

          {/* Butterfly Chart */}
          <Show when={datosLinea().length > 0}>
            <div class="butterfly-chart">
              <div class="butterfly-header">
                <span class="butterfly-col-left">💰 VALOR (S/)</span>
                <span class="butterfly-col-center">LÍNEA</span>
                <span class="butterfly-col-right">📦 VOLUMEN (BX - KG)</span>
              </div>
              
              <For each={datosLinea()}>
                {(d) => {
                  const maxMonto = Math.max(...datosLinea().map(x => x.monto), 1)
                  const maxCajas = Math.max(...datosLinea().map(x => x.cajas), 1)
                  const montoBarWidth = (d.monto / maxMonto) * 180
                  const cajasBarWidth = (d.cajas / maxCajas) * 180
                  
                  return (
                    <div class="butterfly-row">
                      <div class="butterfly-left">
                        <span class="butterfly-monto">S/ {formatNumero(d.monto)}</span>
                        <span class="butterfly-pct">({d.porcentaje.toFixed(2)}%)</span>
                        <div class="butterfly-bar-left" style={{width: `${montoBarWidth}px`, background: d.color}}></div>
                      </div>
                      <div class="butterfly-center">
                        <span class="butterfly-name" style={{background: d.color}}>{d.linea}</span>
                      </div>
                      <div class="butterfly-right">
                        <div class="butterfly-bar-right" style={{width: `${cajasBarWidth}px`, background: d.color}}></div>
                        <span class="butterfly-cajas">{d.cajas} BX</span>
                        <span class="butterfly-peso">{d.peso.toFixed(1)} kg ({((d.cajas / totalGeneral().cajas) * 100).toFixed(2)}%)</span>
                      </div>
                    </div>
                  )
                }}
              </For>

              <div class="butterfly-total">
                <div class="butterfly-total-left">
                  <span class="total-value">S/ {formatNumero(subtotal())}</span>
                  <span class="total-label">Total S/ (100%)</span>
                </div>
                <div class="butterfly-total-center">
                  <span class="total-badge">TOTAL</span>
                </div>
                <div class="butterfly-total-right">
                  <span class="total-value">{totalGeneral().cajas} BX / {totalGeneral().peso.toFixed(1)} kg</span>
                  <span class="total-label">Total Volumen (100%)</span>
                </div>
              </div>
            </div>
          </Show>

          {/* Categorías */}
          <Show when={datosCategoria().length > 0}>
            <div class="categories-compact">
              <span class="cat-label">📂 CATEGORÍAS:</span>
              <For each={datosCategoria()}>
                {(cat, idx) => {
                  const color = CHART_COLORS[idx() % CHART_COLORS.length]
                  return (
                    <span class="cat-badge" style={{background: `${color}15`, border: `1px solid ${color}40`}}>
                      <span class="cat-dot" style={{background: color}}></span>
                      <span class="cat-name">{cat.categoria}</span>
                      <span class="cat-pct" style={{color}}>{cat.porcentaje.toFixed(2)}%</span>
                      <span class="cat-separator">•</span>
                      <span class="cat-monto">S/ {formatNumero(cat.monto)}</span>
                      <span class="cat-separator">•</span>
                      <span class="cat-bx">{cat.cajas} BX</span>
                    </span>
                  )
                }}
              </For>
              <span class="cat-total-badge">
                TOTAL: S/ {formatNumero(subtotal())} | {totalGeneral().cajas} BX | {totalGeneral().peso.toFixed(1)} kg
              </span>
            </div>
          </Show>
        </div>

        {/* Tabla de Productos */}
        <Show when={productosCalculados().length > 0}>
          <div className="dist-table-section">
            <h3 className="dist-table-title">📦 Detalle de Productos ({productosCalculados().length})</h3>
            <div className="dist-table-wrapper">
              <table className="dist-product-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>SKU</th>
                    <th>Descripción</th>
                    <th className="text-right">Cant.</th>
                    <th>U/M</th>
                    <th className="text-right">P. Lista</th>
                    <th className="text-center">Dto 1</th>
                    <th className="text-center">Dto 2</th>
                    <th className="text-right">P. Unit.</th>
                    <th className="text-right">Total</th>
                    <th className="text-center">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={productosCalculados()}>
                    {(p, i) => (
                      <tr className="dist-product-row">
                        <td className="row-num">{i() + 1}</td>
                        <td className="row-sku">{p.sku || '-'}</td>
                        <td className="row-desc" title={p.descripcion || ''}>
                          {p.descripcion ? (p.descripcion.length > 40 ? p.descripcion.substring(0, 40) + '...' : p.descripcion) : '-'}
                        </td>
                        <td className="text-right row-cant">{p.cantidad}</td>
                        <td className="row-um">{p.unidad || 'UND'}</td>
                        <td className="text-right">{(p.precioUnitario || 0).toFixed(2)}</td>
                        <td className="text-center row-d1">{(p.descuento1 || 0).toFixed(0)}%</td>
                        <td className="text-center row-d2">{(p.descuento2 || 0).toFixed(0)}%</td>
                        <td className="text-right row-neto">{((p.valorVenta / p.cantidad) || 0).toFixed(2)}</td>
                        <td className="text-right row-total">{formatNumero(p.valorVenta)}</td>
                        <td className="text-center">
                          <span className={`stock-badge stock-${p.estadoStock === 'OK' ? 'ok' : p.estadoStock === 'AJ' ? 'aj' : 'agotado'}`}>
                            {p.estadoStock === 'OK' ? '✓' : p.estadoStock === 'AJ' ? '!' : '✗'}
                          </span>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
                <tfoot>
                  <tr className="dist-table-footer">
                    <td colspan="3">TOTAL ({productosCalculados().length} items)</td>
                    <td className="text-right">{productosCalculados().reduce((s, p) => s + p.cantidad, 0)}</td>
                    <td></td><td></td><td></td><td></td><td></td>
                    <td className="text-right">S/ {formatNumero(subtotal())}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </Show>

        {/* G360 Signature */}
        <G360Signature cliente={cliente()} />
      </div>
    </div>
  )
}

export default DistributionDashboard