export const TableFooter = (props) => {
  return (
    <tfoot>
      <tr>
        <td colSpan="10" class="table-footer">
          Total de productos: {props.productos.length}
        </td>
      </tr>
    </tfoot>
  )
}