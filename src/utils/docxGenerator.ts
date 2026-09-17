/**
 * Generador de documentos Word (.docx) — Carta Corporativa CIPSA
 * Formato profesional para cotizaciones formales a instituciones/empresas
 */
import { Document, Packer, Paragraph, Table, TableRow, TableCell, ImageRun, TextRun, AlignmentType, WidthType, VerticalAlign, BorderStyle, IFileChild, Footer, PageOrientation, Tab, TabStopType, TabStopPosition } from 'docx';
import { limpiarNombreArchivo, formatMoneda, formatNumero } from './formatters'
import initialData from '../data/initialData.json';
import { IVA } from '../constants/sharedConstants';

interface ProductoPedido {
  codigo: string
  descripcion: string
  cantidad: number
  stock?: number
  unidadMedida?: string
  precioUnitario?: number
  descuento1?: number
  descuento2?: number
}

interface DatosPedido {
  cliente?: string
  documento?: string
  numeroPedido?: string
  vendedor?: string
  emailVendedor?: string
  telefonoVendedor?: string
  productos?: ProductoPedido[]
}

// Paleta corporativa moderna
const PALETTE = {
  primary: "1E293B",     // Slate 800
  accent: "059669",      // Emerald 600
  accentLight: "ECFDF5", // Emerald 50
  text: "1F2937",        // Gray 800
  muted: "6B7280",       // Gray 500
  border: "D1D5DB",      // Gray 300
  rowAlt: "F9FAFB",      // Gray 50
  totalBg: "F0FDF4",     // Green 50
  totalBorder: "059669", // Emerald 600
}

const CELL_PAD = { top: 80, bottom: 80, left: 100, right: 100 }

const getLogoBuffer = async () => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}logo-cipsa.png`);
    const blob = await response.blob();
    return await blob.arrayBuffer();
  } catch { return null; }
};

const getFechaExtendida = () => {
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const now = new Date();
  return `Lima, ${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;
};

const spacer = (pts = 200) => new Paragraph({ text: "", spacing: { before: pts } });

