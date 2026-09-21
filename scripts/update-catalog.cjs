/**
 * Script para actualizar el catálogo local desde la API de g360-stock-api
 * Ejecutar: node scripts/update-catalog.cjs
 */

const fs = require('fs');
const path = require('path');

const API_URL = 'https://g360-stock-api.onrender.com/api/v1/stock?fuente=todas&limit=5000';
const API_KEY = 'cipsa2026';
const OUTPUT_FILE = path.join(__dirname, '../src/data/catalogo_productos.json');

async function fetchCatalog() {
  console.log('🔄 Obteniendo catálogo desde API...');
  
  try {
    const response = await fetch(API_URL, {
      headers: { 'X-API-Key': API_KEY }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const items = data.items || [];
    
    console.log(`✅ Obtenidos ${items.length} productos`);
    console.log(`📊 Metadata:`, JSON.stringify(data.metadata, null, 2));

    // Mapear a formato del catálogo local
    const productos = items.map(item => ({
      sku: item.sku,
      codigo: item.sku,
      descripcion: item.descripcion,
      um: item.um,
      linea: item.linea,
      grupo: item.grupo,
      tipo: item.tipo,
      familia: item.familia,
      categoria: item.categoria,
      estado_linea: item.estado_linea,
      un_bx: item.un_bx || 1,
      peso_kg: item.peso_kg || 0,
      precio: item.precio || 0,
      nombre_corto: item.nombre_corto,
      ean13: item.ean13,
      ean14: item.ean14,
      keywords: item.keywords || [],
      almacenes: item.almacenes || []
    }));

    return {
      version: new Date().toISOString().split('T')[0],
      fuente: 'g360-stock-api',
      total: productos.length,
      productos
    };

  } catch (error) {
    console.error('❌ Error obteniendo catálogo:', error.message);
    throw error;
  }
}

async function updateCatalog() {
  try {
    const catalog = await fetchCatalog();
    
    // Guardar
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(catalog, null, 2));
    console.log(`✅ Catálogo actualizado: ${OUTPUT_FILE}`);
    console.log(`📦 Total productos: ${catalog.total}`);
    console.log(`📅 Versión: ${catalog.version}`);

    // Estadísticas
    const conUnBx = catalog.productos.filter(p => p.un_bx > 0).length;
    const conPeso = catalog.productos.filter(p => p.peso_kg > 0).length;
    console.log(`\n📊 Estadísticas:`);
    console.log(`   - Con un_bx: ${conUnBx}/${catalog.total}`);
    console.log(`   - Con peso_kg: ${conPeso}/${catalog.total}`);

  } catch (error) {
    console.error('\n❌ Error actualizando catálogo:', error.message);
    process.exit(1);
  }
}

updateCatalog();
