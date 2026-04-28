import { createSignal, createEffect, createMemo, onCleanup, onMount, For, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { usePedido } from '../hooks/usePedido'
import { ClientInfo } from '../components/Header/ClientInfo'
import { ProductTable } from '../components/ProductTable'
import { AuditPanel } from '../components/AuditPanel'
import { ChartModal } from '../components/ChartModal'; import { SubtotalCard, TotalIGVCard, AvailableTotalCard } from '../components/TotalsPanel'
import { useTheme } from '../context/ThemeContext'


const HomePage = () => {
  const { darkTheme, toggleTheme } = useTheme()
  const [soloConStock, setSoloConStock] = createSignal(false)
  const [successPulse, setSuccessPulse] = createSignal(false)
  const navigate = useNavigate()
  const pedido = usePedido()

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
    <>
      <div class="vertical-layout fade-in-up">
        <h1 class="page-title text-3xl font-bold mb-6">📊 PEDIDOS Y COTIZACIONES G360</h1>

        <section class="general-data-section g360-panel">
          <h2>📋 DATOS DEL CLIENTE</h2>
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

        <Show when={pedido.productos.length > 0}>
          <section class="totals-summary-section g360-panel">
            <h2>📊 VALORIZACIÓN DEL PEDIDO</h2>
            <div class="totals-cards-grid">
              <SubtotalCard subtotal={pedido.totales?.subtotal || 0} />
              <TotalIGVCard totalIGV={pedido.totales?.totalIGV || 0} />
              <AvailableTotalCard totalDisponible={pedido.totales?.totalDisponible || 0} totalIGV={pedido.totales?.totalIGV || 0} />
            </div>
          </section>
        </Show>

        <section class="ERP-input-section g360-panel">
          <div class="flex-header">
            <label for="import-area" class="panel-title"><h2>📥 IMPORTAR DATOS</h2></label>
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
          <textarea
            id="import-area"
            class="high-contrast-input ERP-textarea"
            placeholder="Pegue aquí los datos del pedido..."
            onPaste={(e) => handleNuevaCarga(e.clipboardData.getData('text'))}
            rows={1}
          />
        </section>

        <Show when={productosFiltrados().length > 0}>
          <section class={`product-table-section g360-panel ${successPulse() ? 'success-pulse' : ''}`}>
            <h2>📦 DETALLE DE PARTIDAS</h2>
            <ProductTable productos={productosFiltrados()} totales={pedido.totales} />
          </section>

          <section class="audit-section g360-panel">
            <AuditPanel productos={productosFiltrados()} />
          </section>
        </Show>

        <ChartModal show={showChartModal()} onClose={() => setShowChartModal(false)} productos={pedido.productos} />

        <Show when={showAlertPendiente()}>
          <div class="modal-overlay">
            <div class="alert-modal">
              <div class="alert-icon">⚠️</div>
              <h3>¿Tienes un cálculo pendiente?</h3>
              <p>Ya tienes un pedido con distribución de cuotas. ¿Qué deseas hacer?</p>
              <div class="alert-buttons">
                <button onClick={confirmarNuevoPedido} class="btn-alert btn-danger">🗑️ Eliminar y calcular nuevo</button>
                <button onClick={descartaERPndiente} class="btn-alert btn-secondary">Mantener actual</button>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </>
  )
}

export default HomePage
