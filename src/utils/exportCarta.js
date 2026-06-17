/**
 * Exporta la carta corporativa (cotización) como descarga HTML/PDF
 * Integra con corporateLetterGenerator.js
 */
import { generarCartaCorporativa } from './corporateLetterGenerator'

export const exportarCartaCorporativa = async (datos) => {
  if (!datos.productos || datos.productos.length === 0) {
    alert('No hay productos para generar la carta corporativa.')
    return
  }
  
  if (!datos.cliente) {
    alert('Complete los datos del cliente antes de generar la carta.')
    return
  }

  generarCartaCorporativa(datos)
}

export default exportarCartaCorporativa