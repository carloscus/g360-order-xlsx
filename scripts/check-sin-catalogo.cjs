const API_KEY = 'cipsa2026';
const API_BASE = 'https://g360-stock-api.onrender.com';

const skus = ['79050','79086','79118','79149','79150','79151','79152','79014','79042','79044','79076','79080','79101','79102','79160','79162','79163','79165','79166','79167','79168','79169','79025','79057','79077','79159','79161'];

async function main() {
  console.log('SKU    | sin_cat | un_bx | um');
  console.log('-------|---------|-------|----');
  for (const sku of skus) {
    const res = await fetch(`${API_BASE}/api/v1/stock/${sku}`, { headers: { 'X-API-Key': API_KEY } });
    if (res.ok) {
      const d = await res.json();
      const flag = d.sin_catalogo ? 'SI' : 'no';
      console.log(`${sku} | ${flag.padEnd(7)} | ${String(d.un_bx).padStart(5)} | ${d.um}`);
    }
    await new Promise(r => setTimeout(r, 150));
  }
}
main();
