import { formatNumero } from '../../utils/formatters'

export const AvailableTotalCard = (props) => {
  const pendiente = () => (props.totalIGV || 0) - (props.totalDisponible || 0)
  
  return (
    <div class='total-card available-total-card'>
      <div class='total-card-header'>
        <span class='total-card-icon'>??</span>
        <div class='flex flex-col'>
          <h3>TOTAL A ATENDER</h3>
          <span class='total-card-subtitle'>Disponible con Stock</span>
        </div>
      </div>
      <div class='total-value'>S/ {formatNumero(props.totalDisponible)}</div>
      <div class='total-pending'>
        Sin Stock (Pendiente): <span class='pending-value'>S/ {formatNumero(pendiente())}</span>
      </div>
    </div>
  )
}
