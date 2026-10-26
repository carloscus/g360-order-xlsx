import { Show, For } from 'solid-js'
import { formatNumero } from '../../utils/formatters'
import { IVA } from '../../constants/sharedConstants'

const stockToClass = (status) => {
  if (status === 'OK') return 'ok'
  if (status === 'AJ') return 'aj'
  if (status === 'Agotado') return 'agotado'
  return 'warning'
}

export const ProductRow = (props) => {
  const p = props.producto
  const estado = () => p.estadoStock || 'OK'
  const stockClass = () => `stock-badge stock-${stockToClass(estado())}`
  const valorVenta = () => p.valorVenta || 0
  const precioUnitCIGV = () => p.cantidad ? (valorVenta() / p.cantidad) * IVA : 0
  const totalVenta = () => valorVenta() * IVA

  // Sólo se muestran las columnas activas en el toggle (mismo Set del header).
  const visible = (key) => props.columnasVisibles().has(key)

  const badgeLinea = () => {
    if (!p.estadoLinea) return null
    const estado = p.estadoLinea
    const color = p.colorEstadoLinea || '#6b7280'
    return <span class="badge" style={{ background: `${color}20`, color, border: `1px solid ${color}40`, padding: '2px 8px', "border-radius": '4px', "font-size": '11px', "font-weight": 600 }}>{estado}</span>
  }

  // Badges de estado del catálogo enriquecido (API v2)
  const badgeEstadoCatalogo = () => {
    const badges = []
    if (p.descontinuado === true) badges.push({ t: 'DESCONT', c: 'ef4444' })
    if (p.cotizable === false) badges.push({ t: 'NO COT', c: 'ef4444' })
    if (p.vigente === false) badges.push({ t: 'NO VIG', c: 'f59e0b' })
    if (p.por_activar === true) badges.push({ t: 'ACTIVAR', c: 'f59e0b' })
    if (p.en_guia === false) badges.push({ t: 'GUÍA', c: '94a3b8' })
    if (p.compromiso === true) badges.push({ t: 'COMPROM', c: '3b82f6' })
    if (badges.length === 0) return null
    return (
      <span class="cat-badges">
        <For each={badges}>{(b) => (
          <span class="cat-badge" style={{ background: `${b.c}20`, color: b.c, border: `1px solid ${b.c}40` }}>{b.t}</span>
        )}</For>
      </span>
    )
  }

  return (
    <tr class="fade-in-up">
      <Show when={visible('id')}>
        <td class="row-num text-center">{p.id}</td>
      </Show>

      <Show when={visible('cantidad')}>
        <td class="row-cant number">
          <span class={stockClass()} title={estado()}></span>
          {Math.round(p.cantidad || 0).toLocaleString('es-PE')}
        </td>
      </Show>

      <Show when={visible('unidadMedida')}>
        <td>{p.unidadMedida || 'UN'}</td>
      </Show>

      <Show when={visible('codigo')}>
        <td class="row-sku">{p.codigo}</td>
      </Show>

      <Show when={visible('descripcion')}>
        <td class="row-desc" title={p.descripcion}>{p.descripcion}</td>
      </Show>

      <Show when={visible('precioUnitario')}>
        <td class="number">{formatNumero(p.precioUnitario || 0, 4)}</td>
      </Show>

      <Show when={visible('descuento1')}>
        <td class="number d1">{p.descuento1?.toFixed(2) || '0.00'}</td>
      </Show>

      <Show when={visible('descuento2')}>
        <td class="number d2">{p.descuento2?.toFixed(2) || '0.00'}</td>
      </Show>

      <Show when={visible('valorVenta')}>
        <td class="number row-total">{formatNumero(valorVenta())}</td>
      </Show>

      <Show when={visible('precioUnitCIGV')}>
        <td class="number">{formatNumero(precioUnitCIGV(), 4)}</td>
      </Show>

      <Show when={visible('totalVenta')}>
        <td class="number">{formatNumero(totalVenta())}</td>
      </Show>

      <Show when={visible('cajas')}>
        <td class="td-cajas text-center">
          <span class="cajas-val">{p.cajasCompletas || 0}</span>
          <Show when={(p.unidadesSueltas || 0) > 0}>
            <span class="cajas-sueltas">+{p.unidadesSueltas}</span>
          </Show>
        </td>
      </Show>

      <Show when={visible('tipo')}>
        <td class="badge-cell">{badgeLinea()}</td>
      </Show>

      <Show when={visible('estadoCatalogo')}>
        <td class="badge-cell">{badgeEstadoCatalogo()}</td>
      </Show>
    </tr>
  )
}
