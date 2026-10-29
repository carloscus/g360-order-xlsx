/**
 * Normaliza el catálogo local: líneas sin prefijo ("ESCRITURA", "ACCESORIOS"…)
 * se resuelven a la variante canónica con prefijo ("76 - ESCRITURA") y se
 * asegura que `linea_id` esté poblado para todos los productos.
 * Reproducible: node scripts/normalize-catalog.cjs
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../src/data/catalogo_productos.json');
const ID_REGEX = /^([A-Z0-9]+)\s*-\s*/;

const extraerId = (linea) => {
  if (!linea) return null;
  const m = String(linea).match(ID_REGEX);
  return m ? m[1] : null;
};

const main = () => {
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const productos = data.productos || [];
  const idRegex = ID_REGEX;

  // Índice nombre normalizado → variante con prefijo más frecuente
  const conteo = new Map();
  productos.forEach((p) => {
    const id = extraerId(p.linea);
    if (!id) return;
    const nombre = String(p.linea).replace(ID_REGEX, '').trim().toUpperCase();
    if (!nombre) return;
    if (!conteo.has(nombre)) conteo.set(nombre, new Map());
    const variantes = conteo.get(nombre);
    variantes.set(p.linea, (variantes.get(p.linea) || 0) + 1);
  });
  const canonico = new Map();
  conteo.forEach((variantes, nombre) => {
    let mejor = null;
    let mejorCuenta = -1;
    variantes.forEach((cuenta, linea) => {
      if (cuenta > mejorCuenta) { mejorCuenta = cuenta; mejor = linea; }
    });
    canonico.set(nombre, mejor);
  });

  let canonizados = 0;
  let idsCompletados = 0;
  productos.forEach((p) => {
    if (p.linea && !extraerId(p.linea)) {
      const nombre = String(p.linea).trim().toUpperCase();
      const variante = canonico.get(nombre);
      if (variante) { p.linea = variante; canonizados++; }
    }
    if (!p.linea_id) {
      const id = extraerId(p.linea);
      if (id) { p.linea_id = id; idsCompletados++; }
    }
  });

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  console.log(`✅ Canonizados ${canonizados} productos con línea sin prefijo`);
  console.log(`✅ Completados ${idsCompletados} linea_id faltantes`);
  console.log(`📦 Total: ${productos.length}`);
};

main();
