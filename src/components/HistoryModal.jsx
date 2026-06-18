import { createSignal, createEffect, Show, For } from 'solid-js'
import { listarHTMLSnapshots, eliminarHTMLSnapshot, descargarHTML } from '../utils/htmlHistoryStorage'

export const HistoryModal = (props) => {
  const [htmlList, setHtmlList] = createSignal([])

  const show = () => props.show
  const onClose = () => props.onClose?.()

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  createEffect(() => {
    if (show()) {
      listarHTMLSnapshots().then(setHtmlList)
    }
  })

  const eliminarHtml = async (id) => {
    if (!confirm('¿Deseas eliminar este HTML de forma permanente?')) return
    await eliminarHTMLSnapshot(id)
    setHtmlList(await listarHTMLSnapshots())
  }

  return (
    <Show when={show()}>
      <div class="modal-overlay" onClick={handleOverlayClick}>
        <div class="history-modal">
          <div class="modal-header">
            <h3>🌐 BÓVEDA HTML</h3>
            <button class="modal-close" onClick={onClose}>✕</button>
          </div>

          <div class="history-list">
            <Show when={htmlList().length === 0}>
              <div class="history-empty">❌ No hay HTML guardados</div>
            </Show>

            <For each={htmlList()}>
              {(item, idx) => (
                <div class="history-item-wrapper" style="position: relative;">
                  <div class="history-item" onClick={() => descargarHTML(item)}>
                    <div class="history-item-header">
                      <span class="history-num">#{idx() + 1}</span>
                      <span class="history-date">{item.fecha}</span>
                    </div>
                    <div class="history-item-body">
                      <div class="history-client">{item.cliente}</div>
                      <div class="history-details">
                        <span>Pedido: {item.numeroPedido || 'N/A'}</span>
                        <span>•</span>
                        <span>RUC: {item.ruc || 'N/A'}</span>
                        <span>•</span>
                        <span style="color: var(--g360-accent); font-weight: bold;">🌐 HTML</span>
                      </div>
                    </div>
                    <button class="history-delete-btn" onClick={(e) => { e.stopPropagation(); eliminarHtml(item.id); }}
                      title="Eliminar HTML"
                      style="position: absolute; right: 10px; top: 10px; border: none; background: none; cursor: pointer; font-size: 1.2rem; color: #ef4444;">
                      ×
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>

          <div class="modal-footer">
            <span class="history-count">Total: {htmlList().length} HTML</span>
            <button class="btn-secondary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </Show>
  )
}

export default HistoryModal
