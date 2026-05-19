import { formatNumero } from '../../utils/formatters'

export const ProductRow = (props) => {
  const p = props.producto

  const stockStatus = () => {
    const s = p.stock || 0
    const c = p.cantidad || 0
    if (s === 0) return 'agotado'
    if (s <= c * 0.9) return 'aj'
    if (s >= c * 1.1) return 'ok'
    return 'warning'
  }

  const stockClass = () => {
    const status = stockStatus()
    return `stock-badge stock-${status}`
  }

  return (
    <tr>
      <td class="row-num">{p.id}</td>
      <td class="row-sku">{p.codigo}</td>
      <td class="row-desc" title={p.descripcion}>{p.descripcion}</td>
      <td class="row-cant">
        {Math.round(p.cantidad || 0).toLocaleString('es-PE')}
        <span class={stockClass()} title={p.estadoStock || stockStatus()}></span>
      </td>
      <td>{p.unidadMedida || 'UN'}</td>
      <td class="number">{formatNumero(p.precioUnitario || 0)}</td>
      <td class="number d1">{p.descuento1?.toFixed(2) || '0.00'}</td>
      <td class="number d2">{p.descuento2?.toFixed(2) || '0.00'}</td>
      <td class="number">{formatNumero(p.valorVenta ? p.valorVenta / p.cantidad : 0)}</td>
      <td class="number row-total">{formatNumero(p.valorVenta || 0)}</td>
    </tr>
  )
}