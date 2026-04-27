import React, { useState, useMemo } from 'react'
import { TableHeader } from './TableHeader'
import { ProductRow } from './ProductRow'
import { TableFooter } from './TableFooter'

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null

  const pages = []
  const maxVisiblePages = 5
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-btn"
      >
        ‹
      </button>

      {startPage > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="pagination-btn">1</button>
          {startPage > 2 && <span className="pagination-dots">...</span>}
        </>
      )}

      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="pagination-dots">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="pagination-btn">{totalPages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-btn"
      >
        ›
      </button>
    </div>
  )
}

const LineaGroup = ({ linea, productos, totalIGV, isExpanded, onToggle }) => {
  const totalMonto = productos.reduce((sum, p) => sum + p.valorVenta, 0)
  const totalCajas = productos.reduce((sum, p) => sum + Math.ceil(p.cantidad / (p.unBx || 1)), 0)
  const totalPeso = productos.reduce((sum, p) => sum + (p.cantidad * (p.pesoKg || 0)), 0)

  return (
    <>
      <tr 
        className="linea-group-row" 
        onClick={onToggle}
        style={{ cursor: 'pointer', background: 'var(--g360-surface)', fontWeight: '600' }}
      >
        <td colSpan={10} style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', 
                transition: 'transform 0.2s',
                fontSize: 'var(--text-sm)'
              }}>▶</span>
              <span style={{ color: 'var(--g360-text)' }}>{linea}</span>
            </span>
            <div style={{ display: 'flex', gap: '16px', fontSize: 'var(--text-base)', color: 'var(--g360-muted)' }}>
              <span>{productos.length} productos</span>
              <span>S/ {totalMonto.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span>{totalCajas} cajas</span>
              <span>{totalPeso.toFixed(2)} kg</span>
            </div>
          </div>
        </td>
      </tr>
      {isExpanded && productos.map(producto => (
        <ProductRow
          key={producto.id}
          producto={producto}
          totalIGV={totalIGV}
        />
      ))}
    </>
  )
}

export const ProductTable = ({ productos, totales, lineaActiva = null }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedLineas, setExpandedLineas] = useState({})
  const [itemsPerPage] = useState(75)

  // Agrupar productos por línea
   const productosPorLinea = useMemo(() => {
     return productos.reduce((acc, p) => {
       const linea = p.linea || 'Sin Línea'
       if (!acc[linea]) acc[linea] = []
       acc[linea].push(p)
       return acc
     }, {})
   }, [productos])

   // Toggle línea
  const toggleLinea = (linea) => {
    setExpandedLineas(prev => ({
      ...prev,
      [linea]: !prev[linea]
    }))
  }

  // Si hay línea activa, mostrar solo esa línea expandida
  const mostrarGrupos = lineaActiva 
    ? { [lineaActiva]: productosPorLinea[lineaActiva] } 
    : productosPorLinea

  // Pagination solo para vista sin grupo
  const totalPages = Math.ceil(productos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = productos.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  return (
    <div className="product-table-container">
      {lineaActiva ? (
        // Vista agrupada con accordion
        <>
          <div className="table-info">
            Filtrado por: <strong>{lineaActiva}</strong> ({productosPorLinea[lineaActiva]?.length || 0} productos)
          </div>
          <table className="product-table">
            <TableHeader />
            <tbody>
              {Object.entries(mostrarGrupos).map(([linea, prods]) => (
                <LineaGroup
                  key={linea}
                  linea={linea}
                  productos={prods}
                  totalIGV={totales.totalIGV}
                  isExpanded={expandedLineas[linea] !== false}
                  onToggle={() => toggleLinea(linea)}
                />
              ))}
            </tbody>
          </table>
        </>
      ) : (
        // Vista normal con pagination
        <>
          <div className="table-info">
            Mostrando {startIndex + 1}-{Math.min(endIndex, productos.length)} de {productos.length} productos
          </div>

          <table className="product-table">
            <TableHeader />
            <tbody>
              {currentProducts.map(producto => (
                <ProductRow
                  key={producto.id}
                  producto={producto}
                  totalIGV={totales.totalIGV}
                />
              ))}
            </tbody>
            <TableFooter productos={currentProducts} />
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}