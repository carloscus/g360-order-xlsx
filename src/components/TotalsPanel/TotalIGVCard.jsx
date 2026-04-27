import React from 'react'
import { formatNumero } from '../../utils/formatters'

export const TotalIGVCard = ({ totalIGV }) => {
  return (
    <div className="total-card total-igv-card">
      <div className="total-card-header">
        <span className="total-card-icon">🧾</span>
        <h3>Total + IGV</h3>
      </div>
      <div className="total-value total-highlight">S/ {formatNumero(totalIGV)}</div>
    </div>
  )
}