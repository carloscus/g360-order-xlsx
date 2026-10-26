import { For, Show } from 'solid-js'
import { COLUMNS } from './columns'

export const TableHeader = (props) => {
  const visibles = () => COLUMNS.filter(c => props.columnasVisibles().has(c.key))

  return (
    <thead>
      <tr>
        <For each={visibles()}>
          {(col) => (
            <th
              class={`th-${col.align}${col.sortable ? ' th-sortable' : ''}${props.sortKey?.() === col.key ? ' th-active' : ''}`}
              onClick={() => col.sortable && props.onSort?.(col.key, col.type)}
              title={col.sortable ? `Ordenar por ${col.label}` : undefined}
            >
              <span class="th-stack">
                <span class="th-label">{col.label}</span>
                <Show when={col.unit}>
                  <span class="th-unit">{col.unit}</span>
                </Show>
                <Show when={col.sortable}>
                  <span class="th-ind">
                    <Show when={props.sortKey?.() === col.key} fallback={<span class="th-ind-idle">↕</span>}>
                      {props.sortDir?.() === 'asc' ? '▲' : '▼'}
                    </Show>
                  </span>
                </Show>
              </span>
            </th>
          )}
        </For>
      </tr>
    </thead>
  )
}
