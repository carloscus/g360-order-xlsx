const fs = require('fs');
const c = fs.readFileSync('src/utils/htmlExportBuilder.js', 'utf8');

const checks = [
  ['CSS .col-linea (pantalla)', /colgroup \.col-linea \{ width/],
  ['CSS .col-linea (print)', /colgroup \.col-linea \{ width:7% !important/],
  ['CSS .td-linea (celda)', /\.td-linea \{/],
  ['CSS .cat-badge-more', /\.cat-badge-more/],
  ['tfoot colspan=9', /colspan="9" class="tf-label"/],
  ['Badges limitados (catVisibles)', /catVisibles/],
  ['Badge title (tooltip)', /catTitle/],
];

checks.forEach(([name, re]) => {
  console.log(name.padEnd(32) + (re.test(c) ? 'OK' : 'FALTA'));
});

// Verificar cuántos th hay en el header (deberían ser 15)
const thead = c.match(/<thead>[\s\S]*?<\/thead>/);
if (thead) {
  const ths = [...thead[0].matchAll(/<th[^>]*>/g)].length;
  console.log('\nheaders th: ' + ths + (ths === 15 ? ' OK' : ' REVISAR (esperaba 15)'));
}

// Verificar tfoot colspan actual
const tfootMatch = c.match(/colspan="(\d+)" class="tf-label"/);
if (tfootMatch) console.log('tfoot colspan: ' + tfootMatch[1]);
