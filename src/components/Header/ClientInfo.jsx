export const ClientInfo = (props) => {
  const isRuc = () => props.documento?.length > 8;

  return (
    <div class="client-form-grid">
      <div class="form-group span-2">
        <label for="cliente">Cliente / Razón Social:</label>
        <input
          id="cliente"
          name="cliente"
          type="text"
          class="high-contrast-input"
          value={props.cliente}
          onInput={(e) => props.onClienteChange(e.currentTarget.value)}
          placeholder="Ej: Inversiones Globales S.A.C."
        />
      </div>
      <div class="form-group">
        <label for="documento">
          Documento ({isRuc() ? 'RUC' : 'DNI'}):
        </label>
        <div class="input-with-badge">
          <input
            id="documento"
            name="documento"
            type="text"
            maxLength="11"
            class="high-contrast-input"
            value={props.documento}
            onInput={(e) => props.onDocumentoChange(e.currentTarget.value.replace(/\D/g, ''))}
            placeholder="8 o 11 dígitos"
          />
          <span class={`doc-badge ${isRuc() ? 'ruc' : 'dni'}`}>
            {isRuc() ? 'RUC' : 'DNI'}
          </span>
        </div>
      </div>
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
        <label for="vendedor">Vendedor Responsable:</label>
        <input
          id="vendedor"
          name="vendedor"
          type="text"
          class="high-contrast-input"
          value={props.vendedor}
          onInput={(e) => props.onVendedorChange(e.currentTarget.value)}
          placeholder="Nombre del Vendedor"
        />
      </div>
      <div class="form-group">
        <label for="emailVendedor">Email Corporativo:</label>
        <input
          id="emailVendedor"
          name="emailVendedor"
          type="email"
          class="high-contrast-input"
          value={props.emailVendedor}
          onInput={(e) => props.onEmailVendedorChange(e.currentTarget.value)}
          placeholder="vendedor@cipsa.com"
        />
      </div>
      <div class="form-group">
        <label for="telefonoVendedor">Contacto Directo:</label>
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
  )
}