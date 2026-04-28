/**
 * =====================================================================
 * G360-ORDER-XLSX - Audit Panel Component (Minimal)
 * =====================================================================
 * Panel de auditoría simplificado - solo errores y advertencias
 * =====================================================================
 */

import { createSignal, createMemo, For, Show } from 'solid-js'
import { auditarPedido, getHallazgosPorTipo, TIPO_AUDITORIA } from '../constants/audit'

export const AuditPanel = (props) => {
  const productos = () => props.productos || []
  
  const resultadosAudit = createMemo(() => auditarPedido(productos()))
  const hallazgosPorTipo = createMemo(() => getHallazgosPorTipo(resultadosAudit().hallazgos))
  
  const [mostrarInfos, setMostrarInfos] = createSignal(false)
  
  const tieneProblemas = () => 
    resultadosAudit().resumen.errores > 0 || 
    resultadosAudit().resumen.advertencias > 0

  return (
    <Show when={resultadosAudit().resumen.totalProductos > 0}>
      <div class="audit-panel-minimal">
        {/* Header con stats */}
        <div class="audit-mini-header">
          <span class={`audit-badge ${resultadosAudit().esValido ? 'ok' : 'error'}`}>
            {resultadosAudit().esValido ? '✅ OK' : '⚠️ REVISAR'}
          </span>
          <Show when={resultadosAudit().resumen.errores > 0}>
            <span class="audit-count error">🚫 {resultadosAudit().resumen.errores}</span>
          </Show>
          <Show when={resultadosAudit().resumen.advertencias > 0}>
            <span class="audit-count warning">⚠️ {resultadosAudit().resumen.advertencias}</span>
          </Show>
          <Show when={resultadosAudit().resumen.infos > 0}>
            <button 
              class="audit-toggle" 
              onClick={() => setMostrarInfos(!mostrarInfos())}
            >
              ℹ️ {resultadosAudit().resumen.infos} {mostrarInfos() ? '▲' : '▼'}
            </button>
          </Show>
        </div>

        {/* Errores - siempre visibles si existen */}
        <Show when={hallazgosPorTipo().errores.length > 0}>
          <div class="audit-list errors">
            <For each={hallazgosPorTipo().errores}>
              {(h) => (
                <div class="audit-item-mini">
                  <span class="sku">{h.sku}</span>
                  <span class="msg">{h.mensaje}</span>
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* Advertencias - siempre visibles si existen */}
        <Show when={hallazgosPorTipo().advertencias.length > 0}>
          <div class="audit-list warnings">
            <For each={hallazgosPorTipo().advertencias}>
              {(h) => (
                <div class="audit-item-mini">
                  <span class="sku">{h.sku}</span>
                  <span class="msg">{h.mensaje}</span>
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* Infos - solo si toggle activado */}
        <Show when={mostrarInfos() && hallazgosPorTipo().infos.length > 0}>
          <div class="audit-list infos">
            <For each={hallazgosPorTipo().infos}>
              {(h) => (
                <div class="audit-item-mini">
                  <span class="sku">{h.sku}</span>
                  <span class="msg">{h.mensaje}</span>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </Show>
  )
}

export default AuditPanel
