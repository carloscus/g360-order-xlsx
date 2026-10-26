const c = require('../src/data/catalogo_productos.json');
const p = c.productos;
console.log('Total productos:', p.length);

const s = p.find(x => x.sku === '78456');
console.log('\n=== SKU 78456 ===');
Object.keys(s).forEach(k => {
  console.log('  ' + k.padEnd(18) + ': ' + JSON.stringify(s[k]).slice(0, 60));
});

// Contar productos con flags enriquecidos
const descont = p.filter(x => x.descontinuado === true).length;
const noCotizable = p.filter(x => x.cotizable === false).length;
const noVigente = p.filter(x => x.vigente === false).length;
const porActivar = p.filter(x => x.por_activar === true).length;
const fueraGuia = p.filter(x => x.en_guia === false).length;
const conCompromiso = p.filter(x => x.compromiso === true).length;

console.log('\n=== Distribución de flags enriquecidos ===');
console.log('  descontinuado:  ' + descont);
console.log('  no cotizable:   ' + noCotizable);
console.log('  no vigente:     ' + noVigente);
console.log('  por activar:    ' + porActivar);
console.log('  fuera de guía:  ' + fueraGuia);
console.log('  con compromiso: ' + conCompromiso);

// Verificar que los campos existen
const sample = p[0];
const camposNuevos = ['descontinuado', 'categoria_venta', 'en_guia', 'compromiso', 'cotizable', 'por_activar', 'vigente', 'origen', 'revision', 'derivado_de'];
console.log('\n=== Campos nuevos presentes ===');
camposNuevos.forEach(campo => {
  console.log('  ' + campo.padEnd(18) + ': ' + (campo in sample ? 'SI' : 'NO'));
});
