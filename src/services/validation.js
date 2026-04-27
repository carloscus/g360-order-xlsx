/**
 * Validation Service
 * Provides Zod schemas and validation functions for G360 Order data
 */

import { z } from 'zod'

// Product schema
export const productoSchema = z.object({
  id: z.number().positive(),
  centro: z.string().optional(),
  codigo: z.string().min(3, 'SKU must be at least 3 characters'),
  descripcion: z.string().min(1, 'Description is required'),
  cantidad: z.number().positive('Quantity must be positive'),
  stock: z.number().min(0, 'Stock cannot be negative'),
  unidadMedida: z.string().min(1, 'Unit of measure is required'),
  precioUnitario: z.number().min(0, 'Price cannot be negative'),
  descuento1: z.number().min(0).max(100, 'Discount 1 must be between 0-100'),
  descuento2: z.number().min(0).max(100, 'Discount 2 must be between 0-100'),
  valorVenta: z.number().min(0, 'Sale value cannot be negative'),
  // Enriched fields
  linea: z.string().optional(),
  precioLista: z.number().optional(),
  margen: z.number().optional(),
  peso: z.number().optional()
})

// Order schema
export const pedidoSchema = z.object({
  cliente: z.string().min(1, 'Client name is required'),
  documento: z.string().optional(),
  numeroPedido: z.string().optional(),
  vendedor: z.string().optional(),
  emailVendedor: z.string().email().optional().or(z.literal('')),
  telefonoVendedor: z.string().optional(),
  productos: z.array(productoSchema).min(1, 'Order must have at least one product'),
  fecha: z.date().optional(),
  totales: z.object({
    subtotal: z.number().min(0),
    igv: z.number().min(0),
    total: z.number().min(0)
  }).optional()
})

// Catalog product schema
export const catalogoProductoSchema = z.object({
  sku: z.string().min(1),
  nombre: z.string().min(1),
  precio_lista: z.number().min(0),
  margen: z.number().min(0).max(1),
  peso: z.number().min(0),
  tipo: z.string().optional(),
  familia: z.string().optional(),
  grupo: z.string().optional()
})

export class ValidationService {
  /**
   * Validates a single product
   * @param {Object} producto - Product to validate
   * @returns {Object} Validation result
   */
  static validateProducto(producto) {
    try {
      const validated = productoSchema.parse(producto)
      return { success: true, data: validated }
    } catch (error) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    }
  }

  /**
   * Validates an entire order
   * @param {Object} pedido - Order to validate
   * @returns {Object} Validation result
   */
  static validatePedido(pedido) {
    try {
      const validated = pedidoSchema.parse(pedido)
      return { success: true, data: validated }
    } catch (error) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    }
  }

  /**
   * Validates catalog data
   * @param {Array} catalogo - Catalog products array
   * @returns {Object} Validation result
   */
  static validateCatalogo(catalogo) {
    try {
      const validated = z.array(catalogoProductoSchema).parse(catalogo)
      return { success: true, data: validated }
    } catch (error) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    }
  }

  /**
   * Sanitizes and normalizes product data
   * @param {Object} producto - Raw product data
   * @returns {Object} Sanitized product
   */
  static sanitizeProducto(producto) {
    return {
      ...producto,
      codigo: producto.codigo?.trim().toUpperCase() || '',
      descripcion: producto.descripcion?.trim() || '',
      unidadMedida: producto.unidadMedida?.trim().toUpperCase() || 'UN',
      cantidad: Math.max(0, producto.cantidad || 0),
      precioUnitario: Math.max(0, producto.precioUnitario || 0),
      descuento1: Math.min(100, Math.max(0, producto.descuento1 || 0)),
      descuento2: Math.min(100, Math.max(0, producto.descuento2 || 0))
    }
  }
}