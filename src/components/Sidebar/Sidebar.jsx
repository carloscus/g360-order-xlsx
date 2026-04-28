import { createSignal, createEffect, createMemo, onCleanup, For, Show } from 'solid-js'
import { useNavigate, useLocation } from '@solidjs/router'
import { usePedido } from '../../hooks/usePedido'
import { useTheme } from '../../context/ThemeContext'
import { HistoryModal } from '../HistoryModal'

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

const guardarEstado = () => {
  try {
    const pedido = usePedido()
    const data = {
      cliente: pedido.cliente,
      ruc: pedido.ruc,
      numeroPedido: pedido.numeroPedido,
      vendedor: pedido.vendedor,
      emailVendedor: pedido.emailVendedor,
      telefonoVendedor: pedido.telefonoVendedor,
      productos: JSON.parse(localStorage.getItem('g360_pedido_actual') || '{}').productos || [],
      distActiva: pedido.distActiva,
      distHistorial: pedido.distHistorial,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_FULL_KEY, JSON.stringify(data))
    const historial = JSON.parse(localStorage.getItem(STORAGE_HISTORIAL_KEY) || '[]')
    historial.unshift({ id: 'save_' + Date.now(), fecha: new Date().toLocaleString('es-PE'), cliente: data.cliente || 'Sin cliente', numeroPedido: data.numeroPedido || 'Sin número', productos: data.productos.length, total: data.productos.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0), data: data })
    if (historial.length > 10) historial.pop()
    localStorage.setItem(STORAGE_HISTORIAL_KEY, JSON.stringify(historial))
    return true
  } catch (e) { console.error('Error guardando:', e); return false }
}

const obtenerHistorial = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_HISTORIAL_KEY) || '[]') } catch { return [] }
}

const cargarDesdeHistorial = function (item) {
  try {
    var pedido = usePedido()
    var data = item.data
    pedido.setCliente(data.cliente)
    pedido.setRuc(data.ruc)
    pedido.setNumeroPedido(data.numeroPedido)
    pedido.setVendedor(data.vendedor)
    pedido.setEmailVendedor(data.emailVendedor)
    pedido.setTelefonoVendedor(data.telefonoVendedor)
    pedido.setState('productos', data.productos)
    pedido.setState('distActiva', data.distActiva)
    pedido.setState('distHistorial', data.distHistorial)
    return true
  } catch (e) { console.error('Error cargando:', e); return false }
}

const ExportMenuInline = function (props) {
  var location = useLocation()
  var pedido = usePedido()
  var isDistPage = function () { return location.pathname === '/distribucion' }

  var exportXLSX = function () {
    try {
      var prods = pedido.productos
      if (!prods.length) { alert('No hay productos para exportar'); props.onClose(); return }
      var csv = 'Codigo,Descripcion,Cantidad,PrecioUnitario,Total,Stock\n'
      prods.forEach(function (p) {
        csv += p.codigo + ',' + (p.descripcion || '').replace(/,/g, ' ') + ',' + p.cantidad + ',' + p.precioUnitario + ',' + (p.cantidad * p.precioUnitario) + ',' + (p.estadoStock || '') + '\n'
      })
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      var link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'pedido_' + (pedido.numeroPedido || 'export') + '_' + Date.now() + '.csv'
      link.click()
      props.onClose()
    } catch (e) { alert('Error exportando: ' + e.message); props.onClose() }
  }

  var exportDOC = function () {
    alert('Export DOC: Generando documento...')
    props.onClose()
  }

  var exportHTML = function () {
    try {
      var prods = pedido.productos
      if (!prods.length) { alert('No hay productos para exportar'); props.onClose(); return }
      var html = '<table border="1"><thead><tr><th>Codigo</th><th>Descripcion</th><th>Cant</th><th>Precio</th><th>Total</th></tr></thead><tbody>'
      prods.forEach(function (p) {
        html += '<tr><td>' + p.codigo + '</td><td>' + (p.descripcion || '') + '</td><td>' + p.cantidad + '</td><td>' + p.precioUnitario + '</td><td>' + (p.cantidad * p.precioUnitario) + '</td></tr>'
      })
      html += '</tbody></table>'
      var win = window.open('', '_blank')
      win.document.write(html)
      win.document.close()
      props.onClose()
    } catch (e) { alert('Error: ' + e.message); props.onClose() }
  }

  return (
    <div class="export-menu">
      <button class="export-menu-item" onClick={exportXLSX} title="Exportar a CSV/Excel">📊 XLSX</button>
      <button class="export-menu-item" onClick={exportDOC} title="Exportar a Word">📄 DOC</button>
      <Show when={isDistPage()}>
        <button class="export-menu-item" onClick={exportHTML} title="Ver distribución">🌐 HTML</button>
      </Show>
    </div>
  )
}

