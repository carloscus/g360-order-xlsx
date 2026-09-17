/**
 * =====================================================================
 * Generador de XLSX - G360 Modern Style
 * =====================================================================
 * Genera archivos Excel con diseño moderno y profesional
 * El cliente debe ver de primera vista: precio unitario, total y stock
 */

import ExcelJS from 'exceljs'
import { limpiarNombreArchivo } from './formatters'
import { IVA } from '../constants/sharedConstants'
import initialData from '../data/initialData.json'

interface ProductoPedido {
  codigo: string
  descripcion: string
  cantidad: number
  stock?: number
  unidadMedida?: string
  precioUnitario?: number
  descuento1?: number
  descuento2?: number
  estadoStock?: string
  linea?: string
}

interface DatosPedido {
  cliente?: string
  documento?: string
  numeroPedido?: string
  sucursal?: string
  vendedor?: string
  emailVendedor?: string
  productos?: ProductoPedido[]
}

// Paleta G360 Corporativa Moderna
const COLORS = {
  darkBg: "0F172A",         // Slate 900 - Headers principales
  accent: "00796B",         // Teal 700 - Acento corporativo
  accentDark: "004D40",     // Teal 900 - Acento oscuro
  headerText: "FFFFFF",
  rowEven: "F8FAFC",        // Slate 50 - Filas pares
  rowOdd: "FFFFFF",
  stockOk: "10B981",        // Emerald 500 - Stock OK
  stockAj: "F59E0B",        // Amber 500 - Stock Ajustado
  stockOut: "EF4444",       // Rose 500 - Agotado
  priceHighlight: "E0F2F1", // Teal 50 - Fondo total venta
  totalBg: "E0F2F1",        // Teal 50 - Fondo total
  subtotalLabel: "64748B",  // Slate 500 - Labels secundarios
  borderColor: "E2E8F0",    // Slate 200 - Bordes
}

