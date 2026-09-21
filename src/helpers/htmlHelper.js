/**
 * Helper unificado para generación de HTML
 * Centraliza la lógica de generación usada por Sidebar y DistributionPage
 */
import { buildCronogramaHTML } from '../utils/htmlExportBuilder'
import { getAgentesSkill } from '../core/g360-skill-agentes'

const { calculos } = getAgentesSkill()

export const generarContenidoHTML = (pedido, cuotas) => {
  // Los productos del pedido YA TIENEN unBx, cajas, pesoTotal calculados en usePedido
  // NO re-enriquecer aquí, usar directamente lo que viene del pedido
  const consolidado = calculos.pedido.consolidado(pedido.productos)

  return buildCronogramaHTML({
    cliente: pedido.cliente,
    ruc: pedido.ruc,
    numeroPedido: pedido.numeroPedido,
    idCliente: pedido.idCliente,
    sucursal: pedido.sucursal,
    vendedor: pedido.vendedor,
    emailVendedor: pedido.emailVendedor,
    telefonoVendedor: pedido.telefonoVendedor,
    cuotas,
    consolidado,
    productosCalculados: pedido.productos
  })
}

export const validarPedidoParaHTML = (pedido) => {
  const faltantes = []
  if (!pedido.cliente) faltantes.push('Cliente')
  if (!pedido.ruc) faltantes.push('Documento (RUC/DNI)')
  if (!pedido.numeroPedido) faltantes.push('N° Pedido')
  if (!pedido.vendedor) faltantes.push('Vendedor')
  return faltantes
}

export const generarNombreArchivo = (ruc, numeroPedido) => {
  const now = new Date()
  const fechaArchivo = now.toISOString().split('T')[0].replace(/-/g, '')
  const rucLimpio = (ruc || '').replace(/\D/g, '')
  const docValido = (rucLimpio.length === 8 || rucLimpio.length === 11) ? rucLimpio : 'DOC'
  const pedidoLimpio = (numeroPedido || 'PEDIDO').replace(/[^a-zA-Z0-9\-_]/g, '').trim().substring(0, 12)
  return `cronograma_${docValido}_${pedidoLimpio}_${fechaArchivo}.html`
}

export const descargarHTML = (htmlContent, nombreArchivo) => {
  const blob = new Blob([htmlContent], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
