import { createSignal, createEffect, createMemo, onCleanup, For, Show } from 'solid-js'
import { useNavigate, useLocation } from '@solidjs/router'
import { usePedido, setTareaPendiente, saveErpTexto, loadErpTexto } from '../../hooks/usePedido'
import { useTheme } from '../../context/ThemeContext'
import { HistoryModal } from '../HistoryModal'
import { useCatalogo } from '../../hooks/useCatalogo'
import { buildCronogramaHTML } from '../../utils/htmlExportBuilder'
import { generarXLSX } from '../../utils/xlsxGenerator'
import { generarDOCX } from '../../utils/docxGenerator'
import { getAgentesSkill } from '../../core/g360-skill-agentes'

const sidebarActions = [
  { id: 'analisis', icon: '📊', label: 'Análisis', shortcut: 'Alt+3', action: 'chart', page: 'home', tooltip: 'Ver gráficos de disponibilidad' },
  { id: 'cuotas', icon: '📋', label: 'Distribución', shortcut: 'Alt+4', action: 'dist', page: 'home', tooltip: 'Calcular distribución de cuotas' },
  { id: 'stock', icon: '⚠️', label: 'Stock', shortcut: 'Alt+5', action: 'stock', badge: true, page: 'all', tooltip: 'Ver productos con stock bajo' },
  { id: 'guardar', icon: '💾', label: 'Guardar', shortcut: 'Alt+G', action: 'guardar', page: 'all', tooltip: 'Guardar estado actual' },
  { id: 'cargar', icon: '📂', label: 'Cargar', shortcut: 'Alt+L', action: 'cargar', page: 'all', tooltip: 'Cargar estado guardado' },
  { id: 'nuevo', icon: '🗑️', label: 'Limpiar', shortcut: 'Alt+N', action: 'nuevo', page: 'all', tooltip: 'Limpiar y cargar nuevo pedido' },
]

const STORAGE_FULL_KEY = 'g360_save_full'
const STORAGE_HISTORIAL_KEY = 'g360_historial'
const STORAGE_CUOTAS_KEY = 'g360_cuotas_persist'

