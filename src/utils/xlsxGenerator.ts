/**
 * =====================================================================
 * Generador de XLSX - G360 Style
 * =====================================================================
 * Genera archivos Excel con fórmulas para edición manual
 * 
 * ✅ Migrado a Typescript - Logica 100% IDENTICA al original
 */

import * as XLSX from 'xlsx'
import { limpiarNombreArchivo } from './formatters.js'
import catalogoData from '../data/catalogo_productos.json'

// Tipos
interface ProductoCatalogo {
  sku: string
  nombre: string
  categoria: string
  linea: string
  peso_kg: number
  un_bx: number
}

interface ProductoPedido {
  codigo: string
  descripcion: string
  cantidad: number
  unidadMedida?: string
  precioUnitario?: number
  descuento1?: number
  descuento2?: number
  estadoStock?: 'OK' | 'AJ' | 'Agotado' | string
}

interface DatosPedido {
  cliente?: string
  documento?: string
  numeroPedido?: string
  vendedor?: string
  productos?: ProductoPedido[]
  tipo?: 'cotizacion' | string
}

// Crear mapa de productos por SKU para búsqueda rápida
const catalogoMap = new Map<string, ProductoCatalogo>()
catalogoData.productos.forEach(p => {
  catalogoMap.set(p.sku, p as ProductoCatalogo)
})

/**
 * Función helper para buscar producto en catálogo
 * @param sku Código SKU del producto
 * @returns Producto del catalogo o null
 */
const getProductoCatalogo = (sku: string): ProductoCatalogo | null => {
  return catalogoMap.get(sku) || null
}

