import { formatNumero } from '../../utils/formatters'

export const SubtotalCard = (props) => {
  return (
    <div class="total-card subtotal-card">
      <div class="total-card-header">
        <span class="total-card-icon">💵</span>
        <h3>SUBTOTAL</h3>
      </div>
      <div class="total-value">S/ {formatNumero(props.subtotal)}</div>
    </div>
  )
}