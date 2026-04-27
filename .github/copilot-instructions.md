# Project Guidelines

## Code Style
- Use Solid.js signals and memos instead of React hooks: `const [state, setState] = createSignal(initial)` and `createMemo(() => computedValue)`
- PascalCase for components (.jsx files), camelCase for utilities
- Export both named and default: `export const Component = () => {}; export default Component`
- Peruvian locale formatting (S/ currency, es-PE numbers) via formatters.js

## Architecture
- Solid.js SPA for converting RPE data to XLSX/DOC documents with advanced analytics
- State managed in App.jsx with reactive signals, persisted to localStorage
- Data flow: Parse RPE text → Enrich with catalog → Calculate totals & KPIs → Generate XLSX/DOC
- Key components: ProductTable (13-column, VBA-compatible headers), TotalsPanel, modals for analytics/distribution/payment
- Parsing: RPE text parsing with exact column mapping (cantidad|sku|descripcion|stock|unidad|precio|dscto1|dscto2) matching VBA implementation
- Output: XLSX with dashboard/analysis sheets including KPIs by line, Word documents with professional formatting

## Build and Test
- Install: `npm install`
- Dev server: `npm run dev` (Vite on port 5174)
- Build: `npm run build`
- Preview: `npm run preview`
- No tests currently implemented

## Conventions
- XLSX formulas use SUMPRODUCT for aggregations (fixed in v4.4 from VBA legacy)
- Stock status color-coding: Red (Agotado), Yellow (AJ), Default (OK)
- Catalog loaded from public/catalogo_productos.json with enrichment (precio_lista, margen, peso, etc.)
- Modal positions tracked separately (modal1Pos, modal2Pos removed)
- Pagination: 75 items per page in product table
- Product ordering: Sorted by line, then SKU
- KPIs calculated: totals by line, margins, availability percentages, weight estimates, box calculations

## G360 Ecosystem Standards
- **Skill**: Uses `client` skill (desktop variant) for client projects with CIPSA branding
- **Component Naming**: Follow GLOSARIO_COMPONENTES.md - PascalCase for components, kebab-case for CSS classes
- **Standard Components**: Use G360Signature for branding, follow naming conventions for DataCard, StatsCard, etc.
- **Snippets**: Use `g360order` for order-specific patterns, `g360marca` for client branding
- **Layout**: Asymmetrical design with sidebar, glassmorphism effects, G360 glow (#00d084)

## Legacy Context
- Successor to VBA macros in reference/samples/ (GenerarXLSXPedido_v4.4.bas, etc.)
- Maintains same 12-column table structure and dashboard panels
- Enhanced with web UI: charts, calendars, interactive analytics vs manual Excel inspection
- Evolution: Added advanced KPIs, catalog enrichment, improved parsing, extended table columns