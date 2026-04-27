import React from 'react'

export const TableHeader = () => {
  return (
    <thead>
      <tr>
        <th className="text-center">N°</th>
        <th>SKU</th>
        <th>Descripción</th>
        <th className="text-right">Cant.</th>
        <th>U/M</th>
        <th className="text-right">P. Lista (S/.)</th>
        <th className="text-right">Desc 01 (%)</th>
        <th className="text-right">Desc 02 (%)</th>
        <th className="text-right">P. Neto (S/.)</th>
        <th className="text-right">Total Neto (S/.)</th>
      </tr>
    </thead>
  )
}