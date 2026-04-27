/**
 * Unit tests for ValidationService
 */

import { describe, it, expect } from 'vitest'
import { ValidationService, productoSchema, pedidoSchema } from '../../services/validation.js'

describe('ValidationService', () => {
  describe('validateProducto', () => {
    it('should validate a correct product', () => {
      const product = {
        id: 1,
        codigo: 'CHOP001',
        descripcion: 'Chopper 5HP',
        cantidad: 10,
        stock: 45,
        unidadMedida: 'UND',
        precioUnitario: 2200.00,
        descuento1: 5,
        descuento2: 3,
        valorVenta: 19890.00
      }

      const result = ValidationService.validateProducto(product)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(product)
    })

    it('should reject product with invalid SKU', () => {
      const product = {
        id: 1,
        codigo: 'AB',
        descripcion: 'Chopper 5HP',
        cantidad: 10,
        stock: 45,
        unidadMedida: 'UND',
        precioUnitario: 2200.00,
        descuento1: 5,
        descuento2: 3
      }

      const result = ValidationService.validateProducto(product)
      expect(result.success).toBe(false)
      expect(result.errors[0].field).toBe('codigo')
    })

    it('should reject product with negative quantity', () => {
      const product = {
        id: 1,
        codigo: 'CHOP001',
        descripcion: 'Chopper 5HP',
        cantidad: -5,
        stock: 45,
        unidadMedida: 'UND',
        precioUnitario: 2200.00,
        descuento1: 5,
        descuento2: 3
      }

      const result = ValidationService.validateProducto(product)
      expect(result.success).toBe(false)
      expect(result.errors[0].field).toBe('cantidad')
    })

    it('should reject product with discount over 100%', () => {
      const product = {
        id: 1,
        codigo: 'CHOP001',
        descripcion: 'Chopper 5HP',
        cantidad: 10,
        stock: 45,
        unidadMedida: 'UND',
        precioUnitario: 2200.00,
        descuento1: 150,
        descuento2: 3
      }

      const result = ValidationService.validateProducto(product)
      expect(result.success).toBe(false)
      expect(result.errors[0].field).toBe('descuento1')
    })
  })

  describe('validatePedido', () => {
    it('should validate a correct order', () => {
      const pedido = {
        cliente: 'Test Client',
        documento: 'RUC123456789',
        productos: [{
          id: 1,
          codigo: 'CHOP001',
          descripcion: 'Chopper 5HP',
          cantidad: 10,
          stock: 45,
          unidadMedida: 'UND',
          precioUnitario: 2200.00,
          descuento1: 5,
          descuento2: 3,
          valorVenta: 19890.00
        }]
      }

      const result = ValidationService.validatePedido(pedido)
      expect(result.success).toBe(true)
    })

    it('should reject order without client', () => {
      const pedido = {
        productos: [{
          id: 1,
          codigo: 'CHOP001',
          descripcion: 'Chopper 5HP',
          cantidad: 10,
          stock: 45,
          unidadMedida: 'UND',
          precioUnitario: 2200.00,
          descuento1: 5,
          descuento2: 3
        }]
      }

      const result = ValidationService.validatePedido(pedido)
      expect(result.success).toBe(false)
      expect(result.errors[0].field).toBe('cliente')
    })

    it('should reject order without products', () => {
      const pedido = {
        cliente: 'Test Client',
        productos: []
      }

      const result = ValidationService.validatePedido(pedido)
      expect(result.success).toBe(false)
      expect(result.errors[0].field).toBe('productos')
    })

    it('should validate order with optional fields', () => {
      const pedido = {
        cliente: 'Test Client',
        productos: [{
          id: 1,
          codigo: 'CHOP001',
          descripcion: 'Chopper 5HP',
          cantidad: 10,
          stock: 45,
          unidadMedida: 'UND',
          precioUnitario: 2200.00,
          descuento1: 5,
          descuento2: 3
        }],
        totales: {
          subtotal: 19890,
          igv: 3580.2,
          total: 23470.2
        }
      }

      const result = ValidationService.validatePedido(pedido)
      expect(result.success).toBe(true)
    })
  })

  describe('sanitizeProducto', () => {
    it('should sanitize and normalize product data', () => {
      const rawProduct = {
        id: 1,
        codigo: '  chop001  ',
        descripcion: '  Chopper 5HP  ',
        cantidad: 10,
        stock: 45,
        unidadMedida: 'und',
        precioUnitario: 2200.00,
        descuento1: 5,
        descuento2: 3
      }

      const sanitized = ValidationService.sanitizeProducto(rawProduct)

      expect(sanitized.codigo).toBe('CHOP001')
      expect(sanitized.descripcion).toBe('Chopper 5HP')
      expect(sanitized.unidadMedida).toBe('UND')
      expect(sanitized.cantidad).toBe(10)
      expect(sanitized.descuento1).toBe(5)
    })

    it('should handle negative values', () => {
      const rawProduct = {
        id: 1,
        codigo: 'CHOP001',
        descripcion: 'Chopper 5HP',
        cantidad: -5,
        precioUnitario: -100,
        descuento1: 150,
        descuento2: -10
      }

      const sanitized = ValidationService.sanitizeProducto(rawProduct)

      expect(sanitized.cantidad).toBe(0)
      expect(sanitized.precioUnitario).toBe(0)
      expect(sanitized.descuento1).toBe(100) // Clamped to max
      expect(sanitized.descuento2).toBe(0) // Clamped to min
    })
  })
})