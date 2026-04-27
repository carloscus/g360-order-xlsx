/**
 * Unit tests for RPEParserService
 */

import { describe, it, expect } from 'vitest'
import { RPEParserService } from '../../services/rpeParser.js'

describe('RPEParserService', () => {
  describe('parseNumberRPE', () => {
    it('should parse Peruvian number format with commas', () => {
      expect(RPEParserService.parseNumberRPE('1,234.56')).toBe(1234.56)
      expect(RPEParserService.parseNumberRPE('72,598.000')).toBe(72598)
    })

    it('should handle regular numbers', () => {
      expect(RPEParserService.parseNumberRPE('123.45')).toBe(123.45)
      expect(RPEParserService.parseNumberRPE(123)).toBe(123)
    })

    it('should return 0 for invalid inputs', () => {
      expect(RPEParserService.parseNumberRPE('')).toBe(0)
      expect(RPEParserService.parseNumberRPE(null)).toBe(0)
      expect(RPEParserService.parseNumberRPE('abc')).toBe(0)
    })
  })

  describe('parseDataPegada', () => {
    it('should parse simple RPE format without center', () => {
      const input = 'CHOP001\tChopper 5HP\t10\t45\tUND\t2200.00\t5\t3\t19890.00'
      const result = RPEParserService.parseDataPegada(input)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        codigo: 'CHOP001',
        descripcion: 'Chopper 5HP',
        cantidad: 10,
        stock: 45,
        unidadMedida: 'UND',
        precioUnitario: 2200,
        descuento1: 5,
        descuento2: 3,
        valorVenta: 19890
      })
    })

    it('should parse RPE format with logistics center', () => {
      const input = 'CENTRO LOGISTICO VES\tCHOP001\tChopper 5HP\t10\t45\tUND\t2200.00\t5\t3\t19890.00'
      const result = RPEParserService.parseDataPegada(input)

      expect(result).toHaveLength(1)
      expect(result[0].centro).toBe('CENTRO LOGISTICO VES')
      expect(result[0].codigo).toBe('CHOP001')
    })

    it('should handle multiple lines', () => {
      const input = `CHOP001\tChopper 5HP\t10\t45\tUND\t2200.00\t5\t3\t19890.00
MIX002\tMezclador Industrial\t5\t20\tUND\t1800.00\t0\t5\t8550.00`
      const result = RPEParserService.parseDataPegada(input)

      expect(result).toHaveLength(2)
      expect(result[0].codigo).toBe('CHOP001')
      expect(result[1].codigo).toBe('MIX002')
    })

    it('should skip invalid lines', () => {
      const input = `CHOP001\tChopper 5HP\t10\t45\tUND\t2200.00\t5\t3\t19890.00
\t\t\t\t\t\t\t\t
INVALID\tShort`
      const result = RPEParserService.parseDataPegada(input)

      expect(result).toHaveLength(1)
      expect(result[0].codigo).toBe('CHOP001')
    })

    it('should return empty array for empty input', () => {
      expect(RPEParserService.parseDataPegada('')).toEqual([])
      expect(RPEParserService.parseDataPegada(null)).toEqual([])
      expect(RPEParserService.parseDataPegada('   ')).toEqual([])
    })
  })

  describe('validateParsedData', () => {
    it('should validate correct product data', () => {
      const products = [{
        id: 1,
        codigo: 'CHOP001',
        descripcion: 'Chopper 5HP',
        cantidad: 10,
        stock: 45,
        precioUnitario: 2200,
        descuento1: 5,
        descuento2: 3
      }]

      const result = RPEParserService.validateParsedData(products)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect invalid SKU', () => {
      const products = [{
        id: 1,
        codigo: 'AB',
        descripcion: 'Invalid SKU',
        cantidad: 10,
        precioUnitario: 2200,
        descuento1: 5,
        descuento2: 3
      }]

      const result = RPEParserService.validateParsedData(products)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Product 1: Invalid SKU')
    })

    it('should detect invalid quantity', () => {
      const products = [{
        id: 1,
        codigo: 'CHOP001',
        descripcion: 'Test',
        cantidad: -5,
        precioUnitario: 2200,
        descuento1: 5,
        descuento2: 3
      }]

      const result = RPEParserService.validateParsedData(products)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Product 1: Invalid quantity')
    })

    it('should detect invalid price', () => {
      const products = [{
        id: 1,
        codigo: 'CHOP001',
        descripcion: 'Test',
        cantidad: 10,
        precioUnitario: -100,
        descuento1: 5,
        descuento2: 3
      }]

      const result = RPEParserService.validateParsedData(products)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Product 1: Invalid price')
    })
  })
})