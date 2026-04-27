// Utilidades de formateo para números y monedas peruanas

/**
 * Formatear números como moneda peruana (S/)
 * @param valor Valor numérico a formatear
 * @returns String con formato de moneda PEN
 */
export const formatMoneda = (valor: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor)
}

/**
 * Formatear números con separadores de miles
 * @param valor Valor numérico a formatear
 * @param decimales Cantidad de decimales a mostrar
 * @returns String con número formateado
 */
export const formatNumero = (valor: number, decimales = 2): string => {
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(valor)
}

/**
 * Formatear porcentajes
 * @param valor Valor porcentual (ej: 18 para 18%)
 * @returns String con formato de porcentaje
 */
export const formatPorcentaje = (valor: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor / 100)
}

/**
 * Función para limpiar nombre de archivo
 * @param nombre Nombre original del archivo
 * @returns Nombre limpio seguro para sistemas de archivos
 */
export const limpiarNombreArchivo = (nombre: string): string => {
  return nombre
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '-')
    .toLowerCase()
}