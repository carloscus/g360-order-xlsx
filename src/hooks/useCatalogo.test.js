import { describe, it, expect } from 'vitest'
import { esItemApiValido, normalizarItemApi, extraerIdLinea, crearIndiceLineas, resolverLineaCanonica } from './useCatalogo.js'

describe('esItemApiValido', () => {
  it('acepta item con sku y línea completos', () => {
    expect(esItemApiValido({ sku: '123', linea: '76 - ESCRITURA' })).toBe(true)
  })

  it('rechaza item sin sku', () => {
    expect(esItemApiValido({ linea: '76 - ESCRITURA' })).toBe(false)
    expect(esItemApiValido({ sku: '', linea: '76 - ESCRITURA' })).toBe(false)
  })

  it('rechaza item sin línea', () => {
    expect(esItemApiValido({ sku: '123' })).toBe(false)
    expect(esItemApiValido({ sku: '123', linea: '' })).toBe(false)
  })

  it('rechaza item no objeto/nulo', () => {
    expect(esItemApiValido(null)).toBe(false)
    expect(esItemApiValido(undefined)).toBe(false)
    expect(esItemApiValido('123')).toBe(false)
  })
})

describe('normalizarItemApi', () => {
  it('conserva el ID de línea del catálogo/API', () => {
    const item = {
      sku: '123',
      codigo: '123',
      linea: '76 - ESCRITURA',
      estado_linea: 'NUEVO',
      un_bx: 50,
      peso_kg: 0.1,
      sin_catalogo: false,
    }

    const out = normalizarItemApi(item)

    expect(out.linea).toBe('76 - ESCRITURA')
    expect(out.estadoLinea).toBe('NUEVO')
    expect(out.unBx).toBe(50)
    expect(out.pesoKg).toBe(0.1)
  })

  it('usa defecto SIN LÍNEA cuando falta la línea', () => {
    const out = normalizarItemApi({ sku: '123', estado_linea: '' })
    expect(out.linea).toBe('SIN LÍNEA')
  })

  it('conserva linea_id explícito del API', () => {
    const out = normalizarItemApi({ sku: '123', linea: '01 - PELOTAS', linea_id: '01' })
    expect(out.lineaId).toBe('01')
  })

  it('deriva lineaId del prefijo numérico cuando el API no lo trae', () => {
    const out = normalizarItemApi({ sku: '123', linea: '76 - ESCRITURA' })
    expect(out.lineaId).toBe('76')
  })

  it('deriva lineaId del prefijo alfabético cuando el API no lo trae', () => {
    const out = normalizarItemApi({ sku: '123', linea: 'MA - MASCOTAS' })
    expect(out.lineaId).toBe('MA')
  })

  it('devuelve lineaId null para líneas sin prefijo', () => {
    const out = normalizarItemApi({ sku: '123', linea: 'OTROS' })
    expect(out.lineaId).toBe(null)
  })
})

describe('extraerIdLinea', () => {
  it('extrae el ID del prefijo antes de " - "', () => {
    expect(extraerIdLinea('01 - PELOTAS')).toBe('01')
    expect(extraerIdLinea('MA - MASCOTAS')).toBe('MA')
    expect(extraerIdLinea('23 - SEGURIDAD Y SEÑALIZACION VIAL')).toBe('23')
  })

  it('tolera espacios variables alrededor del guión', () => {
    expect(extraerIdLinea('01-PELOTAS')).toBe('01')
    expect(extraerIdLinea('01  -  PELOTAS')).toBe('01')
  })

  it('devuelve null sin línea, vacía o sin prefijo', () => {
    expect(extraerIdLinea(null)).toBe(null)
    expect(extraerIdLinea(undefined)).toBe(null)
    expect(extraerIdLinea('')).toBe(null)
    expect(extraerIdLinea('OTROS')).toBe(null)
  })
})

describe('resolverLineaCanonica', () => {
  const CATALOGO = [
    { linea: '76 - ESCRITURA' },
    { linea: '76 - ESCRITURA' },
    { linea: '76 - ESCRITURA' },
    { linea: 'CB - ESCRITURA' },
    { linea: 'ESCRITURA' },
    { linea: '02 - FORROS' },
  ]

  it('resuelve nombre sin prefijo contra la variante canónica', () => {
    const indice = crearIndiceLineas(CATALOGO)
    const out = resolverLineaCanonica('ESCRITURA', indice)
    expect(out.linea).toBe('76 - ESCRITURA')
    expect(out.lineaId).toBe('76')
  })

  it('la frecuencia del catálogo rompe conflictos de variantes', () => {
    const indice = crearIndiceLineas(CATALOGO)
    const out = resolverLineaCanonica('CB - ESCRITURA', indice)
    expect(out.linea).toBe('76 - ESCRITURA')
    expect(out.lineaId).toBe('76')
  })

  it('resuelve por ID cuando el ERP solo manda el número', () => {
    const indice = crearIndiceLineas(CATALOGO)
    const out = resolverLineaCanonica('02', indice)
    expect(out.linea).toBe('02 - FORROS')
    expect(out.lineaId).toBe('02')
  })

  it('devuelve null si no hay match o el índice es inválido', () => {
    const indice = crearIndiceLineas(CATALOGO)
    expect(resolverLineaCanonica('LINEA INEXISTENTE', indice)).toBe(null)
    expect(resolverLineaCanonica('', indice)).toBe(null)
    expect(resolverLineaCanonica(null, indice)).toBe(null)
    expect(resolverLineaCanonica('76', null)).toBe(null)
  })

  it('índice vacío con items sin línea', () => {
    const indice = crearIndiceLineas([{ linea: 'OTROS' }, {}])
    expect(indice.porNombre.size).toBe(0)
    expect(resolverLineaCanonica('OTROS', indice)).toBe(null)
  })
})
