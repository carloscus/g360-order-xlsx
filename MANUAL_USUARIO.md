# Manual de Usuario — G360 Order XLSX

> Sistema de procesamiento inteligente de cotizaciones ERP/CRM  
> **Versión**: 1.1.0 | **Plataforma**: Web (SolidJS) | **Entorno**: Escritorio + Móvil

---

## Índice

1. [Introducción](#1-introducción)
2. [Acceso y requisitos](#2-acceso-y-requisitos)
3. [Estructura general de la interfaz](#3-estructura-general-de-la-interfaz)
4. [Página principal — Pedidos y Cotizaciones](#4-página-principal--pedidos-y-cotizaciones)
   - 4.1 [Datos del Cliente](#41-datos-del-cliente)
   - 4.2 [Datos del Vendedor](#42-datos-del-vendedor)
   - 4.3 [Importar datos del ERP](#43-importar-datos-del-erp)
   - 4.4 [Valorización del pedido](#44-valorización-del-pedido)
   - 4.5 [Tabla de productos (SKU)](#45-tabla-de-productos-sku)
   - 4.6 [Panel de auditoría](#46-panel-de-auditoría)
5. [Sidebar — Acciones rápidas](#5-sidebar--acciones-rápidas)
6. [Página de Distribución](#6-página-de-distribución)
   - 6.1 [Perfil del cliente](#61-perfil-del-cliente)
   - 6.2 [Valorización y stock](#62-valorización-y-stock)
   - 6.3 [Programación de letras (PaymentSplit)](#63-programación-de-letras-paymentsplit)
   - 6.4 [KPIs y gráfico mariposa](#64-kpis-y-gráfico-mariposa)
   - 6.5 [Categorías](#65-categorías)
   - 6.6 [Tabla de partidas](#66-tabla-de-partidas)
   - 6.7 [Exportaciones](#67-exportaciones)
7. [Exportaciones detalladas](#7-exportaciones-detalladas)
   - 7.1 [XLSX (Excel)](#71-xlsx-excel)
   - 7.2 [Word / Carta Corporativa](#72-word--carta-corporativa)
   - 7.3 [HTML (Cronograma descargable)](#73-html-cronograma-descargable)
   - 7.4 [Impresión A4](#74-impresión-a4)
8. [Bóveda HTML](#8-bóveda-html)
9. [FAQ y solución de problemas](#9-faq-y-solución-de-problemas)

---

## 1. Introducción

**G360 Order XLSX** es una herramienta web diseñada para procesar cotizaciones y pedidos provenientes de sistemas ERP. Permite:

- Importar datos de productos desde texto plano (copiado del ERP)
- Enriquecer productos con información de catálogo (línea, categoría, peso, unidades por caja)
- Calcular valorizaciones con descuentos progresivos e IGV (18 %)
- Auditar productos para detectar errores (SKU inválido, stock agotado, etc.)
- Programar letras de pago (cuotas) con calendario interactivo
- Visualizar análisis por línea y categoría (gráfico mariposa)
- Exportar a **Excel (XLSX)** con fórmulas vivas, **Word corporativo**, **HTML descargable** o **impresión A4**

---

## 2. Acceso y requisitos

| Requisito | Detalle |
|-----------|---------|
| Navegador | Chrome 90+, Firefox 90+, Edge 90+, Safari 15+ |
| Conexión | No requiere backend — toda la data se almacena en localStorage |
| Resolución | Mínimo 1024×768 (diseño responsivo) |
| Instalación | Sin instalación. Abrir la URL y usar. También instalable como PWA. |

---

## 3. Estructura general de la interfaz

```
┌─────────────────────────────────────────────────────┐
│  Navbar — Título de la aplicación                   │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │  Contenido principal                     │
│ Acciones │  (ruteado: Home o Distribución)          │
│ rápidas  │                                          │
│          │                                          │
├──────────┴──────────────────────────────────────────┤
│  Footer — Firma G360 (web component)                │
└─────────────────────────────────────────────────────┘
```

- **Navbar**: Muestra el título del sistema y botones contextuales.
- **Sidebar**: Barra lateral izquierda con botones de acción rápida (análisis, distribución, stock, guardar/cargar HTML, limpiar pedido, exportar XLSX/DOCX, alternar tema).
- **Footer**: Firma corporativa G360 con isotipo (tres puntos + chevron).

---

## 4. Página principal — Pedidos y Cotizaciones

Ruta: `/` (Home)

### 4.1 Datos del Cliente

Formulario dividido en dos secciones:

**DATOS DEL CLIENTE**

| Campo | Descripción | Obligatorio |
|-------|-------------|:-----------:|
| Cliente / Razón Social | Nombre o razón social del cliente | Sí |
| Documento (RUC/DNI) | N° de RUC (11 dígitos) o DNI (8 dígitos). Muestra badge RUC/DNI automático | Sí |
| N° Pedido RPE | Número de pedido del sistema ERP | Sí |
| ID Cliente | Identificador interno opcional del cliente | No |
| Sucursal | Nombre de la sucursal — valor por defecto: `PRINCIPAL` | No |

**DATOS DEL VENDEDOR**

| Campo | Descripción | Obligatorio |
|-------|-------------|:-----------:|
| Asesor / Representante Comercial | Nombre del vendedor | Sí |
| Correo Vendedor | Email corporativo del vendedor | Sí |
| Contacto Vendedor | Teléfono directo del vendedor | Sí |

> Todos los datos se guardan automáticamente en localStorage al escribir.

### 4.2 Importar datos del ERP

1. Copiar los datos desde el sistema ERP (VES o similar) en formato tabulado (TSV).
2. Pegar (`Ctrl+V`) en el área de texto **"Pegue aquí los datos del pedido"**.
3. El sistema parsea automáticamente los productos, enriquece con el catálogo local y los muestra en la tabla.

El área de texto se expande automáticamente al pegar datos. Soporta dos formatos:
- **Formato A**: TSV con SKU en columna 2.
- **Formato B**: Tabla con SKU en columna 1.

> **Tip**: Si ya hay un pedido en curso, el sistema preguntará si deseas crear uno nuevo o descartar los cambios.

### 4.3 Filtro de Stock

Checkbox **"Filtrar por Disponibilidad"**: al activarlo, solo se muestran productos con estado `OK` o `AJ` (Ajustado), ocultando los `Agotado`.

### 4.4 Valorización del pedido

Se muestran tres tarjetas una vez hay productos cargados:

| Tarjeta | Fórmula |
|---------|---------|
| **Subtotal** | Suma de `Total Neto` de todas las filas |
| **Total + IGV (18 %)** | `Subtotal × 1.18` |
| **Total Disponible** | Suma de `Total Venta` solo de productos con stock OK |

### 4.5 Tabla de productos (SKU)

La tabla tiene **11 columnas**:

| # | Columna | Descripción | Cálculo |
|---|---------|-------------|---------|
| 1 | **N°** | Número correlativo | `p.id` |
| 2 | **SKU** | Código del producto | `p.codigo` |
| 3 | **Descripción** | Nombre del producto | `p.descripcion` |
| 4 | **Cant.** | Cantidad (entero) | `Math.round(p.cantidad)` |
| 5 | **U/M** | Unidad de medida | `p.unidadMedida || 'UN'` |
| 6 | **P. Lista (S/.)** | Precio de lista unitario | `p.precioUnitario` |
| 7 | **Desc 01 (%)** | Descuento 1 en porcentaje | `p.descuento1` |
| 8 | **Desc 02 (%)** | Descuento 2 en porcentaje | `p.descuento2` |
| 9 | **Total Neto (S/.)** | Total después de descuentos (sin IGV) | `cant × P.Lista × (1−D1/100) × (1−D2/100)` |
| 10 | **P. Unit c/IGV (S/.)** | Precio unitario neto más IGV | `(Total Neto / cant) × 1.18` |
| 11 | **Total Venta (S/.)** | Total neto más IGV | `Total Neto × 1.18` |

**Características adicionales**:

- **Stock badge**: Cada fila muestra un punto de color junto a la cantidad:
  - 🟢 Verde = Stock OK
  - 🟡 Naranja = Stock Ajustado (AJ)
  - 🔴 Rojo = Agotado
- **Paginación**: 75 productos por página con navegación numérica.
- **Agrupación por línea**: Si se filtra por línea desde el gráfico mariposa, los productos se agrupan expandibles por línea.

### 4.6 Panel de auditoría

Se muestra debajo de la tabla de productos. Evalúa cada producto y reporta:

- **Errores (🚫)**: SKU inválido/vacío, descripción vacía, precio unitario cero o negativo, cantidad cero, descuento fuera de rango.
- **Advertencias (⚠️)**: Stock agotado, descuento alto (>50 %), precio elevado.
- **Infos (ℹ️)**: Productos sin datos de catálogo.

El resumen muestra el estado general: ✅ OK o ⚠️ REVISAR.

---

## 5. Sidebar — Acciones rápidas

Botones en la barra lateral izquierda:

| Botón | Atajo | Acción |
|-------|:-----:|--------|
| 📊 Análisis | `Alt+3` | Abre modal con gráfico de disponibilidad (Home) |
| 📋 Distribución | `Alt+4` | Navega a `/distribucion` (Home) |
| ⚠️ Stock | `Alt+5` | Muestra badge con productos con stock bajo |
| 💾 Guardar | `Alt+G` | Guarda snapshot HTML en la Bóveda (IndexedDB) |
| 📂 Cargar | `Alt+L` | Abre la Bóveda HTML para cargar snapshots guardados |
| 🗑️ Limpiar | `Alt+N` | Limpia el pedido actual y reinicia |
| 📊 XLSX | — | Exporta a Excel (requiere N° Pedido + Cliente) |
| 📄 Word | — | Exporta carta corporativa (requiere datos completos) |
| 🌙/☀️ Tema | — | Alterna entre tema oscuro y claro |

---

## 6. Página de Distribución

Ruta: `/distribucion`

Accede desde Home con el botón 📋 **Distribución** del sidebar o manualmente.

### 6.1 Perfil del cliente

Muestra los datos ingresados en Home: Razón Social, RUC/DNI, ID Pedido, Consultor Comercial, Email y Teléfono.

### 6.2 Valorización y stock

Tres tarjetas idénticas a las de Home: Subtotal, Total + IGV, Total Disponible.

### 6.3 Programación de letras (PaymentSplit)

Calendario interactivo para programar cuotas de pago:

1. Seleccionar el rango de meses (inicio → fin) con los inputs de tipo `month`.
2. Hacer clic en cualquier día disponible del calendario para asignar una fecha de vencimiento.
3. Ajustar montos individuales o usar el reparto equitativo automático.
4. El balance muestra en tiempo real el monto asignado vs saldo pendiente.

**Rango máximo**: 12 meses consecutivos. Al alcanzar el límite aparece una advertencia visual "Máximo rango alcanzado: 12 meses" y el selector de mes fin no permite avanzar más.

**Días bloqueados**: Días pasados, feriados nacionales (Año Nuevo, Semana Santa, Fiestas Patrias, etc.) y domingos no son seleccionables.

### 6.4 KPIs y gráfico mariposa

**KPIs** (4 tarjetas):

| KPI | Descripción |
|-----|-------------|
| 💰 Valor Neto Est. | Subtotal del pedido |
| 📦 Unidades Caja | Total de cajas calculadas |
| ⚖️ Masa Logística | Peso total en kg |
| 💳 Total a Financiar | Total + IGV |

**Gráfico Mariposa** — Distribución por línea:

```
💰 VALOR (S/)      LÍNEA       📦 VOLUMEN (BX - KG)
S/ 1,234.56       PELOTAS      45 BX | 18.0 kg (45.00%)
 (45.00%)       ████████████  ████████████
S/ 987.65        ESCRITURA    30 BX | 9.6 kg (30.00%)
 (30.00%)       ██████████    ██████████
...
```

Cada línea muestra:
- Monto en soles y porcentaje sobre el total
- Barras proporcionales (izquierda: valor, derecha: volumen)
- Cajas completas / unidades sueltas (ej: `45/3 BX`)
- Peso en kg con porcentaje

**Filtro**: Botón "📦 Todo el pedido" / "✅ Solo con stock" — filtra KPIs y gráfico (la tabla siempre muestra todo).

### 6.5 Categorías

Badges por categoría con color, porcentaje, monto y desglose de cajas.

### 6.6 Tabla de partidas

Misma tabla de 11 columnas que en Home, con todos los productos calculados.

### 6.7 Exportaciones

Modal flotante con 4 opciones:

| Opción | Formato | Requisitos |
|--------|---------|------------|
| 📊 XLSX | Excel (.xlsx) con fórmulas | N° Pedido + Cliente |
| 📄 Word | Carta corporativa en HTML imprimible | Cliente, RUC, N° Pedido, Vendedor, Email, Teléfono |
| 🌐 HTML | Cronograma completo descargable (.html) | Cliente, RUC, N° Pedido, Vendedor |
| 🗑️ Clear | Limpia todo el pedido | Confirmación |

---

## 7. Exportaciones detalladas

### 7.1 XLSX (Excel)

Genera un archivo `.xlsx` con:

- **Logo corporativo** de CIPSA en cabecera
- **Info**: CLIENTE, PEDIDO, SUCURSAL
- **Totales**: Subtotal, Total + IGV, C/STOCK CONF. con fórmulas
- **Tabla de 12 columnas**: N°, CANT., U/M, SKU, DESCRIPCIÓN, C/STOCK, P. LISTA, DESC 01, DESC 02, **TOTAL NETO**, **P. UNIT C/IGV**, **TOTAL VENTA**
- **Fórmulas vivas**: VALOR VENTA, PRECIO UNIT., PRECIO TOTAL se calculan automáticamente
- **C/STOCK**: Badge de color (verde/ naranja/rojo) según disponibilidad
- **Zebra striping**: Filas alternadas con color de fondo

Las fórmulas permiten editar cantidades, precios o descuentos en Excel y todo se recalcula automáticamente.

### 7.2 Word / Carta Corporativa

Genera un HTML con estilo de carta corporativa imprimible (tamaño A4):

- **Logo y membrete** de CIPSA
- **Destinatario**: Cliente, RUC/DNI, N° Pedido, Sucursal
- **Asesor**: Nombre, email, teléfono
- **Tabla de productos**: SKU, Descripción, Cant., U/M, P. Unit., Total
- **Totales**: Subtotal, IGV (18 %), Total General
- **Condiciones comerciales**: Vigencia, tipo de pago, plazo de entrega
- **Firma del vendedor** con datos de contacto
- **Footer corporativo**: Corporación de Industrias Plásticas S.A. — RUC: 20100654025 — Av. Los Frutales 419, Urb. El Artesano, Ate — Central: (01) 3134200

### 7.3 HTML (Cronograma descargable)

Reporte completo en HTML con:

- **Cabecera**: Nombre del cliente como título + RUC, Pedido, ID, Sucursal, Fecha + badge "Distribución"
- **Datos del vendedor**: solo si hay nombre de vendedor escrito
- **Valorización**: Subtotal, Total + IGV, Total Disponible
- **KPIs**: Ventas totales, cajas, peso, total a financiar, líneas, categorías
- **Gráfico mariposa** con distribución por línea (con barras de valor y volumen)
- **Categorías**: Badges con colores, montos y desglose de cajas
- **Programación de letras**: Meses con tarjetas de cuotas
- **Tabla de partidas**: 12 columnas (#, SKU, Descripción, Cant., U/M, P. Lista, Desc 01, Desc 02, **Total Neto**, **P. Unit c/IGV**, **Total Venta**, **Stock**)
- **Estilo**: Tema oscuro (presentación) o claro (impresión), seleccionable al descargar
- **Botón de impresión**: "🖨️ Imprimir / Guardar como PDF" optimizado para A4
- **Footer**: Generado por G360 Order System

### 7.4 Impresión A4

Botón 🖨️ **Imprimir A4** en la página de Distribución. Abre el diálogo de impresión del navegador con estilo optimizado para papel (tamaño A4, márgenes 15 mm, colores forzados para print).

---

## 8. Bóveda HTML

Sistema de almacenamiento de snapshots HTML usando **IndexedDB**.

**Guardar** (💾): Toma una captura del estado actual (cliente, RUC, productos, distribución) y lo guarda con fecha y hora.

**Cargar** (📂): Abre el modal **🌐 BÓVEDA HTML** que lista todos los snapshots guardados con:
- Número correlativo
- Fecha de guardado
- Cliente y RUC
- N° de Pedido

Acciones:
- **Click** en un item: Descarga el HTML guardado
- **×** (rojo): Elimina el snapshot permanentemente (con confirmación)
- **Cerrar**: Con el ✕ del encabezado del modal

---

## 9. FAQ y solución de problemas

### ¿Qué hago si al pegar datos no se parsean correctamente?
Verifica que los datos copiados estén en formato tabulado (separados por tabulaciones). El formato esperado es el que exporta el sistema ERP VES.

### ¿Dónde se guardan los datos?
Todo se almacena en `localStorage` del navegador. Los snapshots HTML se guardan en **IndexedDB**. No hay servidor ni base de datos remota.

### ¿Por qué no veo el peso en el gráfico mariposa?
Verifica que los productos tengan asignado un `peso_kg` en el catálogo (`catalogo_productos.json`). Si el campo está vacío o es 0, el peso no se mostrará.

### ¿Cómo cambio el tema?
Usa el botón 🌙/☀️ en el sidebar o la página detecta automáticamente la preferencia del sistema.

### ¿Los datos se pierden al cerrar el navegador?
No, siempre que no se borren los datos de navegación. Los datos persisten en localStorage. Usa el botón 🗑️ **Limpiar** para resetear manualmente.

### ¿Puedo editar los productos después de importarlos?
Actualmente la edición se hace modificando los datos en el ERP y re-importando. La tabla es de solo lectura.

### ¿Qué significa el badge en la cantidad?
- 🟢 **Verde** = Stock OK (disponible)
- 🟡 **Naranja** = Stock Ajustado (AJ)
- 🔴 **Rojo** = Agotado

### El XLSX no se descarga
Requisitos: N° Pedido y Cliente deben estar escritos. Verifica la consola del navegador por errores.

### Error "Faltan datos del cliente" al exportar
Completa todos los campos obligatorios marcados en el formulario antes de exportar.

---

*Documento generado para G360 Order XLSX v1.1.0 — Junio 2026*
