/**
 * ERPParserService - Parser de datos pegados desde ERP
 */

export class ERPParserService {
  static parseDataPegada(texto) {
    if (!texto || typeof texto !== 'string') return []
    
    const lineas = texto.trim().split('\n')
    const productos = []
    let id = 1
    
    for (const linea of lineas) {
      if (!linea.trim()) continue
      
      // Detectar formato: código \t descripción \t cantidad \t precio \t stock
      const partes = linea.split('\t')
      
      if (partes.length >= 2) {
        const producto = {
          id: id++,
          codigo: partes[0]?.trim() || '',
          descripcion: partes[1]?.trim() || '',
          cantidad: this.parseNumber(partes[2]),
          precioUnitario: this.parseNumber(partes[3]),
          stock: this.parseNumber(partes[4]),
          descuento1: this.parseNumber(partes[5]) || 0,
          descuento2: this.parseNumber(partes[6]) || 0,
          montoDescuento: this.parseNumber(partes[7]) || 0,
        }
        
        if (producto.codigo) {
          productos.push(producto)
        }
      }
    }
    
    return productos
  }
  
  static parseNumber(valor) {
    if (!valor) return 0
    if (typeof valor === 'number') return valor
    // Eliminar comas de miles y convertir
    const num = String(valor).replace(/,/g, '').trim()
    const parsed = parseFloat(num)
    return isNaN(parsed) ? 0 : parsed
  }
}
