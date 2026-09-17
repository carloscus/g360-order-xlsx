import { createSignal, createEffect, createMemo, For, Show } from 'solid-js'
import { useNavigate, useLocation } from '@solidjs/router'
import { usePedido, setTareaPendiente } from '../../hooks/usePedido'
import { useTheme } from '../../context/ThemeContext'
import { HistoryModal } from '../HistoryModal'
import { Toast, showToast } from '../Toast'
import { guardarHTMLSnapshot, listarHTMLSnapshots } from '../../utils/htmlHistoryStorage'
import { STORAGE_KEYS } from '../../constants/storage'
import { useCatalogo } from '../../hooks/useCatalogo'
import { getAgentesSkill } from '../../core/g360-skill-agentes'
import { generarXLSX } from '../../utils/xlsxGenerator'
import { generarDOCX } from '../../utils/docxGenerator'
import { generarContenidoHTML, validarPedidoParaHTML, generarNombreArchivo, descargarHTML } from '../../helpers/htmlHelper'

const { CUOTAS_PERSIST: STORAGE_CUOTAS_KEY } = STORAGE_KEYS

/**
 * Panel de exportación context-aware
 * Home: XLSX + DOCX
 * Distribución: Guardar HTML + Descargar HTML
 */
const ExportPanel = (props) => {
  const pedido = usePedido()
  const { enriquecerProducto } = useCatalogo()
  const [loadingXlsx, setLoadingXlsx] = createSignal(false)
  const [loadingDocx, setLoadingDocx] = createSignal(false)
  const [loadingHtml, setLoadingHtml] = createSignal(false)

  const exportXLSX = async () => {
    try {
      if (!pedido.numeroPedido) { showToast('XLSX requiere: N° Pedido', 'warning'); props.onClose(); return }
      if (!pedido.cliente) { showToast('XLSX requiere: Cliente', 'warning'); props.onClose(); return }
      const prods = pedido.productos
      if (!prods.length) { showToast('No hay productos para exportar', 'warning'); props.onClose(); return }
      setLoadingXlsx(true)
      const prodsEnriquecidos = prods.map(p => ({ ...p, ...enriquecerProducto(p) }))
      await generarXLSX({
        cliente: pedido.cliente,
        documento: pedido.ruc,
        numeroPedido: pedido.numeroPedido,
        sucursal: pedido.sucursal,
        vendedor: pedido.vendedor,
        emailVendedor: pedido.emailVendedor,
        productos: prodsEnriquecidos,
        tipo: 'cotizacion'
      })
      showToast('Excel descargado correctamente', 'success')
      props.onClose()
    } catch (e) { showToast('Error exportando: ' + e.message, 'error'); props.onClose() }
    finally { setLoadingXlsx(false) }
  }

  const exportDOC = async () => {
    try {
      const faltantes = []
      if (!pedido.cliente) faltantes.push('Cliente')
      if (!pedido.ruc) faltantes.push('Documento (RUC/DNI)')
      if (!pedido.numeroPedido) faltantes.push('N° Pedido')
      if (!pedido.vendedor) faltantes.push('Vendedor')
      if (!pedido.emailVendedor) faltantes.push('Email')
      if (!pedido.telefonoVendedor) faltantes.push('Teléfono')
      if (faltantes.length) { showToast(`Word requiere: ${faltantes.join(', ')}`, 'warning'); props.onClose(); return }
      const prods = pedido.productos
      if (!prods.length) { showToast('No hay productos para exportar', 'warning'); props.onClose(); return }
      setLoadingDocx(true)
      const prodsEnriquecidos = prods.map(p => ({ ...p, ...enriquecerProducto(p) }))
      await generarDOCX({
        cliente: pedido.cliente,
        documento: pedido.ruc,
        numeroPedido: pedido.numeroPedido,
        vendedor: pedido.vendedor,
        emailVendedor: pedido.emailVendedor,
        telefonoVendedor: pedido.telefonoVendedor,
        productos: prodsEnriquecidos
      })
      showToast('Word descargado correctamente', 'success')
      props.onClose()
    } catch (e) { showToast('Error exportando DOC: ' + e.message, 'error'); props.onClose() }
    finally { setLoadingDocx(false) }
  }

  const guardarYDescargarHTML = async () => {
    try {
      const faltantes = validarPedidoParaHTML(pedido)
      if (faltantes.length) { showToast(`HTML requiere: ${faltantes.join(', ')}`, 'warning'); props.onClose(); return }
      const cuotas = JSON.parse(localStorage.getItem(STORAGE_CUOTAS_KEY) || '[]')
      const cuotasConMonto = cuotas.filter(c => parseFloat(c.monto) > 0)
      if (!cuotasConMonto.length) {
        showToast('Distribuya montos antes de guardar', 'warning')
        props.onClose()
        return
      }
      setLoadingHtml(true)
      const htmlContent = generarContenidoHTML(pedido, cuotas)
      const nombreArchivo = generarNombreArchivo(pedido.ruc, pedido.numeroPedido)

      await guardarHTMLSnapshot({
        cliente: pedido.cliente || 'Sin cliente',
        ruc: pedido.ruc,
        numeroPedido: pedido.numeroPedido,
        html: htmlContent
      })

      descargarHTML(htmlContent, nombreArchivo)
      showToast('HTML guardado y descargado', 'success')
      props.onClose()
    } catch (e) {
      console.error('Error guardando HTML:', e)
      showToast('Error guardando HTML: ' + e.message, 'error')
      props.onClose()
    }
    finally { setLoadingHtml(false) }
  }

  // Home page: XLSX + DOCX
  if (props.isHome) {
    return (
      <div class="export-panel">
        <div class="export-panel-header">EXPORTAR PEDIDO</div>
        <button class="export-option" onClick={exportXLSX} disabled={loadingXlsx()}>
          <span class="export-icon">{loadingXlsx() ? '⏳' : '📊'}</span>
          <span class="export-text">
            <span class="export-label">{loadingXlsx() ? 'Generando...' : 'Excel'}</span>
            <span class="export-desc">XLSX con fórmulas</span>
          </span>
        </button>
        <button class="export-option" onClick={exportDOC} disabled={loadingDocx()}>
          <span class="export-icon">{loadingDocx() ? '⏳' : '📝'}</span>
          <span class="export-text">
            <span class="export-label">{loadingDocx() ? 'Generando...' : 'Word'}</span>
            <span class="export-desc">Carta corporativa</span>
          </span>
        </button>
      </div>
    )
  }

  // Distribution page: Guardar + Descargar HTML
  return (
    <div class="export-panel">
      <div class="export-panel-header">REPORTE HTML</div>
      <button class="export-option" onClick={guardarYDescargarHTML} disabled={loadingHtml()}>
        <span class="export-icon">{loadingHtml() ? '⏳' : '💾'}</span>
        <span class="export-text">
          <span class="export-label">{loadingHtml() ? 'Generando...' : 'Guardar y Descargar'}</span>
          <span class="export-desc">Bóveda + archivo local</span>
        </span>
      </button>
    </div>
  )
}

