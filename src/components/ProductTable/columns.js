/**
 * Definición de columnas de la tabla de partidas.
 * Compartida entre TableHeader y ProductRow para que el toggle de columnas
 * afecte a ambos por igual (una sola fuente de verdad).
 *
 * `hideable: false` = la columna siempre se muestra (son las críticas:
 * N°, Descripción y Total Venta, sin ellas la tabla no sirve).
 */
export const COLUMNS = [
  { key: 'id', label: 'N°', unit: '', align: 'center', sortable: true, type: 'num', hideable: false },
  { key: 'cantidad', label: 'Cant.', unit: '', align: 'right', sortable: true, type: 'num' },
  { key: 'unidadMedida', label: 'U/M', unit: '', align: 'center', sortable: false },
  { key: 'codigo', label: 'SKU', unit: '', align: 'center', sortable: true, type: 'text' },
  { key: 'descripcion', label: 'Descripción', unit: '', align: 'left', sortable: true, type: 'text', hideable: false },
  { key: 'precioUnitario', label: 'P. Lista', unit: '(S/.)', align: 'right', sortable: true, type: 'num' },
  { key: 'descuento1', label: 'Desc 01', unit: '(%)', align: 'right', sortable: true, type: 'num' },
  { key: 'descuento2', label: 'Desc 02', unit: '(%)', align: 'right', sortable: true, type: 'num' },
  { key: 'valorVenta', label: 'Total Neto', unit: '(S/.)', align: 'right', sortable: true, type: 'num' },
  { key: 'precioUnitCIGV', label: 'P. Unit', unit: 'c/IGV (S/.)', align: 'right', sortable: true, type: 'num' },
  { key: 'totalVenta', label: 'Total Venta', unit: '(S/.)', align: 'right', sortable: true, type: 'num', hideable: false },
  { key: 'cajas', label: 'Cajas', unit: '(BX)', align: 'center', sortable: true, type: 'num' },
  { key: 'tipo', label: 'Tipo', unit: '', align: 'center', sortable: false },
  { key: 'estadoCatalogo', label: 'Est', unit: '(cat)', align: 'center', sortable: false },
]

/** Todas las columnas visibles por defecto. */
export const columnasPorDefecto = () => new Set(COLUMNS.map(c => c.key))
