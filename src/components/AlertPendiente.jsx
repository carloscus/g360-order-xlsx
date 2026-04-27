import { Show } from 'solid-js'

export const AlertPendiente = (props) => {
  const show = () => props.show !== false
  const onConfirm = () => props.onConfirm
  const onDiscard = () => props.onDiscard

  return (
    <Show when={show()}>
      <div class="modal-overlay">
        <div class="alert-modal">
          <div class="alert-icon">⚠️</div>
          <h3>¿Tienes un cálculo pendiente?</h3>
          <p>Ya tienes un pedido con distribución de cuotas. ¿Qué deseas hacer?</p>
          <div class="alert-buttons">
            <button onClick={onConfirm} class="btn-alert btn-danger">
              🗑️ Eliminar y cargar nuevo
            </button>
            <button onClick={onDiscard} class="btn-alert btn-secondary">
              Mantener actual
            </button>
          </div>
        </div>
      </div>
    </Show>
  )
}

export default AlertPendiente