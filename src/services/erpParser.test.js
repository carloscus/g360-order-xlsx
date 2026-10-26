import { describe, it, expect } from 'vitest'
import { ERPParserService } from './erpParser'

/**
 * Formato real del ERP VES: 28 columnas separadas por tabulación.
 * Índices relevantes:
 *   [0]=Centro [1]=SKU [2]=Descripción [3]=Cantidad [4]=Stock [5]=U/M
 *   [6]=Precio [7]=Desc1 [8]=Desc2 [9]=Neto
 *   [25]=LíneaERP [26]=CantUnd [27]=PesoKg
 *   (los últimos 3 se calculan desde el final: length-3, length-2, length-1)
 */
const linea = (overrides = {}) => {
  const base = [
    '01VES', '78456', 'PORTAPAPELES VINIFAN A4 X 10 UND NP',
    '750.000', '768,240.000', 'BOLSAS', '5.2000', '28.00', '17.28', '2,322.78',
    '', '', '0', '', '', '0', '', '0', '0', '', '0', '', '', '0.00', '0',
    'ARCHIVO', '750', '0.16'
  ]
  Object.entries(overrides).forEach(([i, v]) => { base[Number(i)] = v })
  return base.join('\t')
}

describe('ERPParserService', () => {
  it('parsea una línea con formato de 28 columnas', () => {
    const res = ERPParserService.parseDataPegada(linea())
    expect(res).toHaveLength(1)
  })

  it('extrae SKU, cantidad, precio y descuentos correctamente', () => {
    const [p] = ERPParserService.parseDataPegada(linea())
    expect(p.codigo).toBe('78456')
    expect(p.cantidad).toBe(750)
    expect(p.precioUnitario).toBe(5.2)
    expect(p.descuento1).toBe(28)
    expect(p.descuento2).toBe(17.28)
    expect(p.unidadMedida).toBe('BOLSAS')
  })

  it('extrae los campos extendidos desde el final (línea, cantidadUnd, pesoKg)', () => {
    const [p] = ERPParserService.parseDataPegada(linea())
    // Los últimos 3 campos se indexan desde el final, no con índice fijo 25/26/27
    expect(p.linea).toBe('ARCHIVO')
    expect(p.cantidadUnd).toBe(750)
    expect(p.pesoKg).toBe(0.16)
  })

  it('omite filas con cantidad en cero', () => {
    const res = ERPParserService.parseDataPegada(linea({ 3: '0.000' }))
    expect(res).toHaveLength(0)
  })

  it('omite encabezados y líneas no TSV', () => {
    const texto = [
      '01VES\tSKU\tDESCRIPCION',
      'texto sin tabs',
      linea()
    ].join('\n')
    const res = ERPParserService.parseDataPegada(texto)
    expect(res).toHaveLength(1)
    expect(res[0].codigo).toBe('78456')
  })

  it('parsea múltiples líneas', () => {
    const texto = [linea(), linea({ 1: '72008', 2: 'GOMA EN BARRA' })].join('\n')
    const res = ERPParserService.parseDataPegada(texto)
    expect(res).toHaveLength(2)
    expect(res.map(p => p.codigo)).toEqual(['78456', '72008'])
  })

  it('devuelve array vacío si el texto está vacío', () => {
    expect(ERPParserService.parseDataPegada('')).toEqual([])
    expect(ERPParserService.parseDataPegada(null)).toEqual([])
  })

  it('normaliza números con coma de miles', () => {
    const [p] = ERPParserService.parseDataPegada(linea({ 3: '25,000.000', 4: '1,009,590.000' }))
    expect(p.cantidad).toBe(25000)
    expect(p.stock).toBe(1009590)
  })
})
