/**
 * =============================================================================
 * G360-ORDER-XLSX - Aplicación Principal
 * =============================================================================
 * 
 * Descripción: Conversor de archivos RPE a formato de pedido para CIPSA
 * Skill: client (desktop)
 * Cliente: CIPSA
 * Versión: 1.0.0
 * 
 * @author Carlos Cusi (CCUSI)
 * @created 2026-03-14
 * @modified 2026-04-26
 * 
 * ✅ Migrado a SolidJS - Logica 100% IDENTICA al original React
 * =============================================================================
 */

import { createSignal, createEffect, createMemo, onCleanup } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { G360_ENGINE } from './core/g360-engine.ts'
import { usePedido } from './hooks/usePedido'
import { Navbar } from './components/Header/Navbar'
import { ClientInfo } from './components/Header/ClientInfo'
import { SubtotalCard, TotalIGVCard, AvailableTotalCard } from './components/TotalsPanel'
import { ProductTable } from './components/ProductTable'
import { DistributionPage } from './components/DistributionPage'
import { Footer } from './components/Footer'
import { G360Signature } from './components/G360Signature'
import { generarXLSX } from './utils/xlsxGenerator'
// import { generarCartaWord } from './utils/docGenerator' // Archivo no disponible actualmente
import './styles/main.css'

/**
 * Paleta de colores para gráfico de pastel
 * Colores vibrantes para visualizar distribución por línea de productos
 */
const CHART_COLORS = [
  '#00d084', '#f43f5e', '#8b5cf6', '#f59e0b', '#06b6d4',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#eab308', '#06b6d4', '#a855f7', '#ef4444', '#22c55e',
  '#3b82f6', '#d946ef', '#14b8a6', '#f97316', '#a3e635'
]

/**
 * Componente principal de la aplicación
 * Maneja el estado global y renderiza los componentes hijos
 */
