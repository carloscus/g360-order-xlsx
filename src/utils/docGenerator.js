import initialData from '../data/initialData.json'

const { condiciones, empresa } = initialData.config

export const generarCartaWord = (data) => {
  const { cliente, documento, numeroPedido, vendedor, emailVendedor, telefonoVendedor, productos, totales } = data

  const fecha = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const subtotal = totales.subtotal
  const igv = totales.totalIGV - subtotal
  const total = totales.totalIGV

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
  <meta charset="utf-8">
  <title>Cotizaci\u00f3n CIPSA - ${cliente || 'Cliente'}</title>
  <meta name="Author" content="${empresa.nombre}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 1.5cm 2cm 2cm 2cm; }

    body {
      font-family: 'Calibri', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.2;
      color: #000000;
      background: white;
    }

    .header-vba {
      margin-bottom: 6px;
      border-bottom: 1px solid #CCCCCC;
      padding-bottom: 5px;
    }
    .logo-img {
      width: 50px;
      height: auto;
      display: block;
      margin-bottom: 3px;
    }
    .empresa-nombre {
      font-size: 12pt;
      font-weight: 700;
      color: #333333;
    }

    .doc-line {
      margin-bottom: 6px;
      font-size: 11pt;
      white-space: pre;
    }

    .cliente-bloque {
      margin-bottom: 8px;
      line-height: 1.2;
    }
    .cliente-label {
      font-weight: 700;
      color: #333333;
      margin-bottom: 0;
    }
    .cliente-nombre {
      font-weight: 600;
      margin: 0;
    }
    .cliente-doc {
      font-size: 10pt;
      color: #666;
      margin: 0;
    }
    .saludo {
      font-weight: 700;
      margin-bottom: 6px;
    }

    .introduccion {
      margin-bottom: 10px;
      font-size: 11pt;
      line-height: 1.3;
    }

    .cierre {
      margin-top: 10px;
      margin-bottom: 15px;
      font-size: 11pt;
    }

    .product-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 9pt;
      border: 1px solid #CCCCCC;
    }
    .product-table th {
      background: #333333;
      color: #FFFFFF;
      padding: 1px 2px;
      text-align: center;
      font-weight: 700;
      font-size: 8pt;
      border: 1px solid #333333;
    }
    .product-table td {
      padding: 1px 2px;
      border: 1px solid #CCCCCC;
      text-align: center;
      font-size: 9pt;
    }
    .product-table td.text-left { text-align: left; padding-left: 4px; }
    .product-table td.text-right { text-align: right; padding-right: 4px; }
    .product-table td.text-center { text-align: center; }
    .product-table tr:nth-child(even) {
      background: #F0F0F0;
    }

    .totals-section {
      margin-left: auto;
      width: 260px;
      margin-bottom: 10px;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #CCCCCC;
    }
    .totals-table td {
      padding: 4px 8px;
      border: 1px solid #CCCCCC;
    }
    .totals-table .label {
      font-weight: 700;
      text-align: right;
      color: #333333;
      background: #FFFFFF;
      font-size: 10pt;
    }
    .totals-table .value {
      text-align: right;
      font-weight: 700;
      font-size: 10pt;
      color: #FF0000;
    }
    .totals-table .igv-row .label {
      font-size: 10pt;
      color: #333333;
    }
    .totals-table .igv-row .value {
      font-size: 10pt;
      color: #FF0000;
    }

    .conditions {
      margin-top: 10px;
      margin-bottom: 10px;
    }
    .conditions-title {
      font-size: 10pt;
      font-weight: 700;
      color: #333333;
      margin-bottom: 4px;
    }
    .conditions-list {
      font-size: 9pt;
      list-style: none;
      padding-left: 0;
    }
    .conditions-list li {
      margin: 2px 0;
      color: #000000;
      padding-left: 15px;
      position: relative;
    }
    .conditions-list li:before {
      content: "\\07";
      position: absolute;
      left: 0;
      font-weight: bold;
    }

    .firma {
      margin-top: 20px;
    }
    .firma-line {
      border-top: 1px solid #333333;
      width: 250px;
      margin-top: 25px;
      margin-bottom: 5px;
    }
    .firma-nombre {
      font-weight: 700;
      font-size: 11pt;
      color: #333333;
    }
    .firma-cargo {
      font-size: 10pt;
      color: #333333;
    }
    .firma-contacto {
      font-size: 9pt;
      color: #333333;
      margin-top: 5px;
    }

    .footer-vba {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 8pt;
      color: #666;
      border-top: 1px solid #ccc;
      padding-top: 5px;
    }
  </style>
