const catalog = require('../src/data/catalogo_productos.json');
const map = new Map(catalog.productos.map(p => [p.sku, p]));

// Parsear el HTML del pedido
const fs = require('fs');
const html = fs.readFileSync('C:/Users/ccusi/Desktop/cronograma_20601024714_1212121_20260921.html', 'utf8');

// Extraer filas: <tr>...<td class="td-right"><span...></span> CANT</td>...<td class="td-mono">SKU</td>
const filas = [...html.matchAll(/<tr><td class="td-center">\d+<\/td><td class="td-right"><span[^>]*><\/span>\s*([\d.,]+)<\/td><td class="td-center">[^<]*<\/td><td class="td-mono">([0-9]+)<\/td>/g)];

const productos = [];
for (const f of filas) {
  const cant = parseFloat(f[1].replace(/,/g, '')) || 0;
  const sku = f[2].trim();
  if (sku && cant > 0) productos.push({ sku, cant });
}
console.log('Productos parseados del HTML:', productos.length);

// Agrupar por línea
const porLinea = {};
for (const pr of productos) {
  const info = map.get(pr.sku);
  const linea = info?.linea || 'SIN LINEA';
  const unBx = info?.un_bx || 0;
  const sinCat = info?.sin_catalogo;
  let cajas, completas, sueltas;
  if (sinCat) { cajas = 1; completas = 1; sueltas = 0; }
  else if (unBx > 0) { cajas = Math.ceil(pr.cant / unBx); completas = Math.floor(pr.cant / unBx); sueltas = pr.cant % unBx; }
  else { cajas = 0; completas = 0; sueltas = pr.cant; }
  if (!porLinea[linea]) porLinea[linea] = { cajas: 0, completas: 0, sueltas: 0, n: 0 };
  porLinea[linea].cajas += cajas;
  porLinea[linea].completas += completas;
  porLinea[linea].sueltas += sueltas;
  porLinea[linea].n++;
}

console.log('\nLínea                | N  | Cajas | Completas | Sueltas');
console.log('---------------------|----|-------|-----------|--------');
let tC = 0, tComp = 0, tS = 0;
Object.entries(porLinea).sort((a,b) => b[1].cajas - a[1].cajas).forEach(([l, v]) => {
  console.log(l.padEnd(20).slice(0,20), '|', String(v.n).padStart(2), '|', String(v.cajas).padStart(5), '|', String(v.completas).padStart(9), '|', String(v.sueltas).padStart(6));
  tC += v.cajas; tComp += v.completas; tS += v.sueltas;
});
console.log('---------------------|----|-------|-----------|--------');
console.log('TOTAL                |    |', String(tC).padStart(5), '|', String(tComp).padStart(9), '|', String(tS).padStart(6));
