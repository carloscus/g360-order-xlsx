import { createSignal, createEffect, createMemo, onCleanup, onMount, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { usePedido } from '../hooks/usePedido'
import { ClientInfo } from '../components/Header/ClientInfo'
import { ProductTable } from '../components/ProductTable'
import { AuditPanel } from '../components/AuditPanel'
import { ChartModal } from '../components/ChartModal'
import { SubtotalCard, TotalIGVCard, AvailableTotalCard } from '../components/TotalsPanel'
import { AlertPendiente } from '../components/AlertPendiente'
import { useTheme } from '../context/ThemeContext'


const HomePage = () => {
  const { darkTheme, toggleTheme } = useTheme()
  const [soloConStock, setSoloConStock] = createSignal(false)
  const [successPulse, setSuccessPulse] = createSignal(false)
  const [pasteFlash, setPasteFlash] = createSignal(false)
  const navigate = useNavigate()
  const pedido = usePedido()

  const [showAlertPendiente, setShowAlertPendiente] = createSignal(false)
  const [nuevosProductos, setNuevosProductos] = createSignal(null)

  const [textoErp, setTextoErp] = createSignal('')

  const handleNuevaCarga = (texto) => {
    setTextoErp(texto)
    setPasteFlash(true)
    setTimeout(() => setPasteFlash(false), 800)

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

  const descartaERPndiente = () => {
    setShowAlertPendiente(false)
    setNuevosProductos(null)
  }

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

  const [showChartModal, setShowChartModal] = createSignal(false)

  onMount(() => {
    window.showChartModal = () => {
      if (pedido.productos.length > 0) {
        setShowChartModal(true)
      } else {
        alert('⚠️ Carga productos primero')
      }
    }
  })

  return (
    <div class="vertical-layout fade-in-up">
      <h1 class="page-title text-3xl font-bold mb-6">PEDIDOS Y COTIZACIONES G360</h1>

      <section class="general-data-section g360-panel">
        <h2>DATOS DEL CLIENTE</h2>
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

      <section class="ERP-input-section g360-panel">
        <div class="flex-header">
          <label for="import-area" class="panel-title"><h2>IMPORTAR DATOS</h2></label>
          <div class="stock-toggle">
            <input
              type="checkbox"
              id="filterStock"
              checked={soloConStock()}
              onInput={(e) => setSoloConStock(e.currentTarget.checked)}
            />
            <label for="filterStock">Filtrar por Disponibilidad</label>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <textarea
            id="import-area"
            class={`high-contrast-input ERP-textarea${pasteFlash() ? ' paste-success' : ''}`}
            placeholder="Pegue aquí los datos del pedido (Ctrl+V)..."
            value={textoErp()}
            onInput={(e) => setTextoErp(e.currentTarget.value)}
            onPaste={(e) => {
              e.preventDefault()
              const texto = e.clipboardData.getData('text/plain') || e.clipboardData.getData('text')
              setTextoErp(texto)
              handleNuevaCarga(texto)
            }}
            rows={textoErp() ? 6 : 3}
          />
          <Show when={pasteFlash()}>
            <span style={{
              position: 'absolute',
              right: '12px',
              top: '12px',
              "font-size": '1.2rem',
              "pointer-events": 'none',
              animation: 'fadeInUp 0.3s ease-out'
            }}></span>
          </Show>
        </div>
      </section>

      <Show when={pedido.productos.length > 0}>
        <section class="totals-summary-section g360-panel">
          <h2>VALORIZACIÓN DEL PEDIDO</h2>
          <div class="totals-cards-grid">
            <SubtotalCard subtotal={pedido.totales?.subtotal || 0} />
            <TotalIGVCard totalIGV={pedido.totales?.totalIGV || 0} />
            <AvailableTotalCard totalDisponible={pedido.totales?.totalDisponible || 0} totalIGV={pedido.totales?.totalIGV || 0} />
          </div>
        </section>
      </Show>

      <Show when={productosFiltrados().length > 0}>
        <section class={`product-table-section g360-panel ${successPulse() ? 'success-pulse' : ''}`}>
          <h2>DETALLE DE PARTIDAS</h2>
          <ProductTable productos={productosFiltrados()} totales={pedido.totales} />
        </section>

        <section class="audit-section g360-panel">
          <AuditPanel productos={productosFiltrados()} />
        </section>
      </Show>

      <ChartModal show={showChartModal()} onClose={() => setShowChartModal(false)} productos={pedido.productos} />

      <AlertPendiente
        show={showAlertPendiente()}
        onConfirm={confirmarNuevoPedido}
        onDiscard={descartaERPndiente}
      />
    </div>
  )
}

export default HomePage
