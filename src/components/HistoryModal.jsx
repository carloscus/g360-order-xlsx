import { Show, For } from 'solid-js'

export const HistoryModal = (props) => {
  const show = () => props.show
  const onClose = () => props.onClose?.()
  const historial = () => props.historial || []
  const onSelect = props.onSelect

  const handleSelect = (item) => {
    if (onSelect) onSelect(item)
    onClose()
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <Show when={show()}>
      <div class="modal-overlay" onClick={handleOverlayClick}>
        <div class="history-modal">
          <div class="modal-header">
            <h3>📂 HISTORIAL DE GUARDADOS</h3>
            <button class="modal-close" onClick={onClose}>✕</button>
          </div>
          
          <div class="history-list">
            <Show when={historial().length === 0}>
              <div class="history-empty">❌ No hay estados guardados</div>
            </Show>
            
            <For each={historial()}>
              {(item, idx) => (
                <div class="history-item-wrapper" style="position: relative;">
                  <div 
                    class="history-item"
                    onClick={() => handleSelect(item)}
                  >
                  <div class="history-item-header">
                    <span class="history-num">#{idx() + 1}</span>
                    <span class="history-date">{item.fecha}</span>
                  </div>

                  <div class="history-item-body">
                    <div class="history-client">{item.cliente}</div>
                    <div class="history-details">
                      <span>Pedido: {item.numeroPedido || 'N/A'}</span>
                      <span>•</span>
                      <span>{item.productos} prods</span>
                      <span>•</span>
                      <span>S/ {item.total?.toFixed(2) || '0.00'}</span>
                      <Show when={item.data?.cuotas?.length > 0}>
                        <span>•</span>
                        <span style="color: var(--g360-accent); font-weight: bold; font-size: 0.65rem;">📅 Distribución</span>
                      </Show>
                    </div>
                  </div>
                  <button 
                    class="history-delete-btn" 
                    onClick={(e) => { e.stopPropagation(); props.onDelete(item.id); }}
                    title="Eliminar de historial"
                    style="position: absolute; right: 10px; top: 10px; border: none; background: none; cursor: pointer; font-size: 1.2rem; color: #ef4444;"
                  >
                    ×
                  </button>
                </div>
                </div>
              )}
            </For>
          </div>
          
          <div class="modal-footer">
            <span class="history-count">Total: {historial().length} guardados</span>
            <button class="btn-secondary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </Show>
  )
}

export default HistoryModal
