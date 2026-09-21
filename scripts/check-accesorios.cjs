const catalog = require('../src/data/catalogo_productos.json');
const map = new Map();
catalog.productos.forEach(p => map.set(p.sku, p));

// Productos ACCESORIOS del pedido
const accesorios = [
  { sku: '79050', cant: 288, um: 'BLISTER' },
  { sku: '79086', cant: 144, um: 'UNIDAD' },
  { sku: '79118', cant: 7200, um: 'UNIDAD' },
  { sku: '79149', cant: 432, um: 'BLISTER' },
  { sku: '79150', cant: 144, um: 'BLISTER' },
  { sku: '79151', cant: 288, um: 'BLISTER' },
  { sku: '79152', cant: 524, um: 'BLISTER' },
  { sku: '79014', cant: 1200, um: 'BLISTER' },
  { sku: '79042', cant: 600, um: 'BLISTER' },
  { sku: '79044', cant: 1440, um: 'BLISTER' },
  { sku: '79076', cant: 288, um: 'BLISTER' },
  { sku: '79080', cant: 540, um: 'UNIDAD' },
  { sku: '79101', cant: 1000, um: 'DISPLAY' },
  { sku: '79102', cant: 250, um: 'DISPLAY' },
  { sku: '79160', cant: 120, um: 'DISPLAY' },
  { sku: '79162', cant: 120, um: 'DISPLAY' },
  { sku: '79163', cant: 120, um: 'DISPLAY' },
  { sku: '79165', cant: 2880, um: 'UNIDAD' },
  { sku: '79166', cant: 720, um: 'UNIDAD' },
  { sku: '79167', cant: 720, um: 'BLISTER' },
  { sku: '79168', cant: 1440, um: 'BLISTER' },
  { sku: '79169', cant: 720, um: 'BLISTER' },
  { sku: '79025', cant: 432, um: 'BLISTER' },
  { sku: '79057', cant: 720, um: 'BLISTER' },
  { sku: '79077', cant: 384, um: 'BLISTER' },
  { sku: '79159', cant: 120, um: 'DISPLAY' },
  { sku: '79161', cant: 120, um: 'DISPLAY' },
];

let totalCajas = 0, totalCajasCompletas = 0, totalSueltas = 0;

console.log('ACCESORIOS - Cálculo de cajas:\n');
console.log('SKU    | Cant   | UM      | un_bx | cajas | complet | sueltas');
console.log('-------|--------|---------|-------|-------|---------|--------');

accesorios.forEach(a => {
  const p = map.get(a.sku);
  const unBx = p ? (p.un_bx || 0) : 0;
  const sinCat = p ? p.sin_catalogo : false;
  let cajas, completas, sueltas;
  if (sinCat) {
    // sin_catalogo: un_bx no confiable → 1 caja
    cajas = 1; completas = 1; sueltas = 0;
  } else if (unBx > 0) {
    cajas = Math.ceil(a.cant / unBx);
    completas = Math.floor(a.cant / unBx);
    sueltas = a.cant % unBx;
  } else {
    cajas = 0; completas = 0; sueltas = a.cant;
  }
  totalCajas += cajas;
  totalCajasCompletas += completas;
  totalSueltas += sueltas;
  const src = !p ? ' (NO CAT)' : (sinCat ? ' (sin_catalogo→1)' : '');
  console.log(`${a.sku} | ${String(a.cant).padStart(6)} | ${a.um.padEnd(7)} | ${String(unBx).padStart(5)} | ${String(cajas).padStart(5)} | ${String(completas).padStart(7)} | ${String(sueltas).padStart(6)}${src}`);
});

console.log('-------|--------|---------|-------|-------|---------|--------');
console.log(`TOTAL: cajas(${totalCajas}) completas(${totalCajasCompletas}) sueltas(${totalSueltas})`);
