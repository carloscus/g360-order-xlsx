import { formatNumero } from '../../utils/formatters'
import { IVA } from '../../constants/sharedConstants'

const stockToClass = (status) => {
  if (status === 'OK') return 'ok'
  if (status === 'AJ') return 'aj'
  if (status === 'Agotado') return 'agotado'
  return 'warning'
}

export const ProductRow = (props) => {
  const p = props.producto
  const estado = () => p.estadoStock || 'OK'
  const stockClass = () => `stock-badge stock-${stockToClass(estado())}`
  const valorVenta = () => p.valorVenta || 0
  const precioUnitCIGV = () => p.cantidad ? (valorVenta() / p.cantidad) * IVA : 0
  const totalVenta = () => valorVenta() * IVA

  return (
    <tr class="fade-in-up">
      <td class="row-num">{p.id}</td>
      <td class="row-sku">{p.codigo}</td>
      <td class="row-desc" title={p.descripcion}>{p.descripcion}</td>
      <td class="row-cant">
        {Math.round(p.cantidad || 0).toLocaleString('es-PE')}
        <span class={stockClass()} title={estado()}></span>
      </td>
      <td>{p.unidadMedida || 'UN'}</td>
      <td class="number">{formatNumero(p.precioUnitario || 0)}</td>
      <td class="number d1">{p.descuento1?.toFixed(2) || '0.00'}</td>
      <td class="number d2">{p.descuento2?.toFixed(2) || '0.00'}</td>
      <td class="number row-total">{formatNumero(valorVenta())}</td>
      <td class="number">{formatNumero(precioUnitCIGV())}</td>
      <td class="number">{formatNumero(totalVenta())}</td>
    </tr>
  )
}