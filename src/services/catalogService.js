/**
 * Catalog Service
 * Manages product catalog data and enrichment
 */

export class CatalogService {
  constructor() {
    this.catalogData = null
    this.productMap = new Map()
  }

  /**
   * Loads catalog data from JSON
   * @param {Array} catalogArray - Catalog products array
   * @returns {boolean} Success status
   */
  loadCatalog(catalogArray) {
    try {
      this.catalogData = catalogArray
      this.productMap.clear()

      catalogArray.forEach(product => {
        if (product.sku) {
          this.productMap.set(product.sku.toUpperCase(), {
            linea: product.grupo || product.tipo || 'SIN LÍNEA',
            categoria: product.familia || 'SIN CATEGORÍA',
            grupo: product.grupo || 'SIN GRUPO',
            familia: product.familia || 'SIN FAMILIA',
            peso: product.peso || 0,
            precioLista: product.precio_lista || 0,
            margen: product.margen || 0,
            nombre: product.nombre || product.sku
          })
        }
      })

      return true
    } catch (error) {
      console.error('Error loading catalog:', error)
      return false
    }
  }

  /**
   * Searches for a product by SKU
   * @param {string} sku - Product SKU
   * @returns {Object|null} Product info or null
   */
  findProduct(sku) {
    if (!sku) return null
    return this.productMap.get(sku.toUpperCase()) || null
  }

  /**
   * Enriches a RPE product with catalog data
   * @param {Object} productoRPE - RPE parsed product
   * @returns {Object} Enriched product
   */
  enrichProduct(productoRPE) {
    const catalogInfo = this.findProduct(productoRPE.codigo)

    if (catalogInfo) {
      return {
        ...productoRPE,
        linea: catalogInfo.linea,
        categoria: catalogInfo.categoria,
        grupo: catalogInfo.grupo,
        familia: catalogInfo.familia,
        peso: catalogInfo.peso,
        precioLista: catalogInfo.precioLista,
        margen: catalogInfo.margen,
        nombreCatalogo: catalogInfo.nombre,
        tieneDatosCatalogo: true
      }
    }

    // If not in catalog, infer from description
    return {
      ...productoRPE,
      linea: productoRPE.descripcion?.split(' ')[0]?.toUpperCase() || 'SIN LÍNEA',
      categoria: 'SIN CATEGORÍA',
      grupo: 'SIN GRUPO',
      peso: 0,
      precioLista: productoRPE.precioUnitario || 0,
      margen: 0,
      tieneDatosCatalogo: false
    }
  }

  /**
   * Gets all unique product lines
   * @returns {Array} Array of unique lines
   */
  getAllLines() {
    const linesSet = new Set()
    this.productMap.forEach((info) => {
      if (info.linea) linesSet.add(info.linea)
    })
    return Array.from(linesSet).sort()
  }

  /**
   * Gets products by line
   * @param {string} line - Product line
   * @returns {Array} Products in the line
   */
  getProductsByLine(line) {
    const products = []
    this.productMap.forEach((info, sku) => {
      if (info.linea === line) {
        products.push({ sku, ...info })
      }
    })
    return products
  }

  /**
   * Validates catalog data integrity
   * @returns {Object} Validation report
   */
  validateCatalog() {
    const report = {
      totalProducts: this.productMap.size,
      validProducts: 0,
      errors: [],
      warnings: []
    }

    this.productMap.forEach((info, sku) => {
      let isValid = true

      if (!info.linea) {
        report.errors.push(`Product ${sku}: Missing line`)
        isValid = false
      }

      if (info.precioLista < 0) {
        report.errors.push(`Product ${sku}: Negative list price`)
        isValid = false
      }

      if (info.peso < 0) {
        report.errors.push(`Product ${sku}: Negative weight`)
        isValid = false
      }

      if (info.margen < 0 || info.margen > 1) {
        report.warnings.push(`Product ${sku}: Margin out of range (0-1)`)
      }

      if (isValid) report.validProducts++
    })

    report.isValid = report.errors.length === 0
    return report
  }
}