// =====================================================================
// GENERAR HOJA 2 - ANÁLISIS POR LÍNEA Y CATEGORÍA
// =====================================================================
const generarHojaAnalisis = (wb: XLSX.WorkBook, productos: ProductoPedido[]) => {
  const ws = XLSX.utils.aoa_to_sheet([[]])

  // Agrupar productos por categoría → línea
  const resumen: Record<string, Record<string, Array<{
    n: number
    sku: string
    nombre: string
    cantidad: number
    pesoUnit: number
    cajas: number
    pesoTotal: number
  }>>> = {}

  productos.forEach((p, i) => {
    const prodCatalogo = getProductoCatalogo(p.codigo)
    const categoria = prodCatalogo?.categoria || 'SIN CATEGORÍA'
    const linea = prodCatalogo?.linea || 'SIN LÍNEA'
    const pesoKg = prodCatalogo?.peso_kg || 0
    const unBx = prodCatalogo?.un_bx || 1

    if (!resumen[categoria]) resumen[categoria] = {}
    if (!resumen[categoria][linea]) resumen[categoria][linea] = []

    const pesoTotal = p.cantidad * pesoKg
    const cajas = Math.ceil(p.cantidad / unBx)

    resumen[categoria][linea].push({
      n: i + 1,
      sku: p.codigo,
      nombre: p.descripcion,
      cantidad: p.cantidad || 0,
      pesoUnit: pesoKg,
      cajas: cajas,
      pesoTotal: pesoTotal
    })
  })

   // Construir contenido de la hoja
   const contenido: unknown[][] = []

   // Título
   contenido.push(['ANÁLISIS POR LÍNEA DE PRODUCTOS'])
   contenido.push(['', '', '', '', ''])

   // Headers tabla
   contenido.push(['N°', 'SKU', 'PRODUCTO', 'CANT', 'PESO UNIT (kg)', 'CAJAS', 'PESO TOTAL (kg)'])

   // Función para agregar línea de datos
  const agregarLinea = (data: {n?: number, sku?: string, nombre?: string, cantidad?: number, pesoUnit?: number, cajas?: number, pesoTotal?: number}) => {
    contenido.push([
      data.n || '',
      data.sku || '',
      data.nombre || '',
      data.cantidad || 0,
      data.pesoUnit || 0,
      data.cajas || 0,
      data.pesoTotal || 0
    ])
  }

  // Función para agregar total de línea
  const agregarTotalLinea = (linea: string, items: Array<{cajas: number, pesoTotal: number}>) => {
    const totalCajas = items.reduce((sum, item) => sum + item.cajas, 0)
    const totalPeso = items.reduce((sum, item) => sum + item.pesoTotal, 0)
    contenido.push([
      '',
      '',
      `TOTAL ${linea}:`,
      '',
      '',
      totalCajas,
      totalPeso
    ])
  }

  // Función para agregar total de categoría
  const agregarTotalCategoria = (categoria: string, lineasData: Array<Array<{cajas: number, pesoTotal: number}>>) => {
    const totalCajas = lineasData.reduce((sum, items) => sum + items.reduce((s, i) => s + i.cajas, 0), 0)
    const totalPeso = lineasData.reduce((sum, items) => sum + items.reduce((s, i) => s + i.pesoTotal, 0), 0)
    contenido.push([
      '',
      '',
      `TOTAL ${categoria}:`,
      '',
      '',
      totalCajas,
      totalPeso
    ])
    contenido.push(['', '', '', '', '', '', ''])
  }

  // Recorrer categorías y líneas
  const categoriasOrden = ['VINIBALL', 'VINIFAN', 'REPRESENTADAS', 'SIN CATEGORÍA']
  const categorias = Object.keys(resumen).sort((a, b) => {
    const idxA = categoriasOrden.indexOf(a)
    const idxB = categoriasOrden.indexOf(b)
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return a.localeCompare(b)
  })

  let granTotalCajas = 0
  let granTotalPeso = 0

   categorias.forEach(cat => {
     const lineas = resumen[cat]
     const lineasKeys = Object.keys(lineas).sort()

     // Título categoría
     contenido.push([`===== ${cat} =====`, '', '', '', '', '', ''])

     let catTotalCajas = 0
     let catTotalPeso = 0

     lineasKeys.forEach(linea => {
       const items = lineas[linea]

       // Datos de productos
       items.forEach(item => {
         agregarLinea(item)
       })

       // Total línea
       agregarTotalLinea(linea, items)

       catTotalCajas += items.reduce((sum, i) => sum + i.cajas, 0)
       catTotalPeso += items.reduce((sum, i) => sum + i.pesoTotal, 0)
     })

     // Total categoría
     agregarTotalCategoria(cat, Object.values(lineas))

     granTotalCajas += catTotalCajas
     granTotalPeso += catTotalPeso
   })

  // Total general
  contenido.push(['', '', '', '', '', '', ''])
  contenido.push(['===== TOTAL GENERAL =====', '', '', '', '', granTotalCajas, granTotalPeso])

  // Escribir contenido a la hoja
  XLSX.utils.sheet_add_aoa(ws, contenido, { origin: 0 })

  // Estilos
  ws['!cols'] = [
    { wch: 5 },   // N°
    { wch: 12 },  // SKU
    { wch: 40 },  // PRODUCTO
    { wch: 8 },   // CANT
    { wch: 14 },  // PESO UNIT
    { wch: 8 },   // CAJAS
    { wch: 14 }   // PESO TOTAL
  ]

  // Aplicar estilos a celdas
  const applyStyles = (row: number, isBold = false, isHeader = false, bgColor: string | null = null) => {
    const cols = 7
    for (let c = 0; c < cols; c++) {
      const cell = XLSX.utils.encode_cell({ r: row, c })
      if (!ws[cell]) continue
      ws[cell].s = {
        font: { bold: isBold, sz: isHeader ? 12 : 10 },
        fill: bgColor ? { fgColor: { rgb: bgColor } } : undefined,
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
        alignment: { vertical: "center" }
      }
    }
  }

  // Estilar headers (fila 2)
  for (let c = 0; c < 7; c++) {
    const cell = XLSX.utils.encode_cell({ r: 2, c })
    if (ws[cell]) {
      ws[cell].s = {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
        fill: { fgColor: { rgb: "333333" } },
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
        alignment: { horizontal: "center" }
      }
    }
  }

  // Estilar filas de datos
  let currentRow = 3
  categorias.forEach(cat => {
    const lineas = resumen[cat]
    const lineasKeys = Object.keys(lineas).sort()

    // Categoría (fila de título)
    applyStyles(currentRow, true, false, "E8F5E9")
    currentRow++

    lineasKeys.forEach(linea => {
      const items = lineas[linea]

      // Productos
      items.forEach(() => {
        applyStyles(currentRow, false, false, null)
        currentRow++
      })

      // Total línea
      applyStyles(currentRow, true, false, "F0F0F0")
      currentRow++
    })

    // Total categoría
    applyStyles(currentRow, true, true, "333333")
    currentRow++
    applyStyles(currentRow, false, false, null) // vacío
    currentRow++
  })

  // Total general
  applyStyles(currentRow, true, true, "22C55E")

  XLSX.utils.book_append_sheet(wb, ws, 'ANÁLISIS')
}

