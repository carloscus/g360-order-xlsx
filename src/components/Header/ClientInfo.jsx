import { createSignal, createEffect, Show, For, onCleanup } from 'solid-js'
import { useClientes } from '../../hooks/useClientes'

export const ClientInfo = (props) => {
  const { resultados, cargando: cargandoClientes, buscar: buscarClientes, limpiar: limpiarClientes } = useClientes()

  const [showDropdown, setShowDropdown] = createSignal(false)
  const [inputCliente, setInputCliente] = createSignal(props.documento || props.idCliente || '')
  const [clienteSeleccionado, setClienteSeleccionado] = createSignal(false)

  let dropdownRef = null
  let inputRef = null

  const seleccionarCliente = (cliente) => {
    const trimZeros = (s) => (s || '').replace(/^0+/, '') || ''
    // Cliente
    props.onClienteChange(cliente.nom_cliente || '')
    props.onDocumentoChange(cliente.doc_cliente || '')
    props.onIdClienteChange(trimZeros(cliente.id_cliente))
    props.onSucursalChange(cliente.nom_sucursal || 'PRINCIPAL')
    // Vendedor - preservar ceros iniciales (ej: 031)
    props.onVendedorChange(cliente.nom_vendedor || '')
    props.onIdVendedorChange?.(cliente.id_vendedor || '')
    // Email vendedor: vacío, el vendedor lo escribe manual
    props.onEmailVendedorChange('')

    setInputCliente(trimZeros(cliente.doc_cliente || cliente.id_cliente))
    setClienteSeleccionado(true)
    setShowDropdown(false)
    limpiarClientes()
  }

  const handleInputCliente = (e) => {
    const val = e.currentTarget.value
    setInputCliente(val)
    setClienteSeleccionado(false)
    props.onClienteChange('')
    props.onDocumentoChange('')
    props.onIdClienteChange('')
    props.onSucursalChange('PRINCIPAL')
    props.onVendedorChange('')
    props.onIdVendedorChange?.('')
    props.onEmailVendedorChange('')

    if (val && val.trim().length >= 2) {
      setShowDropdown(true)
      buscarClientes(val)
    } else {
      setShowDropdown(false)
      limpiarClientes()
    }
  }

  const limpiarCliente = () => {
    setInputCliente('')
    setClienteSeleccionado(false)
    props.onClienteChange('')
    props.onDocumentoChange('')
    props.onIdClienteChange('')
    props.onSucursalChange('PRINCIPAL')
    props.onVendedorChange('')
    props.onIdVendedorChange?.('')
    props.onEmailVendedorChange('')
    limpiarClientes()
  }

  const handleClickOutside = (e) => {
    if (dropdownRef && !dropdownRef.contains(e.target) && inputRef !== e.target) {
      setShowDropdown(false)
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('click', handleClickOutside)
    onCleanup(() => document.removeEventListener('click', handleClickOutside))
  }

  return (
    <>
      {/* === BÚSQUEDA DE CLIENTE === */}
      <Show when={!clienteSeleccionado()}>
        <div class="client-form-grid">
          <div class="form-group span-2" style="position: relative;">
            <label for="inputCliente">RUC o Código Cliente:</label>
            <input
              ref={inputRef}
              id="inputCliente"
              name="inputCliente"
              type="text"
              class="high-contrast-input"
              value={inputCliente()}
              onInput={handleInputCliente}
              onFocus={() => { if (inputCliente().length >= 2) setShowDropdown(true) }}
              placeholder="Escriba RUC (11 dígitos) o código del cliente..."
              autocomplete="off"
            />
            <Show when={cargandoClientes()}>
              <span class="search-spinner">Buscando...</span>
            </Show>
            <Show when={showDropdown() && resultados().length > 0}>
              <div ref={dropdownRef} class="autocomplete-dropdown">
                <For each={resultados()}>
                  {(item) => (
                    <div class="autocomplete-item" onClick={() => seleccionarCliente(item)}>
                      <span class="ac-nombre">{item.nom_cliente}</span>
                      <span class="ac-detail">
                        <span class="ac-badge">{item.id_cliente}</span>
                        <span class="ac-ruc">RUC: {item.doc_cliente}</span>
                        <Show when={item.nom_sucursal}>
                          <span class="ac-sucursal">{item.nom_sucursal}</span>
                        </Show>
                      </span>
                      <Show when={item.nom_vendedor}>
                        <span class="ac-vendedor">Vendedor: {item.nom_vendedor}</span>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </Show>
            <Show when={showDropdown() && resultados().length === 0 && !cargandoClientes()}>
              <div class="autocomplete-dropdown">
                <div class="autocomplete-empty">No se encontraron resultados</div>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      {/* === CLIENTE SELECCIONADO === */}
      <Show when={clienteSeleccionado()}>
        <div class="seleccionado-card">
          <div class="seleccionado-grid">
            <div class="seleccionado-dato">
              <span class="dato-label">CLIENTE</span>
              <span class="dato-valor">{props.cliente}</span>
            </div>
            <div class="seleccionado-dato">
              <span class="dato-label">RUC</span>
              <span class="dato-valor mono">{props.documento}</span>
            </div>
            <div class="seleccionado-dato">
              <span class="dato-label">CÓDIGO CLIENTE</span>
              <span class="dato-valor mono">{props.idCliente}</span>
            </div>
            <div class="seleccionado-dato">
              <span class="dato-label">CÓDIGO VENDEDOR</span>
              <span class="dato-valor mono">{props.idVendedor}</span>
            </div>
            <div class="seleccionado-dato">
              <span class="dato-label">VENDEDOR</span>
              <span class="dato-valor">{props.vendedor}</span>
            </div>
            <Show when={props.emailVendedor}>
              <div class="seleccionado-dato">
                <span class="dato-label">EMAIL</span>
                <span class="dato-valor mono">{props.emailVendedor}@cipsa.com.pe</span>
              </div>
            </Show>
          </div>
          <button class="btn-limpiar" onClick={limpiarCliente} title="Cambiar cliente">×</button>
        </div>
      </Show>

      {/* === CAMPOS MANUALES === */}
      <div class="client-form-grid" style="margin-top: 12px;">
        <div class="form-group">
          <label for="numeroPedido">N° Pedido RPE:</label>
          <input
            id="numeroPedido"
            name="numeroPedido"
            type="text"
            class="high-contrast-input"
            value={props.numeroPedido}
            onInput={(e) => props.onNumeroPedidoChange(e.currentTarget.value)}
            placeholder="Ej: 882145"
          />
        </div>
        <div class="form-group">
          <label for="sucursal">Sucursal <span class="optional-tag">(opcional)</span>:</label>
          <input
            id="sucursal"
            name="sucursal"
            type="text"
            class="high-contrast-input"
            value={props.sucursal}
            onInput={(e) => props.onSucursalChange(e.currentTarget.value)}
            placeholder="PRINCIPAL"
          />
        </div>
        <div class="form-group">
          <label for="emailVendedor">Correo Vendedor:</label>
          <div class="input-email-group">
            <input
              id="emailVendedor"
              name="emailVendedor"
              type="text"
              class="high-contrast-input"
              value={props.emailVendedor}
              onInput={(e) => props.onEmailVendedorChange(e.currentTarget.value)}
              placeholder=" Ej: jperez"
            />
            <span class="email-domain">@cipsa.com.pe</span>
          </div>
        </div>
        <div class="form-group">
          <label for="telefonoVendedor">Contacto Vendedor:</label>
          <input
            id="telefonoVendedor"
            name="telefonoVendedor"
            type="tel"
            class="high-contrast-input"
            value={props.telefonoVendedor}
            onInput={(e) => props.onTelefonoVendedorChange(e.currentTarget.value)}
            placeholder="+51 9XX XXX XXX"
          />
        </div>
      </div>
    </>
  )
}