export const generarXLSX = async (data: DatosPedido) => {
  const { cliente, documento, numeroPedido, sucursal, vendedor, emailVendedor, productos } = data
  if (!productos || productos.length === 0) return

  const workbook = new ExcelJS.Workbook()
  workbook.calcProperties.fullCalcOnLoad = true
  workbook.creator = 'ccusi - G360 Order System'
  const worksheet = workbook.addWorksheet('PEDIDO', { properties: { defaultRowHeight: 20 } })
  const { empresa } = initialData.config

  // ── Columnas: A=Item, B=Cant, C=UM, D=SKU, E=Descripción, F=Stock, 
  //   G=P.Unit, H=Dto1, I=Dto2, J=Total Neto, K=P.Unit+IGV, L=Total Venta ──
  worksheet.columns = [
    { width: 6 },    // A: Item
    { width: 10 },   // B: Cantidad
    { width: 17.14 },// C: U/M (125px)
    { width: 12 },   // D: SKU
    { width: 38 },   // E: Descripción
    { width: 12 },   // F: Stock Status
    { width: 14 },   // G: P.Unit
    { width: 17.14 },// H: Dto1 (125px)
    { width: 10 },   // I: Dto2
    { width: 16 },   // J: Total Neto
    { width: 16 },   // K: P.Unit c/IGV
    { width: 22.14 },// L: TOTAL VENTA (160px)
  ]

  // ══════════════════════════════════════════════════════════════════
  // HEADER: Logo + Empresa
  // ══════════════════════════════════════════════════════════════════
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}logo-cipsa.png`)
    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()
    const imageId = workbook.addImage({ buffer: arrayBuffer, extension: 'png' })
    worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 109, height: 81 } })
  } catch (e) {
    console.log('Logo no agregado:', (e as Error).message)
  }

  // ══════════════════════════════════════════════════════════════════
  // SECCIÓN 1: Info del Pedido (Filas 1-4)
  // ══════════════════════════════════════════════════════════════════
  worksheet.getRow(1).height = 30

  // Fila 2: Empresa
  const empRow = worksheet.getRow(2)
  empRow.getCell(3).value = empresa.nombre
  empRow.getCell(3).font = { bold: true, size: 14, color: { argb: COLORS.darkBg }, name: 'Arial' }

  // Fila 3: RUC + Dirección
  const infoRow = worksheet.getRow(3)
  infoRow.getCell(3).value = `RUC: ${empresa.ruc}`
  infoRow.getCell(3).font = { size: 9, color: { argb: COLORS.subtotalLabel }, name: 'Arial' }
  infoRow.getCell(5).value = empresa.direccion
  infoRow.getCell(5).font = { size: 9, color: { argb: COLORS.subtotalLabel }, name: 'Arial' }

  // Fila 5: CLIENTE + PEDIDO
  const clientLabelRow = worksheet.getRow(5)
  clientLabelRow.getCell(3).value = 'CLIENTE:'
  clientLabelRow.getCell(3).font = { bold: true, size: 9, color: { argb: COLORS.subtotalLabel }, name: 'Arial' }
  clientLabelRow.getCell(4).value = (cliente || '').toUpperCase()
  clientLabelRow.getCell(4).font = { bold: true, size: 11, color: { argb: COLORS.darkBg }, name: 'Arial' }
  clientLabelRow.getCell(7).value = 'PEDIDO N°:'
  clientLabelRow.getCell(7).font = { bold: true, size: 9, color: { argb: COLORS.subtotalLabel }, name: 'Arial' }
  clientLabelRow.getCell(8).value = numeroPedido || '-'
  clientLabelRow.getCell(8).font = { bold: true, size: 11, color: { argb: COLORS.accent }, name: 'Arial' }

  // Fila 6: RUC + Sucursal + Vendedor
  const docRow = worksheet.getRow(6)
  docRow.getCell(3).value = 'RUC/DNI:'
  docRow.getCell(3).font = { bold: true, size: 9, color: { argb: COLORS.subtotalLabel }, name: 'Arial' }
  docRow.getCell(4).value = documento || '-'
  docRow.getCell(4).font = { size: 10, name: 'Arial' }
  docRow.getCell(5).value = `Sucursal: ${sucursal || 'PRINCIPAL'}`
  docRow.getCell(5).font = { size: 9, color: { argb: COLORS.subtotalLabel }, name: 'Arial' }
  docRow.getCell(7).value = 'VENDEDOR:'
  docRow.getCell(7).font = { bold: true, size: 9, color: { argb: COLORS.subtotalLabel }, name: 'Arial' }
  docRow.getCell(8).value = vendedor || '-'
  docRow.getCell(8).font = { size: 10, name: 'Arial' }

  // Fila 7: Email vendedor
  if (emailVendedor) {
    const emailRow = worksheet.getRow(7)
    emailRow.getCell(7).value = 'EMAIL:'
    emailRow.getCell(7).font = { bold: true, size: 9, color: { argb: COLORS.subtotalLabel }, name: 'Arial' }
    const emailFull = emailVendedor.includes('@') ? emailVendedor : `${emailVendedor}@cipsa.com.pe`
    emailRow.getCell(8).value = emailFull
    emailRow.getCell(8).font = { size: 9, color: { argb: COLORS.accent }, name: 'Arial' }
  }

  // ══════════════════════════════════════════════════════════════════
  // SECCIÓN 2: KPIs (Filas 9-10) - TOTAL, STOCK CONFIRMADO, IGV
  // ══════════════════════════════════════════════════════════════════
  const dataStart = 13
  const dataEnd = dataStart + productos.length - 1

  // Fila 9: Labels KPI
  const kpiLabelRow = worksheet.getRow(9)
  kpiLabelRow.height = 22
  const kpiLabels = [
    { col: 3, text: 'SUBTOTAL', color: COLORS.subtotalLabel },
    { col: 5, text: 'TOTAL + IGV', color: COLORS.darkBg },
    { col: 8, text: 'CON STOCK CONFIRMADO', color: COLORS.accentDark },
  ]
  kpiLabels.forEach(({ col, text, color }) => {
    const cell = kpiLabelRow.getCell(col)
    cell.value = text
    cell.font = { bold: true, size: 8, color: { argb: color }, name: 'Arial' }
    cell.alignment = { horizontal: 'center' }
  })

  // Fila 10: Valores KPI
  const kpiValueRow = worksheet.getRow(10)
  kpiValueRow.height = 28

  // Subtotal
  const subtotalCell = kpiValueRow.getCell(3)
  subtotalCell.value = { formula: `SUM(J${dataStart}:J${dataEnd})` }
  subtotalCell.numFmt = '"S/" #,##0.00'
  subtotalCell.font = { bold: true, size: 13, color: { argb: COLORS.subtotalLabel }, name: 'Arial' }
  subtotalCell.alignment = { horizontal: 'center' }

  // Total + IGV
  const totalIgvCell = kpiValueRow.getCell(5)
  totalIgvCell.value = { formula: `C10*${IVA}` }
  totalIgvCell.numFmt = '"S/" #,##0.00'
  totalIgvCell.font = { bold: true, size: 15, color: { argb: COLORS.darkBg }, name: 'Arial' }
  totalIgvCell.alignment = { horizontal: 'center' }

  // Stock Confirmado
  const stockConfCell = kpiValueRow.getCell(8)
  stockConfCell.value = { formula: `SUMPRODUCT(--(F${dataStart}:F${dataEnd}="OK"),L${dataStart}:L${dataEnd})` }
  stockConfCell.numFmt = '"S/" #,##0.00'
  stockConfCell.font = { bold: true, size: 13, color: { argb: COLORS.accentDark }, name: 'Arial' }
  stockConfCell.alignment = { horizontal: 'center' }

  // Separador visual
  worksheet.getRow(11).height = 6
  for (let c = 3; c <= 12; c++) {
    const sepCell = worksheet.getRow(11).getCell(c)
    sepCell.border = { bottom: { style: 'medium', color: { argb: COLORS.accent } } }
  }

  // ══════════════════════════════════════════════════════════════════
  // SECCIÓN 3: Tabla de Productos (Fila 12+)
  // ══════════════════════════════════════════════════════════════════
  
  // Headers
  const headerRow = worksheet.getRow(12)
  headerRow.height = 26
  const headers = ['N°', 'CANT.', 'U/M', 'SKU', 'DESCRIPCIÓN', 'STOCK', 'P. LISTA', 'DESC 1', 'DESC 2', 'NETO', 'P. UNIT', 'TOTAL VENTA']
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkBg } }
    cell.font = { color: { argb: COLORS.headerText }, bold: true, size: 9, name: 'Arial' }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.borderColor } },
      bottom: { style: 'thin', color: { argb: COLORS.borderColor } },
    }
  })

  // Datos
  productos.forEach((p, i) => {
    const rowIdx = dataStart + i
    const row = worksheet.getRow(rowIdx)
    row.height = 22

    // Valores estáticos
    row.getCell(1).value = i + 1
    row.getCell(2).value = p.cantidad
    row.getCell(3).value = p.unidadMedida || 'UND'
    row.getCell(4).value = p.codigo
    row.getCell(5).value = p.descripcion
    row.getCell(7).value = p.precioUnitario
    row.getCell(8).value = p.descuento1
    row.getCell(9).value = p.descuento2

    // Fórmulas
    // Stock Status
    row.getCell(6).value = { formula: `IF(${p.stock || 0}>=B${rowIdx}*1.1,"OK",IF(${p.stock || 0}>=B${rowIdx}*0.9,"AJ","Agotado"))` }
    
    // P. Unitario formato 4 decimales
    row.getCell(7).numFmt = '0.0000'

    // NETO = Cant × P.Unit × (1-Dto1/100) × (1-Dto2/100)
    row.getCell(10).value = { formula: `B${rowIdx}*G${rowIdx}*(1-H${rowIdx}/100)*(1-I${rowIdx}/100)` }
    row.getCell(10).numFmt = '#,##0.00'

    // P. Unit c/IGV = NETO/Cant × IVA
    row.getCell(11).value = { formula: `IFERROR(J${rowIdx}/B${rowIdx}*${IVA},0)` }
    row.getCell(11).numFmt = '0.0000'

    // TOTAL VENTA = NETO × IGV ← columna más visible
    row.getCell(12).value = { formula: `J${rowIdx}*${IVA}` }
    row.getCell(12).numFmt = '"S/" #,##0.00'

    // Estilo Zebra
    const rowColor = i % 2 === 0 ? COLORS.rowEven : COLORS.rowOdd
    for (let c = 1; c <= 12; c++) {
      const cell = row.getCell(c)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowColor } }
      cell.border = {
        bottom: { style: 'thin', color: { argb: COLORS.borderColor } },
      }
      cell.font = { size: 10, name: 'Arial' }
      cell.alignment = { vertical: 'middle' }
    }

    // Alineaciones específicas
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' }

    // Total Venta: fondo verde claro, bold
    row.getCell(12).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.priceHighlight } }
    row.getCell(12).font = { bold: true, size: 10, color: { argb: COLORS.accentDark }, name: 'Arial' }

    // Badge de Stock
    const stockVal = p.stock || 0
    const cantVal = p.cantidad || 1
    const status = stockVal >= cantVal * 1.1 ? 'OK' : stockVal >= cantVal * 0.9 ? 'AJ' : 'Agotado'
    const stockColor = status === 'OK' ? COLORS.stockOk : status === 'AJ' ? COLORS.stockAj : COLORS.stockOut
    row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: stockColor } }
    row.getCell(6).font = { color: { argb: COLORS.headerText }, bold: true, size: 9, name: 'Arial' }
  })

  // ══════════════════════════════════════════════════════════════════
  // SECCIÓN 4: Totales al pie
  // ══════════════════════════════════════════════════════════════════
  const totalsStart = dataEnd + 2

  // Subtotal
  const subRow = worksheet.getRow(totalsStart)
  subRow.getCell(10).value = 'Subtotal:'
  subRow.getCell(10).font = { bold: true, size: 10, color: { argb: COLORS.subtotalLabel }, name: 'Arial' }
  subRow.getCell(10).alignment = { horizontal: 'right' }
  subRow.getCell(12).value = { formula: `SUM(J${dataStart}:J${dataEnd})` }
  subRow.getCell(12).numFmt = '"S/" #,##0.00'
  subRow.getCell(12).font = { bold: true, size: 10, name: 'Arial' }
  subRow.getCell(12).alignment = { horizontal: 'right' }

  // IGV
  const igvRow = worksheet.getRow(totalsStart + 1)
  igvRow.getCell(10).value = 'I.G.V. (18%):'
  igvRow.getCell(10).font = { bold: true, size: 10, color: { argb: COLORS.subtotalLabel }, name: 'Arial' }
  igvRow.getCell(10).alignment = { horizontal: 'right' }
  igvRow.getCell(12).value = { formula: `L${totalsStart}*0.18` }
  igvRow.getCell(12).numFmt = '"S/" #,##0.00'
  igvRow.getCell(12).font = { size: 10, name: 'Arial' }
  igvRow.getCell(12).alignment = { horizontal: 'right' }

  // TOTAL FINAL
  const totalRow = worksheet.getRow(totalsStart + 2)
  totalRow.height = 28
  totalRow.getCell(10).value = 'TOTAL A PAGAR:'
  totalRow.getCell(10).font = { bold: true, size: 12, color: { argb: COLORS.darkBg }, name: 'Arial' }
  totalRow.getCell(10).alignment = { horizontal: 'right', vertical: 'middle' }
  totalRow.getCell(12).value = { formula: `L${totalsStart}+L${totalsStart + 1}` }
  totalRow.getCell(12).numFmt = '"S/" #,##0.00'
  totalRow.getCell(12).font = { bold: true, size: 14, color: { argb: COLORS.accentDark }, name: 'Arial' }
  totalRow.getCell(12).alignment = { horizontal: 'right', vertical: 'middle' }
  totalRow.getCell(12).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.totalBg } }

  // Bordes totales
  for (let r = totalsStart; r <= totalsStart + 2; r++) {
    const rObj = worksheet.getRow(r)
    rObj.getCell(10).border = { top: { style: 'thin', color: { argb: COLORS.borderColor } } }
    rObj.getCell(12).border = { top: { style: 'thin', color: { argb: COLORS.borderColor } } }
  }

  // ══════════════════════════════════════════════════════════════════
  // FOOTER: Notas
  // ══════════════════════════════════════════════════════════════════
  const footerRow = worksheet.getRow(totalsStart + 4)
  footerRow.getCell(3).value = '* Precios en Soles (S/). IGV incluido en TOTAL VENTA.'
  footerRow.getCell(3).font = { italic: true, size: 8, color: { argb: COLORS.subtotalLabel }, name: 'Arial' }
  
  const footerRow2 = worksheet.getRow(totalsStart + 5)
  footerRow2.getCell(3).value = `Generado por G360 Order System — ${new Date().toLocaleDateString('es-PE')}`
  footerRow2.getCell(3).font = { italic: true, size: 8, color: { argb: COLORS.subtotalLabel }, name: 'Arial' }

  // ══════════════════════════════════════════════════════════════════
  // Print settings
  // ══════════════════════════════════════════════════════════════════
  worksheet.pageSetup = {
    paperSize: 9, // A4
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    orientation: 'landscape',
  }

  // Descarga
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)

  const now = new Date()
  const fechaStr = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`

  const a = document.createElement('a')
  a.href = url
  a.download = `${numeroPedido || 'pedido'}_${limpiarNombreArchivo(cliente || 'cliente')}_${fechaStr}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
