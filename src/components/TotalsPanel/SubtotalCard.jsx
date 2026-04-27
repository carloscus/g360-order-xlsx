import React from 'react'
import { formatNumero } from '../../utils/formatters'

export const SubtotalCard = ({ subtotal }) => {
  return (
    <div className="total-card subtotal-card">
      <div className="total-card-header">
        <span className="total-card-icon">💵</span>
        <h3>Subtotal</h3>
      </div>
      <div className="total-value">S/ {formatNumero(subtotal)}</div>
    </div>
  )
}