export const generarDOCX = async (data: DatosPedido) => {
  const { cliente, documento, numeroPedido, vendedor, emailVendedor, telefonoVendedor, productos } = data;
  if (!productos || productos.length === 0) return;

  const { empresa, condiciones } = initialData.config;
  const logoBuffer = await getLogoBuffer();
  const children: IFileChild[] = [];

  // ══════════════════════════════════════════════════════════════════
  // 1. ENCABEZADO: Logo + Datos Empresa (tabla sin bordes)
  // ══════════════════════════════════════════════════════════════════
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              children: logoBuffer ? [
                new Paragraph({ children: [new ImageRun({ data: logoBuffer, type: "png", transformation: { width: 109, height: 81 } })] }),
              ] : [new Paragraph("")],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              borders: { bottom: { style: BorderStyle.SINGLE, size: 6, color: PALETTE.accent } },
              children: [
                new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 40 }, children: [
                  new TextRun({ text: empresa.nombre, bold: true, size: 18, font: "Arial", color: PALETTE.primary }),
                ]}),
                new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 20 }, children: [
                  new TextRun({ text: `RUC: ${empresa.ruc}`, size: 16, font: "Arial", color: PALETTE.muted }),
                ]}),
                new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 20 }, children: [
                  new TextRun({ text: empresa.direccion, size: 14, font: "Arial", color: PALETTE.muted }),
                ]}),
                new Paragraph({ alignment: AlignmentType.RIGHT, children: [
                  new TextRun({ text: `Central: ${empresa.telefono} | www.cipsa.com.pe`, size: 14, font: "Arial", color: PALETTE.accent }),
                ]}),
              ],
            }),
          ],
        }),
      ],
    })
  );

  children.push(spacer(300));

  // ══════════════════════════════════════════════════════════════════
  // 2. FECHA (derecha)
  // ══════════════════════════════════════════════════════════════════
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: getFechaExtendida(), size: 20, font: "Arial", color: PALETTE.text })],
      spacing: { after: 300 },
    })
  );

  // ══════════════════════════════════════════════════════════════════
  // 3. DESTINATARIO
  // ══════════════════════════════════════════════════════════════════
  const destLines = [
    { text: "Señores:", bold: true },
    { text: (cliente || "NOMBRE DEL CLIENTE").toUpperCase(), bold: true },
    { text: `RUC: ${documento || "---"}` },
    { text: "Atn: Gerencia de Compras / Logística" },
  ];
  destLines.forEach((l, i) => {
    children.push(new Paragraph({
      spacing: { after: i === destLines.length - 1 ? 300 : 40 },
      children: [new TextRun({ text: l.text, bold: l.bold, size: 20, font: "Arial", color: PALETTE.text })],
    }));
  });

  // ══════════════════════════════════════════════════════════════════
  // 4. ASUNTO
  // ══════════════════════════════════════════════════════════════════
  children.push(
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({ text: "ASUNTO: ", bold: true, size: 20, font: "Arial", color: PALETTE.primary }),
        new TextRun({ text: `Cotización de productos plásticos — Pedido N° ${numeroPedido || '---'}`, underline: { type: "single" as any }, size: 20, font: "Arial", color: PALETTE.text }),
      ],
    })
  );

  // ══════════════════════════════════════════════════════════════════
  // 5. INTRODUCCIÓN
  // ══════════════════════════════════════════════════════════════════
  children.push(new Paragraph({ children: [new TextRun({ text: "De nuestra consideración:", size: 20, font: "Arial", color: PALETTE.text })] }));
  children.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      spacing: { before: 100, after: 300 },
      children: [new TextRun({
        text: "Es un placer saludarlos y, en respuesta a su amable solicitud, hacemos llegar la cotización correspondiente a los productos requeridos por su representada, bajo las siguientes condiciones comerciales:",
        size: 20, font: "Arial", color: PALETTE.text
      })],
    })
  );

  // ══════════════════════════════════════════════════════════════════
  // 6. TABLA DE PRODUCTOS
  // ══════════════════════════════════════════════════════════════════
  const productosCalc = productos.map(p => {
    const valorNetoUnit = (p.precioUnitario || 0) * (1 - (p.descuento1 || 0) / 100) * (1 - (p.descuento2 || 0) / 100);
    const valorNetoFila = Math.round(p.cantidad * valorNetoUnit * 100) / 100;
    return { ...p, valorNetoUnit, valorNetoFila };
  });

  const subtotalNeto = productosCalc.reduce((sum, p) => sum + p.valorNetoFila, 0);
  const igvTotal = Math.round(subtotalNeto * (IVA - 1) * 100) / 100;
  const totalGral = subtotalNeto + igvTotal;

  const headerCell = (text: string) => new TableCell({
    shading: { fill: PALETTE.primary },
    verticalAlign: VerticalAlign.CENTER,
    margins: CELL_PAD,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text, color: "FFFFFF", bold: true, size: 16, font: "Arial" })
    ]})],
  });

  const dataCell = (text: string, align: AlignmentType = AlignmentType.LEFT, isAlt = false, bold = false, color?: string) => new TableCell({
    shading: isAlt ? { fill: PALETTE.rowAlt } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: CELL_PAD,
    children: [new Paragraph({ alignment: align, children: [
      new TextRun({ text, size: 16, font: "Arial", bold, color: color || PALETTE.text })
    ]})],
  });

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Header
        new TableRow({
          tableHeader: true,
          children: ["ÍTEM", "SKU", "DESCRIPCIÓN", "CANT.", "UND", "P. UNIT (S/)", "TOTAL (S/)"].map(h => headerCell(h)),
        }),
        // Data rows
        ...productosCalc.map((p, i) => {
          const isAlt = i % 2 !== 0
          return new TableRow({
            children: [
              dataCell((i + 1).toString(), AlignmentType.CENTER, isAlt),
              dataCell(p.codigo || "", AlignmentType.CENTER, isAlt),
              dataCell(p.descripcion || "", AlignmentType.LEFT, isAlt),
              dataCell(p.cantidad.toString(), AlignmentType.CENTER, isAlt),
              dataCell(p.unidadMedida || "UND", AlignmentType.CENTER, isAlt),
              dataCell(formatNumero(p.valorNetoUnit, 4), AlignmentType.RIGHT, isAlt),
              dataCell(formatNumero(p.valorNetoFila), AlignmentType.RIGHT, isAlt, true),
            ],
          });
        }),
        // Subtotal
        new TableRow({ children: [
          new TableCell({ columnSpan: 6, margins: CELL_PAD, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
            new TextRun({ text: "Subtotal:", bold: true, size: 17, font: "Arial", color: PALETTE.muted })
          ]})] }),
          dataCell(formatMoneda(subtotalNeto), AlignmentType.RIGHT, false, true),
        ]}),
        // IGV
        new TableRow({ children: [
          new TableCell({ columnSpan: 6, margins: CELL_PAD, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
            new TextRun({ text: "I.G.V. (18%):", bold: true, size: 17, font: "Arial", color: PALETTE.muted })
          ]})] }),
          dataCell(formatMoneda(igvTotal), AlignmentType.RIGHT, false, false, PALETTE.muted),
        ]}),
        // TOTAL
        new TableRow({ children: [
          new TableCell({ columnSpan: 6, margins: CELL_PAD, shading: { fill: PALETTE.totalBg }, 
            borders: { top: { style: BorderStyle.SINGLE, size: 2, color: PALETTE.totalBorder } },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
              new TextRun({ text: "TOTAL A PAGAR:", bold: true, size: 19, font: "Arial", color: PALETTE.primary })
            ]})] }),
          new TableCell({ margins: CELL_PAD, shading: { fill: PALETTE.totalBg },
            borders: { top: { style: BorderStyle.SINGLE, size: 2, color: PALETTE.totalBorder } },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
              new TextRun({ text: formatMoneda(totalGral), bold: true, size: 19, font: "Arial", color: PALETTE.accent })
            ]})] }),
        ]}),
      ],
    })
  );

  // ══════════════════════════════════════════════════════════════════
  // 7. CONDICIONES COMERCIALES
  // ══════════════════════════════════════════════════════════════════
  children.push(spacer(300));
  children.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: "CONDICIONES COMERCIALES:", bold: true, size: 17, font: "Arial", color: PALETTE.primary, underline: { type: "single" as any } })],
    })
  );

  const condicionesList = [
    `Vigencia: ${condiciones.validez}`,
    `Pago: ${condiciones.tipoPago}`,
    `Entrega: ${condiciones.plazoEntrega}`,
    `Garantía: ${condiciones.garantia || '12 meses'}`,
  ];
  condicionesList.forEach(c => {
    children.push(new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: "  •  ", bold: true, size: 18, font: "Arial", color: PALETTE.accent }),
        new TextRun({ text: c, size: 18, font: "Arial", color: PALETTE.text }),
      ],
    }));
  });

  // ══════════════════════════════════════════════════════════════════
  // 8. CIERRE
  // ══════════════════════════════════════════════════════════════════
  children.push(spacer(300));
  children.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFY,
      spacing: { after: 300 },
      children: [new TextRun({
        text: "Agradecemos la oportunidad de atender sus requerimientos y quedamos a su disposición para cualquier consulta.",
        size: 20, font: "Arial", color: PALETTE.text
      })],
    })
  );

  children.push(new Paragraph({ children: [new TextRun({ text: "Atentamente,", size: 20, font: "Arial", color: PALETTE.text })], spacing: { after: 800 } }));

  // ══════════════════════════════════════════════════════════════════
  // 9. FIRMA
  // ══════════════════════════════════════════════════════════════════
  children.push(new Paragraph({ spacing: { after: 40 }, children: [
    new TextRun({ text: vendedor || "Responsable Comercial", bold: true, size: 20, font: "Arial", color: PALETTE.primary }),
  ]}));
  children.push(new Paragraph({ spacing: { after: 20 }, children: [
    new TextRun({ text: "Ejecutivo de Ventas / Representante Comercial", size: 16, font: "Arial", color: PALETTE.muted }),
  ]}));
  children.push(new Paragraph({ spacing: { after: 20 }, children: [
    new TextRun({ text: empresa.nombre, size: 16, font: "Arial", color: PALETTE.muted }),
  ]}));
  
  if (emailVendedor) {
    const emailFull = emailVendedor.includes('@') ? emailVendedor : `${emailVendedor}@cipsa.com.pe`
    children.push(new Paragraph({ spacing: { after: 20 }, children: [
      new TextRun({ text: `Email: ${emailFull}`, size: 15, font: "Arial", color: PALETTE.accent }),
    ]}));
  }
  if (telefonoVendedor) {
    children.push(new Paragraph({ children: [
      new TextRun({ text: `Teléfono: ${telefonoVendedor}`, size: 15, font: "Arial", color: PALETTE.muted }),
    ]}));
  }

  // ══════════════════════════════════════════════════════════════════
  // DOCUMENT
  // ══════════════════════════════════════════════════════════════════
  const doc = new Document({
    creator: 'ccusi - G360 Order System',
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: `${empresa.nombre} — RUC: ${empresa.ruc}`, size: 13, color: PALETTE.muted, font: "Arial" }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: `${empresa.direccion} | Central: ${empresa.telefono} | www.cipsa.com.pe`, size: 12, color: PALETTE.muted, font: "Arial" }),
              ],
            }),
          ],
        }),
      },
      children,
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