</head>
<body>
  <div class="header-vba">
    <img src="${empresa.logo}" alt="${empresa.nombre}" class="logo-img">
    <p class="empresa-nombre">${empresa.nombre}</p>
  </div>

  <p class="doc-line">COTIZACI\u00d3N N\u00b0: ${numeroPedido || '______'}\t\t\t\t\t${fecha}</p>

  <div class="cliente-bloque">
    <p class="cliente-label">SE\u00d1OR(ES):</p>
    <p class="cliente-nombre">${cliente || '______________________________'}</p>
    <p class="cliente-doc">RUC: ${documento || '________________'}</p>
  </div>

  <p class="saludo">Estimados Se\u00f1ores:</p>

  <div class="introduccion">
    <p>Es un placer dirigirnos a usted para presentar nuestra propuesta comercial correspondiente a los productos de inter\u00e9s que hemos conversado previamente.</p>
    <p style="margin-top: 5px;">A continuaci\u00f3n detallamos las condiciones y precios vigentes para su consideraci\u00f3n:</p>
  </div>

  <table class="product-table">
    <thead>
      <tr>
        <th style="width: 5%;">ITEM</th>
        <th style="width: 10%;">C\u00d3DIGO</th>
        <th style="width: 40%;">DESCRIPCI\u00d3N</th>
        <th style="width: 8%;">CANT.</th>
        <th style="width: 7%;">U/M</th>
        <th style="width: 15%;">P. UNIT.</th>
        <th style="width: 15%;">TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${(productos || []).map((p, i) => {
        const precioUnit = p.precioUnitario * (1 - p.descuento1/100) * (1 - p.descuento2/100)
        const totalLinea = precioUnit * p.cantidad
        return `
        <tr>
          <td class="text-center">${i + 1}</td>
          <td class="text-center">${p.codigo || ''}</td>
          <td class="text-left">${p.descripcion || ''}</td>
          <td class="text-center">${p.cantidad || 0}</td>
          <td class="text-center">${p.unidadMedida || ''}</td>
          <td class="text-right">S/ ${precioUnit.toFixed(2)}</td>
          <td class="text-right">S/ ${totalLinea.toFixed(2)}</td>
        </tr>
        `
      }).join('')}
    </tbody>
  </table>

  <div class="totals-section">
    <table class="totals-table">
      <tr>
        <td class="label">SUBTOTAL</td>
        <td class="value">S/ ${subtotal.toFixed(2)}</td>
      </tr>
      <tr class="igv-row">
        <td class="label">IGV (18%)</td>
        <td class="value">S/ ${igv.toFixed(2)}</td>
      </tr>
      <tr>
        <td class="label" style="font-size: 12pt;">TOTAL</td>
        <td class="value" style="font-size: 12pt;">S/ ${total.toFixed(2)}</td>
      </tr>
    </table>
  </div>

  <div class="conditions">
    <p class="conditions-title">CONDICIONES COMERCIALES</p>
    <ul class="conditions-list">
      <li><strong>Validez de la oferta:</strong> ${condiciones.validez} calendario contados a partir de la fecha de emisi\u00f3n</li>
      <li><strong>Forma de pago:</strong> ${condiciones.tipoPago}</li>
      <li><strong>Plazo de entrega:</strong> ${condiciones.plazoEntrega}</li>
      <li><strong>Garant\u00eda:</strong> ${condiciones.garantia}</li>
      <li><strong>Precios:</strong> Incluyen IGV y est\u00e1n sujetos a variaci\u00f3n sin previo aviso</li>
    </ul>
  </div>

  <div class="cierre">
    <p>Quedamos atentos a sus comentarios.</p>
    <p style="margin-top: 5px;">Sin otro particular por el momento, nos despedimos cordialmente.</p>
  </div>

  <div class="firma">
    <p>Atentamente,</p>
    <div class="firma-line"></div>
    <p class="firma-nombre">${vendedor || 'Vendedor'}</p>
    <p class="firma-cargo">Representante de Ventas</p>
    <p class="firma-contacto">T: ${telefonoVendedor || '______'} | E: ${emailVendedor || '______'}</p>
  </div>

  <div class="footer-vba">
    <p>${empresa.direccion} | RUC: ${documento || '______'} | ${empresa.website || ''}</p>
  </div>
</body>
</html>
  `

  const blob = new Blob([htmlContent], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Cotizacion-${(cliente || 'Cliente').replace(/\s+/g, '-')}.doc`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
