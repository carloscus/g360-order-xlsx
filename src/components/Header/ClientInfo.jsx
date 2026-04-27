import React from 'react'

export const ClientInfo = ({ 
  cliente, 
  documento, // DNI o RUC
  numeroPedido, 
  vendedor, 
  emailVendedor, 
  telefonoVendedor,
  onClienteChange, 
  onDocumentoChange,
  onNumeroPedidoChange,
  onVendedorChange,
  onEmailVendedorChange,
  onTelefonoVendedorChange
}) => {
  const isRuc = documento?.length > 8;

  return (
    <div className="client-form-grid">
      <div className="form-group span-2">
        <label htmlFor="cliente">Cliente / Razón Social:</label>
        <input
          id="cliente"
          name="cliente"
          type="text"
          className="high-contrast-input"
          value={cliente}
          onChange={(e) => onClienteChange(e.target.value)}
          placeholder="Ej: Inversiones Globales S.A.C."
        />
      </div>
      <div className="form-group">
        <label htmlFor="documento">
          Documento ({isRuc ? 'RUC' : 'DNI'}):
        </label>
        <div className="input-with-badge">
          <input
            id="documento"
            name="documento"
            type="text"
            maxLength="11"
            className="high-contrast-input"
            value={documento}
            onChange={(e) => onDocumentoChange(e.target.value.replace(/\D/g, ''))}
            placeholder="8 o 11 dígitos"
          />
          <span className={`doc-badge ${isRuc ? 'ruc' : 'dni'}`}>
            {isRuc ? 'RUC' : 'DNI'}
          </span>
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="numeroPedido">N° Pedido RPE:</label>
        <input
          id="numeroPedido"
          name="numeroPedido"
          type="text"
          className="high-contrast-input"
          value={numeroPedido}
          onChange={(e) => onNumeroPedidoChange(e.target.value)}
          placeholder="Ej: 882145"
        />
      </div>
      <div className="form-group">
        <label htmlFor="vendedor">Vendedor Responsable:</label>
        <input
          id="vendedor"
          name="vendedor"
          type="text"
          className="high-contrast-input"
          value={vendedor}
          onChange={(e) => onVendedorChange(e.target.value)}
          placeholder="Nombre del Vendedor"
        />
      </div>
      <div className="form-group">
        <label htmlFor="emailVendedor">Email Corporativo:</label>
        <input
          id="emailVendedor"
          name="emailVendedor"
          type="email"
          className="high-contrast-input"
          value={emailVendedor}
          onChange={(e) => onEmailVendedorChange(e.target.value)}
          placeholder="vendedor@cipsa.com"
        />
      </div>
      <div className="form-group">
        <label htmlFor="telefonoVendedor">Contacto Directo:</label>
        <input
          id="telefonoVendedor"
          name="telefonoVendedor"
          type="tel"
          className="high-contrast-input"
          value={telefonoVendedor}
          onChange={(e) => onTelefonoVendedorChange(e.target.value)}
          placeholder="+51 9XX XXX XXX"
        />
      </div>
    </div>
  )
}