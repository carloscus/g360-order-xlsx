/**
 * Generador de Carta Corporativa (Cotización) en formato HTML
 * Diseñado para ser impreso como PDF o guardado como reporte.
 */

export const generarCartaCorporativa = (datos) => {
  const { cliente, documento, numeroPedido, vendedor, emailVendedor, telefonoVendedor, productos, totales } = datos
  const now = new Date()
  const fechaStr = now.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotización - ${cliente || 'Sin Cliente'}</title>
  <style>
    :root {
      --primary: #00d084;
      --secondary: #1e293b;
      --text: #334155;
      --border: #e2e8f0;
    }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: var(--text); padding: 40px; line-height: 1.6; }
    .header { border-bottom: 2px solid var(--primary); padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
    .logo { height: 60px; }
    .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .info-box { border: 1px solid var(--border); padding: 15px; border-radius: 8px; }
    .info-box h3 { margin-top: 0; color: var(--primary); font-size: 14px; text-transform: uppercase; }
    .info-box p { margin: 5px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: var(--secondary); color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
    td { padding: 10px; border-bottom: 1px solid var(--border); font-size: 13px; }
    .totals { margin-top: 20px; text-align: right; }
    .total-row { display: flex; justify-content: flex-end; gap: 50px; padding: 5px 0; }
    .total-row.grand { border-top: 2px solid var(--primary); margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 18px; color: var(--primary); }
    .footer { margin-top: 50px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid var(--border); padding-top: 20px; }
    .btn-print { background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-bottom: 20px; }
    @media print { .btn-print { display: none; } }
  </style>
</head>
<body>
  <button class="btn-print" onclick="window.print()">🖨️ Imprimir Carta / Guardar PDF</button>
  <div class="header">
    <div>
      <h1 style="margin:0; color: var(--secondary);">COTIZACIÓN CORPORATIVA</h1>
      <p style="margin:5px 0; color: var(--primary); font-weight: bold;">CIPSA OrderX | Inteligencia ERP</p>
    </div>
    <img src="/logo-cipsa.svg" class="logo" alt="CIPSA Logo">
  </div>

  <div class="info-section">
    <div class="info-box">
      <h3>Información del Cliente</h3>
      <p><strong>Cliente:</strong> ${cliente || '-'}</p>
      <p><strong>RUC/DOC:</strong> ${documento || '-'}</p>
      <p><strong>N° Pedido:</strong> ${numeroPedido || '-'}</p>
    </div>
    <div class="info-box">
      <h3>Información del Asesor</h3>
      <p><strong>Asesor:</strong> ${vendedor || '-'}</p>
      <p><strong>Email:</strong> ${emailVendedor || '-'}</p>
      <p><strong>Teléfono:</strong> ${telefonoVendedor || '-'}</p>
    </div>
  </div>

  <p>Estimados señores de <strong>${cliente || 'su representada'}</strong>,</p>
  <p>De acuerdo a lo conversado, presentamos la propuesta económica detallada para el pedido en mención:</p>

  <table>
    <thead>
      <tr>
        <th>SKU</th>
        <th>Descripción</th>
        <th>Cant.</th>
        <th>U/M</th>
        <th>P. Unit.</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${productos.map(p => `
        <tr>
          <td>${p.codigo}</td>
          <td>${p.descripcion}</td>
          <td>${p.cantidad}</td>
          <td>${p.unidadMedida || 'UND'}</td>
          <td>S/ ${p.precioUnitario.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
          <td>S/ ${p.valorVenta.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span>SUBTOTAL VENTAS:</span>
      <span>S/ ${totales.subtotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
    </div>
    <div class="total-row">
      <span>IGV (18%):</span>
      <span>S/ (INCLUIDO)</span>
    </div>
    <div class="total-row grand">
      <span>TOTAL GENERAL (S/):</span>
      <span>S/ ${totales.totalIGV.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
    </div>
  </div>

  <p style="margin-top: 40px;">Quedamos a su entera disposición para cualquier consulta adicional.</p>
  
  <div class="footer">
    <p>Este documento fue generado automáticamente por CIPSA OrderX - ${fechaStr}</p>
    <p>Calle Los Plateros 123, Urb. Vulcano, Ate - Lima, Perú</p>
  </div>
</body>
</html>
  `

  const blob = new Blob([htmlContent], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `CARTA_CIPSA_${numeroPedido || 'COT'}_${cliente?.replace(/\s/g, '_') || 'CLIENTE'}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
