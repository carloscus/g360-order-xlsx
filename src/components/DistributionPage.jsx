import { createSignal, createMemo, createEffect, onMount, For, Show, onCleanup } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { usePedido, loadFromStorage, setTareaPendiente, loadErpTexto } from '../hooks/usePedido'
import { ERPParserService } from '../services/erpParser'
import { ProductTable } from './ProductTable'
import { SubtotalCard, TotalIGVCard, AvailableTotalCard } from './TotalsPanel'
import { PaymentSplit } from './PaymentSplit'
import { useTheme } from '../context/ThemeContext'
import { useCatalogo } from '../hooks/useCatalogo'
import { getAgentesSkill } from '../core/g360-skill-agentes'
import initialData from '../data/initialData.json'
import { CHART_COLORS } from '../constants/sharedConstants'
import { generarXLSX } from '../utils/xlsxGenerator'
import { buildCronogramaHTML } from '../utils/htmlExportBuilder'

import { STORAGE_KEYS } from '../constants/storage'

// Helper para enriquecer y calcular un producto usando los agentes de skill
const procesarProducto = (p, enriquecerProductoFn, calculos) => {
  const enrichedP = enriquecerProductoFn(p)
  const valorVenta = calculos.basic.valorVenta(p.cantidad, p.precioUnitario, p.descuento1, p.descuento2)
  const precioVenta = calculos.basic.precioVenta(valorVenta)
  const cantLogistica = (p.cantidadUnd && p.cantidadUnd > 0) ? p.cantidadUnd : p.cantidad
  const estadoStock = calculos.stock.estado(p.stock, cantLogistica)
  const desglose = calculos.logistica.desglose(cantLogistica, enrichedP.unBx)
  const pesoTotal = calculos.logistica.pesoTotal(cantLogistica, enrichedP.pesoKg || 0)
  return { 
    ...p, 
    ...enrichedP,
    valorVenta,
    precioVenta,
    estadoStock, 
    cajas: desglose.cajas,
    cajasCompletas: desglose.cajasCompletas,
    unidadesSueltas: desglose.unidadesSueltas,
    pesoTotal
  }
}

