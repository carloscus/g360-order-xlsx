/**
 * RPE Parsing Agent
 * AI-powered agent for intelligent RPE data processing
 */

import { RPEParserService } from '../services/rpeParser.js'
import { ValidationService } from '../services/validation.js'

export class ParsingAgent {
  constructor(catalogoService = null) {
    this.catalogoService = catalogoService
  }

  /**
   * Processes RPE text input with intelligent parsing and enrichment
   * @param {string} rpeText - Raw RPE text input
   * @param {Object} options - Processing options
   * @returns {Object} Processed result with products, validation, and metadata
   */
  async processRPEInput(rpeText, options = {}) {
    try {
      // Step 1: Parse raw RPE data
      const rawProducts = RPEParserService.parseDataPegada(rpeText)

      if (rawProducts.length === 0) {
        return {
          success: false,
          error: 'No valid products found in RPE input',
          products: [],
          metadata: { parsedLines: 0, validProducts: 0 }
        }
      }

      // Step 2: Validate parsed data
      const validation = RPEParserService.validateParsedData(rawProducts)

      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          validationErrors: validation.errors,
          products: [],
          metadata: { parsedLines: rawProducts.length, validProducts: 0 }
        }
      }

      // Step 3: Sanitize and enrich products
      let enrichedProducts = rawProducts.map(product => {
        const sanitized = ValidationService.sanitizeProducto(product)

        // Enrich with catalog data if available
        if (this.catalogoService) {
          const catalogInfo = this.catalogoService.enrichProduct(sanitized)
          return { ...sanitized, ...catalogInfo }
        }

        return sanitized
      })

      // Step 4: Apply business rules and calculations
      enrichedProducts = this.applyBusinessRules(enrichedProducts, options)

      // Step 5: Calculate KPIs and analytics
      const analytics = this.calculateAnalytics(enrichedProducts)

      return {
        success: true,
        products: enrichedProducts,
        analytics,
        metadata: {
          parsedLines: rawProducts.length,
          validProducts: enrichedProducts.length,
          processingTimestamp: new Date().toISOString()
        }
      }

    } catch (error) {
      console.error('Parsing Agent Error:', error)
      return {
        success: false,
        error: error.message,
        products: [],
        metadata: { error: true }
      }
    }
  }

  /**
   * Applies business rules to products
   * @param {Array} products - Products to process
   * @param {Object} options - Business rule options
   * @returns {Array} Products with business rules applied
   */
  applyBusinessRules(products, options) {
    return products.map(product => {
      // Calculate final price after discounts
      const precioConDescuento = product.precioUnitario *
        (1 - product.descuento1 / 100) *
        (1 - product.descuento2 / 100)

      const valorCalculado = precioConDescuento * product.cantidad

      return {
        ...product,
        precioConDescuento,
        valorCalculado,
        // Add business logic flags
        esProductoCritico: product.stock < 10,
        requiereAprobacion: valorCalculado > 50000 // Example threshold
      }
    })
  }

  /**
   * Calculates analytics and KPIs from products
   * @param {Array} products - Products to analyze
   * @returns {Object} Analytics data
   */
  calculateAnalytics(products) {
    const totales = products.reduce((acc, product) => ({
      subtotal: acc.subtotal + (product.valorCalculado || 0),
      cantidadTotal: acc.cantidadTotal + product.cantidad,
      pesoTotal: acc.pesoTotal + ((product.peso || 0) * product.cantidad),
      productosUnicos: acc.productosUnicos + 1
    }), {
      subtotal: 0,
      cantidadTotal: 0,
      pesoTotal: 0,
      productosUnicos: 0
    })

    const igv = totales.subtotal * 0.18
    const total = totales.subtotal + igv

    // Group by line for KPIs
    const porLinea = products.reduce((acc, product) => {
      const linea = product.linea || 'SIN LÍNEA'
      if (!acc[linea]) {
        acc[linea] = {
          productos: 0,
          subtotal: 0,
          cantidad: 0,
          margenPromedio: 0
        }
      }
      acc[linea].productos += 1
      acc[linea].subtotal += product.valorCalculado || 0
      acc[linea].cantidad += product.cantidad
      acc[linea].margenPromedio += product.margen || 0
      return acc
    }, {})

    // Calculate averages
    Object.keys(porLinea).forEach(linea => {
      porLinea[linea].margenPromedio /= porLinea[linea].productos
    })

    return {
      totales: {
        subtotal: totales.subtotal,
        igv,
        total,
        cantidadTotal: totales.cantidadTotal,
        pesoTotal: totales.pesoTotal,
        productosUnicos: totales.productosUnicos
      },
      porLinea,
      kpis: {
        coberturaStock: this.calcularCoberturaStock(products),
        productosCriticos: products.filter(p => p.esProductoCritico).length,
        productosAltaValor: products.filter(p => (p.valorCalculado || 0) > 10000).length
      }
    }
  }

  /**
   * Calculates stock coverage KPI
   * @param {Array} products - Products to analyze
   * @returns {number} Coverage percentage
   */
  calcularCoberturaStock(products) {
    const productosConStock = products.filter(p => p.stock > 0)
    return productosConStock.length / products.length * 100
  }
}