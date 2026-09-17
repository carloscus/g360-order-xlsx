const pptxgen = require('pptxgenjs');

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'G360 by ccusi';
pres.title = 'CIPSA OrderX - Guía de Uso';

// Colores G360 Teal
const COLORS = {
  primary: '0F172A',
  accent: '00796B',
  accentLight: 'E0F2F1',
  text: '1E293B',
  muted: '64748B',
  white: 'FFFFFF',
  success: '10B981',
  warning: 'F59E0B',
  error: 'EF4444'
};

// Slide 1: Portada
let slide1 = pres.addSlide();
slide1.background = { color: COLORS.primary };
slide1.addText('CIPSA OrderX', {
  x: 0.5, y: 1.5, w: 9, h: 1.5,
  fontSize: 44, fontFace: 'Arial', color: COLORS.white, bold: true
});
slide1.addText('Guía de Uso - Sistema de Cotizaciones', {
  x: 0.5, y: 3, w: 9, h: 0.8,
  fontSize: 20, fontFace: 'Arial', color: COLORS.accent
});
slide1.addText('v6.0.0 | G360 by ccusi', {
  x: 0.5, y: 4.5, w: 9, h: 0.5,
  fontSize: 14, fontFace: 'Arial', color: COLORS.muted
});

// Slide 2: Flujo Principal
let slide2 = pres.addSlide();
slide2.addText('Flujo Principal', { x: 0.5, y: 0.3, w: 9, h: 0.8, fontSize: 28, fontFace: 'Arial', color: COLORS.accent, bold: true });

const steps = [
  { num: '1', title: 'Buscar Cliente', desc: 'Escribir RUC o código\nAutocomplete desde Supabase' },
  { num: '2', title: 'Cargar ERP', desc: 'Pegar texto del ERP (Ctrl+V)\nFormato 28 columnas' },
  { num: '3', title: 'Completar Pedido', desc: 'N° Pedido, Correo Vendedor\nSucursal (opcional)' },
  { num: '4', title: 'Exportar', desc: 'XLSX / DOCX / HTML\nSegún la página' }
];

steps.forEach((step, i) => {
  const x = 0.5 + (i * 2.3);
  slide2.addShape(pres.ShapeType.roundRect, {
    x: x, y: 1.5, w: 2, h: 2.5,
    fill: { color: COLORS.white },
    shadow: { type: 'outer', blur: 6, offset: 3, color: '000000', opacity: 0.2 }
  });
  slide2.addText(step.num, {
    x: x + 0.7, y: 1.7, w: 0.6, h: 0.6,
    fontSize: 24, fontFace: 'Arial', color: COLORS.white, bold: true,
    align: 'center', valign: 'middle',
    fill: { color: COLORS.accent }
  });
  slide2.addText(step.title, {
    x: x + 0.1, y: 2.5, w: 1.8, h: 0.5,
    fontSize: 14, fontFace: 'Arial', color: COLORS.text, bold: true, align: 'center'
  });
  slide2.addText(step.desc, {
    x: x + 0.1, y: 3, w: 1.8, h: 0.8,
    fontSize: 11, fontFace: 'Arial', color: COLORS.muted, align: 'center'
  });
});

// Slide 3: Búsqueda de Clientes
let slide3 = pres.addSlide();
slide3.addText('Búsqueda de Clientes', { x: 0.5, y: 0.3, w: 9, h: 0.8, fontSize: 28, fontFace: 'Arial', color: COLORS.accent, bold: true });

slide3.addText([
  { text: 'Autocomplete Supabase\n', options: { fontSize: 16, bold: true, color: COLORS.text } },
  { text: '\n', options: { fontSize: 8 } },
  { text: '• Escribir RUC (11 dígitos) o código del cliente\n', options: { fontSize: 13, color: COLORS.muted } },
  { text: '• Sistema busca en tabla "ventas" de Supabase\n', options: { fontSize: 13, color: COLORS.muted } },
  { text: '• Prioriza coincidencia exacta en código\n', options: { fontSize: 13, color: COLORS.muted } },
  { text: '• Auto-completa: Cliente, RUC, Código, Vendedor\n', options: { fontSize: 13, color: COLORS.muted } },
  { text: '\n', options: { fontSize: 8 } },
  { text: 'Campos auto-completados:', options: { fontSize: 14, bold: true, color: COLORS.accent } },
  { text: '\n', options: { fontSize: 6 } },
  { text: '  CLIENTE | RUC | CÓDIGO CLIENTE | CÓDIGO VENDEDOR | VENDEDOR', options: { fontSize: 12, color: COLORS.text, bold: true } }
], { x: 0.5, y: 1.3, w: 9, h: 4 });

// Slide 4: Exportaciones
let slide4 = pres.addSlide();
slide4.addText('Exportaciones', { x: 0.5, y: 0.3, w: 9, h: 0.8, fontSize: 28, fontFace: 'Arial', color: COLORS.accent, bold: true });

const exportItems = [
  { icon: '📊', name: 'XLSX', desc: 'Excel con fórmulas\nKPIs prominentes\nLogo CIPSA', page: 'Home' },
  { icon: '📝', name: 'DOCX', desc: 'Carta corporativa\nCondiciones comerciales\nFirma vendedor', page: 'Home' },
  { icon: '📄', name: 'HTML', desc: 'Reporte distribución\nGráfico mariposa\nDark/Light theme', page: 'Distribución' }
];