const ExportMenuInline = (props) => {
  const location = useLocation()
  const pedido = usePedido()
  const isDistPage = () => location.pathname === '/distribucion'
  const { enriquecerProducto } = useCatalogo()
  const { calculos } = getAgentesSkill()

  const exportXLSX = async () => {
    try {
      const prods = pedido.productos
      if (!prods.length) { alert('No hay productos para exportar'); props.onClose(); return }

      // Enriquecer productos con datos de catálogo para el análisis de la Hoja 2
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
      const prods = pedido.productos
      if (!prods.length) { alert('No hay productos para exportar'); props.onClose(); return }

      const prodsEnriquecidos = prods.map(p => ({ ...p, ...enriquecerProducto(p) }))

      await generarDOCX({
        cliente: pedido.cliente,
        documento: pedido.ruc,
        numeroPedido: pedido.numeroPedido,
        vendedor: pedido.vendedor,
        productos: prodsEnriquecidos
      })
      props.onClose()
    } catch (e) { alert('Error exportando DOC: ' + e.message); props.onClose() }
  }

  const exportHTML = () => {
    try {
      const prods = pedido.productos
      if (!prods.length) { alert('No hay productos para exportar'); props.onClose(); return }

      // Enriquecer productos antes de calcular el consolidado
      const clientProds = prods.map(p => {
        const catInfo = enriquecerProducto(p)
        return {
          ...p,
          ...catInfo,
          cajasDetalle: calculos.logistica.cajasDetalle(p.cantidad, catInfo.un_bx || 1)
        }
      })

      const consolidado = calculos.pedido.consolidado(clientProds)

      const respuesta = prompt('¿Qué estilo deseas para el HTML?\n1 = Presentación (oscuro)\n2 = Impresión (claro)\n(Presiona Enter para por defecto - Presentación)', '1')
      if (respuesta !== '1' && respuesta !== '2') { props.onClose(); return }
      const htmlDarkTheme = respuesta !== '2'

      const now = new Date()
      const fechaArchivo = now.toISOString().split('T')[0].replace(/-/g, '')
      const rucLimpio = (pedido.ruc || '').replace(/\D/g, '')
      const documentoValido = (rucLimpio.length === 8 || rucLimpio.length === 11) ? rucLimpio : 'DOC'
      const pedidoLimpio = (pedido.numeroPedido || '').replace(/[^a-zA-Z0-9\-_]/g, '').trim().substring(0, 12) || 'PEDIDO'
      const nombreArchivo = `cronograma_${documentoValido}_${pedidoLimpio}_${fechaArchivo}.html`

      const htmlContent = buildCronogramaHTML({
        cliente: pedido.cliente,
        ruc: pedido.ruc,
        numeroPedido: pedido.numeroPedido,
        vendedor: pedido.vendedor,
        emailVendedor: pedido.emailVendedor,
        telefonoVendedor: pedido.telefonoVendedor,
        cuotas: (() => { try { const s = localStorage.getItem(STORAGE_CUOTAS_KEY); return s ? JSON.parse(s) : [] } catch { return [] } })(),
        consolidado,
        productosCalculados: clientProds,
        htmlDarkTheme
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
      props.onClose()
    } catch (e) { alert('Error: ' + e.message); props.onClose() }
  }

  return (
    <div class="export-menu">
      <button class="export-menu-item" onClick={exportXLSX} title="Exportar a CSV/Excel">XLSX</button>
      <button class="export-menu-item" onClick={exportDOC} title="Exportar a Word">DOC</button>
      <Show when={isDistPage()}>
        <button class="export-menu-item" onClick={exportHTML} title="Ver distribución">HTML</button>
      </Show>
    </div>
  )
}

export const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const pedido = usePedido()
  const { toggleTheme, darkTheme } = useTheme()

  const guardarEstado = () => {
    try {
      // Validar que estemos en la página de distribución
      if (location.pathname === '/') {
        alert('💡 GUÍA: No hay una distribución para grabar desde aquí. Entra primero al botón "Distribución" (📋) para configurar las cuotas.')
        return false
      }

      // Validar datos obligatorios del pedido
      if (!pedido.cliente || !pedido.ruc || !pedido.numeroPedido) {
        alert('⚠️ ATENCIÓN: El pedido debe tener Razón Social, RUC/DNI y Número de Pedido para ser guardado.')
        return false
      }

      const cuotasActuales = JSON.parse(localStorage.getItem(STORAGE_CUOTAS_KEY) || '[]')
      if (cuotasActuales.length === 0) {
        alert('📅 GUÍA: El calendario está vacío. Marca al menos una fecha de pago antes de presionar Guardar.')
        return false
      }

      // Snapshot de productos con metadatos completos
      const productosAGuardar = pedido.productos.map(p => ({
        codigo: p.codigo || '',
        descripcion: p.descripcion || '',
        cantidad: p.cantidad || 0,
        precioUnitario: p.precioUnitario || 0,
        stock: p.stock || 0,
        descuento1: p.descuento1 || 0,
        descuento2: p.descuento2 || 0
      }))

      const data = {
        cliente: pedido.cliente,
        ruc: pedido.ruc,
        numeroPedido: pedido.numeroPedido,
        vendedor: pedido.vendedor,
        emailVendedor: pedido.emailVendedor,
        telefonoVendedor: pedido.telefonoVendedor,
        productos: productosAGuardar,
        cuotas: cuotasActuales,
        erpTexto: loadErpTexto(), // Guardamos el texto original para reconstrucción total
        distActiva: pedido.distActiva,
        distHistorial: pedido.distHistorial,
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_FULL_KEY, JSON.stringify(data))
      const currentHistory = JSON.parse(localStorage.getItem(STORAGE_HISTORIAL_KEY) || '[]')
      currentHistory.unshift({
        id: `save_${Date.now()}`,
        fecha: new Date().toLocaleString('es-PE'),
        cliente: data.cliente || 'Sin cliente',
        numeroPedido: data.numeroPedido || 'Sin número',
        productos: data.productos.length,
        total: (data.productos.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0)) * 1.18,
        data
      })
      if (currentHistory.length > 10) currentHistory.pop()
      localStorage.setItem(STORAGE_HISTORIAL_KEY, JSON.stringify(currentHistory))
      setHistorial(currentHistory) // Actualizamos la señal para refrescar la UI
      return true
    } catch (e) { console.error('Error guardando:', e); return false }
  }

  const obtenerHistorial = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_HISTORIAL_KEY) || '[]') } catch { return [] }
  }

  const eliminarDeHistorial = (id) => {
    if (!confirm('¿Deseas eliminar este registro de forma permanente?')) return
    try {
      const currentHistory = obtenerHistorial()
      const newHistory = currentHistory.filter(item => item.id !== id)
      localStorage.setItem(STORAGE_HISTORIAL_KEY, JSON.stringify(newHistory))
      setHistorial(newHistory)
    } catch (e) {
      console.error('Error eliminando del historial:', e)
    }
  }

  const cargarDesdeHistorial = (item) => {
    try {
      const data = item.data
      pedido.setCliente(data.cliente)
      pedido.setRuc(data.ruc)
      pedido.setNumeroPedido(data.numeroPedido)
      pedido.setVendedor(data.vendedor)
      pedido.setEmailVendedor(data.emailVendedor)
      pedido.setTelefonoVendedor(data.telefonoVendedor)
      
      // Restauramos la distribución al buffer de trabajo
      localStorage.setItem(STORAGE_CUOTAS_KEY, JSON.stringify(data.cuotas || []))

      // Restaurar texto ERP original si existe en el snapshot
      if (data.erpTexto) {
        saveErpTexto(data.erpTexto)
      }

      // Si el pedido cargado tiene distribución, reactivamos la alerta visual
      if (data.cuotas && data.cuotas.length > 0) {
        setTareaPendiente(true)
      }

      pedido.actualizarProductosDesdeTexto(
        (data.productos || []).map((p) =>
          [p.codigo || '', p.descripcion || '', p.cantidad || 0, p.precioUnitario || 0, p.stock || 0].join('\t')
        ).join('\n')
      )
      if (data.distActiva) pedido.iniciarDistribucion()
      return true
    } catch (e) { console.error('Error cargando:', e); return false }
  }

  const [showExport, setShowExport] = createSignal(false)
  const [showHistory, setShowHistory] = createSignal(false)
  const [historial, setHistorial] = createSignal(obtenerHistorial())

  // Memo para detectar si algún guardado tiene distribución
  const hasHistoryWithCuotas = createMemo(() => 
    historial().some(item => item.data?.cuotas?.length > 0)
  )

  const stockAlerts = createMemo(() => {
    const prods = pedido.productos
    if (!prods.length) return 0
    return prods.filter((p) => p.estadoStock === 'Agotado' || p.estadoStock === 'AJ').length
  })
  const isHomePage = () => location.pathname === '/'
  const hasProducts = () => pedido.productos.length > 0
  const hasPendingCuotas = () => pedido.tareaPendiente

  const handleAction = (action) => {
    switch (action) {
      case 'chart':
        if (!hasProducts()) { alert('Primero carga productos para ver el analisis grafico'); return }
        if (window.showChartModal) { window.showChartModal() }
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
        const prodsStock = pedido.productos.filter((p) => p.estadoStock === 'Agotado' || p.estadoStock === 'AJ')
        if (prodsStock.length === 0) {
          alert('Todos los productos tienen stock disponible')
        } else {
          const agotados = prodsStock.filter((p) => p.estadoStock === 'Agotado').length
          const porConfirmar = prodsStock.filter((p) => p.estadoStock === 'AJ').length
          const lista = prodsStock.slice(0, 5).map((p) => `${p.codigo} ${(p.descripcion || '').slice(0, 25)} (${p.estadoStock})`).join('\n')
          const mas = prodsStock.length > 5 ? `...y ${prodsStock.length - 5} mas` : ''
          alert(`STOCK BAJO\nAgotados: ${agotados}\nPor confirmar: ${porConfirmar}\n${lista}${mas}`)
        }
        break
      case 'guardar':
        if (guardarEstado()) { alert('Estado guardado correctamente') } else { alert('Error al guardar') }
        break
      case 'cargar':
        setShowHistory(true)
        break
      case 'nuevo':
        if (hasProducts()) { 
          if (confirm('🗑️ ¿Limpiar todo el trabajo actual?\nEsto borrará los datos del cliente, productos y el calendario de pagos.')) { 
            pedido.resetearPedido() 
            localStorage.removeItem(STORAGE_CUOTAS_KEY)
            setTareaPendiente(false)
          } 
        }
        break
      case 'theme':
        toggleTheme()
        break
    }
  }

  const toggleExport = (e) => { e.stopPropagation(); setShowExport(!showExport()) }
  const closeExport = () => setShowExport(false)

  createEffect(() => {
    if (showExport()) {
      const handleClickOutside = (e) => { if (!e.target.closest('.export-menu-wrapper')) { closeExport() } }
      document.addEventListener('click', handleClickOutside)
      onCleanup(() => document.removeEventListener('click', handleClickOutside))
    }
  })

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
                    if (item.id === 'cargar' && hasHistoryWithCuotas()) return '📂 Cargar (Tienes distribuciones guardadas)'
                    if (item.id === 'guardar') {
                      if (isHomePage()) return '💾 Guía: Entra a Distribución para habilitar guardado'
                      if (!pedido.cliente || !pedido.ruc || !pedido.numeroPedido) return '💾 Guía: Completa datos del cliente para guardar'
                    }
                    if (item.id === 'cuotas' && isHomePage() && !hasProducts()) return '📋 Guía: Carga productos primero'
                    return item.tooltip
                  })()}
                  data-action={item.action} data-icon={item.icon}>
                  <span class="sidebar-icon">{item.icon}</span>
                  <Show when={item.id === 'cuotas' && hasPendingCuotas()}><span class="sidebar-badge-pending">⚠️</span></Show>
                  <Show when={item.id === 'cargar' && hasHistoryWithCuotas()}>
                    <span class="sidebar-badge" style="background: var(--g360-accent); font-size: 0.5rem; width: 14px; height: 14px; top: -2px; right: -2px;">✓</span>
                  </Show>
                </button>
              </Show>
            </Show>
          )}
        </For>
      </div>
      <HistoryModal show={showHistory()} historial={historial()} onClose={() => setShowHistory(false)}
        onSelect={(item) => { if (cargarDesdeHistorial(item)) { alert('Estado cargado correctamente') } else { alert('Error al cargar') } }}
        onDelete={eliminarDeHistorial} />
    </aside>
  )
}
