import React from 'react'

export const TableFooter = ({ productos }) => {
  return (
    <tfoot>
      <tr>
        <td colSpan="10" className="table-footer">
          Total de productos: {productos.length}
        </td>
      </tr>
    </tfoot>
  )
}