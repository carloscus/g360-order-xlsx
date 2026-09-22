import { For, Show } from 'solid-js'

// Encabezados a 2 líneas: etiqueta corta + unidad
const COLUMNS = [
  { key: 'id', label: 'N°', unit: '', align: 'center', sortable: true, type: 'num' },
  { key: 'cantidad', label: 'Cant.', unit: '', align: 'right', sortable: true, type: 'num' },
  { key: 'unidadMedida', label: 'U/M', unit: '', align: 'center', sortable: false },
  { key: 'codigo', label: 'SKU', unit: '', align: 'center', sortable: true, type: 'text' },
  { key: 'descripcion', label: 'Descripción', unit: '', align: 'left', sortable: true, type: 'text' },
  { key: 'precioUnitario', label: 'P. Lista', unit: '(S/.)', align: 'right', sortable: true, type: 'num' },
  { key: 'descuento1', label: 'Desc 01', unit: '(%)', align: 'right', sortable: true, type: 'num' },
  { key: 'descuento2', label: 'Desc 02', unit: '(%)', align: 'right', sortable: true, type: 'num' },
  { key: 'valorVenta', label: 'Total Neto', unit: '(S/.)', align: 'right', sortable: true, type: 'num' },
  { key: 'precioUnitCIGV', label: 'P. Unit', unit: 'c/IGV (S/.)', align: 'right', sortable: true, type: 'num' },
  { key: 'totalVenta', label: 'Total Venta', unit: '(S/.)', align: 'right', sortable: true, type: 'num' },
  { key: 'cajas', label: 'Cajas', unit: '(BX)', align: 'center', sortable: true, type: 'num' },
  { key: 'tipo', label: 'Tipo', unit: '', align: 'center', sortable: false },
]

export const TableHeader = (props) => {
  return (
    <thead>
      <tr>
        <For each={COLUMNS}>
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
