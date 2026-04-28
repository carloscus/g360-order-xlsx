import { createSignal, createMemo, For, Show } from 'solid-js'
import { TableHeader } from './TableHeader'
import { ProductRow } from './ProductRow'
import { TableFooter } from './TableFooter'

const Pagination = (props) => {
  const totalPages = () => props.totalPages
  if (totalPages() <= 1) return null

  const pages = createMemo(() => {
    const p = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, props.currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages(), startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      p.push(i)
    }
    return p
  })

  return (
    <div class="pagination">
      <button
        onClick={() => props.onPageChange(props.currentPage - 1)}
        disabled={props.currentPage === 1}
        class="pagination-btn"
      >
        ‹
      </button>

      <Show when={pages()[0] > 1}>
        <button onClick={() => props.onPageChange(1)} class="pagination-btn">1</button>
        <Show when={pages()[0] > 2}>
          <span class="pagination-dots">...</span>
        </Show>
      </Show>

      <For each={pages()}>
        {(page) => (
          <button
            onClick={() => props.onPageChange(page)}
            class={`pagination-btn ${page === props.currentPage ? 'active' : ''}`}
          >
            {page}
          </button>
        )}
      </For>

      <Show when={pages()[pages().length - 1] < totalPages()}>
        <Show when={pages()[pages().length - 1] < totalPages() - 1}>
          <span class="pagination-dots">...</span>
        </Show>
        <button onClick={() => props.onPageChange(totalPages())} class="pagination-btn">{totalPages()}</button>
      </Show>

      <button
        onClick={() => props.onPageChange(props.currentPage + 1)}
        disabled={props.currentPage === totalPages()}
        class="pagination-btn"
      >
        ›
      </button>
    </div>
  )
}

const LineaGroup = (props) => {
  const totalMonto = () => props.productos.reduce((sum, p) => sum + p.valorVenta, 0)
  const totalCajas = () => props.productos.reduce((sum, p) => sum + Math.ceil(p.cantidad / (p.unBx || 1)), 0)
  const totalPeso = () => props.productos.reduce((sum, p) => sum + (p.cantidad * (p.pesoKg || 0)), 0)

  return (
    <>
      <tr 
        class="linea-group-row" 
        onClick={props.onToggle}
        style={{ cursor: 'pointer', background: 'var(--g360-surface)', "font-weight": '600' }}
      >
        <td colSpan={10} style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', "justify-content": 'space-between', "align-items": 'center' }}>
            <span style={{ display: 'flex', "align-items": 'center', gap: '8px' }}>
              <span style={{ 
                transform: props.isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', 
                transition: 'transform 0.2s',
                "font-size": 'var(--text-sm)'
              }}>▶</span>
              <span style={{ color: 'var(--g360-text)' }}>{props.linea}</span>
            </span>
            <div style={{ display: 'flex', gap: '16px', "font-size": 'var(--text-base)', color: 'var(--g360-muted)' }}>
              <span>{props.productos.length} productos</span>
              <span>S/ {totalMonto().toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span>{totalCajas()} cajas</span>
              <span>{totalPeso().toFixed(2)} kg</span>
            </div>
          </div>
        </td>
      </tr>
      <Show when={props.isExpanded}>
        <For each={props.productos}>
          {(producto) => (
            <ProductRow
              producto={producto}
              totalIGV={props.totalIGV}
            />
          )}
        </For>
      </Show>
    </>
  )
}

export const ProductTable = (props) => {
  const [currentPage, setCurrentPage] = createSignal(1)
  const [expandedLineas, setExpandedLineas] = createSignal({})
  const itemsPerPage = 75

  // Agrupar productos por línea
   const productosPorLinea = createMemo(() => {
     return props.productos.reduce((acc, p) => {
       const linea = p.linea || 'Sin Línea'
       if (!acc[linea]) acc[linea] = []
       acc[linea].push(p)
       return acc
     }, {})
   })

   // Toggle línea
  const toggleLinea = (linea) => {
    setExpandedLineas(prev => ({
      ...prev,
      [linea]: !prev[linea]
    }))
  }

  // Si hay línea activa, mostrar solo esa línea expandida
  const mostrarGrupos = createMemo(() => {
    const grupos = productosPorLinea()
    return props.lineaActiva 
      ? { [props.lineaActiva]: grupos[props.lineaActiva] } 
      : grupos
  })

  // Pagination solo para vista sin grupo
  const totalPages = () => Math.ceil(props.productos.length / itemsPerPage)
  const startIndex = () => (currentPage() - 1) * itemsPerPage
  const endIndex = () => startIndex() + itemsPerPage
  const currentProducts = () => props.productos.slice(startIndex(), endIndex())

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  return (
    <div class="product-table-container">
      <Show 
        when={!props.lineaActiva} 
        fallback={
          <>
            <div class="table-info">
              Filtrado por: <strong>{props.lineaActiva}</strong> ({productosPorLinea()[props.lineaActiva]?.length || 0} productos)
            </div>
            <table class="product-table">
              <TableHeader />
              <tbody>
                <For each={Object.entries(mostrarGrupos())}>
                  {([linea, prods]) => (
                    <LineaGroup
                      linea={linea}
                      productos={prods}
                      totalIGV={props.totales.totalIGV}
                      isExpanded={expandedLineas()[linea] !== false}
                      onToggle={() => toggleLinea(linea)}
                    />
                  )}
                </For>
              </tbody>
            </table>
          </>
        }
      >
        <div class="table-info">
          Mostrando {startIndex() + 1}-{Math.min(endIndex(), props.productos.length)} de {props.productos.length} productos
        </div>

        <table class="product-table">
          <TableHeader />
          <tbody>
            <For each={currentProducts()}>
              {(producto) => (
                <ProductRow
                  producto={producto}
                  totalIGV={props.totales.totalIGV}
                />
              )}
            </For>
          </tbody>
          <TableFooter productos={currentProducts()} />
        </table>

        <Pagination
          currentPage={currentPage()}
          totalPages={totalPages()}
          onPageChange={handlePageChange}
        />
      </Show>
    </div>
  )
}