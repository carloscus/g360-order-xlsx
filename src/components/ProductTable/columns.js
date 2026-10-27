/**
 * Definición de columnas de la tabla de partidas.
 * Compartida entre TableHeader y ProductRow para que el toggle de columnas
 * afecte a ambos por igual (una sola fuente de verdad).
 *
 * Todas las columnas son ocultables: el usuario decide qué ver desde el
 * toggle. Recomendación mínima: mantener Descripción + un valor (Neto o
 * Total Venta) para que la tabla tenga sentido.
 */
/**
 * Todas las columnas son ocultables (sin "fijas / protegidas). El usuario decide
 * qué ver: desde el toggle puede ocultar cualquiera para dar aire a la Descripción
 * o dejar sólo las que necesite para su análisis.
 * El control mínimo recomendado: dejar al menos Descripción + un valor (Neto o Total
 * Venta) para que la tabla tenga sentido.
 */
export const COLUMNS = [
  { key: 'id', label: 'N°', unit: '', align: 'center', sortable: true, type: 'num' },
  { key: 'cantidad', label: 'Cant.', unit: '', align: 'right', sortable: true, type: 'num' },
  { key: 'unidadMedida', label: 'U/M', unit: '', align: 'center', sortable: false },
  { key: 'codigo', label: 'SKU', unit: '', align: 'center', sortable: true, type: 'text' },
  { key: 'descripcion', label: 'Descripción', unit: '', align: 'left', sortable: true, type: 'text' },
  { key: 'linea', label: 'Línea', unit: '', align: 'center', sortable: true, type: 'text' },
  { key: 'precioUnitario', label: 'P. Lista', unit: '(S/.)', align: 'right', sortable: true, type: 'num' },
  { key: 'descuento1', label: 'Desc 01', unit: '(%)', align: 'right', sortable: true, type: 'num' },
  { key: 'descuento2', label: 'Desc 02', unit: '(%)', align: 'right', sortable: true, type: 'num' },
  { key: 'valorVenta', label: 'Total Neto', unit: '(S/.)', align: 'right', sortable: true, type: 'num' },
  { key: 'precioUnitCIGV', label: 'P. Unit', unit: 'c/IGV (S/.)', align: 'right', sortable: true, type: 'num' },
  { key: 'totalVenta', label: 'Total Venta', unit: '(S/.)', align: 'right', sortable: true, type: 'num' },
  { key: 'cajas', label: 'Cajas', unit: '(BX)', align: 'center', sortable: true, type: 'num' },
  { key: 'tipo', label: 'Est. línea', unit: '', align: 'center', sortable: false },
  { key: 'estadoCatalogo', label: 'Est', unit: '(cat)', align: 'center', sortable: false },
]

/** Todas las columnas visibles por defecto. */
export const columnasPorDefecto = () => new Set(COLUMNS.map(c => c.key))
