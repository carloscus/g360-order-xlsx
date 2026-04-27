import React from 'react'
import { formatNumero } from '../../utils/formatters'

export const AvailableTotalCard = ({ totalDisponible, totalIGV }) => {
  const pendiente = totalIGV - totalDisponible
  
  return (
    <div className="total-card available-total-card">
      <div className="total-card-header">
        <span className="total-card-icon">📋</span>
        <h3>Total a Atender</h3>
      </div>
      <div className="total-value">S/ {formatNumero(totalDisponible)}</div>
      <div className="total-pending">
        Pendiente: <span>S/ {formatNumero(pendiente)}</span>
      </div>
    </div>
  )
}