export const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const pedido = usePedido()
  const { toggleTheme, darkTheme } = useTheme()

  const [expanded, setExpanded] = createSignal(true)
  const [showExport, setShowExport] = createSignal(false)
  const [showHistory, setShowHistory] = createSignal(false)
  const [htmlCount, setHtmlCount] = createSignal(0)

  createEffect(() => {
    listarHTMLSnapshots().then(items => setHtmlCount(items.length))
  })

  const stockAlerts = createMemo(() => {
    const prods = pedido.productos
    if (!prods.length) return 0
    return prods.filter(p => p.estadoStock === 'Agotado' || p.estadoStock === 'AJ').length
  })

  const isHomePage = () => location.pathname === '/'
  const isDistPage = () => location.pathname === '/distribucion'
  const hasProducts = () => pedido.productos.length > 0

  const handleAction = async (action) => {
    switch (action) {
      case 'chart':
        if (!hasProducts()) { alert('Primero carga productos para ver el análisis gráfico'); return }
        if (window.showChartModal) window.showChartModal()
        break
      case 'dist':
        if (isHomePage()) {
          if (pedido.tieneDistPendiente()) {
            const continuar = confirm('Hay una DISTRIBUCIÓN en proceso')
            if (!continuar) return
          } else {
            pedido.iniciarDistribucion()
            pedido.setTareaPendiente(true)
          }
          navigate('/distribucion')
        }
        break
      case 'stock':
        const prodsStock = pedido.productos.filter(p => p.estadoStock === 'Agotado' || p.estadoStock === 'AJ')
        if (!prodsStock.length) {
          alert('Todos los productos tienen stock disponible')
        } else {
          const agotados = prodsStock.filter(p => p.estadoStock === 'Agotado').length
          const porConfirmar = prodsStock.filter(p => p.estadoStock === 'AJ').length
          const lista = prodsStock.slice(0, 5).map(p => `${p.codigo} ${(p.descripcion || '').slice(0, 25)} (${p.estadoStock})`).join('\n')
          const mas = prodsStock.length > 5 ? `...y ${prodsStock.length - 5} más` : ''
          alert(`STOCK BAJO\nAgotados: ${agotados}\nPor confirmar: ${porConfirmar}\n${lista}${mas}`)
        }
        break
      case 'cargar':
        setShowHistory(true)
        break
      case 'nuevo':
        if (confirm('🗑️ ¿Limpiar todo el trabajo actual?\nEsto borrará los datos del cliente, productos y distribución.')) {
          pedido.resetearPedido()
          localStorage.removeItem(STORAGE_CUOTAS_KEY)
          localStorage.removeItem(STORAGE_KEYS.DIST_FLAG)
          localStorage.removeItem(STORAGE_KEYS.DIST_HISTORIAL)
          localStorage.removeItem(STORAGE_KEYS.HISTORIAL)
          setTareaPendiente(false)
        }
        break
    }
  }

  const exportLabel = isDistPage() ? 'Reporte' : 'Exportar'
  const exportIcon = isDistPage() ? '📄' : '📥'

  // Calcular posición del panel basado en el botón
  const [panelPos, setPanelPos] = createSignal({ top: 100, left: 64 })
  let exportBtnRef = null

  const toggleExportPanel = () => {
    if (exportBtnRef) {
      const rect = exportBtnRef.getBoundingClientRect()
      setPanelPos({ top: rect.top, left: rect.right + 8 })
    }
    setShowExport(!showExport())
  }

  return (
    <aside class={`g360-sidebar ${expanded() ? 'expanded' : 'collapsed'}`}>
      {/* Header */}
      <div class="sidebar-header">
        <Show when={expanded()}>
          <div class="sidebar-brand">
            <span class="brand-icon">☰</span>
            <span class="brand-text">Menú</span>
          </div>
        </Show>
        <button class="sidebar-toggle" onClick={() => setExpanded(!expanded())} title={expanded() ? 'Colapsar' : 'Expandir'}>
          <span class="toggle-icon">{expanded() ? '«' : '»'}</span>
        </button>
      </div>

      <div class="sidebar-nav">
        {/* NAVEGACIÓN */}
        <Show when={expanded()}>
          <div class="nav-section-label">NAVEGACIÓN</div>
        </Show>
        
        <button
          class={`nav-item ${isHomePage() ? 'active' : ''}`}
          onClick={() => navigate('/')}
          title="Pedidos y Cotizaciones"
        >
          <span class="nav-icon">📦</span>
          <Show when={expanded()}><span class="nav-label">Pedidos</span></Show>
        </button>

        <Show when={hasProducts()}>
          <button
            class={`nav-item ${isDistPage() ? 'active' : ''}`}
            onClick={() => handleAction('dist')}
            title="Distribución de Letras"
          >
            <span class="nav-icon">📅</span>
            <Show when={expanded()}><span class="nav-label">Distribución</span></Show>
          </button>
        </Show>

        {/* ACCIONES */}
        <Show when={expanded()}>
          <div class="nav-section-label">ACCIONES</div>
        </Show>

        <Show when={hasProducts()}>
          <button class="nav-item" onClick={() => handleAction('chart')} title="Análisis gráfico">
            <span class="nav-icon">📊</span>
            <Show when={expanded()}><span class="nav-label">Análisis</span></Show>
          </button>
        </Show>

        <button
          class={`nav-item ${stockAlerts() > 0 ? 'has-alert' : ''}`}
          onClick={() => handleAction('stock')}
          title={`Stock: ${stockAlerts()} alertas`}
        >
          <span class="nav-icon">⚠️</span>
          <Show when={expanded()}><span class="nav-label">Stock</span></Show>
          <Show when={stockAlerts() > 0}>
            <span class="nav-badge">{stockAlerts()}</span>
          </Show>
        </button>

        {/* EXPORTAR — Context-aware */}
        <Show when={expanded()}>
          <div class="nav-section-label">{isDistPage() ? 'REPORTE' : 'EXPORTAR'}</div>
        </Show>

        <div class="export-wrapper">
          <button ref={exportBtnRef} class="nav-item" onClick={toggleExportPanel} title={isDistPage() ? 'Generar reporte HTML' : 'Exportar pedido'}>
            <span class="nav-icon">{exportIcon}</span>
            <Show when={expanded()}><span class="nav-label">{exportLabel}</span></Show>
          </button>
        </div>

        {/* Panel de exportación - fuera del sidebar */}
        <Show when={showExport()}>
          <div class="export-overlay" onClick={() => setShowExport(false)} />
          <div class="export-panel" style={{ top: `${panelPos().top}px`, left: `${panelPos().left}px` }}>
            <ExportPanel isHome={isHomePage()} onClose={() => setShowExport(false)} />
          </div>
        </Show>

        <Show when={isDistPage()}>
          <button class="nav-item" onClick={() => handleAction('cargar')} title="Bóveda de reportes">
            <span class="nav-icon">📂</span>
            <Show when={expanded()}><span class="nav-label">Bóveda</span></Show>
            <Show when={htmlCount() > 0}>
              <span class="nav-badge">{htmlCount()}</span>
            </Show>
          </button>
        </Show>

        {/* SISTEMA */}
        <Show when={expanded()}>
          <div class="nav-section-label">SISTEMA</div>
        </Show>

        <button class="nav-item" onClick={toggleTheme} title="Cambiar tema">
          <span class="nav-icon">{darkTheme() ? '☀️' : '🌙'}</span>
          <Show when={expanded()}><span class="nav-label">{darkTheme() ? 'Claro' : 'Oscuro'}</span></Show>
        </button>

        <button class="nav-item nav-danger" onClick={() => handleAction('nuevo')} title="Limpiar todo">
          <span class="nav-icon">🗑️</span>
          <Show when={expanded()}><span class="nav-label">Limpiar</span></Show>
        </button>
      </div>

      <HistoryModal show={showHistory()} onClose={() => setShowHistory(false)} />
    </aside>
  )
}
