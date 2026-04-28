// Utilidades de formateo para números y monedas peruanas

export const formatMoneda = (valor: number): string => {
  const num = Number(valor)
  if (isNaN(num)) return 'S/ 0.00'
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

export const formatNumero = (valor: number, decimales = 2): string => {
  const num = Number(valor)
  if (isNaN(num)) return '0.00'
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(num)
}

export const formatPorcentaje = (valor: number): string => {
  const num = Number(valor)
  if (isNaN(num)) return '0.00%'
  return new Intl.NumberFormat('es-PE', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num / 100)
}

export const limpiarNombreArchivo = (nombre: string): string => {
  return (nombre || "")
    .replace(/[<>:"/\X|?*]/g, "_")
    .replace(/\s+/g, "-")
    .toLowerCase()
}

