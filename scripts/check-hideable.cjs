const fs = require('fs');
const files = [
  'src/components/ProductTable/ProductTable.jsx',
  'src/components/ProductTable/columns.js',
  'src/components/ProductTable/ProductRow.jsx',
  'src/components/ProductTable/TableHeader.jsx',
];

let count = 0;
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  c.split('\n').forEach((l, i) => {
    if (/hideable/.test(l)) {
      count++;
      console.log(f.replace('src/components/ProductTable/', '') + ':' + (i + 1) + ': ' + l.trim());
    }
  });
});
console.log('total refs hideable: ' + count);
