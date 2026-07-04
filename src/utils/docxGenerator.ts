/**
 * Generador de documentos Word (.docx) para cotizaciones CIPSA
 * Formato corporativo con logo, tabla de productos y condiciones comerciales
 */
import { Document, Packer, Paragraph, Table, TableRow, TableCell, ImageRun, TextRun, AlignmentType, WidthType, VerticalAlign, BorderStyle, IFileChild, Footer, PageOrientation } from 'docx';
import { limpiarNombreArchivo, formatMoneda, formatNumero } from './formatters'
import initialData from '../data/initialData.json';
import { IVA } from '../constants/sharedConstants';

interface ProductoPedido {
  codigo: string;
  descripcion: string;
  cantidad: number;
  stock?: number;
  unidadMedida?: string;
  precioUnitario?: number;
  descuento1?: number;
  descuento2?: number;
}

interface DatosPedido {
  cliente?: string;
  documento?: string;
  numeroPedido?: string;
  vendedor?: string;
  emailVendedor?: string;
  telefonoVendedor?: string;
  productos?: ProductoPedido[];
}

const HEADER_BG = "1F2937"; // Azul marino muy oscuro corporativo
const TOTAL_RED = "FF0000";
const LIGHT_GRAY_BG = "F9FAFB";
const CELL_MARGINS = {
  top: 100,
  bottom: 100,
  left: 100,
  right: 100,
};

/**
 * Carga el logo corporativo desde el servidor como ArrayBuffer
 */