// =====================================================================
// ESTILOS G360 - Colores para Excel
// =====================================================================
const G360_ACCENT = "00D084"      // Verde G360
const G360_LIGHT = "E8F5E9"       // Verde claro
const G360_OK = "22C55E"          // Verde stock OK
const G360_AJ = "F59E0B"          // Naranja stock AJ
const G360_AGOTADO = "EF4444"     // Rojo stock Agotado
const G360_ROW_EVEN = "F8FAFC"     // Gris claro fila par
const G360_ROW_ODD = "FFFFFF"      // Blanco fila impar

/**
 * Función auxiliar para cargar logo como base64
 * @param worksheet Hoja de excel donde agregar el logo
 */
const agregarLogoBase64 = async (worksheet: XLSX.WorkSheet) => {
  try {
    const response = await fetch('/logo-cipsa.png')
    const blob = await response.blob()
    return new Promise<void>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        worksheet['!images'] = [{
          x: 0,
          y: 0,
          w: 2,
          h: 3,
          path: reader.result as string
        }]
        resolve()
      }
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.log('Logo no agregado:', (e as Error).message)
  }
}

/**
 * Generar archivo XLSX completo con formato G360
 * @param data Datos completos del pedido
 */
export const generarXLSX = async (data: DatosPedido) => {
  const { cliente, documento, numeroPedido, vendedor, productos, tipo } = data
  
  // Crear workbook
  const wb = XLSX.utils.book_new()
  
  // =====================================================================
  // XLSX TIPO COTIZACIÓN - Formato completo con headers
  // =====================================================================
  if (tipo === 'cotizacion') {
    // Encabezados de la hoja - Estilo VBA
    const headers = [
      ['CORPORACIÓN DE INDUSTRIAS PLÁSTICAS S.A.', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'PEDIDO'],
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['CLIENTE:', cliente || '', '', '', '', '', '', '', '', 'RUC:', documento || '', '', '', 'PEDIDO:', numeroPedido || '', 'VENDEDOR:', vendedor || ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ]
    
    // Título empresa
    const ws = XLSX.utils.aoa_to_sheet(headers)
    
    // Estilos para título empresa (fila 1)
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 })
    ws[titleCell].s = { font: { bold: true, sz: 16, color: { rgb: "333333" } } }
    
    // Badge PEDIDO (columna O = índice 14, ajustar)
    const badgeCell = XLSX.utils.encode_cell({ r: 0, c: 14 })
    ws[badgeCell].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "333333" } }, alignment: { horizontal: "center" } }
    ws[badgeCell].v = 'PEDIDO'
    
    // Info cliente (fila 3) - Estilo VBA
    for (let c = 0; c <= 14; c++) {
      const cell = XLSX.utils.encode_cell({ r: 2, c })
      if (ws[cell] && ws[cell].v) {
        ws[cell].s = { 
          font: { 
            bold: c % 3 === 0, 
            color: { rgb: c === 9 || c === 13 ? "FFFFFF" : "000000" } 
          }, 
          fill: { fgColor: { rgb: c === 9 || c === 13 ? "333333" : G360_LIGHT } },
          border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
        }
      }
    }
    
    // Ajuste: fila 3 alto de fila
    ws['!rows'] = ws['!rows'] || []
    ws['!rows'][2] = { hpt: 22 }
    
    // ===== PANEL DE TOTALES (filas 4-6) - Estilo VBA =====
    // Fila 4: Headers | Fila 5: Valores | Fila 6: Vacío
    
    const totalsHeaders = [
      ['', '', '', '', '', '', '', '', 'Subtotal:', 'Total + IGV:', 'Total Disponible:', '', '', '', '', '']
    ]
    XLSX.utils.sheet_add_aoa(ws, totalsHeaders, { origin: 4 })
    
    // Estilos headers totales (fila 4) - Fondo gris oscuro
    for (let c = 8; c <= 10; c++) {
      const cell = XLSX.utils.encode_cell({ r: 3, c })
      ws[cell].s = { 
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 }, 
        fill: { fgColor: { rgb: "333333" } },
        alignment: { horizontal: "right" }
      }
    }
    
    // Fila 4 altura
    ws['!rows'][3] = { hpt: 20 }
    ws['!rows'][4] = { hpt: 28 }
    ws['!rows'][5] = { hpt: 10 }  // Separador
    
    // ===== TABLA DE PRODUCTOS (fila 7+) - Con columnas separadoras =====
    const tableStartRow = 7
    
    // Encabezados tabla - 16 columnas (A-P) con separadoras H, N, O
    const tableHeaders = [
      ['N°', 'CANT.', 'U/M', 'SKU', 'DESCRIPCIÓN', 'ESTADO', 'P. LISTA (S/.)', '', 'DESC 01', 'DESC 02', 'P. NETO (S/.)', 'PRECIO UNIT.', 'PRECIO VENTA', '', '', '']
    ]
    
    // Agregar headers de tabla
    XLSX.utils.sheet_add_aoa(ws, tableHeaders, { origin: tableStartRow })
    
    // Estilos para headers de tabla (fila 7) - Fondo gris oscuro
    for (let c = 0; c < 16; c++) {
      const cell = XLSX.utils.encode_cell({ r: tableStartRow, c })
      const isSeparator = c === 7 || c === 13 || c === 14
      ws[cell].s = { 
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 }, 
        fill: { fgColor: { rgb: isSeparator ? "CCCCCC" : "333333" } }, 
        alignment: { horizontal: "center" },
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
      }
    }
    
    // Fila 7 altura
    ws['!rows'][6] = { hpt: 35 }
    
    // ===== DATOS DE PRODUCTOS (16 columnas: A-P) =====
    const dataStartRow = tableStartRow + 1
    
    if (productos && productos.length > 0) {
      productos.forEach((p, i) => {
        const row = dataStartRow + i
        
        // Datos directos - 16 columnas (A-P) con separadoras
        // A:N°, B:CANT, C:U/M, D:SKU, E:Descripción, F:Estado, G:P.Lista, H:sep, I:Desc1, J:Desc2, K:P.Neto, L:P.Unit, M:P.Venta, N:sep, O:sep, P:vacío
        XLSX.utils.sheet_add_aoa(ws, [[
          i + 1,                           // A: N°
          p.cantidad || 0,               // B: CANT
          p.unidadMedida || '',           // C: U/M
          p.codigo || '',                 // D: SKU
          p.descripcion || '',            // E: DESCRIPCIÓN
          p.estadoStock || '',             // F: ESTADO
          p.precioUnitario || 0,          // G: P. LISTA
          '',                              // H: separador
          p.descuento1 || 0,              // I: DESC 01
          p.descuento2 || 0,              // J: DESC 02
          0,                               // K: P. NETO (fórmula)
          0,                               // L: PRECIO UNIT. (fórmula)
          0,                               // M: PRECIO VENTA (fórmula)
          '',                              // N: separador
          '',                              // O: separador
          0                                // P: vacío (reservado)
        ]], { origin: row })
        
        // Fórmulas - Excel usa 1-based y las filas empiezan en dataStartRow
        const excelRow = row + 1
        
        // Fórmula: CANT * P.LISTA * (1-DESC1/100) * (1-DESC2/100)
        const formulaValor = `B${excelRow}*G${excelRow}*(1-I${excelRow}/100)*(1-J${excelRow}/100)`
        // Precio Unitario: (P.Neto / CANT) * 1.18
        const formulaPrecioUnit = `IFERROR(K${excelRow}/B${excelRow}*1.18,0)`
        // Precio Venta: P.Neto * 1.18
        const formulaPrecioVenta = `K${excelRow}*1.18`
        
        // Color de fila zebra y según estado de stock
        const rowColor = i % 2 === 0 ? G360_ROW_EVEN : G360_ROW_ODD
        const estado = p.estadoStock || ''
        let stockColor = G360_ACCENT
        if (estado === 'OK') stockColor = G360_OK
        else if (estado === 'AJ') stockColor = G360_AJ
        else if (estado === 'Agotado') stockColor = G360_AGOTADO
        
        // Aplicar estilos base a todas las celdas (16 columnas A-P)
        for (let c = 0; c < 16; c++) {
          const cell = XLSX.utils.encode_cell({ r: row, c })
          ws[cell] = ws[cell] || { v: '' }
          const isSeparator = c === 7 || c === 13 || c === 14
          ws[cell].s = { 
            fill: { fgColor: { rgb: isSeparator ? "F0F0F0" : rowColor } },
            border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
            alignment: { vertical: "center" }
          }
        }
        
        // Columna N° (A) - centrado
        const numCell = XLSX.utils.encode_cell({ r: row, c: 0 })
        ws[numCell].s.alignment = { horizontal: "center" }
        
        // Columna ESTADO (F) - color según stock
        const estadoCell = XLSX.utils.encode_cell({ r: row, c: 5 })
        ws[estadoCell].s = { 
          fill: { fgColor: { rgb: stockColor } },
          font: { bold: true, color: { rgb: "FFFFFF" } },
          border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
          alignment: { horizontal: "center" }
        }
        
        // Columna G (P. LISTA) - formato moneda
        const listaCell = XLSX.utils.encode_cell({ r: row, c: 6 })
        ws[listaCell].z = '#,##0.00'
        
        // Columnas I, J (DESC 01, DESC 02) - número simple
        const dscto1Cell = XLSX.utils.encode_cell({ r: row, c: 8 })
        ws[dscto1Cell].z = '0'
        
        const dscto2Cell = XLSX.utils.encode_cell({ r: row, c: 9 })
        ws[dscto2Cell].z = '0'
        
        // Columna K (P. NETO) - fórmula + formato moneda
        const valorCell = XLSX.utils.encode_cell({ r: row, c: 10 })
        ws[valorCell] = { f: formulaValor, t: 'n', z: '#,##0.00', s: { 
          fill: { fgColor: { rgb: "DCDCDC" } },
          font: { bold: true },
          border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
          alignment: { horizontal: "right" }
        } }
        
        // Columna L (PRECIO UNIT.) - fórmula + formato moneda
        const precioUnitCell = XLSX.utils.encode_cell({ r: row, c: 11 })
        ws[precioUnitCell] = { f: formulaPrecioUnit, t: 'n', z: '#,##0.00', s: { 
          fill: { fgColor: { rgb: "C8E6C9" } },
          font: { bold: true },
          border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
          alignment: { horizontal: "right" }
        } }
        
        // Columna M (PRECIO VENTA) - fórmula + formato moneda
        const precioCell = XLSX.utils.encode_cell({ r: row, c: 12 })
        ws[precioCell] = { f: formulaPrecioVenta, t: 'n', z: '#,##0.00', s: { 
          fill: { fgColor: { rgb: stockColor } },
          font: { bold: true, color: { rgb: "FFFFFF" } },
          border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
          alignment: { horizontal: "right" }
        } }
      })
    }
    
    // ===== TOTALES =====
    // Fila 4: Headers (ya configurados), Fila 5: Valores
    const totalsValuesRow = 5 // Fila 5 (índice 4)
    
    // Columnas: F=ESTADO (col 5), K=PRECIO_VENTA (col 12), J=VALOR_VENTA (col 10)
    // Fila datos: dataStartRow (=8) a lastDataRow
    const firstDataExcelRow = dataStartRow
    const lastDataExcelRow = dataStartRow + (productos?.length || 0) - 1
    
    // Agregar fila de valores de totales - Estilo VBA optimizado
    // K=P.Neto (col 10), M=PRECIO VENTA (col 12)
    XLSX.utils.sheet_add_aoa(ws, [
      ['', '', '', '', '', '', '', '', 'SUBTOTAL:', `=SUM(K${firstDataExcelRow}:K${lastDataExcelRow})`, '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', 'Total + IGV:', `=IFERROR(K${totalsValuesRow}*1.18,0)`, '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', 'Total Disponible:', `=IFERROR(SUMPRODUCT(((F${firstDataExcelRow}:F${lastDataExcelRow}="OK")+(F${firstDataExcelRow}:F${lastDataExcelRow}="AJ"))*M${firstDataExcelRow}:M${lastDataExcelRow}),0)`, '', '', '', '', '', '']
    ], { origin: totalsValuesRow })
    
    // Estilos para totales - VBA Style
    // Fila 5: Subtotal, Fila 6: Total+IGV, Fila 7: Total Disponible
    
    for (let c = 8; c <= 10; c++) {
      for (let r = totalsValuesRow; r <= totalsValuesRow + 2; r++) {
        const cell = XLSX.utils.encode_cell({ r, c })
        if (!ws[cell]) continue
        
        const rowIndex = r - totalsValuesRow
        const isSubtotal = rowIndex === 0
        const isTotalPagar = rowIndex === 1
        const isTotalDisp = rowIndex === 2
        
        let bgColor = G360_LIGHT
        let fontColor = "000000"
        let borderStyle = "thin"
        let borderColor = "B4B4B4"
        let fontWeight = true
        let fontSize = 12
        
        if (isSubtotal) {
          bgColor = "F0F0F0"
          fontColor = "000000"
        } else if (isTotalPagar) {
          bgColor = "FFFFFF"
          fontColor = "FF0000"
          borderStyle = "thick"
          borderColor = "FF0000"
          fontSize = 14
        } else if (isTotalDisp) {
          bgColor = "F0F0F0"
          fontColor = "000000"
        }
        
        ws[cell].s = { 
          font: { bold: fontWeight, sz: fontSize, color: { rgb: fontColor } }, 
          fill: { fgColor: { rgb: bgColor } },
          border: { 
            top: { style: borderStyle, color: { rgb: borderColor } }, 
            bottom: { style: borderStyle, color: { rgb: borderColor } }, 
            left: { style: borderStyle, color: { rgb: borderColor } }, 
            right: { style: borderStyle, color: { rgb: borderColor } } 
          },
          alignment: { horizontal: "right" },
          z: '#,##0.00'
        }
        
        if (isTotalPagar) {
          ws[cell].s.font.color = { rgb: "FF0000" }
        }
      }
    }
    
    // Ancho de columnas - 16 columnas (A-P) con separadoras
    ws['!cols'] = [
      { wch: 5 },   // A: N°
      { wch: 10 },  // B: CANT
      { wch: 8 },   // C: U/M
      { wch: 14 },  // D: SKU
      { wch: 35 },  // E: DESCRIPCIÓN
      { wch: 10 },  // F: ESTADO
      { wch: 14 },  // G: P. LISTA
      { wch: 2 },   // H: separador
      { wch: 10 },  // I: DESC 01
      { wch: 10 },  // J: DESC 02
      { wch: 14 },  // K: P. NETO
      { wch: 14 },  // L: PRECIO UNIT.
      { wch: 14 },  // M: PRECIO VENTA
      { wch: 2 },   // N: separador
      { wch: 2 },   // O: separador
      { wch: 10 }   // P: vacío
    ]
    
    // Freeze panes - Congelar fila 7 (headers tabla) y columna A
    ws['!freeze'] = { x: 1, y: 7 }
    
    XLSX.utils.book_append_sheet(wb, ws, 'PEDIDO')
    
    // Agregar logo en A1:B4 - cargar como base64 para navegador
    await agregarLogoBase64(ws)

    // =====================================================================
    // HOJA 2 - ANÁLISIS POR LÍNEA Y CATEGORÍA
    // =====================================================================
    generarHojaAnalisis(wb, productos || [])
  }

  // =====================================================================
  // DESCARGAR ARCHIVO
  // =====================================================================
  const nombre = `cotizacion-${limpiarNombreArchivo(cliente || 'doc')}.xlsx`
  XLSX.writeFile(wb, nombre)
}
