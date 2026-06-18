/**
 * =====================================================================
 * Generador de XLSX - G360 Style
 * =====================================================================
 * Genera archivos Excel con fórmulas para edición manual
 * 
 * ✅ Migrado a Typescript - Formato alineado con archivo de referencia
 * ✅ Optimizado: Una sola hoja "viva" con fórmulas y estilos de tabla.
 */

import ExcelJS from 'exceljs'
import { limpiarNombreArchivo } from './formatters'
import { IVA } from '../constants/sharedConstants'
import initialData from '../data/initialData.json'

// Tipos
interface ProductoPedido {
  codigo: string
  descripcion: string
  cantidad: number
  stock?: number
  unidadMedida?: string
  precioUnitario?: number
  descuento1?: number
  descuento2?: number
  estadoStock?: 'OK' | 'AJ' | 'Agotado' | string
  linea?: string
  categoria?: string
}

interface DatosPedido {
  cliente?: string;
  documento?: string;
  numeroPedido?: string;
  sucursal?: string;
  vendedor?: string;
  productos?: ProductoPedido[];
  tipo?: 'cotizacion' | string;
}

// =====================================================================
// ESTILOS G360 - Colores para Excel (referencia)
// =====================================================================
const DARK_BG = "333333"         // Gris oscuro (headers, labels)
const ROW_EVEN = "F8FAFC"        // Gris muy claro para filas pares
const ROW_ODD = "FFFFFF"         // Blanco para filas impares
const VALOR_VENTA_FILL = "F0F0F0" // Gris claro para VALOR VENTA
const STOCK_OK = "22C55E"        // Verde stock OK (Badge)
const STOCK_AJ = "F59E0B"        // Naranja stock Ajustado (Badge)
const STOCK_AGOTADO = "EF4444"   // Rojo stock Agotado (Badge)
const PRECIO_UNIT_FILL = "C8E6C9" // Verde claro para PRECIO UNIT.
const TOTALS_FILL = "F0F0F0"     // Gris claro para totales

/**
 * Función auxiliar para cargar logo como base64
 */