export var Sidebar = function () {
  var navigate = useNavigate()
  var location = useLocation()
  var pedido = usePedido()
  var theme = useTheme()
  var toggleTheme = theme.toggleTheme
  var darkTheme = theme.darkTheme

  var isDistributionPage = function () { return location.pathname === '/distribucion' }
  var showExport = createSignal(false)
  var showHistory = createSignal(false)
  var stockAlerts = createMemo(function () {
    var prods = pedido.productos
    if (!prods.length) return 0
    return prods.filter(function (p) { return p.estadoStock === 'Agotado' || p.estadoStock === 'AJ' }).length
  })
  var isHomePage = function () { return location.pathname === '/' }
  var hasProducts = function () { return pedido.productos.length > 0 }
  var hasPendingCuotas = function () { return pedido.tareaPendiente }

  var handleAction = function (action) {
    switch (action) {
      case 'chart':
        if (!hasProducts()) { alert('Primero carga productos para ver el analisis grafico'); return }
        if (window.showChartModal) { window.showChartModal() }
        break
      case 'dist':
        if (isHomePage()) {
          if (pedido.tieneDistPendiente()) {
            var continuar = confirm('Hay una DISTRIBUCION en proceso')
            if (!continuar) return
          } else {
            pedido.iniciarDistribucion()
            pedido.setTareaPendiente(true)
          }
          navigate('/distribucion')
        }
        break
      case 'stock':
        var prodsStock = pedido.productos.filter(function (p) { return p.estadoStock === 'Agotado' || p.estadoStock === 'AJ' })
        if (prodsStock.length === 0) {
          alert('Todos los productos tienen stock disponible')
        } else {
          var agotados = prodsStock.filter(function (p) { return p.estadoStock === 'Agotado' }).length
          var porConfirmar = prodsStock.filter(function (p) { return p.estadoStock === 'AJ' }).length
          var lista = prodsStock.slice(0, 5).map(function (p) { return p.codigo + ' ' + (p.descripcion || '').slice(0, 25) + ' (' + p.estadoStock + ')' }).join('\n')
          var mas = prodsStock.length > 5 ? '...y ' + (prodsStock.length - 5) + ' mas' : ''
          alert('STOCK BAJO\nAgotados: ' +agotados+ '\nPor confirmar: '+porConfirmar+ '\n' +lista +mas)
        }
        break
      case 'guardar':
        if (guardarEstado()) { alert('Estado guardado correctamente') } else { alert('Error al guardar') }
        break
      case 'cargar':
        showHistory[1](true)
        break
      case 'nuevo':
        if (hasProducts()) { if (confirm('Resetear y cargar nuevo pedido?')) { pedido.resetearPedido() } }
        break
      case 'theme':
        toggleTheme()
        break
    }
  }

  var toggleExport = function (e) { e.stopPropagation(); showExport[1](!showExport[0]()) }
  var closeExport = function () { showExport[1](false) }

  createEffect(function () {
    if (showExport[0]()) {
      var handleClickOutside = function (e) { if (!e.target.closest('.export-menu-wrapper')) { closeExport() } }
      document.addEventListener('click', handleClickOutside)
      onCleanup(function () { return document.removeEventListener('click', handleClickOutside) })
    }
  })

  return (
    <aside class="g360-sidebar">
      <div class="sidebar-inner">
        <div class="export-menu-wrapper">
          <button class="sidebar-btn export-btn" onClick={toggleExport} title="Exportar pedido"><span class="sidebar-icon">📥</span></button>
          <Show when={showExport[0]()}><ExportMenuInline onClose={closeExport} /></Show>
        </div>
        <button class="sidebar-btn" onClick={toggleTheme} title="Cambiar tema"><span class="sidebar-icon">{darkTheme() ? '☀️' : '🌙'}</span></button>
        <Show when={!isHomePage()}><button class="sidebar-btn" onClick={function () { return navigate('/') }} title="Volver"><span class="sidebar-icon">↩️</span></button></Show>
        <For each={sidebarActions}>
          {function (item) {
            return (
              <Show when={item.id !== 'analisis' || isHomePage()}>
                <Show when={item.id !== 'cuotas' || isHomePage()}>
                  <button class={item.id === 'stock' && stockAlerts() > 0 ? 'sidebar-btn has-badge' : 'sidebar-btn'}
                    onClick={function () { return handleAction(item.action) }} title={item.tooltip} data-action={item.action} data-icon={item.icon}>
                    <span class="sidebar-icon">{item.icon}</span>
                    <Show when={item.id === 'cuotas' && hasPendingCuotas()}><span class="sidebar-badge-pending">⚠️</span></Show>
                  </button>
                </Show>
              </Show>
            )
          }}
        </For>
      </div>
      <HistoryModal show={showHistory[0]()} historial={obtenerHistorial()} onClose={function () { return showHistory[1](false) }}
        onSelect={function (item) { if (cargarDesdeHistorial(item)) { alert('Estado cargado correctamente') } else { alert('Error al cargar') } }} />
    </aside>
  )
}

export default Sidebar