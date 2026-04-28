import { createSignal, For } from 'solid-js'

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
                    </div>
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
