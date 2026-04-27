/**
 * =====================================================================
 * G360-ORDER-XLSX - Audit Panel Component
 * =====================================================================
 * Panel de visualización de auditoría de pedidos
 * 
 * @author Carlos Cusi (CCUSI)
 * @created 2026-04-10
 * =====================================================================
 */

import { createSignal, createMemo, For, Show } from 'solid-js'
import { auditarPedido, getHallazgosPorCategoria, getHallazgosPorTipo, TIPO_AUDITORIA, CATEGORIA_AUDITORIA } from '../constants/audit'

export const AuditPanel = (props) => {
  const productos = () => props.productos || []
  
  const resultadosAudit = createMemo(() => auditarPedido(productos()))
  
  const hallazgosPorTipo = createMemo(() => getHallazgosPorTipo(resultadosAudit().hallazgos))
  
  const tieneProblemas = () => resultadosAudit().resumen.errores > 0 || resultadosAudit().resumen.advertencias > 0
  
  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case TIPO_AUDITORIA.ERROR: return '🚫'
      case TIPO_AUDITORIA.WARNING: return '⚠️'
      case TIPO_AUDITORIA.INFO: return 'ℹ️'
      case TIPO_AUDITORIA.SUCCESS: return '✅'
      default: return '•'
    }
  }
  
  const getTipoClass = (tipo) => {
    switch (tipo) {
      case TIPO_AUDITORIA.ERROR: return 'audit-error'
      case TIPO_AUDITORIA.WARNING: return 'audit-warning'
      case TIPO_AUDITORIA.INFO: return 'audit-info'
      case TIPO_AUDITORIA.SUCCESS: return 'audit-success'
      default: return ''
    }
  }

  return (
    <div class="audit-panel">
      <div class="audit-header">
        <h3>🔍 Auditoría del Pedido</h3>
        <div class="audit-stats">
          <span class="stat-error">🚫 {resultadosAudit().resumen.errores}</span>
          <span class="stat-warning">⚠️ {resultadosAudit().resumen.advertencias}</span>
          <span class="stat-info">ℹ️ {resultadosAudit().resumen.infos}</span>
        </div>
      </div>
      
      <Show when={resultadosAudit().resumen.totalProductos > 0}>
        <div class="audit-summary">
          <div class={`audit-status ${resultadosAudit().esValido ? 'valid' : 'invalid'}`}>
            {resultadosAudit().esValido ? '✅ Pedido Válido' : '❌ Pedido con Errores'}
          </div>
          <div class="audit-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill valid" 
                style={{ width: `${resultadosAudit().porcentajeValidos}%` }}
              ></div>
              <div 
                class="progress-fill errors" 
                style={{ width: `${(resultadosAudit().resumen.errores / resultadosAudit().resumen.totalProductos) * 100}%` }}
              ></div>
            </div>
            <span class="progress-text">{resultadosAudit().porcentajeValidos.toFixed(1)}% válido</span>
          </div>
        </div>
        
        <Show when={tieneProblemas()}>
          <div class="audit-details">
            <Show when={hallazgosPorTipo().errores.length > 0}>
              <div class="audit-section errors">
                <h4>🚫 Errores ({hallazgosPorTipo().errores.length})</h4>
                <For each={hallazgosPorTipo().errores}>
                  {(h) => (
                    <div class="audit-item error">
                      <span class="audit-sku">{h.sku}</span>
                      <span class="audit-msg">{h.mensaje}</span>
                    </div>
                  )}
                </For>
              </div>
            </Show>
            
            <Show when={hallazgosPorTipo().advertencias.length > 0}>
              <div class="audit-section warnings">
                <h4>⚠️ Advertencias ({hallazgosPorTipo().advertencias.length})</h4>
                <For each={hallazgosPorTipo().advertencias}>
                  {(h) => (
                    <div class="audit-item warning">
                      <span class="audit-sku">{h.sku}</span>
                      <span class="audit-msg">{h.mensaje}</span>
                    </div>
                  )}
                </For>
              </div>
            </Show>
            
            <Show when={hallazgosPorTipo().infos.length > 0}>
              <div class="audit-section infos">
                <h4>ℹ️ Informaciones ({hallazgosPorTipo().infos.length})</h4>
                <For each={hallazgosPorTipo().infos}>
                  {(h) => (
                    <div class="audit-item info">
                      <span class="audit-sku">{h.sku}</span>
                      <span class="audit-msg">{h.mensaje}</span>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </Show>
      </Show>
      
      <Show when={resultadosAudit().resumen.totalProductos === 0}>
        <div class="audit-empty">No hay productos para auditar</div>
      </Show>
    </div>
  )
}

export default AuditPanel