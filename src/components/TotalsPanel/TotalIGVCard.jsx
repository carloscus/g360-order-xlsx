import { formatNumero } from '../../utils/formatters'

export const TotalIGVCard = (props) => {
  return (
    <div class="total-card total-igv-card">
      <div class="total-card-header">
        <span class="total-card-icon">🧾</span>
        <h3>SUBTOTAL + IGV</h3>
      </div>
      <div class="total-value total-highlight">S/ {formatNumero(props.totalIGV)}</div>
    </div>
  )
}