import { createSignal, createEffect, createMemo, For, Show } from 'solid-js'
import { useNavigate, useLocation } from '@solidjs/router'
import { usePedido, setTareaPendiente } from '../../hooks/usePedido'
import { useTheme } from '../../context/ThemeContext'
import { HistoryModal } from '../HistoryModal'
import { buildCronogramaHTML } from '../../utils/htmlExportBuilder'
import { guardarHTMLSnapshot, listarHTMLSnapshots } from '../../utils/htmlHistoryStorage'
import { STORAGE_KEYS } from '../../constants/storage'
import { useCatalogo } from '../../hooks/useCatalogo'
import { getAgentesSkill } from '../../core/g360-skill-agentes'
import { generarXLSX } from '../../utils/xlsxGenerator'
import { generarDOCX } from '../../utils/docxGenerator'

const { CUOTAS_PERSIST: STORAGE_CUOTAS_KEY } = STORAGE_KEYS

const sidebarActions = [
  { id: 'analisis', icon: '📊', label: 'Análisis', shortcut: 'Alt+3', action: 'chart', page: 'home', tooltip: 'Ver gráficos de disponibilidad' },
  { id: 'cuotas', icon: '📋', label: 'Distribución', shortcut: 'Alt+4', action: 'dist', page: 'home', tooltip: 'Calcular distribución de cuotas' },
  { id: 'stock', icon: '⚠️', label: 'Stock', shortcut: 'Alt+5', action: 'stock', badge: true, page: 'all', tooltip: 'Ver productos con stock bajo' },
  { id: 'guardar', icon: '💾', label: 'Guardar', shortcut: 'Alt+G', action: 'guardar', page: 'all', tooltip: 'Guardar HTML en bóveda' },
  { id: 'cargar', icon: '📂', label: 'Cargar', shortcut: 'Alt+L', action: 'cargar', page: 'all', tooltip: 'Abrir bóveda HTML' },
  { id: 'nuevo', icon: '🗑️', label: 'Limpiar', shortcut: 'Alt+N', action: 'nuevo', page: 'all', tooltip: 'Limpiar y cargar nuevo pedido' },
]

const ExportMenuInline = (props) => {
  const pedido = usePedido()
  const { enriquecerProducto } = useCatalogo()
  const { calculos } = getAgentesSkill()
  const { darkTheme } = useTheme()

  const exportXLSX = async () => {
    try {
      if (!pedido.numeroPedido) { alert('⚠️ XLSX requiere: N° Pedido'); props.onClose(); return }
      if (!pedido.cliente) { alert('⚠️ XLSX requiere: Cliente'); props.onClose(); return }
      const prods = pedido.productos
      if (!prods.length) { alert('No hay productos para exportar'); props.onClose(); return }
      const prodsEnriquecidos = prods.map(p => ({ ...p, ...enriquecerProducto(p) }))
      await generarXLSX({
        cliente: pedido.cliente,
        documento: pedido.ruc,
        numeroPedido: pedido.numeroPedido,
        vendedor: pedido.vendedor,
        productos: prodsEnriquecidos,
        tipo: 'cotizacion'
      })
      props.onClose()
    } catch (e) { alert('Error exportando: ' + e.message); props.onClose() }
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
      if (faltantes.length) { alert(`⚠️ Word / Carta requiere:\n• ${faltantes.join('\n• ')}`); props.onClose(); return }
      const prods = pedido.productos
      if (!prods.length) { alert('No hay productos para exportar'); props.onClose(); return }
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
      props.onClose()
    } catch (e) { alert('Error exportando DOC: ' + e.message); props.onClose() }
  }

  return (
    <div class="export-menu">
      <button class="export-menu-item" onClick={exportXLSX} title="Exportar a Excel">XLSX</button>
      <button class="export-menu-item" onClick={exportDOC} title="Exportar a Word">DOC</button>
    </div>
  )
}

