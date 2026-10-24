import { describe, expect, it } from 'vitest'
import { formatMoneda, formatNumero, limpiarNombreArchivo } from './formatters'

describe('formatMoneda', () => {
  it('formats soles with two decimal places', () => {
    const result = formatMoneda(1234.5)

    expect(result).toContain('S/')
    expect(result).toContain('1,234.50')
  })

  it('falls back to zero for invalid numeric input', () => {
    expect(formatMoneda(Number.NaN)).toBe('S/ 0.00')
  })
})

describe('formatNumero', () => {
  it('respects the requested decimal scale', () => {
    expect(formatNumero(1234.5, 0)).toBe('1,235')
    expect(formatNumero(1234.5, 2)).toBe('1,234.50')
  })

  it('formats invalid values as zero with the requested scale', () => {
    expect(formatNumero(Number.NaN, 3)).toBe('0.000')
  })
})

describe('limpiarNombreArchivo', () => {
  it('replaces forbidden filename characters and normalizes spaces', () => {
    expect(limpiarNombreArchivo('Pedido: Abril / Norte?')).toBe('pedido_-abril-_-norte_')
  })

  it('preserves the letter x in extensions and names', () => {
    expect(limpiarNombreArchivo('Reporte XLSX')).toBe('reporte-xlsx')
  })
})
