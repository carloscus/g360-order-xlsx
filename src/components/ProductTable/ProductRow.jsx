import React from 'react'
import { formatNumero } from '../../utils/formatters'

export const ProductRow = ({ producto }) => {
  const precioLista = producto.precioUnitario || 0
  const desc01 = producto.descuento1 || 0
  const desc02 = producto.descuento2 || 0
  const cantidad = producto.cantidad || 0
  const stock = producto.stock || 0
  
  const precioNeto = precioLista * (1 - desc01 / 100) * (1 - desc02 / 100)
  const totalNeto = precioNeto * cantidad

  const getStockStatus = () => {
    if (stock === 0) return 'empty'
    if (stock <= cantidad) return 'low'
    return 'ok'
  }

  const stockStatus = getStockStatus()

  return (
    <tr>
      <td className="text-center">{producto.id}</td>
      <td>{producto.codigo}</td>
      <td>{producto.descripcion}</td>
      <td className="text-right quantity-cell">
        {cantidad}
        <span className={`stock-indicator stock-${stockStatus}`}></span>
      </td>
      <td>{producto.unidadMedida}</td>
      <td className="text-right">{formatNumero(precioLista)}</td>
      <td className="text-right">{desc01}</td>
      <td className="text-right">{desc02}</td>
      <td className="text-right">{formatNumero(precioNeto)}</td>
      <td className="text-right">{formatNumero(totalNeto)}</td>
    </tr>
  )
}