exportItems.forEach((exp, i) => {
  const x = 0.5 + (i * 3.1);
  slide4.addShape(pres.ShapeType.roundRect, {
    x: x, y: 1.5, w: 2.8, h: 3,
    fill: { color: COLORS.white },
    shadow: { type: 'outer', blur: 6, offset: 3, color: '000000', opacity: 0.2 }
  });
  slide4.addText(exp.icon, {
    x: x + 1, y: 1.7, w: 0.8, h: 0.8,
    fontSize: 32, align: 'center'
  });
  slide4.addText(exp.name, {
    x: x + 0.2, y: 2.5, w: 2.4, h: 0.5,
    fontSize: 18, fontFace: 'Arial', color: COLORS.accent, bold: true, align: 'center'
  });
  slide4.addText(exp.desc, {
    x: x + 0.2, y: 3, w: 2.4, h: 1,
    fontSize: 11, fontFace: 'Arial', color: COLORS.muted, align: 'center'
  });
  slide4.addText(`Página: ${exp.page}`, {
    x: x + 0.2, y: 4, w: 2.4, h: 0.4,
    fontSize: 10, fontFace: 'Arial', color: COLORS.accent, align: 'center', italic: true
  });
});

// Slide 5: Sidebar
let slide5 = pres.addSlide();
slide5.addText('Sidebar Expandible', { x: 0.5, y: 0.3, w: 9, h: 0.8, fontSize: 28, fontFace: 'Arial', color: COLORS.accent, bold: true });

slide5.addText([
  { text: 'Navegación por secciones:\n', options: { fontSize: 16, bold: true, color: COLORS.text } },
  { text: '\n', options: { fontSize: 6 } },
  { text: '📦 NAVEGACIÓN\n', options: { fontSize: 13, bold: true, color: COLORS.accent } },
  { text: '   • Pedidos — Página principal\n', options: { fontSize: 12, color: COLORS.muted } },
  { text: '   • Distribución — Programación de letras\n', options: { fontSize: 12, color: COLORS.muted } },
  { text: '\n', options: { fontSize: 6 } },
  { text: '⚡ ACCIONES\n', options: { fontSize: 13, bold: true, color: COLORS.accent } },
  { text: '   • Análisis — Gráficos de disponibilidad\n', options: { fontSize: 12, color: COLORS.muted } },
  { text: '   • Stock — Alertas de inventario\n', options: { fontSize: 12, color: COLORS.muted } },
  { text: '\n', options: { fontSize: 6 } },
  { text: '📥 EXPORTAR (context-aware)\n', options: { fontSize: 13, bold: true, color: COLORS.accent } },
  { text: '   • Home: XLSX + DOCX\n', options: { fontSize: 12, color: COLORS.muted } },
  { text: '   • Distribución: HTML\n', options: { fontSize: 12, color: COLORS.muted } }
], { x: 0.5, y: 1.3, w: 9, h: 4.2 });

// Slide 6: Atajos de Teclado
let slide6 = pres.addSlide();
slide6.addText('Atajos de Teclado', { x: 0.5, y: 0.3, w: 9, h: 0.8, fontSize: 28, fontFace: 'Arial', color: COLORS.accent, bold: true });

const shortcuts = [
  { key: 'Ctrl+V', action: 'Pegar datos del ERP' },
  { key: 'Alt+3', action: 'Abrir análisis gráfico' },
  { key: 'Alt+4', action: 'Ir a distribución' },
  { key: 'Alt+5', action: 'Ver alertas de stock' },
  { key: 'Alt+G', action: 'Guardar HTML' },
  { key: 'Alt+L', action: 'Abrir bóveda HTML' },
  { key: 'Alt+N', action: 'Limpiar pedido' }
];

shortcuts.forEach((s, i) => {
  const y = 1.3 + (i * 0.55);
  slide6.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: y, w: 9, h: 0.45,
    fill: { color: i % 2 === 0 ? COLORS.accentLight : COLORS.white }
  });
  slide6.addText(s.key, {
    x: 0.7, y: y, w: 2, h: 0.45,
    fontSize: 13, fontFace: 'Consolas', color: COLORS.accent, bold: true, valign: 'middle'
  });
  slide6.addText(s.action, {
    x: 3, y: y, w: 6, h: 0.45,
    fontSize: 13, fontFace: 'Arial', color: COLORS.text, valign: 'middle'
  });
});

// Slide 7: Soporte
let slide7 = pres.addSlide();
slide7.background = { color: COLORS.primary };
slide7.addText('¿Necesitas ayuda?', {
  x: 0.5, y: 1.5, w: 9, h: 1,
  fontSize: 32, fontFace: 'Arial', color: COLORS.white, bold: true, align: 'center'
});
slide7.addText('G360 by ccusi', {
  x: 0.5, y: 3, w: 9, h: 0.6,
  fontSize: 18, fontFace: 'Arial', color: COLORS.accent, align: 'center'
});
slide7.addText('CIPSA OrderX v6.0.0', {
  x: 0.5, y: 4, w: 9, h: 0.5,
  fontSize: 14, fontFace: 'Arial', color: COLORS.muted, align: 'center'
});

// Guardar
pres.writeFile({ fileName: 'docs/CIPSA_OrderX_Guia_Uso.pptx' })
  .then(() => console.log('✅ Presentación creada: docs/CIPSA_OrderX_Guia_Uso.pptx'))
  .catch(err => console.error('Error:', err));
