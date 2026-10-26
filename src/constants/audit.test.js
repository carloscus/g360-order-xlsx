import { describe, it, expect } from 'vitest'
import { auditarProducto, REGLAS_AUDITORIA } from './audit'

describe('Reglas de auditoría con catálogo enriquecido (API v2)', () => {
  it('detecta producto descontinuado', () => {
    const hallazgos = auditarProducto({
      id: 1, codigo: '12345', descripcion: 'X',
      cantidad: 10, stock: 100, precioUnitario: 5,
      descontinuado: true
    })
    expect(hallazgos.some(h => h.reglaId === 'PRODUCTO_DESCONTINUADO')).toBe(true)
  })

  it('detecta producto no cotizable', () => {
    const hallazgos = auditarProducto({
      id: 2, codigo: '12346', descripcion: 'Y',
      cantidad: 10, stock: 100, precioUnitario: 5,
      cotizable: false
    })
    expect(hallazgos.some(h => h.reglaId === 'PRODUCTO_NO_COTIZABLE')).toBe(true)
  })

  it('detecta producto no vigente', () => {
    const hallazgos = auditarProducto({
      id: 3, codigo: '12347', descripcion: 'Z',
      cantidad: 10, stock: 100, precioUnitario: 5,
      vigente: false
    })
    expect(hallazgos.some(h => h.reglaId === 'PRODUCTO_NO_VIGENTE')).toBe(true)
  })

  it('detecta producto por activar', () => {
    const hallazgos = auditarProducto({
      id: 4, codigo: '12348', descripcion: 'W',
      cantidad: 10, stock: 100, precioUnitario: 5,
      por_activar: true
    })
    expect(hallazgos.some(h => h.reglaId === 'PRODUCTO_POR_ACTIVAR')).toBe(true)
  })

  it('no marca hallazgos cuando los flags son correctos', () => {
    const hallazgos = auditarProducto({
      id: 5, codigo: '12349', descripcion: 'V',
      cantidad: 10, stock: 100, precioUnitario: 5,
      descontinuado: false,
      cotizable: true,
      vigente: true,
      por_activar: false,
      en_guia: true,
      compromiso: false,
      tieneDatosCatalogo: true,
      unBx: 50,
      pesoKg: 0.5,
      estadoStock: 'OK'
    })
    // No debe tener hallazgos de las reglas enriquecidas
    expect(hallazgos.some(h => h.reglaId === 'PRODUCTO_DESCONTINUADO')).toBe(false)
    expect(hallazgos.some(h => h.reglaId === 'PRODUCTO_NO_COTIZABLE')).toBe(false)
    expect(hallazgos.some(h => h.reglaId === 'PRODUCTO_NO_VIGENTE')).toBe(false)
    expect(hallazgos.some(h => h.reglaId === 'PRODUCTO_POR_ACTIVAR')).toBe(false)
  })

  it('las reglas enriquecidas están registradas', () => {
    expect(REGLAS_AUDITORIA.PRODUCTO_DESCONTINUADO).toBeDefined()
    expect(REGLAS_AUDITORIA.PRODUCTO_NO_COTIZABLE).toBeDefined()
    expect(REGLAS_AUDITORIA.PRODUCTO_NO_VIGENTE).toBeDefined()
    expect(REGLAS_AUDITORIA.PRODUCTO_POR_ACTIVAR).toBeDefined()
    expect(REGLAS_AUDITORIA.PRODUCTO_FUERA_GUIA).toBeDefined()
    expect(REGLAS_AUDITORIA.PRODUCTO_CON_COMPROMISO).toBeDefined()
  })
})