const agregarLogoExcelJS = async (workbook: ExcelJS.Workbook, worksheet: ExcelJS.Worksheet) => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}logo-cipsa.png`)
    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()
    
    const imageId = workbook.addImage({
      buffer: arrayBuffer,
      extension: 'png',
    })

    worksheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 120, height: 60 }
    })
  } catch (e) {
    console.log('Logo no agregado:', (e as Error).message)
  }
  }
/**
 * Generar archivo XLSX completo con formato G360
 * Formato alineado con el archivo de referencia: pedido-cc000103-chopers-distribuciones.xlsx
 * 
 * Estructura de la hoja PEDIDO (14 columnas A-N):
 *   Fila 1: Nombre empresa (C1)
 *   Fila 2: CLIENTE (C2-D2), PEDIDO (G2-H2)
 *   Fila 3: (vacía)
 *   Fila 4: Subtotal, Total+IGV, C/STOCK CONF. (labels)
 *   Fila 5: Fórmulas de totales
 *   Fila 6-7: (vacías)
 *   Fila 8: Encabezados de tabla
 *   Fila 9+: Datos con fórmulas
 */
export const generarXLSX = async (data: DatosPedido) => {
  const { cliente, numeroPedido, sucursal, productos, tipo } = data
  if (!productos || productos.length === 0) return

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('PEDIDO')
  const { empresa } = initialData.config
  
  // Configurar columnas (Anchos)
  worksheet.columns = [
    { width: 5 }, { width: 10 }, { width: 12 }, { width: 14 }, { width: 35 }, // A-E
    { width: 10 }, { width: 14 }, { width: 10 }, { width: 10 }, { width: 15 }, // F-J
    { width: 15 }, { width: 15 }, { width: 5 } // K-M
  ]

  // Cabecera Empresa e Info
  worksheet.mergeCells('C1:E1')
  const titleCell = worksheet.getCell('C1')
  titleCell.value = empresa.nombre
  titleCell.font = { bold: true, size: 16 }

  worksheet.addRow([]) // Fila 2
  const clientRow = worksheet.addRow(['', '', 'CLIENTE:', cliente, '', '', 'PEDIDO:', numeroPedido])
  clientRow.getCell(3).font = { bold: true }
  clientRow.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK_BG } }
  clientRow.getCell(7).font = { color: { argb: 'FFFFFF' }, bold: true }

  // Fila 3: Sucursal
  const sucRow = worksheet.addRow(['', '', 'SUCURSAL:', sucursal || 'PRINCIPAL'])
  sucRow.getCell(3).font = { bold: true }
  sucRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK_BG } }
  sucRow.getCell(3).font = { color: { argb: 'FFFFFF' }, bold: true }

  // Panel de Totales
  worksheet.addRow([]) // Fila 5
  const totalLabels = ['Subtotal:', 'Total + IGV:', 'C/STOCK CONF.:']
  const labelRow = worksheet.getRow(6)
  totalLabels.forEach((l, i) => {
    const cell = labelRow.getCell(i + 3)
    cell.value = l
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK_BG } }
    cell.font = { color: { argb: 'FFFFFF' }, bold: true }
  })

  const dataStart = 10
  const dataEnd = dataStart + productos.length - 1

  const valueRow = worksheet.getRow(7)
  
  const subtotalCell = valueRow.getCell(3)
  subtotalCell.value = { formula: `SUM(J${dataStart}:J${dataEnd})` }
  subtotalCell.numFmt = '"S/" #,##0.00'

  const totalIgvCell = valueRow.getCell(4)
  totalIgvCell.value = { formula: `C7*${IVA}` }
  totalIgvCell.font = { color: { argb: 'FF0000' }, bold: true }
  totalIgvCell.numFmt = '"S/" #,##0.00'

  const stockConfCell = valueRow.getCell(5)
  // Suma de PRECIO TOTAL (columna L) solo si C/STOCK (columna F) es "OK"
  stockConfCell.value = { formula: `SUMPRODUCT(--(F${dataStart}:F${dataEnd}="OK"), L${dataStart}:L${dataEnd})` }
  stockConfCell.numFmt = '"S/" #,##0.00'

  // Tabla de Productos
  const headerRow = worksheet.getRow(9)
  headerRow.values = ['N°', 'CANT.', 'U/M', 'SKU', 'DESCRIPCIÓN', 'C/STOCK', 'P. LISTA', 'DESC 01', 'DESC 02', 'TOTAL NETO', 'P. UNIT C/IGV', 'TOTAL VENTA']
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK_BG } }
    cell.font = { color: { argb: 'FFFFFF' }, bold: true }
    cell.alignment = { horizontal: 'center' }
  })

  // Datos con Estilo Zebra y Fórmulas
  productos.forEach((p, i) => {
    const rowIdx = dataStart + i
    const row = worksheet.addRow([
      i + 1, p.cantidad, p.unidadMedida, p.codigo, p.descripcion,
      '', p.precioUnitario, p.descuento1, p.descuento2, '', '', ''
    ])

    // Fórmulas
    // C/STOCK (F/6): Mantiene la lógica de stock viva embebiendo el valor numérico en la fórmula
    row.getCell(6).value = { formula: `IF(${p.stock || 0}>=B${rowIdx}*1.1,"OK",IF(${p.stock || 0}>=B${rowIdx}*0.9,"AJ","Agotado"))` }
    
    // P. LISTA (G/7): Formato de 4 decimales
    row.getCell(7).numFmt = '0.0000'

    // VALOR VENTA (J/10): Formato 2 decimales
    row.getCell(10).value = { formula: `B${rowIdx}*G${rowIdx}*(1-H${rowIdx}/100)*(1-I${rowIdx}/100)` }
    row.getCell(10).numFmt = '0.00'

    // PRECIO UNIT (K/11): Formato 4 decimales para congruencia con el DOCX
    row.getCell(11).value = { formula: `IFERROR(J${rowIdx}/B${rowIdx}*${IVA},0)` }
    row.getCell(11).numFmt = '0.0000'

    // PRECIO TOTAL (L/12): Formato 2 decimales
    row.getCell(12).value = { formula: `J${rowIdx}*${IVA}` }
    row.getCell(12).numFmt = '0.00'

    // Estilo Zebra
    const rowColor = i % 2 === 0 ? ROW_EVEN : ROW_ODD
    row.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowColor } }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    })

    // Badge de Stock
    const stockCell = row.getCell(6)
    const status = p.stock! >= p.cantidad * 1.1 ? 'OK' : p.stock! >= p.cantidad * 0.9 ? 'AJ' : 'Agotado'
    const color = status === 'OK' ? STOCK_OK : status === 'AJ' ? STOCK_AJ : STOCK_AGOTADO
    stockCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } }
    stockCell.font = { color: { argb: 'FFFFFF' }, bold: true }
    stockCell.alignment = { horizontal: 'center' }
  })

  await agregarLogoExcelJS(workbook, worksheet)

  // Descarga
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)

  // Generar fecha en formato ddmmyyyy
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = now.getFullYear()
  const fechaStr = `${dd}${mm}${yyyy}`

  const a = document.createElement('a')
  a.href = url
  a.download = `${numeroPedido || 'pedido'}_${limpiarNombreArchivo(cliente || 'cliente')}_${fechaStr}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}