/**
 * Agrega el flag sin_catalogo a los productos del catálogo local
 * usando el reporte principal de la API.
 */
const fs = require('fs');
const path = require('path');

const API_URL = 'https://g360-stock-api.onrender.com/api/v1/stock?fuente=todas&limit=5000';
const API_KEY = 'cipsa2026';
const CATALOG_FILE = path.join(__dirname, '../src/data/catalogo_productos.json');

async function main() {
  console.log('🔄 Obteniendo reporte principal para flags sin_catalogo...');
  const res = await fetch(API_URL, { headers: { 'X-API-Key': API_KEY } });
  const data = await res.json();
  const flagMap = new Map();
  (data.items || []).forEach(i => { if (i.sku) flagMap.set(i.sku, !!i.sin_catalogo); });
  console.log(`   ${flagMap.size} SKUs con flag`);

  const catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));
  let actualizados = 0, marcados = 0, noEncontrados = 0;

  catalog.productos.forEach(p => {
    if (flagMap.has(p.sku)) {
      p.sin_catalogo = flagMap.get(p.sku);
      actualizados++;
      if (p.sin_catalogo) marcados++;
    } else {
      // Enriquecidos vía lookup individual: sin_catalogo=undefined (se asume true si un_bx=1 y sin datos)
      if (p.sin_catalogo === undefined) noEncontrados++;
    }
  });

  fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2));
  console.log(`✅ Actualizados: ${actualizados} | Marcados sin_catalogo: ${marcados}`);
  console.log(`   Sin flag (enriquecidos): ${noEncontrados}`);
}

main();
