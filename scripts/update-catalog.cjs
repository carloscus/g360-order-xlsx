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

    // Descarga vacía = API frío/fallido: abortar para no "preservar" todo el
    // catálogo viejo vía merge y creer que se actualizó.
    if (items.length === 0) {
      throw new Error('La API devolvió 0 items (posible cold start). Reintentar cuando el servicio responda.');
    }

    console.log(`✅ Obtenidos ${items.length} productos`);
    console.log(`📊 Metadata:`, JSON.stringify(data.metadata, null, 2));

    // Mapear a formato del catálogo local
    const productos = items.map(item => ({
      sku: item.sku,
      codigo: item.sku,
      descripcion: item.descripcion,
      um: item.um,
      linea: item.linea,
      linea_id: item.linea_id || '',
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
      sin_catalogo: !!item.sin_catalogo,
      keywords: item.keywords || [],
      // Campos enriquecidos del API v2 (para auditoría)
      descontinuado: !!item.descontinuado,
      categoria_venta: item.categoria_venta || '',
      en_guia: item.en_guia !== undefined ? !!item.en_guia : null,
      compromiso: item.compromiso !== undefined ? !!item.compromiso : null,
      cotizable: item.cotizable !== undefined ? !!item.cotizable : null,
      por_activar: !!item.por_activar,
      vigente: item.vigente !== undefined ? !!item.vigente : null,
      origen: item.origen || '',
      revision: item.revision || '',
      derivado_de: item.derivado_de || '',
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

    // MERGE: preservar SKUs existentes que no estén en la nueva descarga (enriquecidos)
    const existing = fs.existsSync(OUTPUT_FILE)
      ? JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'))
      : { productos: [] };
    const nuevosSkus = new Set(catalog.productos.map(p => p.sku));
    const preservados = (existing.productos || []).filter(p => p.sku && !nuevosSkus.has(p.sku));
    if (preservados.length > 0) {
      catalog.productos.push(...preservados);
      catalog.total = catalog.productos.length;
      console.log(`🔗 Preservados ${preservados.length} SKUs enriquecidos no presentes en la API`);
    }

    // Guardar
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(catalog, null, 2));
    console.log(`✅ Catálogo actualizado: ${OUTPUT_FILE}`);
    console.log(`📦 Total productos: ${catalog.total}`);
    console.log(`📅 Versión: ${catalog.version}`);

    // Estadísticas
    const conUnBx = catalog.productos.filter(p => p.un_bx > 0).length;
    const conPeso = catalog.productos.filter(p => p.peso_kg > 0).length;
    const sinCat = catalog.productos.filter(p => p.sin_catalogo).length;
    console.log(`\n📊 Estadísticas:`);
    console.log(`   - Con un_bx: ${conUnBx}/${catalog.total}`);
    console.log(`   - Con peso_kg: ${conPeso}/${catalog.total}`);
    console.log(`   - sin_catalogo: ${sinCat}/${catalog.total}`);

  } catch (error) {
    console.error('\n❌ Error actualizando catálogo:', error.message);
    process.exit(1);
  }
}

updateCatalog();
