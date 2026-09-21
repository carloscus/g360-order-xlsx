/**
 * Enriquece el catálogo local con SKUs específicos vía lookup individual
 * Uso: node scripts/enrich-catalog.cjs [archivo-skus.json]
 */

const fs = require('fs');
const path = require('path');

const API_KEY = 'cipsa2026';
const API_BASE = 'https://g360-stock-api.onrender.com';
const CATALOG_FILE = path.join(__dirname, '../src/data/catalogo_productos.json');
const SKUS_FILE = process.argv[2] || path.join(__dirname, '../skus-pedido.json');

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchSku(sku) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/stock/${sku}`, {
      headers: { 'X-API-Key': API_KEY }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.sku) return null;
    return {
      sku: data.sku,
      codigo: data.sku,
      descripcion: data.descripcion,
      um: data.um,
      linea: data.linea,
      grupo: data.grupo,
      tipo: data.tipo,
      familia: data.familia,
      categoria: data.categoria,
      estado_linea: data.estado_linea,
      un_bx: data.un_bx || 1,
      peso_kg: data.peso_kg || 0,
      precio: data.precio || 0,
      nombre_corto: data.nombre_corto,
      ean13: data.ean13,
      ean14: data.ean14,
      keywords: data.keywords || [],
      almacenes: data.almacenes || []
    };
  } catch {
    return null;
  }
}

async function main() {
  console.log('📦 Cargando catálogo local...');
  const catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));
  const productos = catalog.productos || [];
  const existingSkus = new Set(productos.map(p => p.sku));
  console.log(`   ${productos.length} productos, ${existingSkus.size} SKUs únicos`);

  if (!fs.existsSync(SKUS_FILE)) {
    console.error(`❌ No existe ${SKUS_FILE}`);
    process.exit(1);
  }
  const skusToCheck = JSON.parse(fs.readFileSync(SKUS_FILE, 'utf8'));
  const faltantes = skusToCheck.filter(sku => !existingSkus.has(sku));
  console.log(`\n🔍 SKUs a verificar: ${skusToCheck.length}`);
  console.log(`   Ya en catálogo: ${skusToCheck.length - faltantes.length}`);
  console.log(`   Faltantes: ${faltantes.length}`);

  if (faltantes.length === 0) {
    console.log('\n✅ No hay SKUs faltantes');
    return;
  }

  console.log('\n🔄 Fetch individual (3 concurrentes)...');
  const nuevos = [];
  const CONCURRENCY = 3;

  for (let i = 0; i < faltantes.length; i += CONCURRENCY) {
    const batch = faltantes.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(fetchSku));
    results.forEach((r, idx) => {
      const sku = batch[idx];
      if (r) {
        nuevos.push(r);
        console.log(`   ✓ ${sku} un_bx=${r.un_bx} ${r.linea}`);
      } else {
        console.log(`   ✗ ${sku} no disponible`);
      }
    });
    await delay(300);
  }

  if (nuevos.length > 0) {
    productos.push(...nuevos);
    catalog.total = productos.length;
    catalog.version = new Date().toISOString().split('T')[0];
    fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2));
    console.log(`\n✅ Catálogo actualizado: ${nuevos.length} nuevos, total ${productos.length}`);
  } else {
    console.log('\n⚠️ No se agregó ningún SKU nuevo');
  }
}

main();
