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

  const badgeLinea = () => {
    if (!p.estadoLinea) return null
    const estado = p.estadoLinea
    const color = p.colorEstadoLinea || '#6b7280'
    return <span class="badge" style={{ background: `${color}20`, color, border: `1px solid ${color}40`, padding: '2px 8px', "border-radius": '4px', "font-size": '11px', "font-weight": 600 }}>{estado}</span>
  }

  return (
    <tr class="fade-in-up">
      <td class="row-num text-center">{p.id}</td>
      <td class="row-cant number">
        <span class={stockClass()} title={estado()}></span>
        {Math.round(p.cantidad || 0).toLocaleString('es-PE')}
      </td>
      <td>{p.unidadMedida || 'UN'}</td>
      <td class="row-sku">{p.codigo}</td>
      <td class="row-desc" title={p.descripcion}>{p.descripcion}</td>
      <td class="number">{formatNumero(p.precioUnitario || 0, 4)}</td>
      <td class="number d1">{p.descuento1?.toFixed(2) || '0.00'}</td>
      <td class="number d2">{p.descuento2?.toFixed(2) || '0.00'}</td>
      <td class="number row-total">{formatNumero(valorVenta())}</td>
      <td class="number">{formatNumero(precioUnitCIGV(), 4)}</td>
      <td class="number">{formatNumero(totalVenta())}</td>
      <td class="badge-cell">{badgeLinea()}</td>
    </tr>
  )
}
