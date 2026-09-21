const fs = require('fs');
const html = fs.readFileSync('C:/Users/ccusi/Desktop/cronograma_20601024714_1212121_20260921.html', 'utf8');
const matches = [...html.matchAll(/td-mono">([^<]+)<\/td>/g)];
const skus = [...new Set(matches.map(m => m[1].trim()))];
console.log('SKUs extraidos:', skus.length);
fs.writeFileSync('skus-pedido.json', JSON.stringify(skus, null, 2));
console.log('Guardado en skus-pedido.json');
