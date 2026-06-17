/**
 * ERPParserService
 * ================
 * Parsea texto pegado desde el portapapeles (ERP VES) y devuelve un array
 * normalizado de productos.
 *
 * Dos formatos soportados:
 *
 *  A) TSV directo del ERP VES  (primera celda vacía)
 *     [0]=""  [1]=Centro  [2]=SKU  [3]=Descripción
 *     [4]=Cantidad  [5]=Stock  [6]=U/M  [7]=Precio  [8]=Desc1%  [9]=Desc2%
 *     [10..]=ignorar
 *
 *  B) Tabla recargada sin celda vacía inicial
 *     [0]=N° / header  [1]=SKU  [2]=Desc  [3]=Cant
 *     Variante normal:  [4]=U/M  [5]=Precio  [6]=Desc1  [7]=Desc2
 *     Variante corrida: [4]=Precio  [5]=Desc1  [6]=Desc2   (sin U/M, todo izq)
 *     Variante duplicada:[3]=Cant entera  [4]=Cant decimal (= a [3]) — estructura normal
 */
export class ERPParserService {
  static parseDataPegada(texto) {
    if (!texto || typeof texto !== 'string') return []

    const textoLimpio = texto
      .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      .replace(/\uFEFF/g, '')
    const lineas = textoLimpio.replace(/^\n+|\n+$/g, '').split('\n')
    const productos = []
    let id = 1

    const UNIDADES = new Set([
      'UNIDAD', 'KG', 'CAJA', 'PACK', 'BOLSA', 'ROLLO', 'PZA', 'PIEZA',
      'M2', 'M', 'L', 'LT', 'GLN', 'CAJITA', 'BULT', 'DOCENA', 'SET'
    ])

    // Detectar formato por la línea de encabezado o por la primera línea de datos
    // Funciona incluso si Google Sheets elimina el tab vacío inicial al exportar
    let formatoDetectado = null // 'A'|'B'|null
    for (const _raw of lineas) { // solo examinar hasta 3 primeras líneas
      if (!_raw.trim()) continue
      const _esTSV = _raw.includes('\t')
      if (!_esTSV) break
      const _p = _raw.split('\t')
      const _e = _p.map(c => (c || '').trim().toUpperCase())
      // TSV ERP VES: primera celda vacía + segunda contiene nombre de centro
      if (_e[0] === '' && (_e[1].includes('CENTRO') || _e[1].includes('ALMACEN'))) {
        formatoDetectado = 'A'; break
      }
      // Grid / tabla VES: encabezado N° o SKU en [1]
      if (_e[0] === 'N°' || _e[0] === 'Nº' || _e[1] === 'SKU') {
        formatoDetectado = 'B'; break
      }
      break // solo revisar primeras líneas
    }

    for (const rawLinea of lineas) {
      const linea = rawLinea
      if (!linea.trim()) continue

      // Detectar separador: tabs (TSV) o espacios múltiples
      const esTSV = linea.includes('\t')
      const partes = esTSV
        ? linea.split('\t')
        : linea.split(/\s{2,}/)

      // Saltar encabezados
      const col0 = (partes[0] || '').trim().toUpperCase()
      const col1 = (partes[1] || '').trim().toUpperCase()
      if (col1 === 'SKU' || col0.includes('CARGAS') || col0.includes('MUESTRA')) continue

      // ── Formato A: ERP VES (primera celda vacía) ──────────────────
      const esFormatoA = (formatoDetectado === 'A') || (formatoDetectado === null && esTSV && col0 === '')

      // ── SKU ───────────────────────────────────────────────────────
      const idxSku = esFormatoA ? 2 : 1
      if (partes.length <= idxSku) continue
      const codigo = (partes[idxSku] || '').trim()
      if (!codigo) continue

      // ── Formato B: resolver variante ───────────────────────────────
      let offsetB = 0
      if (!esFormatoA) {
        const posibleUM = (partes[4] || '').trim().toUpperCase()
        const esTextoUM = UNIDADES.has(posibleUM)
        if (!esTextoUM) {
          const col4texto = (partes[4] || '').trim()
          if (col4texto && /^[\d\s,.-]+$/.test(col4texto)) {
            const cantEntera  = this.parseNumber(partes[3])
            const cantDecimal = this.parseNumber(partes[4])
            const esCantDuplicada = cantEntera > 10 &&
              Math.abs(cantDecimal - cantEntera) < cantEntera * 0.05
            if (formatoDetectado === 'B' && !esCantDuplicada) {
              offsetB = 1   // rejilla VES sin UM: [4]=Precio, [5]=Dto1, [6]=Dto2
            } else if (formatoDetectado !== 'B' && !esCantDuplicada) {
              offsetB = 1   // autodetectado corrido
            }
          }
        }
      }

      // ── Índices ──────────────────────────────────────────────────
      // Formato A (TSV ERP VES: col0="" col1=Centro)
      // [0]="" [1]=Centro [2]=SKU [3]=Desc [4]=Cant [5]=Stock [6]=UM [7]=Precio [8]=Dto1% [9]=Dto2% [10]=ValorVenta
      const A_Cant    = 4,  A_Stock  = 5,  A_Unidad = 6,  A_Precio = 7,  A_Dto1 = 8,  A_Dto2 = 9
      // Formato B normal (UM en [4])
      const B_Cant    = 3,  B_Precio = 5,  B_Unidad = 4,  B_Dto1 = 6,  B_Dto2 = 7
      // Formato B corrido sin UM  ([4]=Precio)
      const BC_Cant   = 3,  BC_Precio = 4, BC_Dto1 = 5, BC_Dto2 = 6

      const f  = () => esFormatoA
      const b  = () => !esFormatoA && offsetB === 0
      const bc = () => !esFormatoA && offsetB === 1

      const idxCant    = f() ? A_Cant    : (bc() ? BC_Cant  : B_Cant)
      const idxStock   = f() ? A_Stock   : 0   // solo Formato A incluye stock
      const idxUnidad  = f() ? A_Unidad  : (b()  ? B_Unidad : 0)
      const idxPrecio  = f() ? A_Precio  : (b()  ? B_Precio : BC_Precio)
      const idxDto1    = f() ? A_Dto1    : (b()  ? B_Dto1   : BC_Dto1)
      const idxDto2    = f() ? A_Dto2    : (b()  ? B_Dto2   : BC_Dto2)

      const cantidad    = this.parseNumber(partes[idxCant])
      const descripcion = (partes[idxSku + 1] || '').trim()

      // if (id <= 6) {
      //   console.log(`[PARSE L${id}] fmtA=${esFormatoA} offB=${offsetB}`,
      //     { cant: cantidad, stock: this.parseNumber(partes[idxStock]),
      //       precio: this.parseNumber(partes[idxPrecio]), um: (partes[idxUnidad]||'').slice(0,20),
      //       dto1: this.parseNumber(partes[idxDto1]), dto2: this.parseNumber(partes[idxDto2]),
      //       line0: JSON.stringify(partes[0]), line1: JSON.stringify(partes[1]) })
      // }

      productos.push({
        id:              id++,
        codigo:          codigo,
        descripcion:     descripcion,
        marca:           this.extraerMarca(descripcion),
        cantidad,
        stock:           this.parseNumber(partes[idxStock]),
        precioUnitario:  this.parseNumber(partes[idxPrecio]),
        unidadMedida:    (partes[idxUnidad] && UNIDADES.has((partes[idxUnidad] || '').trim().toUpperCase()) ? partes[idxUnidad].trim() : 'UNIDAD'),
        descuento1:      this.parseNumber(partes[idxDto1]) || 0,
        descuento2:      this.parseNumber(partes[idxDto2]) || 0,
        montoDescuento:  0,
        linea:           rawLinea,
      })
    }

    return productos
  }

  // Extrae la marca desde la descripción
  // Corta en el primer indicador de variante: país, color, #N, guión-modelo
  static extraerMarca(descripcion) {
    const d = (descripcion || '').trim().toUpperCase()
    if (!d) return 'SIN MARCA'
    const cortes = [
      /\s+BRASIL$/, /\s+USA$/, /\s+PERU$/,
      /\s+\d{1,2}$/, /\s*#\d/, /\s+-\w+/, /\s+NP$/
    ]
    let corte = d.length
    for (const pat of cortes) {
      const m = d.match(pat)
      if (m) corte = Math.min(corte, m.index)
    }
    return d.slice(0, corte).trim() || 'SIN MARCA'
  }

  // Formatea número eliminando espacios y comas de miles, manteniendo punto decimal
  static parseNumber(valor) {
    if (valor === null || valor === undefined || valor === '') return 0
    if (typeof valor === 'number') return valor
    const num = String(valor)
      .replace(/\s/g, '')  // espacios = separador de miles (formato español)
      .replace(/,/g, '')   // comas = separador de miles
      .trim()
    if (!num) return 0
    const parsed = parseFloat(num)
    return isNaN(parsed) ? 0 : parsed
  }
}
