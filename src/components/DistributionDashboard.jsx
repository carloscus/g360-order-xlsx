import { createSignal, createMemo, For, Show } from 'solid-js'
import { formatNumero } from '../utils/formatters'
import { G360Signature } from './G360Signature'
import { PaymentSplit } from './PaymentSplit'
import { useCatalogo } from '../hooks/useCatalogo'
import { getAgentesSkill } from '../core/g360-skill-agentes'
import { CHART_COLORS, IVA } from '../constants/sharedConstants'

export const DistributionDashboard = (props) => {
  const cliente = () => props.cliente || ''
  const ruc = () => props.documento || ''
  const numeroPedido = () => props.numeroPedido || ''
  const vendedor = () => props.vendedor || ''
  const emailVendedor = () => props.emailVendedor || ''
  const telefonoVendedor = () => props.telefonoVendedor || ''
  const productos = () => props.productos || []
  const totales = () => props.totales || { subtotal: 0, igv: 0, total: 0, totalIGV: 0, totalDisponible: 0 }

  const { buscarProducto } = useCatalogo()
  const { calculos } = getAgentesSkill()
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
      const infoCatalogo = buscarProducto(p.codigo) || {}
      const linea = infoCatalogo.linea || p.linea || p.descripcion?.split(' ')[0] || 'SIN LÍNEA'
      
      const valorVenta = calculos.basic.valorVenta(p.cantidad, p.precioUnitario, p.descuento1, p.descuento2)
      const precioVenta = calculos.basic.precioVenta(valorVenta)
      const estadoStock = calculos.stock.estado(p.stock, p.cantidad)
      
      const unBx = infoCatalogo.unBx || p.unBx || 1 // unBx del catálogo o del producto, fallback 1
      const pesoKg = infoCatalogo.pesoKg || p.pesoKg || 0 // pesoKg del catálogo o del producto, fallback 0
      const cajas = calculos.logistica.cajas(p.cantidad, unBx)
      const pesoTotal = calculos.logistica.pesoTotal(p.cantidad, pesoKg)
      
      return {
        ...p,
        ...infoCatalogo,
        linea,
        valorVenta,
        precioVenta,
        estadoStock,
        unBx,
        pesoKg,
        cajas,
        pesoTotal,
      }
    })
  })

  const datosOriginales = createMemo(() => {
    if (productosCalculados().length === 0) {
      return {
        subtotal: 0, // Este subtotal es el valorVenta total
        totales: { subtotal: 0, igv: 0, totalIGV: 0, totalDisponible: 0, productosTotal: 0, productosDisponibles: 0, productosAgotados: 0 },
        datosLinea: [],
        datosCategoria: [],
        totalGeneral: { cajas: 0, peso: 0 }
      }
    }

    const prods = productosCalculados() // Productos ya enriquecidos y calculados

    // Calcular totales generales del pedido
    const totalesPedido = calculos.pedido.totales(prods)

    // Calcular distribución por línea
    const distribucionLineas = calculos.pedido.distribucion(prods)
    const datosLinea = distribucionLineas.map((d, index) => ({
      ...d,
      color: CHART_COLORS[index % CHART_COLORS.length] // Asignar color
    }))

    // Calcular métricas por categoría (requiere adaptar o crear una función en agentesSkill)
    // Por ahora, se mantiene una lógica similar a la original, pero usando los productos ya calculados
    const datosCategoria = Object.values(prods.reduce((acc, p) => {
      const categoria = p.categoria || 'SIN CATEGORÍA'
      if (!acc[categoria]) {
        acc[categoria] = { categoria, monto: 0, cajas: 0, peso: 0 }
      }
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

  const formatSoles = (n) => 'S/ ' + formatNumero(n || 0)
  const now = new Date()

  const datosLinea = () => datosOriginales().datosLinea
  const subtotal = () => datosOriginales().subtotal
  const totalesPedido = () => datosOriginales().totales // Renombrado para mayor claridad
  const totalGeneral = () => datosOriginales().totalGeneral
  const datosCategoria = () => datosOriginales().datosCategoria

  // UX: Memorizar máximos para el gráfico de barras fuera del bucle For
  const maxMonto = createMemo(() => 
    Math.max(...datosLinea().map(x => x.monto || 0), 1)
  )
  const maxCajas = createMemo(() => 
    Math.max(...datosLinea().map(x => x.cajas || 0), 1)
  )

  return (
    <div class="distribution-page">
      <div class="distribution-header">
        <button onClick={handleBack} className="back-btn" aria-label="Volver a la página principal">← Volver</button>
        <h1>📊 Reporte Operativo de Distribución</h1>
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
          <h3>📊 Análisis Consolidado de Valorización</h3>
          <div class="totals-cards-preview g360-totals-cards">
            <div class="total-card">
              <div class="total-label">Valor Neto</div>
              <div class="total-value">S/ {formatNumero(totalesPedido().subtotal)}</div>
            </div>
            <div class="total-card main">
              <div class="total-label">Total + IGV (18%)</div>
              <div class="total-value">S/ {formatNumero(totalesPedido().totalIGV)}</div>
            </div>
            <div class="total-card">
              <div class="total-label">Total Atendible (Con Stock)</div>
              <div class="total-value">S/ {formatNumero(totalesPedido().totalDisponible)}</div>
            </div> 
          </div>
        </div>

        {/* PaymentSplit */}
        <Show when={totalesPedido().totalIGV > 0}>
          <PaymentSplit totalAmount={totalesPedido().totalIGV} onChange={onCuotasChange} />
        </Show>

        {/* Análisis por Línea */}
        <div class="preview-analytics-section">
          <h3>📈 Métricas Operativas por Línea</h3>
          
          {/* KPIs */}
          <div class="kpis">
            <div class="kpi-card">
              <div class="kpi-label">💰 Valor Neto Total</div>
              <div class="kpi-value">S/ {formatNumero(subtotal())}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">📦 Cajas Totales</div>
              <div class="kpi-value">{totalGeneral().cajas}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">⚖️ Masa Total Logística</div>
              <div class="kpi-value">{(totalGeneral().peso || 0).toFixed(1)} kg</div>
            </div>
            <div class="kpi-card gradient-1">
              <div class="kpi-label">💳 Total + IGV</div>
              <div class="kpi-value">S/ {formatNumero(totalesPedido().totalIGV)}</div>
            </div>
            <div class="kpi-card gradient-2">
              <div class="kpi-label">✅ Total Disponible</div>
              <div class="kpi-value">S/ {formatNumero(totalesPedido().totalDisponible)}</div>
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
                <span class="butterfly-col-left">💰 VALOR NETO (S/)</span>
                <span class="butterfly-col-center">LÍNEA OPERATIVA</span>
                <span class="butterfly-col-right">📦 VOLUMEN (BX - KG)</span>
              </div>
              
              <For each={datosLinea()}>
                {(d) => {
                  const montoBarWidth = (d.monto / maxMonto()) * 180
                  const cajasBarWidth = (d.cajas / maxCajas()) * 180
                  
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
            <h3 className="dist-table-title">📦 Auditoría Operativa y Partidas del Pedido ({productosCalculados().length})</h3>
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
                    <th className="text-center">Dto 1 (%)</th>
                    <th className="text-center">Dto 2 (%)</th>
                    <th className="text-right">P. Neto</th>
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
                        <td className="text-center row-d1">{(p.descuento1 || 0).toFixed(1)}</td>
                        <td className="text-center row-d2">{(p.descuento2 || 0).toFixed(1)}</td>
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