export const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const pedido = usePedido()
  const { toggleTheme, darkTheme } = useTheme()
  const { enriquecerProducto } = useCatalogo()
  const { calculos } = getAgentesSkill()

  const [showExport, setShowExport] = createSignal(false)
  const [showHistory, setShowHistory] = createSignal(false)
  const [htmlCount, setHtmlCount] = createSignal(0)

  createEffect(() => {
    listarHTMLSnapshots().then(items => setHtmlCount(items.length))
  })

  const guardarHTML = async () => {
    try {
      const faltantes = []
      if (!pedido.cliente) faltantes.push('Cliente')
      if (!pedido.ruc) faltantes.push('Documento (RUC/DNI)')
      if (!pedido.numeroPedido) faltantes.push('N° Pedido')
      if (!pedido.vendedor) faltantes.push('Vendedor')
      if (faltantes.length) { alert(`⚠️ HTML / Distribución requiere:\n• ${faltantes.join('\n• ')}`); return false }
      const cuotas = JSON.parse(localStorage.getItem(STORAGE_CUOTAS_KEY) || '[]')
      const cuotasConMonto = cuotas.filter(c => parseFloat(c.monto) > 0)
      if (!cuotasConMonto.length) {
        alert('📅 GUÍA: El calendario está vacío o sin montos asignados. Marca fechas y distribuye montos antes de guardar.')
        return false
      }

      const prodsEnriquecidos = pedido.productos.map(p => ({ ...p, ...enriquecerProducto(p) }))
      const consolidado = calculos.pedido.consolidado(prodsEnriquecidos)

      const htmlContent = buildCronogramaHTML({
        cliente: pedido.cliente,
        ruc: pedido.ruc,
        numeroPedido: pedido.numeroPedido,
        vendedor: pedido.vendedor,
        emailVendedor: pedido.emailVendedor,
        telefonoVendedor: pedido.telefonoVendedor,
        cuotas,
        consolidado,
        productosCalculados: prodsEnriquecidos,
        htmlDarkTheme: false
      })

      await guardarHTMLSnapshot({
        cliente: pedido.cliente || 'Sin cliente',
        ruc: pedido.ruc,
        numeroPedido: pedido.numeroPedido,
        html: htmlContent
      })
      setHtmlCount(c => c + 1)
      return true
    } catch (e) {
      console.error('Error guardando HTML:', e)
      return false
    }
  }

  const stockAlerts = createMemo(() => {
    const prods = pedido.productos
    if (!prods.length) return 0
    return prods.filter(p => p.estadoStock === 'Agotado' || p.estadoStock === 'AJ').length
  })

  const isHomePage = () => location.pathname === '/'
  const hasProducts = () => pedido.productos.length > 0

  const handleAction = async (action) => {
    switch (action) {
      case 'chart':
        if (!hasProducts()) { alert('Primero carga productos para ver el analisis grafico'); return }
        if (window.showChartModal) window.showChartModal()
        break
      case 'dist':
        if (isHomePage()) {
          if (pedido.tieneDistPendiente()) {
            const continuar = confirm('Hay una DISTRIBUCION en proceso')
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
          const mas = prodsStock.length > 5 ? `...y ${prodsStock.length - 5} mas` : ''
          alert(`STOCK BAJO\nAgotados: ${agotados}\nPor confirmar: ${porConfirmar}\n${lista}${mas}`)
        }
        break
      case 'guardar':
        if (await guardarHTML()) {
          alert('✅ HTML guardado correctamente en la bóveda')
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
      case 'theme':
        toggleTheme()
        break
    }
  }

  const toggleExport = (e) => { e.stopPropagation(); setShowExport(!showExport()) }
  const closeExport = () => setShowExport(false)

  return (
    <aside class="g360-sidebar">
      <div class="sidebar-inner">
        <div class="export-menu-wrapper">
          <button class="sidebar-btn export-btn" onClick={toggleExport} title="Exportar pedido"><span class="sidebar-icon">📥</span></button>
          <Show when={showExport()}><ExportMenuInline onClose={closeExport} /></Show>
        </div>
        <button class="sidebar-btn" onClick={toggleTheme} title="Cambiar tema"><span class="sidebar-icon">{darkTheme() ? '☀️' : '🌙'}</span></button>
        <Show when={!isHomePage()}><button class="sidebar-btn" onClick={() => navigate('/')} title="Volver"><span class="sidebar-icon">↩️</span></button></Show>
        <For each={sidebarActions}>
          {(item) => (
            <Show when={item.id !== 'analisis' || isHomePage()}>
              <Show when={item.id !== 'cuotas' || isHomePage()}>
                <button class={item.id === 'stock' && stockAlerts() > 0 ? 'sidebar-btn has-badge' : 'sidebar-btn'}
                  onClick={() => handleAction(item.action)}
                  title={(() => {
                    if (item.id === 'guardar' && isHomePage()) return '💾 Guía: Entra a Distribución para guardar HTML'
                    return item.tooltip
                  })()}
                  data-action={item.action} data-icon={item.icon}>
                  <span class="sidebar-icon">{item.icon}</span>
                  <Show when={item.id === 'cargar' && htmlCount() > 0}>
                    <span class="sidebar-badge" style="background: var(--g360-accent); font-size: 0.5rem; width: 14px; height: 14px; top: -2px; right: -2px;">{htmlCount()}</span>
                  </Show>
                </button>
              </Show>
            </Show>
          )}
        </For>
      </div>
      <HistoryModal show={showHistory()} onClose={() => setShowHistory(false)} />
    </aside>
  )
}
