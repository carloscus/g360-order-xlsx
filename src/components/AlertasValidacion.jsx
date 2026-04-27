/**
 * =====================================================================
 * G360-ORDER-XLSX - AlertasValidacion Component (SolidJS)
 * =====================================================================
 * Componente para mostrar errores y advertencias en tiempo real
 * 
 * @author Carlos Cusi (CCUSI)
 * @created 2026-04-10
 * =====================================================================
 */

import { Show, For } from 'solid-js'
import { getResumenValidaciones } from '../constants/validaciones'

export const AlertasValidacion = (props) => {
  const productos = () => props.productos || []
  const resumen = () => getResumenValidaciones(productos())
  const maxItems = () => props.maxItems || 5

  const tieneAlertas = () => resumen().total > 0

  return (
    <Show when={tieneAlertas()}>
      <div class="alertas-container">
        {/* Errores */}
        <Show when={resumen().errores.length > 0}>
          <div class="alerta-item error">
            <div class="alerta-header">
              <span class="alerta-icon">🚫</span>
              <span class="alerta-title">Errores ({resumen().errores.length})</span>
              <span class="alerta-badge error">{resumen().productosConErrores} productos</span>
            </div>
            <div class="alerta-list">
              <For each={resumen().errores.slice(0, maxItems())}>
                {(e) => (
                  <div class="alerta-producto">
                    <span class="producto-codigo">{e.producto}</span>
                    <span class="producto-mensaje">{e.mensaje}</span>
                  </div>
                )}
              </For>
              <Show when={resumen().errores.length > maxItems()}>
                <div class="alerta-mas">+{resumen().errores.length - maxItems()} más errores</div>
              </Show>
            </div>
          </div>
        </Show>

        {/* Advertencias */}
        <Show when={resumen().advertencias.length > 0}>
          <div class="alerta-item warning">
            <div class="alerta-header">
              <span class="alerta-icon">⚠️</span>
              <span class="alerta-title">Advertencias ({resumen().advertencias.length})</span>
              <span class="alerta-badge warning">{resumen().productosConAdvertencias} productos</span>
            </div>
            <div class="alerta-list">
              <For each={resumen().advertencias.slice(0, maxItems())}>
                {(a) => (
                  <div class="alerta-producto">
                    <span class="producto-codigo">{a.producto}</span>
                    <span class="producto-mensaje">{a.mensaje}</span>
                  </div>
                )}
              </For>
              <Show when={resumen().advertencias.length > maxItems()}>
                <div class="alerta-mas">+{resumen().advertencias.length - maxItems()} más advertencias</div>
              </Show>
            </div>
          </div>
        </Show>
      </div>
    </Show>
  )
}

// Componente inline para mostrar solo icono con tooltip
export const AlertasBadge = (props) => {
  const productos = () => props.productos || []
  const resumen = () => getResumenValidaciones(productos())

  const tieneErrores = () => resumen().errores.length > 0
  const tieneAdvertencias = () => resumen().advertencias.length > 0

  return (
    <Show when={tieneErrores() || tieneAdvertencias()}>
      <div class={`alertas-badge ${tieneErrores() ? 'has-errors' : 'has-warnings'}`} title={`${resumen().errores.length} errores, ${resumen().advertencias.length} advertencias`}>
        <Show when={tieneErrores()}>
          <span class="badge-count error">{resumen().errores.length}</span>
        </Show>
        <Show when={tieneAdvertencias()}>
          <span class="badge-count warning">{resumen().advertencias.length}</span>
        </Show>
      </div>
    </Show>
  )
}

export default AlertasValidacion