import { formatNumero } from '../../utils/formatters'

export const ProductRow = (props) => {
  const precioLista = () => props.producto.precioUnitario || 0
  const desc01 = () => props.producto.descuento1 || 0
  const desc02 = () => props.producto.descuento2 || 0
  const cantidad = () => props.producto.cantidad || 0
  const stock = () => props.producto.stock || 0
  
  const precioNeto = () => precioLista() * (1 - desc01() / 100) * (1 - desc02() / 100)
  const totalNeto = () => precioNeto() * cantidad()

  const getStockStatus = () => {
    if (stock() === 0) return 'empty'
    if (stock() <= cantidad()) return 'low'
    return 'ok'
  }

  return (
    <tr>
      <td class="text-center font-mono">{props.producto.id}</td>
      <td class="text-left font-mono">{props.producto.codigo}</td>
      <td class="text-left">{props.producto.descripcion}</td>
      <td class="text-right">
        {cantidad().toLocaleString('es-PE', { minimumFractionDigits: 0 })}
        <span class={`stock-indicator stock-${getStockStatus()}`} style={{ "margin-left": '8px' }}></span>
      </td>
      <td class="text-left">{props.producto.unidadMedida || 'UN'}</td>
      <td class="text-right">{precioLista().toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td class="text-right">{desc01().toFixed(2)}</td>
      <td class="text-right">{desc02().toFixed(2)}</td>
      <td class="text-right">{precioNeto().toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td class="text-right font-bold" style={{ color: 'var(--g360-accent)' }}>{totalNeto().toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>
  )
}