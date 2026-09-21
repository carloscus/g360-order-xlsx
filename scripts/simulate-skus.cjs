/**
 * Simulación del flujo ERP → catálogo → cajas
 * Verifica qué SKUs no encuentran un_bx
 */

const fs = require('fs');
const path = require('path');

const API_KEY = 'cipsa2026';
const API_BASE = 'https://g360-stock-api.onrender.com';

// Catálogo local
const catalogData = require('../src/data/catalogo_productos.json');
const localProducts = catalogData.productos || catalogData;
const localMap = new Map();
localProducts.forEach(p => {
  const sku = p.codigo || p.sku;
  if (sku) localMap.set(sku, { unBx: p.un_bx || 0, linea: p.linea, categoria: p.categoria });
});

console.log('📦 Catálogo local:', localMap.size, 'productos\n');

// SKUs de prueba (los que aparecen en logs)
const skusTest = [
  '016791', '78456', '76251', '76253', '76254', '76255',
  '76279', '76280', '76281', '76282', '76292', '76293', '76294',
  '76300', '76301', '76302', '76304', '77270', '77271', '77272',
  '78504', '78536', '78537', '78538', '78539', '78540',
  '79165', '79166', '79167', '79168', '79169'
];

async function checkSku(sku) {
  const local = localMap.get(sku);
  if (local) {
    return { sku, source: 'local', unBx: local.unBx, linea: local.linea };
  }
  // Lookup individual
  try {
    const res = await fetch(`${API_BASE}/api/v1/stock/${sku}`, {
      headers: { 'X-API-Key': API_KEY }
    });
    if (res.ok) {
      const data = await res.json();
      return { sku, source: 'api-individual', unBx: data.un_bx || 0, linea: data.linea };
    }
    return { sku, source: 'not-found', unBx: 0, status: res.status };
  } catch (e) {
    return { sku, source: 'error', unBx: 0, error: e.message };
  }
}

async function main() {
  console.log('🔍 Verificando SKUs...\n');
  const results = [];
  
  for (const sku of skusTest) {
    const result = await checkSku(sku);
    results.push(result);
    const icon = result.unBx > 0 ? '✓' : '✗';
    console.log(`${icon} ${sku.padEnd(8)} | ${result.source.padEnd(15)} | un_bx: ${String(result.unBx).padEnd(6)} | ${result.linea || result.status || result.error || ''}`);
    await new Promise(r => setTimeout(r, 200));
  }

  const sinUnBx = results.filter(r => r.unBx === 0);
  console.log(`\n📊 Resumen:`);
  console.log(`   Total verificados: ${results.length}`);
  console.log(`   Con un_bx: ${results.length - sinUnBx.length}`);
  console.log(`   Sin un_bx: ${sinUnBx.length}`);
  
  if (sinUnBx.length) {
    console.log(`\n❌ SKUs sin un_bx:`);
    sinUnBx.forEach(r => console.log(`   - ${r.sku} (${r.source})`));
  }
}

main();