function App() {
  const [darkTheme, setDarkTheme] = createSignal(true)
  const [soloConStock, setSoloConStock] = createSignal(false)
  const [successPulse, setSuccessPulse] = createSignal(false)
  const navigate = useNavigate()

  // Sincronizar título de pestaña con el estándar G360
  createEffect(() => {
    const appName = G360_ENGINE.branding.appTitle || 'G360 App';
    const client = G360_ENGINE.branding.clientName || 'G360';
    document.title = `${appName} - ${client}`;
  });

  const pedido = usePedido()

  const toggleTheme = () => setDarkTheme(!darkTheme())

  const [showAlertPendiente, setShowAlertPendiente] = createSignal(false)
  const [nuevosProductos, setNuevosProductos] = createSignal(null)

  const handleNuevaCarga = (texto) => {
    if (pedido.tareaPendiente && pedido.productos.length > 0) {
      setNuevosProductos(texto)
      setShowAlertPendiente(true)
    } else {
      pedido.actualizarProductosDesdeTexto(texto)
    }
  }

  const confirmarNuevoPedido = () => {
    pedido.setTareaPendiente(false)
    setShowAlertPendiente(false)
    pedido.actualizarProductosDesdeTexto(nuevosProductos())
    setNuevosProductos(null)
  }

  const descartarPendiente = () => {
    setShowAlertPendiente(false)
    setNuevosProductos(null)
  }

  // Efecto visual cuando se cargan productos
  createEffect(() => {
    if (pedido.productos.length > 0) {
      setSuccessPulse(true)
      const timer = setTimeout(() => setSuccessPulse(false), 1000)
      onCleanup(() => clearTimeout(timer))
    }
  })

  const productosFiltrados = createMemo(() => 
    soloConStock() 
      ? pedido.productos.filter(p => p.estadoStock !== 'Agotado')
      : pedido.productos
  )

  // Calcular monto y porcentaje por linea
  const datosLinea = createMemo(() => {
    const totalVentaNeto = pedido.totales.subtotal
    return Object.entries(
      productosFiltrados().reduce((acc, p) => {
        acc[p.linea] = (acc[p.linea] || 0) + p.valorVenta
        return acc
      }, {})
    ).map(([linea, monto], index) => ({
      linea,
      monto,
      porcentaje: totalVentaNeto > 0 ? (monto / totalVentaNeto) * 100 : 0,
      color: CHART_COLORS[index % CHART_COLORS.length]
    })).sort((a, b) => b.monto - a.monto)
  })

  // Generar segmentos del pastel SVG
  const generarPastelSVG = (datos) => {
    const radius = 90
    const cx = 110
    const cy = 110
    let startAngle = -90
    
    return datos.map((d) => {
      const angle = (d.porcentaje / 100) * 360
      const endAngle = startAngle + angle
      
      const x1 = cx + radius * Math.cos(startAngle * Math.PI / 180)
      const y1 = cy + radius * Math.sin(startAngle * Math.PI / 180)
      const x2 = cx + radius * Math.cos(endAngle * Math.PI / 180)
      const y2 = cy + radius * Math.sin(endAngle * Math.PI / 180)
      
      const largeArc = angle > 180 ? 1 : 0
      
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
      startAngle = endAngle
      
      return { path, color: d.color, ...d }
    })
  }

  const segmentos = createMemo(() => generarPastelSVG(datosLinea()))

  // Modal para exportar
  const [showChartModal, setShowChartModal] = createSignal(false)
  const [exportModalPos, setExportModalPos] = createSignal({ x: window.innerWidth - 450, y: 100 })
  const [isDragging, setIsDragging] = createSignal(false)
  const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 })

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - exportModalPos().x,
      y: e.clientY - exportModalPos().y
    })
    e.preventDefault()
  }

  const handleMouseMove = (e) => {
    if (!isDragging()) return
    setExportModalPos({
      x: e.clientX - dragStart().x,
      y: e.clientY - dragStart().y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Attach global mouse events
  createEffect(() => {
    if (isDragging()) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      onCleanup(() => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      })
    }
  })

  const handleTouchStart = (e) => {
    setIsDragging(true)
    const touch = e.touches[0]
    setDragStart({
      x: touch.clientX - exportModalPos().x,
      y: touch.clientY - exportModalPos().y
    })
  }

  const handleTouchMove = (e) => {
    if (!isDragging()) return
    const touch = e.touches[0]
    setExportModalPos({
      x: touch.clientX - dragStart().x,
      y: touch.clientY - dragStart().y
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const toggleChartModal = () => {
    setShowChartModal(!showChartModal())
  }

  const handleExport = async (tipo) => {
    if (tipo === 'carta') {
      // Función exportar Word pendiente de implementar
      alert('📄 Exportación a Word estará disponible próximamente')
    } else {
      await generarXLSX({
        cliente: pedido.cliente, 
        documento: pedido.ruc, 
        numeroPedido: pedido.numeroPedido, 
        vendedor: pedido.vendedor, 
        emailVendedor: pedido.emailVendedor, 
        telefonoVendedor: pedido.telefonoVendedor,
        productos: productosFiltrados(), 
        totales: pedido.totales, 
        tipo
      })
    }
  }

  return (
    <div class={`app skill-marca ${darkTheme() ? 'dark-mode' : 'light-mode'}`}>
          <Navbar hayProductos={pedido.productos.length > 0} tareaPendiente={pedido.tareaPendiente} />

          {/* Floating Action Buttons */}
          <div class="floating-buttons">
            <button onClick={toggleTheme} class="floating-btn theme-toggle">
              {darkTheme() ? '☀️' : '🌙'}
            </button>
            <Show when={pedido.productos.length > 0}>
              <div class="flex flex-col gap-2">
                <button onClick={toggleChartModal} class="floating-btn chart-btn">
                  📊
                </button>
                <button 
                  onClick={() => {
                    if (pedido.tareaPendiente) {
                      if (window.confirm('¿Tienes un cálculo de cuotas pendiente?\n\nSí: Limpia y carga datos actuales\nNo: Continúa con cálculo pendiente')) {
                        pedido.setTareaPendiente(false)
                      } else {
                        return
                      }
                    }
                    navigate('/distribucion')
                  }} 
                  class="floating-btn cuotas-btn"
                >
                  📋
                </button>
              </div>
            </Show>
          </div>

          <div class="vertical-layout fade-in-up">
            {/* Datos Generales Horizontal */}
            <section class="general-data-section g360-panel">
              <ClientInfo
                cliente={pedido.cliente} 
                documento={pedido.ruc} 
                numeroPedido={pedido.numeroPedido}
                vendedor={pedido.vendedor} 
                emailVendedor={pedido.emailVendedor} 
                telefonoVendedor={pedido.telefonoVendedor}
                onClienteChange={pedido.setCliente} 
                onDocumentoChange={pedido.setRuc} 
                onNumeroPedidoChange={pedido.setNumeroPedido}
                onVendedorChange={pedido.setVendedor} 
                onEmailVendedorChange={pedido.setEmailVendedor} 
                onTelefonoVendedorChange={pedido.setTelefonoVendedor}
              />
            </section>

            {/* Párrafo Dedicado a Totales */}
            <Show when={pedido.productos.length > 0}>
              <section class="totals-summary-section g360-panel">
                <h3>Totales del Pedido</h3>
                <div class="totals-cards-grid">
                  <div class="total-card subtotal-card">
                    <h4>Subtotal (sin IGV)</h4>
                    <div class="total-value">S/ {pedido.totales?.subtotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                  </div>
                  <div class="total-card igv-card">
                    <h4>IGV (18%)</h4>
                    <div class="total-value">S/ {pedido.totales?.totalIGV.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                  </div>
                  <div class="total-card total-card">
                    <h4>Total Disponible</h4>
                    <div class="total-value">S/ {pedido.totales?.totalDisponible.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                  </div>
                </div>
              </section>
            </Show>

            {/* Input de Texto para RPE */}
            <section class="rpe-input-section g360-panel">
              <div class="flex-header">
                <label for="import-area" class="panel-title">Pegue aquí los datos del RPE (Registro de Pedido Electrónico):</label>
                <div class="stock-toggle">
                  <input
                    type="checkbox"
                    id="filterStock"
                    checked={soloConStock()}
                    onChange={(e) => setSoloConStock(e.target.checked)}
                  />
                  <label for="filterStock">Solo productos disponibles</label>
                </div>
              </div>
              <textarea
                id="import-area"
                class="high-contrast-input rpe-textarea"
                placeholder="Pegue aquí los datos del RPE..."
                onPaste={(e) => handleNuevaCarga(e.clipboardData.getData('text'))}
                rows={1}
              />
            </section>

            {/* Tabla DOM de Resultados RPE */}
            <Show when={productosFiltrados().length > 0}>
              <section class={`product-table-section g360-panel ${successPulse() ? 'success-pulse' : ''}`}>
                <h3>Resultado Procesado del RPE</h3>
                <ProductTable productos={productosFiltrados()} totales={pedido.totales} />
              </section>
            </Show>

            {/* Modal Flotante para Exportar */}
            <Show when={pedido.productos.length > 0}>
              <div
                class="export-modal-floating"
                style={{
                  left: exportModalPos().x,
                  top: exportModalPos().y,
                  cursor: isDragging() ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div class="export-options-compact">
                  <button onClick={() => handleExport('cotizacion')} class="export-option xlsx">
                    📊 XLSX
                  </button>
                  <button onClick={() => handleExport('carta')} class="export-option word">
                    📄 Word
                  </button>
                  <button onClick={() => pedido.resetearPedido()} class="export-option clear">
                    🗑️ Clear
                  </button>
                </div>
              </div>
            </Show>

            {/* Modal Flotante para Gráfico Pie */}
            <Show when={showChartModal()}>
              <div class="chart-modal-overlay">
                <div class="chart-modal">
                  <div class="chart-modal-header">
                    <h3>Participación por Línea</h3>
                    <button onClick={toggleChartModal} class="close-btn">×</button>
                  </div>
                  <div class="chart-modal-content">
                    <div class="analytics-preview">
                      <div class="chart-container chart-container-large">
                        <div class="pie-chart-wrapper">
                          <svg viewBox="0 0 220 220" class="pie-chart">
                            <defs>
                              <filter id="chartGlowModal" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                <feMerge>
                                  <feMergeNode in="coloredBlur"/>
                                  <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                              </filter>
                            </defs>
                          <For each={segmentos()}>
                            {(seg) => (
                              <path
                                d={seg.path}
                                fill={seg.color}
                                stroke="var(--g360-bg)"
                                strokeWidth="3"
                                class="pie-segment"
                                style={{ filter: 'url(#chartGlowModal)', transform: 'scale(1)', transformOrigin: '110px 110px' }}
                              />
                            )}
                          </For>
                            <circle cx="110" cy="110" r="45" fill="var(--g360-bg)" />
                            <text x="110" y="105" textAnchor="middle" class="pie-center-text">
                              {datosLinea().length}
                            </text>
                            <text x="110" y="125" textAnchor="middle" class="pie-center-label">
                              Líneas
                            </text>
                          </svg>
                        </div>

                        <div class="pie-legend legend-large">
                          <For each={datosLinea()}>
                            {(d) => (
                              <div class="legend-item">
                                <span class="legend-color" style={{ "background-color": d.color, "box-shadow": `0 0 8px ${d.color}` }}></span>
                                <span class="legend-label">{d.linea}</span>
                                <span class="legend-value">S/ {d.monto.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                                <span class="legend-percent">{d.porcentaje.toFixed(1)}%</span>
                              </div>
                            )}
                          </For>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Show>

          </div>

          <Show when={showAlertPendiente()}>
            <div class="modal-overlay">
              <div class="alert-modal">
                <div class="alert-icon">⚠️</div>
                <h3>¿Tienes un cálculo pendiente?</h3>
                <p>Ya tienes un pedido con distribución de cuotas. ¿Qué deseas hacer?</p>
                <div class="alert-buttons">
                  <button onClick={confirmarNuevoPedido} class="btn-alert btn-danger">
                    🗑️ Eliminar y calcular nuevo
                  </button>
                  <button onClick={descartarPendiente} class="btn-alert btn-secondary">
                    Mantener actual
                  </button>
                </div>
              </div>
            </div>
          </Show>
          <Footer />
          <G360Signature cliente="CIPSA" showVersion={true} version="1.0.0" />
    </div>
  )
}

export default App
