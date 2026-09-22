const fs = require('fs');
const html = fs.readFileSync('C:/Users/ccusi/Desktop/cronograma_regenerado.html', 'utf8');
const strip = (s) => s.replace(/<[^>]*>/g, '');

// Paleta
console.log('=== PALETA (:root) ===');
const root = html.match(/:root\s*\{[\s\S]*?\n\s*\}/);
if (root) {
  const l = root[0].split('\n').filter(x => x.includes('--g360'));
  l.forEach(x => console.log('  ' + x.trim()));
}

console.log('\n=== PALETA (.light) ===');
const light = html.match(/\.light\s*\{[\s\S]*?\n\s*\}/);
if (light) {
  const l = light[0].split('\n').filter(x => x.includes('--g360'));
  l.forEach(x => console.log('  ' + x.trim()));
}

// Colgroup widths
console.log('\n=== COLGROUP WIDTHS ===');
const cg = html.match(/<colgroup>[\s\S]*?<\/colgroup>/);
console.log('colgroup:', cg ? 'PRESENTE' : 'AUSENTE');

// Extraer los estilos colgroup del CSS
const colStyles = [...html.matchAll(/colgroup\s*\.\s*([\w-]+)\s*\{\s*width:\s*([^;]+);/g)];
console.log('estilos colgroup encontrados:', colStyles.length);
let sum = 0;
colStyles.forEach(c => {
  console.log('  ' + c[1].padEnd(12) + ' => ' + c[2].trim());
  const pct = c[2].trim().match(/(\d+)%/);
  if (pct) sum += parseInt(pct[1]);
});
console.log('  SUMA %:', sum, sum === 100 ? 'OK (100%)' : 'REVISAR');

// td-desc clamp
console.log('\n=== DESCRIPCION 2 LINEAS ===');
const tdDesc = html.match(/\.td-desc\s*\{[^}]*\}/);
if (tdDesc) {
  console.log('CSS .td-desc:');
  tdDesc[0].split('\n').forEach(l => {
    if (l.trim()) console.log('  ' + l.trim());
  });
}

// Verificar descripcion truncada (40 chars)
const descCells = [...html.matchAll(/class="td-desc"[^>]*>([^<]*)/g)];
console.log('\nn celdas descripcion:', descCells.length);
const lens = descCells.map(d => d[1].length);
console.log('  long max:', Math.max(...lens), '| long avg:', Math.round(lens.reduce((a,b)=>a+b,0)/lens.length));
console.log('  con elipsis (…):', descCells.filter(d => d[1].includes('…')).length);

console.log('\n=== HEADER SNAPSHOT (gradiente) ===');
const snap = html.match(/\.snapshot-header\s*\{[^}]*\}/);
if (snap) {
  const bg = snap[0].match(/background:\s*([^;]+);/);
  console.log('  background:', bg ? bg[1].trim() : 'NO');
}

console.log('\n=== BADGE NUEVA ===');
const bn = html.match(/\.badge-nueva\s*\{[^}]*\}/);
if (bn) console.log('  ' + bn[0].replace(/\s+/g,' ').trim());