export const DistributionPage = () => {
  const { darkTheme } = useTheme()
  const pedido = usePedido()
  const { enriquecerProducto } = useCatalogo()
  const { calculos } = getAgentesSkill()
  const navigate = useNavigate()
  const [loading, setLoading] = createSignal(true)
  const cuotasIniciales = (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUOTAS_PERSIST)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })()
  const [cuotas, setCuotas] = createSignal(cuotasIniciales)
  const [filterStock, setFilterStock] = createSignal(false)

  // Sincronizar cuotas cuando cambie el pedido global (ej: al cargar del historial)
  createEffect(() => {
    if (pedido.productos.length >= 0) {
      const saved = localStorage.getItem(STORAGE_KEYS.CUOTAS_PERSIST)
      try { setCuotas(saved ? JSON.parse(saved) : []) } 
      catch { setCuotas([]) }
    }
  })

  // Consolidación de onMount
  onMount(() => {
    setLoading(false)
  })

  onCleanup(() => {
  })

  const getCliente = () => pedido.cliente || ''
  const getRuc = () => pedido.ruc || ''
  const getNumeroPedido = () => pedido.numeroPedido || ''
  const getVendedor = () => pedido.vendedor || ''
  const getEmailVendedor = () => pedido.emailVendedor || ''
  const getTelefonoVendedor = () => pedido.telefonoVendedor || ''
  const getProductos = () => pedido.productos || []

  const handleCuotasChange = (nuevasCuotas) => {
    setCuotas(nuevasCuotas)
    try {
      localStorage.setItem(STORAGE_KEYS.CUOTAS_PERSIST, JSON.stringify(nuevasCuotas))
    } catch { /* localStorage no disponible */ }
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
      return { subtotal: 0, totales: {}, datosLinea: [], datosCategoria: [], totalGeneral: { cajas: 0, unidadesSueltas: 0, peso: 0 } }
    }
    return calculos.pedido.consolidado(prods)
  })

  // Datos filtrados (para UI según filterStock). Se accede directamente en el JSX.
  const datosFiltrados = createMemo(() => {
    const prods = productosCalculados()
    const orig = datosOriginales()
    if (!filterStock() || prods.length === 0) return orig

    const productosFiltrados = prods.filter(p => p.estadoStock !== 'Agotado')
    return calculos.pedido.consolidado(productosFiltrados)
  })

  // Agrupar productos por estadoLinea (NUEVA / TRADICIONAL)
  // Usa la misma fuente que el butterfly (datosFiltrados) para mantener consistencia
  const datosEstadoLinea = createMemo(() => {
    const prods = filterStock() 
      ? productosCalculados().filter(p => p.estadoStock !== 'Agotado')
      : productosCalculados()
    if (!prods.length) return []
    
    const grupos = {}
    let totalValor = 0
    
    prods.forEach(p => {
      if (!p.estadoLinea) return
      const estado = p.estadoLinea
      if (!grupos[estado]) {
        grupos[estado] = { estado, color: p.colorEstadoLinea || '#6b7280', valorTotal: 0, cantidad: 0, cajas: 0, unidadesSueltas: 0, peso: 0 }
      }
      grupos[estado].valorTotal += p.valorVenta || 0
      grupos[estado].cantidad++
      grupos[estado].cajas += p.cajas || 0
      grupos[estado].unidadesSueltas += p.unidadesSueltas || 0
      grupos[estado].peso += p.pesoTotal || 0
      totalValor += p.valorVenta || 0
    })
    
    return Object.values(grupos).map(g => ({
      ...g,
      porcentaje: totalValor > 0 ? (g.valorTotal / totalValor) * 100 : 0
    })).sort((a, b) => b.valorTotal - a.valorTotal)
  })

  const formatSoles = (n) => 'S/ ' + (n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handlePrintA4 = () => {
    const cliente = getCliente()
    const ruc = getRuc()
    const numeroPedido = getNumeroPedido()

    if (!cliente && !ruc && !numeroPedido) {
      alert('Faltan datos del cliente. Complete los datos en la página principal.')
      return
    }

    const productos = getProductos()
    if (!productos || productos.length === 0) {
      alert('No hay productos para generar el cronograma.')
      return
    }

    window.print()
  }

  const handleDownloadHTML = () => { // Removed redundant async
    const cliente = getCliente()
    const ruc = getRuc()
    const numeroPedido = getNumeroPedido()
    const vendedor = getVendedor()
    
    const faltantes = []
    if (!cliente) faltantes.push('Cliente')
    if (!ruc) faltantes.push('Documento (RUC/DNI)')
    if (!numeroPedido) faltantes.push('N° Pedido')
    if (!vendedor) faltantes.push('Vendedor')
    if (faltantes.length) {
      alert(`⚠️ HTML / Distribución requiere:\n• ${faltantes.join('\n• ')}`)
      return
    }

    const productos = getProductos()
    if (!productos || productos.length === 0) {
      alert('No hay productos para generar el cronograma.')
      navigate('/')
      return
    }

    const now = new Date()
    const fechaArchivo = now.toISOString().split('T')[0].replace(/-/g, '')
    const rucLimpio = ruc ? ruc.replace(/\D/g, '') : ''
    const documentoValido = (rucLimpio.length === 8 || rucLimpio.length === 11) ? rucLimpio : 'DOC'
    const pedidoLimpio = numeroPedido 
      ? numeroPedido.replace(/[^a-zA-Z0-9\-_]/g, '').trim().substring(0, 12)
      : 'PEDIDO'
    
    const nombreArchivo = `cronograma_${documentoValido}_${pedidoLimpio}_${fechaArchivo}.html`

    const htmlContent = buildCronogramaHTML({
      cliente, ruc, numeroPedido,
      idCliente: pedido.idCliente,
      sucursal: pedido.sucursal,
      vendedor: getVendedor(),
      emailVendedor: getEmailVendedor(),
      telefonoVendedor: getTelefonoVendedor(),
      cuotas: cuotas(),
      consolidado: datosOriginales(),
      productosCalculados: productosCalculados()
    })

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

  // UX: Memorizar máximos para el gráfico de barras fuera del bucle For
  const maxMonto = createMemo(() => 
    Math.max(...datosFiltrados().datosLinea.map(x => x.monto || 0), 1)
  )
  const maxCajas = createMemo(() => 
    Math.max(...datosFiltrados().datosLinea.map(x => x.cajas || 0), 1)
  )

  return (
    <Show when={!loading()} fallback={<div class="loading">Cargando...</div>}>
      <Show when={pedido.productos.length > 0} 
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
            <h1>📅 PROGRAMACIÓN DE LETRAS</h1>
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
                <SubtotalCard subtotal={datosFiltrados().totales.subtotal} />
                <TotalIGVCard totalIGV={datosFiltrados().totales.totalIGV} />
                <AvailableTotalCard totalDisponible={datosFiltrados().totales.totalDisponible} totalIGV={datosFiltrados().totales.totalIGV} />
              </div>
            </div>

            <PaymentSplit totalAmount={datosFiltrados().totales.totalIGV} onChange={handleCuotasChange} />

            <div class="preview-analytics-section">
              <h2>📊 ANÁLISIS Y SEGMENTACIÓN</h2>
              
              <div class="dist-kpi-grid">
                <div class="dist-kpi-card green">
                  <div class="dist-kpi-label">💰 Valor Neto Est.</div>
                  <div class="dist-kpi-value">{formatSoles(datosFiltrados().subtotal)}</div>
                </div>
<div class="dist-kpi-card blue">
                   <div class="dist-kpi-label">📦 Cajas / UND</div>
                   <div class="dist-kpi-value">{datosFiltrados().totalGeneral.cajas}/{datosFiltrados().totalGeneral.unidadesSueltas} BX</div>
                 </div>
                <div class="dist-kpi-card amber">
                  <div class="dist-kpi-label">⚖️ Masa Logística</div>
                  <div class="dist-kpi-value">{(datosFiltrados().totalGeneral.peso || 0).toFixed(0)} kg</div>
                </div>
                <div class="dist-kpi-card pink">
                  <div class="dist-kpi-label">💳 Total a Financiar</div>
                  <div class="dist-kpi-value">{formatSoles(datosFiltrados().totales.totalIGV)}</div>
                </div>
              </div>
              
              <div style={{ "font-size": 'var(--text-xs)', color: 'var(--g360-info)', "margin-top": '4px', "display": 'flex', "align-items": 'center', gap: '6px' }}>
                <span style={{ "font-size": '1rem' }}>ℹ️</span>
                <span>Peso producto. Para envío real considerar +2% por empaque/caja.</span>
              </div>

              <div class="dist-filter-row">
                <button
                  onClick={() => setFilterStock(!filterStock())}
                  class={`dist-filter-btn${filterStock() ? ' active' : ''}`}
                >
                  {filterStock() ? '✅ Solo con stock' : '📦 Todo el pedido'}
                </button>
                <button
                  onClick={handlePrintA4}
                  class="dist-print-btn"
                >
                  🖨️ Imprimir A4
                </button>
                <Show when={filterStock()}>
                  <span class="dist-filter-hint">
                    ⓘ Solo aplica a estadísticas (KPIs, gráficos). La tabla muestra todo el pedido.
                  </span>
                </Show>
              </div>

              <div class="dist-butterfly-section">
                <div class="dist-butterfly-title">📊 Distribución por Línea</div>
                
                <div>
                  <div class="dist-butterfly-header">
                    <div class="dist-butterfly-header-col left">
                      <span>💰 VALOR (S/)</span>
                    </div>
                    <div class="dist-butterfly-header-col center">
                      <span>LÍNEA</span>
                    </div>
                    <div class="dist-butterfly-header-col right">
                      <span>📦 VOLUMEN (BX - KG)</span>
                    </div>
                  </div>
                  
                  <For each={datosFiltrados().datosLinea}>
                    {(d, idx) => {
                      const barMaxWidth = 200
                      const montoBarWidth = () => (d.monto / maxMonto()) * barMaxWidth
                      const cajasBarWidth = () => (d.cajas / maxCajas()) * barMaxWidth
                      
                      return (
                        <div class={`dist-butterfly-row${idx() % 2 === 0 ? ' even' : ''}`}>
                          <div class="dist-butterfly-left">
                            <div>
                              <div class="dist-butterfly-value">{formatSoles(d.monto)}</div>
                              <div class="dist-butterfly-pct">({d.porcentaje.toFixed(2)}%)</div>
                            </div>
                            <div class="dist-butterfly-bar-left" style={{ width: `${montoBarWidth()}px`, background: `linear-gradient(90deg, transparent, ${CHART_COLORS[idx() % CHART_COLORS.length]})` }}></div>
                          </div>
                          
                          <div class="dist-butterfly-center">
                            <div class="dist-butterfly-name" style={{ background: CHART_COLORS[idx() % CHART_COLORS.length] }}>
                              {d.linea}
                            </div>
                          </div>
                          
                          <div class="dist-butterfly-right">
                            <div class="dist-butterfly-bar-right" style={{ width: `${cajasBarWidth()}px`, background: `linear-gradient(90deg, ${CHART_COLORS[idx() % CHART_COLORS.length]}, transparent)` }}></div>
                            <div>
                              <div class="dist-butterfly-cajas">
                                <span style={{ color: 'var(--g360-accent)', "font-weight": 'bold' }}>{d.cajasCompletas}</span>
                                <span style={{ opacity: 0.4 }}>/</span>
                                <span style={{ color: d.unidadesSueltas > 0 ? '#f59e0b' : 'inherit' }}>{d.unidadesSueltas}</span>
                                <span style={{ "font-size": '0.75em', "margin-left": '4px', opacity: 0.7 }}>BX</span>
                              </div>
                              <div class="dist-butterfly-peso">{d.peso.toFixed(1)} kg ({((d.cajas / datosFiltrados().totalGeneral.cajas) * 100).toFixed(2)}%)</div>
                            </div>
                          </div>
                        </div>
                      )
                    }}
                  </For>
                  
                  <div class="dist-butterfly-total">
                    <div class="dist-butterfly-total-left">
                      <div class="dist-butterfly-total-value">{formatSoles(datosFiltrados().subtotal)}</div>
                      <div class="dist-butterfly-total-label">Total S/ (100%)</div>
                    </div>
                    <div class="dist-butterfly-total-center">
                      <span class="dist-butterfly-total-value" style={{ color: 'var(--g360-accent)', "font-size": 'var(--g360-font-sm)' }}>TOTAL</span>
                    </div>
                    <div class="dist-butterfly-total-right">
                      <div class="dist-butterfly-total-value">{datosFiltrados().totalGeneral.cajas}/{datosFiltrados().totalGeneral.unidadesSueltas} BX | {datosFiltrados().totalGeneral.peso.toFixed(1)} kg</div>
                      <div class="dist-butterfly-total-label">Total Volumen (100%)</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="dist-categories-section">
                <div class="dist-categories-inner">
                  <span class="dist-category-label">📂 CATEGORÍAS:</span>
                  
                  <For each={datosFiltrados().datosCategoria}>
                    {(cat, idx) => {
                      const color = CHART_COLORS[idx() % CHART_COLORS.length]
                      return (
                        <span class="dist-category-badge" style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
                          <span class="dist-category-dot" style={{ background: color }}></span>
                          <span class="dist-category-name">{cat.categoria}</span>
                          <span class="dist-category-pct" style={{ color }}>{cat.porcentaje.toFixed(2)}%</span>
                          <span class="dist-category-sep">•</span>
                          <span class="dist-category-monto">{formatSoles(cat.monto)}</span>
                          <span class="dist-category-sep">•</span>
                          <span class="dist-category-bx">
                            <b style={{ color: 'var(--g360-accent)' }}>{cat.cajasCompletas}</b>/
                            <span style={{ color: cat.unidadesSueltas > 0 ? '#f59e0b' : 'inherit' }}>{cat.unidadesSueltas}</span>
                          </span>
                        </span>
                      )
                    }}
                  </For>
                  
                  <span class="dist-category-total">
                    <span class="dist-category-name">TOTAL</span>
                    <span class="dist-category-monto">{formatSoles(datosFiltrados().subtotal)}</span>
                    <span class="dist-category-sep">|</span>
                    <span class="dist-category-bx">{datosFiltrados().totalGeneral.cajas}/{datosFiltrados().totalGeneral.unidadesSueltas} BX</span>
                    <span class="dist-category-bx">{datosFiltrados().totalGeneral.peso.toFixed(1)} kg</span>
                  </span>
                </div>
              </div>

              {/* Sección de Estado de Línea (NUEVA / TRADICIONAL) */}
              <Show when={datosEstadoLinea().length > 0}>
                <div class="dist-categories-section" style={{ "margin-top": '8px' }}>
                  <div class="dist-categories-inner">
                    <span class="dist-category-label">🏷️ ESTADO LÍNEA:</span>
                    
                    <For each={datosEstadoLinea()}>
                      {(d) => {
                        const color = d.color || '#6b7280'
                        return (
                          <span class="dist-category-badge" style={{ 
                            background: `${color}15`, 
                            border: `1px solid ${color}40`,
                            padding: '6px 14px'
                          }}>
                            <span class="dist-category-dot" style={{ background: color }}></span>
                            <span class="dist-category-name" style={{ color }}>{d.estado}</span>
                            <span class="dist-category-pct" style={{ color }}>{d.porcentaje.toFixed(2)}%</span>
                            <span class="dist-category-sep">•</span>
                            <span class="dist-category-monto">{formatSoles(d.valorTotal)}</span>
                            <span class="dist-category-sep">•</span>
                            <span class="dist-category-bx">{d.cantidad} prod.</span>
                            <span class="dist-category-sep">•</span>
                            <span class="dist-category-bx">{d.cajas}/{d.unidadesSueltas} BX | {d.peso.toFixed(1)} kg</span>
                          </span>
                        )
                      }}
                    </For>
                    
                    <span class="dist-category-total">
                      <span class="dist-category-name">TOTAL</span>
                      <span class="dist-category-monto">{formatSoles(datosFiltrados().subtotal)}</span>
                      <span class="dist-category-sep">|</span>
<span class="dist-category-bx">{datosFiltrados().totalGeneral.cajas}/{datosFiltrados().totalGeneral.unidadesSueltas} BX</span>
                      <span class="dist-category-bx">{datosFiltrados().totalGeneral.peso.toFixed(1)} kg</span>
                    </span>
                  </div>
                </div>
              </Show>
            </div>

            <div class="preview-table-section">
              <h3>📦 DETALLE DE PARTIDAS ({productosCalculados().length})</h3>
              <div class="table-wrapper">
                <ProductTable productos={productosCalculados()} totales={datosFiltrados().totales} />
              </div>
            </div>
          </div>
        </div>

        

      </Show>
    </Show>
  )
}
