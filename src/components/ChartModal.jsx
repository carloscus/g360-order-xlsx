import { createSignal, createMemo, For, Show, onMount, onCleanup } from 'solid-js'

const CHART_COLORS = [
  '#00d084', '#f43f5e', '#8b5cf6', '#f59e0b', '#06b6d4',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#eab308', '#3b82f6', '#d946ef', '#10b981', '#ef4444',
  '#22c55e', '#a855f7', '#f43f5e', '#14b8a6', '#f97316',
  '#06b6d4', '#ec4899', '#8b5cf6', '#84cc16', '#f59e0b'
]

export const ChartModal = (props) => {
  const show = () => props.show !== false
  const onClose = () => props.onClose?.()
  const productos = () => props.productos || []

  const datosLinea = createMemo(() => {
    const lineas = {}
    productos().forEach(p => {
      const linea = p.linea || 'SIN LÍNEA'
      if (!lineas[linea]) lineas[linea] = 0
      lineas[linea] += p.valorVenta
    })
    const total = Object.values(lineas).reduce((sum, v) => sum + v, 0)
    return Object.entries(lineas).map(([linea, monto], index) => ({
      linea,
      monto,
      porcentaje: total > 0 ? (monto / total) * 100 : 0,
      color: CHART_COLORS[index % CHART_COLORS.length]
    })).sort((a, b) => b.monto - a.monto)
  })

  const stockPorLinea = createMemo(() => {
    const lineas = {}
    productos().forEach(p => {
      const linea = p.linea || 'SIN LÍNEA'
      if (!lineas[linea]) {
        lineas[linea] = { conStock: 0, sinStock: 0, total: 0, valorConStock: 0, valorSinStock: 0 }
      }
      const tieneStock = p.estadoStock !== 'Agotado'
      const valor = p.valorVenta || 0
      if (tieneStock) {
        lineas[linea].conStock++
        lineas[linea].valorConStock += valor
      } else {
        lineas[linea].sinStock++
        lineas[linea].valorSinStock += valor
      }
      lineas[linea].total++
    })
    const total = Object.values(lineas).reduce((sum, l) => sum + l.valorConStock + l.valorSinStock, 0)
    return Object.entries(lineas).map(([linea, data]) => ({
      linea,
      conStock: data.conStock,
      sinStock: data.sinStock,
      total: data.total,
      valorConStock: data.valorConStock,
      valorSinStock: data.valorSinStock,
      valorTotal: data.valorConStock + data.valorSinStock,
      pctStock: data.total > 0 ? (data.conStock / data.total) * 100 : 0,
      pctAgotado: data.total > 0 ? (data.sinStock / data.total) * 100 : 0,
      pctValor: total > 0 ? ((data.valorConStock + data.valorSinStock) / total) * 100 : 0
    })).sort((a, b) => b.valorTotal - a.valorTotal)
  })



  // Drag functionality
  const [pos, setPos] = createSignal({ x: window.innerWidth - 450, y: 100 })
  const [isDragging, setIsDragging] = createSignal(false)
  const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 })

  const handleMouseDown = (e) => {
    if (e.target.closest('.chart-modal-header')) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - pos().x,
        y: e.clientY - pos().y
      })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging()) {
      setPos({
        x: e.clientX - dragStart().x,
        y: e.clientY - dragStart().y
      })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  onMount(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  })

  onCleanup(() => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  })

  return (
    <Show when={show()}>
      <div className="chart-modal-overlay" onClick={onClose}>
        <div 
          className="chart-modal" 
          style={{ left: pos().x + 'px', top: pos().y + 'px' }}
          onMouseDown={handleMouseDown}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="chart-modal-header">
            <h3>📊 Distribución por Línea</h3>
            <button onClick={onClose} className="close-btn">×</button>
          </div>
          <div className="chart-modal-content">
            <div class="stock-distribution-grid">
              <For each={stockPorLinea()}>
                {(d) => {
                  const pctStock = d.valorTotal > 0 ? (d.valorConStock / d.valorTotal) * 100 : 0
                  const pctTotal = datosLinea().find(l => l.linea === d.linea)?.porcentaje || 0
                  const color = datosLinea().find(l => l.linea === d.linea)?.color || 'var(--g360-accent)'
                  
                  return (
                    <div className="stock-row">
                      <div className="stock-left">
                        <span className="stock-name">{d.linea}</span>
                        <span className="stock-pct-total">{pctTotal.toFixed(0)}%</span>
                      </div>
                      
                      <div className="stock-bar-container">
                        <div className="stock-bar-bg">
                          <div 
                            className="stock-bar-fill" 
                            style={{
                              width: `${pctStock}%`,
                              background: color,
                              'box-shadow': `0 0 8px ${color}60`
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="stock-right">
                        <span className="stock-value-available">{d.valorConStock.toLocaleString('es-PE', { maximumFractionDigits: 0 })}</span>
                        <span className="stock-divider">/</span>
                        <span className="stock-value-total">{d.valorTotal.toLocaleString('es-PE', { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  )
                }}
              </For>
            </div>

            <div class="stock-total-footer">
              <span class="stock-total-label">TOTAL PEDIDO</span>
              <span class="stock-total-value">S/ {stockPorLinea().reduce((sum, d) => sum + d.valorTotal, 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </Show>
  )
}

export default ChartModal