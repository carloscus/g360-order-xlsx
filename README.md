# G360 Order XLSX

> Aplicación web desarrollada en SolidJS para el procesamiento inteligente de cotizaciones ERP/CRM. Forma parte de la familia de microherramientas G360 para apoyo CRM y gestión de datos en escritorio.

[![version](https://img.shields.io/badge/version-5.0.0-blue)](https://github.com/carloscus/g360-order-xlsx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Tabla de Contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Tecnologías](#tecnologías)
- [Instalación](# instalación)
- [Uso](#uso)
- [Estructura](#estructura)
- [Scripts](#scripts)
- [Testing](#testing)
- [Contribución](#contribución)
- [Licencia](#licencia)
- [Familia G360](#familia-g360)

---

## Descripción

**G360 Order XLSX** es una aplicación web desarrollada en **SolidJS** para el procesamiento inteligente de cotizaciones ERP/CRM. Forma parte del ecosistema G360 y proporciona una interfaz intuitiva para gestionar pedidos, distribuir productos, calcular totales, generar reportes en formato XLSX y más. Diseñada como una micro-herramienta de apoyo ERP, facilita el flujo de trabajo en entornos corporativos.

La aplicación incluye funcionalidades avanzadas como validaciones en tiempo real, auditoría de cambios, gestión de catálogos de productos, cálculo de distribuciones proporcionales, y exportación a Excel. Está optimizada para entornos de producción con soporte para temas oscuros/claros y un diseño responsivo.

## Tecnologías

- **Framework**: SolidJS 1.8.0 (librería reactiva para interfaces de usuario)
- **Router**: @solidjs/router 0.16.1
- **Build Tool**: Vite 5.0.0
- **Lenguajes**: TypeScript 5.4.0 + JavaScript (ESModules)
- **Testing**: Vitest 1.2.0
- **Styling**: CSS puro con variables CSS para temas
- **Exportación**: XLSX 0.18.5 para generación de archivos Excel
- **Plugins**: Vite Plugin Solid 2.10.0

## Características Principales

### Gestión de Pedidos
- Creación y edición de pedidos con productos dinámicos
- Validaciones en tiempo real de datos
- Cálculo automático de subtotales, IGV, y totales
- Persistencia automática en localStorage

### Tabla de Productos
- Interfaz tabular para gestión de productos
- Agregar, editar y eliminar productos
- Cálculos automáticos de precios y cantidades
- Footer con totales resumidos

### Auditoría y Validaciones
- Sistema de auditoría para rastrear cambios
- Alertas y notificaciones de errores

### Exportaciones
- **XLSX**: Generación de archivos Excel con logo corporativo
- **DOCX**: Cartas corporativas en Word con formato A4, logo y márgenes profesionales
- **HTML**: Descarga de cronograma en HTML con tema oscuro/claro seleccionable
- **Impresión A4**: Botón de impresión directa desde la página de distribución con tema claro forzado via `@media print`

### Distribución y Programación de Letras
- Programación de letras (promissory notes) con calendario interactivo
- Selección de fechas de vencimiento por día
- Rango máximo de 12 meses consecutivos con indicador visual
- Cálculo automático de montos equitativos por letra
- Balance en tiempo real (asignado vs saldo)
- KPIs de valor neto, unidades por caja, masa logística y total a financiar

### UI/UX Avanzada
- Tema oscuro/claro automático con persistencia en localStorage
- Sidebar navegable con acceso rápido a exportación
- Componentes modales para detalles y gráficos
- Diseño responsivo para móviles y desktop
- Branding G360 integrado

### Integraciones
- Submódulo `g360-signature` para branding consistente
- Soporte para catálogos externos vía hooks
- Integración con servicios ERP

## Instalación

### Prerrequisitos
- Node.js 18+ y npm
- Git

### Pasos de Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/carloscus/g360-order-xlsx.git
   cd g360-order-xlsx
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar submódulos** (opcional, para branding):
   ```bash
   git submodule update --init --recursive
   ```

4. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

## Uso

### Navegación
- **/**: Página principal con gestión del pedido (carga RPE, catálogo, edición de productos)
- **/distribucion**: Página de programación de letras con calendario, KPIs, tablas y exportaciones

### Flujo Básico
1. Cargar datos del RPE o ingresar manualmente en la página principal
2. Revisar y editar productos, precios y descuentos
3. Navegar a **Distribución** para programar letras (fechas de vencimiento y montos)
4. Exportar a XLSX, Word, HTML o imprimir en A4

### Temas
La aplicación detecta automáticamente el tema del sistema (oscuro/claro). También se puede forzar desde el contexto de tema.

## Desarrollo

### Estructura del Proyecto
```
src/
├── components/          # Componentes UI reutilizables
│   ├── Header/         # Navbar y navegación
│   ├── Footer/         # Footer con firma G360
│   ├── ProductTable/   # Tabla de productos
│   ├── TotalsPanel/    # Paneles de totales
│   ├── PaymentSplit/   # Calendario de programación de letras
│   ├── Sidebar/        # Sidebar con exportación y navegación
│   └── DistributionPage.jsx  # Página de distribución y letras
├── hooks/              # Hooks personalizados (usePedido, useCatalogo)
├── constants/          # Constantes y configuraciones compartidas (storage.js, sharedConstants.js)
├── utils/              # Utilidades (xlsxGenerator, docxGenerator, htmlExportBuilder, etc.)
├── context/            # Contextos (ThemeContext.jsx)
├── pages/              # Páginas principales (HomePage)
├── services/           # Servicios (erpParser)
├── core/               # Lógica central (G360_ENGINE y skills)
└── styles/             # CSS global con variables de tema
```

### Scripts Disponibles
- `npm run dev`: Servidor de desarrollo con hot reload
- `npm run build`: Construir para producción
- `npm run preview`: Vista previa de la build
- `npm run test`: Ejecutar tests con Vitest

### Desarrollo con TypeScript
El proyecto usa TypeScript para tipado fuerte. Los archivos principales están en `.ts/.tsx`, con algunos legacy en `.js/.jsx`.

### Agregar Nuevas Características
1. Crear componentes en `src/components/`
2. Usar hooks para lógica de estado
3. Agregar rutas en `src/index.jsx` si es necesario
4. Mantener consistencia con el estilo existente

## Construcción y Despliegue

### Build de Producción
```bash
npm run build
```
Los archivos se generan en `dist/`.

### Despliegue
La aplicación es estática y puede desplegarse en cualquier servidor web (Vercel, Netlify, Apache, etc.).

### PWA
Incluye `manifest.json` para instalación como PWA.

## Testing

Ejecutar tests:
```bash
npm run test
```

Los tests usan Vitest y están configurados en `vitest.config.js`.

## Contribución

1. Fork el repositorio
2. Crear una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit tus cambios: `git commit -m 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abrir un Pull Request

### Guías de Código
- Usar SolidJS patterns (signals, effects, etc.)
- Mantener tipado fuerte con TypeScript
- Seguir convenciones de nomenclatura existentes
- Agregar tests para nuevas funcionalidades

## Licencia

Este proyecto es parte del ecosistema G360 y está sujeto a las políticas internas de la organización.

## Soporte

Para soporte técnico o preguntas, contactar al equipo de desarrollo de G360.

---

## Familia G360

Este proyecto forma parte de la familia de microherramientas **G360** para apoyo CRM y gestión de datos en escritorio, enfocadas en áreas como ventas, finanzas y logística.

### Herramientas Relacionadas

- **[g360-cli](https://github.com/carloscus/g360-cli)**: Bootstrap de proyectos G360
- **[g360-signature](https://github.com/carloscus/g360-signature)**: Web component de branding G360
- **[g360-order-form](https://github.com/carloscus/g360-order-form)**: Sistema de gestión de pedidos con interfaz móvil

---
**Marca**: G360
**Isotipo**: 3 puntos verticales paralelos (gris-verde-gris) + chevron `>`
**Autor**: Carlos Cusi
**Desarrollo**: Con asistencia de herramientas de código IA (Vibe Code)
**Powered by**: [g360-signature](https://github.com/carloscus/g360-signature)</content>
<parameter name="filePath">README.md