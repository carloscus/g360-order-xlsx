/**
 * ERPParserService
 * ================
 * Parsea texto pegado desde el portapapeles (ERP VES) y devuelve un array
 * normalizado de productos.
 *
 * Formato actual (nuevo ERP VES) — 28 columnas TSV:
 *   [0]=Centro  [1]=SKU  [2]=Descripción  [3]=Cantidad  [4]=Stock
 *   [5]=U/M  [6]=Precio  [7]=Desc1%  [8]=Desc2%  [9]=ValorVenta
 *   [10..24]=vacíos/ceros  [25]=LíneaERP  [26]=CantUnd  [27]=PesoKg
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
      'M2', 'M', 'L', 'LT', 'GLN', 'CAJITA', 'BULT', 'DOCENA', 'SET',
      'BOLSAS', 'PIEZAS', 'CAJAS', 'PAQUETES', 'LATAS', 'TUBOS'
    ])

    for (const rawLinea of lineas) {
      const linea = rawLinea
      if (!linea.trim()) continue

      const esTSV = linea.includes('\t')
      if (!esTSV) continue

      const partes = linea.split('\t')

      // Formato nuevo: 28 columnas, [0]=Centro, [1]=SKU numérico
      if (partes.length < 10) continue

      // Saltar encabezados
      const col0 = (partes[0] || '').trim().toUpperCase()
      const col1 = (partes[1] || '').trim().toUpperCase()
      if (col1 === 'SKU' || col0.includes('CARGAS') || col0.includes('MUESTRA')) continue
      if (col0 === 'N°' || col0 === 'Nº') continue

      // ── Índices Formato Nuevo ─────────────────────────────────────
      const idxCentro   = 0
      const idxSku      = 1
      const idxDesc     = 2
      const idxCant     = 3
      const idxStock    = 4
      const idxUnidad   = 5
      const idxPrecio   = 6
      const idxDto1     = 7
      const idxDto2     = 8
      // Los últimos 3 campos siempre son: LíneaERP, CantUnd, PesoKg
      const idxLineaERP = partes.length - 3
      const idxCantUnd  = partes.length - 2
      const idxPesoKg   = partes.length - 1

      const codigo = (partes[idxSku] || '').trim()
      if (!codigo) continue

      const centro = (partes[idxCentro] || '').trim()
      const descripcion = (partes[idxDesc] || '').trim()
      const unidadRaw = (partes[idxUnidad] || '').trim().toUpperCase()
      const unidadMedida = UNIDADES.has(unidadRaw) ? partes[idxUnidad].trim() : 'UNIDAD'

      const cantidad = this.parseNumber(partes[idxCant])
      const stock = this.parseNumber(partes[idxStock])

      // Saltar filas sin cantidad o sin código
      if (cantidad <= 0) continue

      productos.push({
        id:              id++,
        codigo,
        descripcion,
        marca:           this.extraerMarca(descripcion),
        cantidad,
        stock,
        precioUnitario:  this.parseNumber(partes[idxPrecio]),
        unidadMedida,
        descuento1:      this.parseNumber(partes[idxDto1]) || 0,
        descuento2:      this.parseNumber(partes[idxDto2]) || 0,
        montoDescuento:  0,
        linea:           (partes[idxLineaERP] || '').trim() || rawLinea,
        centro,
        // Campos extendidos ERP
        cantidadUnd:     this.parseNumber(partes[idxCantUnd]) || cantidad,
        pesoKg:          this.parseNumber(partes[idxPesoKg]),
        estadoLinea:     undefined,
      })
    }

    return productos
  }

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

  static parseNumber(valor) {
    if (valor === null || valor === undefined || valor === '') return 0
    if (typeof valor === 'number') return valor
    const num = String(valor)
      .replace(/\s/g, '')
      .replace(/,/g, '')
      .trim()
    if (!num) return 0
    const parsed = parseFloat(num)
    return isNaN(parsed) ? 0 : parsed
  }
}
