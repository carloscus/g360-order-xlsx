import { createSignal, createMemo, For, Show } from 'solid-js'
import { TableHeader } from './TableHeader'
import { ProductRow } from './ProductRow'
import { TableFooter } from './TableFooter'
import { formatNumero } from '../../utils/formatters'

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
  const totalMonto = () => props.productos.reduce((sum, p) => sum + (p.valorVenta || 0), 0)
  const totalCajas = () => props.productos.reduce((sum, p) => sum + (p.cajas || 0), 0)
  const totalPeso = () => props.productos.reduce((sum, p) => sum + (p.cantidad * (p.pesoKg || 0)), 0)

  return (
    <>
      <tr 
        class="linea-group-row" 
        onClick={props.onToggle}
        style={{ cursor: 'pointer', background: 'var(--g360-surface)', "font-weight": '600' }}
      >
        <td colSpan={13} style={{ padding: '12px 16px' }}>
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
              <span>S/ {formatNumero(totalMonto())}</span>
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
  const [searchTerm, setSearchTerm] = createSignal('')
  const [sortKey, setSortKey] = createSignal(null)
  const [sortDir, setSortDir] = createSignal('asc')
  const itemsPerPage = 75

  const productos = () => props.productos || []
  const totales = () => props.totales || { subtotal: 0, totalIGV: 0, totalDisponible: 0 }

  // Ordenar
  const ordenar = (key, type) => {
    if (sortKey() === key) {
      setSortDir(sortDir() === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // Filtrar + ordenar
  const productosFiltrados = createMemo(() => {
    let result = props.productos || []
    const term = searchTerm().toLowerCase().trim()
    if (term) {
      result = result.filter(p => 
        (p.codigo || '').toLowerCase().includes(term) ||
        (p.descripcion || '').toLowerCase().includes(term) ||
        (p.linea || '').toLowerCase().includes(term)
      )
    }
    const key = sortKey()
    if (key) {
      const dir = sortDir() === 'asc' ? 1 : -1
      result = [...result].sort((a, b) => {
        let va, vb
        if (key === 'precioUnitCIGV') {
          va = a.cantidad ? (a.valorVenta || 0) / a.cantidad : 0
          vb = b.cantidad ? (b.valorVenta || 0) / b.cantidad : 0
        } else if (key === 'totalVenta') {
          va = a.valorVenta || 0
          vb = b.valorVenta || 0
        } else {
          va = a[key]
          vb = b[key]
        }
        return dir * comparar(va, vb, key)
      })
    }
    return result
  })

  const comparar = (va, vb, key) => {
    // Numérico
    if (typeof va === 'number' || typeof vb === 'number') {
      va = Number(va) || 0
      vb = Number(vb) || 0
      return va - vb
    }
    // Texto
    va = String(va ?? '').toLowerCase()
    vb = String(vb ?? '').toLowerCase()
    if (va === vb) return 0
    return va < vb ? -1 : 1
  }

  // Agrupar productos por línea
   const productosPorLinea = createMemo(() => {
     const prods = productosFiltrados()
     return prods.reduce((acc, p) => {
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
  const totalPages = () => Math.ceil(productosFiltrados().length / itemsPerPage)
  const startIndex = () => (currentPage() - 1) * itemsPerPage
  const endIndex = () => startIndex() + itemsPerPage
  const currentProducts = () => productosFiltrados().slice(startIndex(), endIndex())

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  return (
    <div class="product-table-container">
      {/* Barra de búsqueda */}
      <div class="product-search">
        <input
          type="text"
          class="product-search-input"
          placeholder="Buscar por SKU, descripción o línea..."
          value={searchTerm()}
          onInput={(e) => { setSearchTerm(e.currentTarget.value); setCurrentPage(1) }}
        />
        <Show when={searchTerm()}>
          <button class="product-search-clear" onClick={() => { setSearchTerm(''); setCurrentPage(1) }}>×</button>
        </Show>
      </div>

      <Show 
        when={!props.lineaActiva} 
        fallback={
          <>
            <div class="table-info">
              Filtrado por: <strong>{props.lineaActiva}</strong> ({productosPorLinea()[props.lineaActiva]?.length || 0} productos)
            </div>
            <table class="product-table">
              <TableHeader sortKey={sortKey} sortDir={sortDir} onSort={ordenar} />
              <tbody>
                <For each={Object.entries(mostrarGrupos())}>
                  {([linea, prods]) => (
                    <LineaGroup
                      linea={linea}
                      productos={prods}
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
          <Show when={searchTerm()}>
            {productosFiltrados().length} resultados para "{searchTerm()}"
          </Show>
          <Show when={!searchTerm()}>
            Mostrando {startIndex() + 1}-{Math.min(endIndex(), productosFiltrados().length)} de {productosFiltrados().length} productos
          </Show>
        </div>

        <table class="product-table">
          <TableHeader sortKey={sortKey} sortDir={sortDir} onSort={ordenar} />
          <tbody>
            <For each={currentProducts()}>
              {(producto) => (
                <ProductRow
                  producto={producto}
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