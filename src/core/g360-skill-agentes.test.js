import { describe, it, expect } from 'vitest'
import { getAgentesSkill } from './g360-skill-agentes'

const { calculos } = getAgentesSkill()

describe('desgloseCajas', () => {
  it('calcula cajas completas y unidades sueltas', () => {
    // 750 / 50 = 15 exactas
    const r = calculos.logistica.desglose(750, 50)
    expect(r.cajas).toBe(15)
    expect(r.cajasCompletas).toBe(15)
    expect(r.unidadesSueltas).toBe(0)
  })

  it('redondea hacia arriba (ceil) cuando sobra', () => {
    // 524 / 144 = 3.63 → 4 cajas, 3 completas, 92 sueltas
    const r = calculos.logistica.desglose(524, 144)
    expect(r.cajas).toBe(4)
    expect(r.cajasCompletas).toBe(3)
    expect(r.unidadesSueltas).toBe(92)
  })

  it('sin unidades por caja devuelve cajas en 0', () => {
    // unBx=0 → no se puede calcular
    const r = calculos.logistica.desglose(100, 0)
    expect(r.cajas).toBe(0)
    expect(r.unidadesSueltas).toBe(100)
  })
})

describe('valorVenta', () => {
  it('aplica descuentos en cascada', () => {
    // 750 * 5.2 = 3900, con 28% y 17.28% de descuento
    const vv = calculos.basic.valorVenta(750, 5.2, 28, 17.28)
    // 3900 * (1 - 0.28) * (1 - 0.1728) = 3900 * 0.72 * 0.8272 = 2322.78
    expect(Math.round(vv * 100) / 100).toBe(2322.78)
  })

  it('sin descuentos el valor es cantidad por precio', () => {
    expect(calculos.basic.valorVenta(100, 10, 0, 0)).toBe(1000)
  })
})

describe('estadoStock', () => {
  it('OK cuando stock >= 110% de la cantidad', () => {
    expect(calculos.stock.estado(1100, 1000)).toBe('OK')
  })

  it('AJ cuando stock entre 90% y 110%', () => {
    expect(calculos.stock.estado(950, 1000)).toBe('AJ')
  })

  it('Agotado cuando stock < 90% de la cantidad', () => {
    expect(calculos.stock.estado(500, 1000)).toBe('Agotado')
  })
})

describe('totales del pedido', () => {
  it('suma el subtotal de los productos', () => {
    const prods = [
      { valorVenta: 1000, cajas: 5, cajasCompletas: 5, unidadesSueltas: 0, pesoTotal: 2 },
      { valorVenta: 500, cajas: 2, cajasCompletas: 2, unidadesSueltas: 0, pesoTotal: 1 }
    ]
    const t = calculos.pedido.totales(prods)
    expect(t.subtotal).toBe(1500)
    // 1500 * 1.18 = 1770
    expect(Math.round(t.totalIGV * 100) / 100).toBe(1770)
  })
})
