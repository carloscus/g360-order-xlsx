/**
 * Extrae el pedido completo del HTML compartido por el usuario y regenera el reporte
 * con el generador actualizado (para validar anchos / paleta / 2 lineas).
 */
const fs = require('fs');
const path = require('path');

const HTML_IN = 'C:/Users/ccusi/Desktop/cronograma_20601024714_CC000103_20260922.html';
const html = fs.readFileSync(HTML_IN, 'utf8');

// Extraer filas completas del tbody
const rowRe = /<tr data-stock="(\w+)">\s*<td class="td-center">(\d+)<\/td>\s*<td class="td-right" data-value="([\d.]+)">[\s\S]*?<\/td>\s*<td class="td-center">([^<]*)<\/td>\s*<td class="td-mono" data-value="([0-9]+)">([0-9]+)<\/td>\s*<td class="td-desc" title="([^"]*)">([^<]*)<\/td>\s*<td class="td-right" data-value="([\d.]+)">([\d.,]+)<\/td>\s*<td class="td-center" data-value="([\d.]+)">([\d.,]+)<\/td>\s*<td class="td-center" data-value="([\d.]+)">([\d.,]+)<\/td>\s*<td class="td-right td-bold" data-value="([\d.]+)">([\d.,]+)<\/td>\s*<td class="td-right" data-value="([\d.]+)">([\d.,]+)<\/td>\s*<td class="td-right td-total" data-value="([\d.]+)">([\d.,]+)<\/td>\s*<td class="td-center td-cajas">([\s\S]*?)<\/td>/g;

