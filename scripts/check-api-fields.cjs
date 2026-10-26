const API_KEY = 'cipsa2026';
const API_BASE = 'https://g360-stock-api.onrender.com';

async function check(sku) {
  const res = await fetch(`${API_BASE}/api/v1/stock/${sku}`, { headers: { 'X-API-Key': API_KEY } });
  if (!res.ok) { console.log('HTTP ' + res.status); return; }
  const d = await res.json();
  console.log('=== SKU ' + sku + ' ===');
  console.log('Campos disponibles:');
  Object.keys(d).forEach(k => {
    const v = d[k];
    const type = Array.isArray(v) ? 'array(' + v.length + ')' : typeof v;
    const preview = Array.isArray(v) ? JSON.stringify(v).slice(0, 60) : String(v).slice(0, 40);
    console.log('  ' + k.padEnd(20) + ' [' + type + ']: ' + preview);
  });
  return d;
}

(async () => {
  await check('79050');
  console.log('\n');
  await check('78456');
})();
