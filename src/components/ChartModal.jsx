/**
 * @component ChartModal
 * @description Modal de Analisis de Disponibilidad por Linea
 * @architecture G360 Ecosystem - Modulo Analitico
 * @version 2.1.0
 * 
 * @features
 * - Agrupamiento automatico por linea de productos
 * - Calculo de disponibilidad real vs pendiente
 * - Grafico de barras horizontales proporcional al total
 * - 2 tonos por linea: disponible / sin stock
 * - Marcador de corte exacto
 * - Tooltip detallado por hover
 * - Arrastre de modal
 * - Ordenamiento automatico por monto
 * 
 * @dependencies solid-js, formatNumero
 */
import { createSignal, createMemo, For, Show, onMount, onCleanup } from 'solid-js'
import { formatNumero } from '../utils/formatters' // Assuming formatNumero is available
import { getAgentesSkill } from '../core/g360-skill-agentes'
import { CHART_COLORS } from '../constants/sharedConstants'

const [hoverData, setHoverData] = createSignal(null)
const [tooltipPos, setTooltipPos] = createSignal({ x: 0, y: 0 })

export const ChartModal = (props) => {
  const show = () => props.show
  const onClose = () => props.onClose?.()
  const productos = () => props.productos || []
  const { calculos } = getAgentesSkill()

  /**
   * Memo calculado automaticamente ante cambios de productos
   * Agrupa todos los items por linea y calcula metricas de disponibilidad
   * @returns {Array} Datos agrupados y ordenados
   */
  const stockPorLinea = createMemo(() => {
    const lineas = {}

    // Recorremos productos y agrupamos
    productos().forEach(p => {
      const linea = (p.linea || 'OTRAS').toUpperCase()
      
      // Inicializar linea si no existe
      if (!lineas[linea]) {
        lineas[linea] = { valorConStock: 0, valorSinStock: 0 }
      }

      // Regla de disponibilidad: stock >= cantidad solicitada
      const tieneStock = calculos.stock.estado(p.stock, p.cantidad) === 'OK' // Usar el skill agent para consistencia
      const valor = Number(p.valorVenta) || 0

      // Clasificamos el valor segun disponibilidad
      if (tieneStock) {
        lineas[linea].valorConStock += valor
      } else {
        lineas[linea].valorSinStock += valor
      }
    })

    // Total general del pedido
    const totalVentaPedido = Object.values(lineas).reduce((sum, l) => sum + l.valorConStock + l.valorSinStock, 0)

    // Transformamos y calculamos porcentajes
    return Object.entries(lineas).map(([linea, data], index) => {
      const valorTotalLinea = data.valorConStock + data.valorSinStock
      
      return {
        linea,
        color: CHART_COLORS[index % CHART_COLORS.length],
        valorConStock: data.valorConStock,
        valorSinStock: data.valorSinStock,
        valorTotal: valorTotalLinea,
        // Porcentaje que representa esta linea sobre el TOTAL del pedido
        porcentajeDelTotal: totalVentaPedido > 0 ? (valorTotalLinea / totalVentaPedido) * 100 : 0,
        // Porcentaje de esta linea que SI tiene stock
        pctStockDeLinea: valorTotalLinea > 0 ? (data.valorConStock / valorTotalLinea) * 100 : 0,
        // Porcentaje de esta linea que NO tiene stock
        pctSinStockDeLinea: valorTotalLinea > 0 ? (data.valorSinStock / valorTotalLinea) * 100 : 0
      }
      // Ordenamos de mayor a menor monto
    }).sort((a, b) => b.valorTotal - a.valorTotal)
  })

  // Estado para arrastre del modal
  const [pos, setPos] = createSignal({ x: window.innerWidth / 2 - 300, y: 100 })
  const [isDragging, setIsDragging] = createSignal(false)
  const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 })

  const handleMouseDown = (e) => {
    if (e.target.closest('.chart-modal-header')) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pos().x, y: e.clientY - pos().y })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging()) {
      setPos({ x: e.clientX - dragStart().x, y: e.clientY - dragStart().y })
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
      <div class='chart-modal-overlay' onClick={onClose}>
        <div 
          class='chart-modal premium-chart-modal minimalist-chart' 
          style={{ left: pos().x + 'px', top: pos().y + 'px' }}
          onMouseDown={handleMouseDown}
          onClick={(e) => e.stopPropagation()}
        >
          <div class='chart-modal-header'>
            <h3>📊 ANÁLISIS DE DISPONIBILIDAD OPERATIVA</h3>
            <button onClick={onClose} class='close-btn'>×</button>
          </div>
          <div class='chart-modal-content'>
            <div class='chart-bars-list'>
              <For each={stockPorLinea()}>
                {(d) => (
                  <div class='minimal-row'>
                    <div class='minimal-header'>
                      <span class='minimal-name'>{d.linea}</span>
                      <span class='minimal-stats'>
                        <span class='minimal-pct'>{d.porcentajeDelTotal.toFixed(1)}%</span>
                        <span class='minimal-total'>S/ {formatNumero(d.valorTotal)}</span>
                      </span>
                    </div>
                    
                    <div 
                      class='minimal-bar-container' 
                      style={{ width: Math.max(d.porcentajeDelTotal, 3) + '%' }}
                      onMouseMove={(e) => {
                        setTooltipPos({ x: e.clientX, y: e.clientY })
                        setHoverData(d)
                      }}
                      onMouseLeave={() => setHoverData(null)}
                    >
                      <div 
                        class='minimal-segment-available' 
                        style={{ width: d.pctStockDeLinea + '%', background: d.color }}
                      />
                      <div 
                        class='minimal-segment-pending' 
                        style={{ width: d.pctSinStockDeLinea + '%', background: d.color + '30' }}
                      />
                      <div class='minimal-cut-marker' style={{ left: d.pctStockDeLinea + '%' }} />
                    </div>
                  </div>
                )}
              </For>
            </div>
            
            <div class='minimal-footer'>
              <div class='minimal-footer-row'>
                <span>VALOR ATENDIBLE (CON STOCK):</span>
                <span class='text-emerald-400'>S/ {formatNumero(stockPorLinea().reduce((sum, d) => sum + d.valorConStock, 0))}</span>
              </div>
              <div class='minimal-footer-row'>
                <span>VALOR PENDIENTE (SIN STOCK):</span>
                <span class='text-amber-400'>S/ {formatNumero(stockPorLinea().reduce((sum, d) => sum + d.valorSinStock, 0))}</span>
              </div>
              <div class='minimal-footer-row total'>
                <span>TOTAL A ATENDER:</span>
                <span>S/ {formatNumero(stockPorLinea().reduce((sum, d) => sum + d.valorTotal, 0))}</span>
              </div>
            </div>
            </div>

            <Show when={hoverData()}>
              <div 
                class='chart-tooltip'
                style={{ 
                  left: tooltipPos().x + 15 + 'px', 
                  top: tooltipPos().y - 10 + 'px' 
                }}
              >
                <div class='tooltip-title'>{hoverData().linea}</div>
                <div class='tooltip-row'>
                  <span class='tooltip-label'>✅ Disponible:</span>
                  <span class='tooltip-value text-emerald-400'>S/ {formatNumero(hoverData().valorConStock)}</span>
                  <span class='tooltip-pct'>({hoverData().pctStockDeLinea.toFixed(1)}%)</span>
                </div>
                <div class='tooltip-row'>
                  <span class='tooltip-label'>⚠️ Pendiente:</span>
                  <span class='tooltip-value text-amber-400'>S/ {formatNumero(hoverData().valorSinStock)}</span>
                  <span class='tooltip-pct'>({hoverData().pctSinStockDeLinea.toFixed(1)}%)</span>
                </div>
                <div class='tooltip-divider'/>
                <div class='tooltip-row total'>
                  <span class='tooltip-label'>Total Línea:</span>
                  <span class='tooltip-value'>S/ {formatNumero(hoverData().valorTotal)}</span>
                  <span class='tooltip-pct'>{hoverData().porcentajeDelTotal.toFixed(1)}% del pedido</span>
                </div>
              </div>
            </Show>

          </div>
        </div>
      </Show>
  )
}

export default ChartModal
