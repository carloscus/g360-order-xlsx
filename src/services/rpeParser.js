/**
 * RPE Parser Service
 * Handles parsing of RPE/SAP data formats for G360 Order XLSX
 */

export class RPEParserService {
  /**
   * Parses numbers from RPE format (Peruvian locale with commas)
   * @param {string|number} valor - The value to parse
   * @returns {number} Parsed number or 0
   */
  static parseNumberRPE(valor) {
    if (!valor) return 0
    const str = String(valor).trim()
    // Remove thousand separators (commas), keep decimal point
    return parseFloat(str.replace(/,/g, '')) || 0
  }

  /**
   * Parses pasted RPE/SAP data
   * Supports both formats: with and without center column
   * @param {string} textoPegado - The pasted RPE text
   * @returns {Array} Array of parsed products
   */
  static parseDataPegada(textoPegado) {
    if (!textoPegado?.trim()) return []

    const lineas = textoPegado.trim().split('\n')
    const productosParseados = []

    lineas.forEach((linea, index) => {
      // Clean initial tab if exists
      const limpio = linea.startsWith('\t') ? linea.slice(1) : linea

      // Split by tabs
      const campos = limpio.split('\t').map(c => c.trim())

      // Skip empty lines or lines with too few fields
      if (campos.length < 8) return

      // Detect format: campo0 is text (contains letters), campo3 is number
      const campo0 = campos[0] || ''
      const campo3 = campos[3] || ''

      const esFormatoConCentro = /[a-zA-Z]/.test(campo0) && /^\d/.test(campo3)

      let producto = {}

      if (esFormatoConCentro && campos.length >= 10) {
        // Format with logistics center
        // Format: CENTRO | SKU | DESCRIPCION | CANT | STOCK | UM | PRECIO | DSCTO1 | DSCTO2 | VALOR
        producto = {
          id: productosParseados.length + 1,
          centro: campo0, // "CENTRO LOGISTICO VES"
          codigo: campos[1] || '', // SKU
          descripcion: campos[2] || '', // Description
          cantidad: this.parseNumberRPE(campos[3]), // Quantity
          stock: this.parseNumberRPE(campos[4]), // Stock (may have comma: 72,598.000)
          unidadMedida: campos[5] || 'UN', // UM (CAJA, CAJITA, UNIDAD)
          precioUnitario: this.parseNumberRPE(campos[6]), // Price
          descuento1: this.parseNumberRPE(campos[7]), // Discount 1
          descuento2: this.parseNumberRPE(campos[8]), // Discount 2
          valorVenta: this.parseNumberRPE(campos[9]), // Sale value
        }
      } else {
        // Simple format without center
        producto = {
          id: productosParseados.length + 1,
          centro: '',
          codigo: campos[0] || '',
          descripcion: campos[1] || '',
          cantidad: this.parseNumberRPE(campos[2]),
          stock: this.parseNumberRPE(campos[3]),
          unidadMedida: campos[4] || 'UN',
          precioUnitario: this.parseNumberRPE(campos[5]),
          descuento1: this.parseNumberRPE(campos[6]),
          descuento2: this.parseNumberRPE(campos[7]),
          valorVenta: this.parseNumberRPE(campos[8]),
        }
      }

      // Only add if has valid code
      if (producto.codigo && producto.codigo.length >= 3) {
        productosParseados.push(producto)
      }
    })

    return productosParseados
  }

  /**
   * Validates parsed RPE data
   * @param {Array} productos - Array of products to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validateParsedData(productos) {
    const errors = []

    if (!Array.isArray(productos)) {
      errors.push('Parsed data must be an array')
      return { isValid: false, errors }
    }

    productos.forEach((producto, index) => {
      if (!producto.codigo || producto.codigo.length < 3) {
        errors.push(`Product ${index + 1}: Invalid SKU`)
      }
      if (producto.cantidad <= 0) {
        errors.push(`Product ${index + 1}: Invalid quantity`)
      }
      if (producto.precioUnitario < 0) {
        errors.push(`Product ${index + 1}: Invalid price`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}