const getLogoBuffer = async () => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}logo-cipsa.png`);
    const blob = await response.blob();
    return await blob.arrayBuffer();
  } catch (e) {
    return null;
  }
};

/**
 * Retorna la fecha actual en formato: Lima, {dia} de {mes} de {anio}
 */
const getFechaExtendida = () => {
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  const now = new Date();
  const dia = now.getDate();
  const mes = meses[now.getMonth()];
  const anio = now.getFullYear();
  return `Lima, ${dia} de ${mes} de ${anio}`;
};

/**
 * Genera un archivo .docx con formato corporativo CIPSA
 * Incluye: logo, datos del cliente, tabla de productos, totales, condiciones comerciales y firma
 */
export const generarDOCX = async (data: DatosPedido) => {
  const { cliente, documento, numeroPedido, vendedor, emailVendedor, telefonoVendedor, productos } = data;
  if (!productos || productos.length === 0) return;

  const { empresa, condiciones } = initialData.config;
  const logoBuffer = await getLogoBuffer();

  // Configuración de estilo global
  const docOptions = {
    defaultStyle: { paragraph: { spacing: { line: 276 } } } // Interlineado 1.15
  };

  const children: IFileChild[] = [];

  // 1. Logo and Company Info Header
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              children: logoBuffer ? [
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: logoBuffer,
                      type: "png",
                      transformation: { width: 150, height: 50 },
                    }),
                  ],
                }),
              ] : [new Paragraph("")],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: empresa.nombre, bold: true, size: 20, font: "Arial" }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: `RUC: ${empresa.ruc}`, size: 16, font: "Arial" }),
                  ],
                }),
                new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: empresa.direccion, size: 14, font: "Arial" })] }),
                new Paragraph({ alignment: AlignmentType.RIGHT, children: [                new TextRun({ text: `Central: ${empresa.telefono} | https://www.cipsa.com.pe/`, size: 14, font: "Arial" })] }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  children.push(new Paragraph({ text: "", spacing: { before: 200 } }));

  // 2. Lugar y Fecha (Lado derecho superior)
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: getFechaExtendida(), size: 22, font: "Arial" })],
      spacing: { before: 400, after: 400 },
    })
  );

  // 3. Datos del Destinatario
  children.push(new Paragraph({ children: [new TextRun({ text: "Señores:", bold: true, size: 22, font: "Arial" })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: (cliente || "NOMBRE DEL CLIENTE").toUpperCase(), bold: true, size: 22, font: "Arial" })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: `RUC: ${documento || "---"}`, size: 22, font: "Arial" })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: `Atn: Gerencia de Compras / Logística`, size: 22, font: "Arial" })], spacing: { after: 400 } }));

  // 4. Referencia / Asunto
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `ASUNTO: `, bold: true, size: 22, font: "Arial" }),
        new TextRun({ text: `Cotización de productos plásticos - Pedido N° ${numeroPedido || '---'}`, underline: {}, size: 22, font: "Arial" }),
      ],
      spacing: { after: 400 },
    })
  );

  // 5. Saludo e Introducción
  children.push(new Paragraph({ children: [new TextRun({ text: "De nuestra consideración:", size: 22, font: "Arial" })] }));
  children.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      children: [
        new TextRun({ 
          text: "Es un placer saludarlos y, en respuesta a su amable solicitud, adjuntamos la cotización correspondiente a los productos requeridos por su representada, bajo las siguientes condiciones comerciales:", 
          size: 22, font: "Arial" 
        })
      ],
      spacing: { before: 200, after: 400 },
    })
  );

  // 6. Tabla de Productos y Totales (Recalculados para precisión)
  const productosCalculados = productos.map(p => {
    // Calculamos el valor neto unitario con precisión para mantener congruencia visual con 4 decimales
    const valorNetoUnitario = (p.precioUnitario || 0) * (1 - (p.descuento1 || 0) / 100) * (1 - (p.descuento2 || 0) / 100);
    
    // El total de la fila se redondea a 2 decimales para el cobro final
    const valorNetoFila = Math.round(p.cantidad * valorNetoUnitario * 100) / 100;
    return { ...p, valorNetoUnitario, valorNetoFila };
  });

  const subtotalNeto = productosCalculados.reduce((sum, p) => sum + p.valorNetoFila, 0);
  const igvTotal = Math.round(subtotalNeto * (IVA - 1) * 100) / 100;
  const totalGral = subtotalNeto + igvTotal;

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: ["ÍTEM", "SKU", "DESCRIPCIÓN", "CANT.", "UND", "P. UNIT (S/)", "TOTAL (S/)"].map(h => 
            new TableCell({
              shading: { fill: HEADER_BG },
              children: [new Paragraph({ 
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: h, color: "FFFFFF", bold: true, size: 18, font: "Arial" })] 
              })],
              verticalAlign: VerticalAlign.CENTER,
              margins: CELL_MARGINS,
            })
          ),
        }),
        ...productosCalculados.map((p, i) => {
          const rowBg = i % 2 === 0 ? undefined : LIGHT_GRAY_BG
          const cellStyle = (bg) => bg ? { shading: { fill: bg }, verticalAlign: VerticalAlign.CENTER, margins: CELL_MARGINS } : { verticalAlign: VerticalAlign.CENTER, margins: CELL_MARGINS }
          return new TableRow({
            children: [
              new TableCell({ ...cellStyle(rowBg), children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (i + 1).toString(), size: 16, font: "Arial" })] })] }),
              new TableCell({ ...cellStyle(rowBg), children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.codigo || "", size: 16, font: "Arial" })] })] }),
              new TableCell({ ...cellStyle(rowBg), children: [new Paragraph({ children: [new TextRun({ text: p.descripcion || "", size: 16, font: "Arial" })] })] }),
              new TableCell({ ...cellStyle(rowBg), children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.cantidad.toString(), size: 16, font: "Arial" })] })] }),
              new TableCell({ ...cellStyle(rowBg), children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.unidadMedida || "UND", size: 16, font: "Arial" })] })] }),
              new TableCell({ ...cellStyle(rowBg), children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatNumero(p.valorNetoUnitario, 4), size: 16, font: "Arial" })] })] }),
              new TableCell({ ...cellStyle(rowBg), children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatNumero(p.valorNetoFila), size: 16, font: "Arial" })] })] }),
            ],
          });
        }),
        // Filas de totales integradas a la tabla
        new TableRow({
          children: [
            new TableCell({ columnSpan: 6, margins: CELL_MARGINS, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Subtotal:", bold: true, size: 18, font: "Arial" })] })] }),
            new TableCell({ margins: CELL_MARGINS, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatMoneda(subtotalNeto), size: 18, font: "Arial" })] })] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ columnSpan: 6, margins: CELL_MARGINS, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "I.G.V. (18%):", bold: true, size: 18, font: "Arial" })] })] }),
            new TableCell({ margins: CELL_MARGINS, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatMoneda(igvTotal), size: 18, font: "Arial" })] })] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ columnSpan: 6, margins: CELL_MARGINS, shading: { fill: "F3F4F6" }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "TOTAL A PAGAR:", bold: true, size: 20, font: "Arial" })] })] }),
            new TableCell({ margins: CELL_MARGINS, shading: { fill: "F3F4F6" }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatMoneda(totalGral), bold: true, size: 20, color: TOTAL_RED, font: "Arial" })] })] }),
          ],
        }),
      ],
    })
  );

  // 7. Condiciones Comerciales
  children.push(
    new Paragraph({ 
      children: [new TextRun({ text: "CONDICIONES COMERCIALES:", bold: true, size: 18, font: "Arial", underline: {} })],
      spacing: { before: 400, after: 100 }
    })
  );
  children.push(new Paragraph({ children: [new TextRun({ text: `• Vigencia de la cotización: ${condiciones.validez}`, size: 18, font: "Arial" })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: `• Condiciones de pago: ${condiciones.tipoPago}`, size: 18, font: "Arial" })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: `• Plazo de entrega: ${condiciones.plazoEntrega}`, size: 18, font: "Arial" })] }));

  // 8. Cierre y Firma
  children.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      children: [
        new TextRun({ 
          text: "Agradecemos de antemano la oportunidad de atender sus requerimientos y quedamos a su entera disposición para cualquier consulta adicional.", 
          size: 22, font: "Arial" 
        })
      ],
      spacing: { before: 400, after: 400 },
    })
  );
  children.push(new Paragraph({ children: [new TextRun({ text: "Atentamente,", size: 22, font: "Arial" })], spacing: { after: 1000 } }));

  // Bloque de Firma
  children.push(new Paragraph({ children: [new TextRun({ text: vendedor || "Responsable Comercial", bold: true, size: 20, font: "Arial" })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: "Ejecutivo de Ventas / Representante Comercial", size: 18, font: "Arial" })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: empresa.nombre, size: 18, font: "Arial" })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: `📧 Email: ${emailVendedor || empresa.email}`, size: 16, font: "Arial" })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: `📱 Telf: ${telefonoVendedor || empresa.telefono}`, size: 16, font: "Arial" })] }));

  const doc = new Document({
    creator: 'ccusi - G360 Order System',
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `CORPORACIÓN DE INDUSTRIAS PLÁSTICAS S.A. — RUC: 20100654025`,
                  size: 14, color: "666666", font: "Arial",
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `Av. Los Frutales 419, Urb. El Artesano, Ate — Lima, Perú | Central: (01) 3134200 | https://www.cipsa.com.pe/`,
                  size: 14, color: "666666", font: "Arial",
                }),
              ],
            }),
          ],
        }),
      },
      children: children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  
  const now = new Date();
  const fechaStr = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`;
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `cotizacion_${limpiarNombreArchivo(cliente || 'cliente')}_${fechaStr}.docx`;
  a.click();
  URL.revokeObjectURL(url);
};