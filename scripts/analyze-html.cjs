const fs = require('fs');
const path = 'C:/Users/ccusi/Desktop/cronograma_20601024714_CC000103_20260922.html';
const html = fs.readFileSync(path, 'utf8');
const strip = (s) => s.replace(/<[^>]*>/g, '').trim();

console.log('=== COLGROUP ===');
const colgroup = html.match(/<colgroup>[\s\S]*?<\/colgroup>/);
if (colgroup) {
  const cols = [...colgroup[0].matchAll(/<col class="([\w-]+)"/g)].map(m => m[1]);
  console.log('n cols:', cols.length);
  console.log('clases:', cols.join(', '));
} else console.log('AUSENTE');

console.log('\n=== HEADERS ===');
const thead = html.match(/<thead>[\s\S]*?<\/thead>/);
const ths = [...thead[0].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)];
console.log('n headers:', ths.length);
ths.forEach((t, i) => console.log('  ' + (i + 1) + '. [' + strip(t[1]).replace(/\s+/g, ' ') + ']'));

console.log('\n=== TFOOT ===');
const tfoot = html.match(/<tfoot>[\s\S]*?<\/tfoot>/);
const tds = [...tfoot[0].matchAll(/<td([^>]*)>([\s\S]*?)<\/td>/g)];
console.log('n celdas:', tds.length);
let tot = 0;
tds.forEach((t, i) => {
  const m = t[1].match(/colspan="(\d+)"/);
  const s = m ? parseInt(m[1]) : 1;
  tot += s;
  console.log('  ' + (i + 1) + '. colspan=' + s + ' | ' + strip(t[2]).slice(0, 45));
});
console.log('  cols cubiertas:', tot, tot === 13 ? 'OK' : 'MAL');

console.log('\n=== FILAS / STOCK ===');
const rows = [...html.matchAll(/<tr data-stock="(\w+)"/g)];
console.log('filas:', rows.length);
console.log('  ok:', rows.filter(r => r[1] === 'ok').length, '| out:', rows.filter(r => r[1] === 'out').length);

console.log('\n=== DESCRIPCIONES ===');
const desc = [...html.matchAll(/class="td-desc"[^>]*>([^<]*)/g)];
console.log('n descs:', desc.length);
const lens = desc.map(d => d[1].length);
console.log('  long max:', Math.max(...lens));
console.log('  long avg:', Math.round(lens.reduce((a,b)=>a+b,0) / lens.length));
console.log('  >45 chars:', lens.filter(l => l > 45).length);

console.log('\n=== PALETA (:root) ===');
const root = html.match(/:root\s*\{[\s\S]*?\n\s*\}/);
if (root) {
  const lines = root[0].split('\n').filter(l => l.includes('--g360'));
  lines.forEach(l => console.log('  ' + l.trim()));
}

console.log('\n=== PALETA (.light) ===');
const light = html.match(/\.light\s*\{[\s\S]*?\n\s*\}/);
if (light) {
  const lines = light[0].split('\n').filter(l => l.includes('--g360'));
  lines.forEach(l => console.log('  ' + l.trim()));
}

console.log('\n=== ACENTO USADO ===');
const accentUses = [...html.matchAll(/--g360-accent[^;]*;?/g)].length;
console.log('referencias --g360-accent en CSS:', accentUses);
const accentVal = html.match(/--g360-accent:\s*(#[0-9a-fA-F]{3,8})/);
console.log('valor --g360-accent:', accentVal ? accentVal[1] : 'NO ENCONTRADO');

// clase th-total, td-total (verde)
console.log('\n=== USO DE COLOR EN TOTALES ===');
const tdTotal = html.match(/\.td-total\s*\{[^}]*\}/);
if (tdTotal) console.log('  .td-total CSS:', tdTotal[0].replace(/\s+/g,' ').trim());
const tfValue = html.match(/\.tf-value\s*\{[^}]*\}/);
if (tfValue) console.log('  .tf-value CSS:', tfValue[0].replace(/\s+/g,' ').trim());
const thTotal = html.match(/\.th-total\s*\{[^}]*\}/);
if (thTotal) console.log('  .th-total CSS:', thTotal[0].replace(/\s+/g,' ').trim());