const rows = [];
let m;
while ((m = rowRe.exec(html)) !== null) {
  const stockFlag = m[1];
  const id = parseInt(m[2]);
  const cant = parseFloat(m[3]);
  const um = m[4];
  const sku = m[5];
  const desc = m[7].replace(/&quot;/g, '"');
  const precio = parseFloat(m[9]);
  const d1 = parseFloat(m[11]);
  const d2 = parseFloat(m[13]);
  const neto = parseFloat(m[15]);
  const punit = parseFloat(m[17]);
  const total = parseFloat(m[19]);
  const cajasHtml = m[21];
  const cajasCompMatch = cajasHtml.match(/^(\d+)/);
  const sueltasMatch = cajasHtml.match(/cajas-sueltas">\+(\d+)/);
  const cajasComp = cajasCompMatch ? parseInt(cajasCompMatch[1]) : 0;
  const sueltas = sueltasMatch ? parseInt(sueltasMatch[1]) : 0;

  rows.push({
    id, codigo: sku, descripcion: desc, cantidad: cant, unidadMedida: um,
    precioUnitario: precio, descuento1: d1, descuento2: d2,
    valorVenta: neto, precioVenta: total,
    cajasCompletas: cajasComp, unidadesSueltas: sueltas,
    estadoStock: stockFlag === 'out' ? 'Agotado' : 'OK',
  });
}

console.log('Filas extraidas:', rows.length);
if (rows.length === 0) {
  console.log('ERROR: no se extrajeron filas. Revisa el regex.');
  process.exit(1);
}

// Obtener catalogo para linea/categoria/estadoLinea/peso
const catalogo = require('../src/data/catalogo_productos.json');
const catMap = new Map(catalogo.productos.map(p => [p.sku, p]));

const productos = rows.map(r => {
  const info = catMap.get(r.codigo);
  return {
    ...r,
    linea: info ? info.linea : 'SIN LINEA',
    categoria: info ? info.categoria : 'SIN CATEGORIA',
    pesoKg: info ? (info.peso_kg || 0) : 0,
    estadoLinea: null,
    colorEstadoLinea: null,
    stock: r.estadoStock === 'Agotado' ? 0 : Math.ceil(r.cantidad * 1.2),
    cantidadUnd: r.cantidad,
    unBx: info ? (info.un_bx || 0) : 0,
  };
});

console.log('Productos enriquecidos:', productos.length);

// Construir consolidado
const IVA = 1.18;
const r2 = (n) => Math.round((n || 0) * 100) / 100;
const totales = {
  subtotal: r2(productos.reduce((s, p) => s + (p.valorVenta || 0), 0)),
};
totales.totalIGV = r2(totales.subtotal * IVA);

const porLinea = {};
for (const p of productos) {
  const l = p.linea || 'SIN LINEA';
  if (!porLinea[l]) porLinea[l] = { linea: l, monto: 0, cajas: 0, peso: 0, cajasCompletas: 0, unidadesSueltas: 0 };
  porLinea[l].monto += p.valorVenta || 0;
  porLinea[l].cajas += p.cajasCompletas || 0;
  porLinea[l].peso += (p.cantidad || 0) * (p.pesoKg || 0);
  porLinea[l].cajasCompletas += p.cajasCompletas || 0;
  porLinea[l].unidadesSueltas += p.unidadesSueltas || 0;
}
const datosLinea = Object.values(porLinea)
  .map(l => ({ ...l, porcentaje: totales.subtotal ? (l.monto / totales.subtotal) * 100 : 0 }))
  .sort((a, b) => b.monto - a.monto);

const porCat = {};
for (const p of productos) {
  const c = p.categoria || 'SIN CATEGORIA';
  if (!porCat[c]) porCat[c] = { categoria: c, monto: 0, cajas: 0, peso: 0, cajasCompletas: 0, unidadesSueltas: 0 };
  porCat[c].monto += p.valorVenta || 0;
  porCat[c].cajas += p.cajasCompletas || 0;
  porCat[c].peso += (p.cantidad || 0) * (p.pesoKg || 0);
  porCat[c].cajasCompletas += p.cajasCompletas || 0;
  porCat[c].unidadesSueltas += p.unidadesSueltas || 0;
}
const datosCategoria = Object.values(porCat)
  .map(c => ({ ...c, porcentaje: totales.subtotal ? (c.monto / totales.subtotal) * 100 : 0 }))
  .sort((a, b) => b.monto - a.monto);

const consolidado = {
  subtotal: totales.subtotal,
  totales,
  datosLinea,
  datosCategoria,
  totalGeneral: {
    cajas: productos.reduce((s, p) => s + (p.cajasCompletas || 0), 0),
    unidadesSueltas: productos.reduce((s, p) => s + (p.unidadesSueltas || 0), 0),
    peso: productos.reduce((s, p) => s + ((p.cantidad || 0) * (p.pesoKg || 0)), 0),
  },
};

(async () => {
  const SRC = path.join(__dirname, '../src/utils/htmlExportBuilder.js');
  const TMP = path.join(__dirname, '../src/utils/__html_regen.mjs');
  let code = fs.readFileSync(SRC, 'utf8');
  code = code.replace(/from '\.\.\/constants\/sharedConstants'/g, "from '../constants/sharedConstants.js'");
  fs.writeFileSync(TMP, code);

  const mod = await import('file:///' + TMP.replace(/\\/g, '/'));
  const out = mod.buildCronogramaHTML({
    cliente: 'PRIMAVERA DISTRIBUIDORES S.A.C.',
    ruc: '20560201011',
    numeroPedido: 'CC000103',
    idCliente: '68414',
    sucursal: 'ACUMULADO',
    vendedor: 'MILCA SARAY REYES BALLENA',
    emailVendedor: '178',
    telefonoVendedor: '',
    cuotas: [],
    consolidado,
    productosCalculados: productos,
  });

  const OUT = 'C:/Users/ccusi/Desktop/cronograma_regenerado.html';
  fs.writeFileSync(OUT, out);
  console.log('\nHTML regenerado en:', OUT);
  console.log('Total cajas:', consolidado.totalGeneral.cajas);
  console.log('Total filas:', productos.length);

  fs.unlinkSync(TMP);
  console.log('Temp eliminado.');
})();
