# js-ppt-generate

> Plataforma browser-first para generar presentaciones PPTX y PDF desde JSON declarativo o código JavaScript. Sin backend. Sin dependencias de servidor. Con preview visual integrado.

---

## Modos

| Modo | URL | Input | Pipeline |
|------|-----|-------|----------|
| **JSON** | `/index.html` | JSON Schema Universal | parse → validate → compile → DNT → PPTX / PDF / Preview |
| **JS** | `/js.html` | Código pptxgenjs (`require("pptxgenjs")`) | execute → capture → PPTX / PDF / Preview |

Ambos modos comparten el mismo motor de preview: thumbnails, zoom, navegación con teclado.

---

## Pipeline

```
JSON Mode                              JS Mode
─────────                              ───────
JSON Schema Universal                  Código pptxgenjs
  │                                      │
  ▼                                      ▼
parser.ts (normalize → validate)       library.ts (polyfill require)
  │                                      │
  ▼                                      ▼
runtime.ts (theme + layout)            pptxgenjs instance
  │                                      │
  ▼                                      ▼
Document Node Tree (DNT)               _slideObjects internos
  │                                      │
  ├── pptx.ts  →  PPTX  ─┐              ├── writeFile()  →  PPTX  ─┐
  ├── pdf.ts   →  PDF    │              ├── pptx-to-pdf  →  PDF    │
  └── html.ts  →  HTML   │              └── js-preview   →  HTML   │
                         ▼                                           ▼
                  Preview UI compartido                    Preview UI compartido
                  (thumbnails + viewport + controls)
```

---

## JSON Schema Universal

### Elementos (15 tipos)

| Tipo | Props clave | Ejemplo |
|------|------------|---------|
| **Texto** | | |
| `heading` | `level` (1/2/3), `content` | `{ "type": "heading", "level": 1, "content": "Titulo" }` |
| `text` | `content` | `{ "type": "text", "content": "Parrafo" }` |
| `label` | `content` | `{ "type": "label", "content": "Q1 2026" }` |
| `quote` | `text`, `author?` | `{ "type": "quote", "text": "...", "author": "..." }` |
| `list` | `items`, `ordered?` | `{ "type": "list", "items": ["A", "B"] }` |
| **Datos** | | |
| `table` | `headers`, `rows` | `{ "type": "table", "headers": ["Plan"], "rows": [["Pro"]] }` |
| `stat` | `value`, `label`, `detail?` | `{ "type": "stat", "value": "$2.4M", "label": "ARR" }` |
| `grid` | `columns`, `items: [{title, body, icon?}]` | `{ "type": "grid", "columns": 3, "items": [...] }` |
| `cards` | `items`, `columns?` | `{ "type": "cards", "items": [{title, body}] }` |
| **Layout** | | |
| `column` | `position` (left/right), `elements` | `{ "type": "column", "position": "left", "elements": [...] }` |
| `divider` | — | `{ "type": "divider" }` |
| **Visual** | | |
| `shape` | `shape` (rect/circle/line), `fill?` | `{ "type": "shape", "shape": "circle", "fill": "accent" }` |
| `image` | `src`, `alt?` | `{ "type": "image", "src": "https://..." }` |
| **Estructurado** | | |
| `flow` | `nodes: [{id, label, sublabel?}]` | `{ "type": "flow", "nodes": [...] }` |
| `timeline` | `items: [{phase, period, title, items}]` | `{ "type": "timeline", "items": [...] }` |

Todo elemento acepta `style?`, `grid?`, y `placement?` como props opcionales.

### Placement (posición explícita)

Control total sobre la posición de cualquier elemento. Si no se especifica, el engine calcula automáticamente con layout vertical.

```json
{
  "type": "heading",
  "content": "Titulo centrado",
  "placement": { "x": 2, "y": 1.5, "w": 6, "h": 1 },
  "style": { "fontSize": 44, "color": "C8922A", "align": "center" }
}
```

`x, y, w, h` en pulgadas. Slide = 10" × 5.625" (16:9). Cualquier campo puede omitirse, el engine usa defaults para el resto.

### Style (estilo por elemento)

```json
"style": {
  "color": "C8922A",
  "fontSize": 44,
  "bold": true,
  "italic": false,
  "align": "center",
  "fontFace": "Calibri",
  "bgColor": "1A1A2E",
  "padding": 4
}
```

Los campos del `style` **mergean sobre los defaults del tema**. Lo que no especificás, el tema lo define.

### Grid (12 columnas)

Posicionamiento por grilla en vez de coordenadas exactas:

```json
{ "type": "text", "content": "...", "grid": { "col": 1, "span": 6 } }
```

### Temas incorporados

| Tema | Fondo | Acento | Carácter |
|------|-------|--------|----------|
| `corporate-light` | `#FFFFFF` | `#1A5276` | Empresarial claro |
| `corporate-dark` | `#0F172A` | `#38BDF8` | Empresarial oscuro |
| `dark` | `#1A1A2E` | `#C8922A` | Pitch decks |
| `minimal` | `#FFFFFF` | `#000000` | Documentos |

```json
{ "theme": "dark", "slides": [...] }
```

### Tokens de color

Usables en cualquier `color`, `bgColor`, o `fill`:

`primary` `secondary` `accent` `background` `surface` `text` `textSecondary` `border` `success`

También aceptan hex crudo: `"C8922A"` o `"#C8922A"`.

---

## JS Mode

Ejecuta código pptxgenjs arbitrario en el navegador. La app polyfillea `require("pptxgenjs")` y captura la instancia para permitir exportación PPTX/PDF y preview visual.

```javascript
var pptxgen = require("pptxgenjs");
var pres = new pptxgen();
pres.layout = "LAYOUT_16x9";

var s = pres.addSlide();
s.background = { color: "1A1A2E" };
s.addText("HOLA", { x: 1, y: 1.5, w: 8, h: 1, fontSize: 48, bold: true, color: "C8922A", align: "center" });
s.addShape(pres.ShapeType.rect, { x: 2, y: 3, w: 6, h: 1, fill: { color: "E94560" } });

pres.writeFile({ fileName: "ejemplo.pptx" });
```

El `writeFile()` es interceptado — no descarga al disco, sino que guarda la presentación para que los botones PPTX/PDF/Preview la usen.

---

## Preview Visual

El preview está disponible en **ambos modos** y se abre automáticamente al compilar/ejecutar.

```
┌──────────────────────────────────────────┐
│  Main Viewport                           │
│  (slide actual, fit automático)          │
│                                          │
├──────────────────────────────────────────┤
│  ◀  ▶    3 / 9    Fit 100% 75% 50%     │
├──────────────────────────────────────────┤
│  [1] [2] [3] [4] [5] [6] [7] → scroll →│
└──────────────────────────────────────────┘
```

| Feature | Detalle |
|---------|---------|
| Modos | JSON y JS, mismo layout |
| Thumbnails | Tira horizontal scrolleable abajo |
| Navegación | Click en thumbnail, ← → teclado, Home/End, botones ◀ ▶ |
| Zoom | Fit (auto), 100%, 75%, 50% |
| Slide counter | `3 / 9` en tiempo real |
| Scroll | Rueda del mouse sobre thumbnails = scroll horizontal |

---

## Estructura del proyecto

```
js-ppt-generate/
├── index.html              — JSON Mode entry point
├── js.html                 — JS Mode entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
├── docs/
│   └── ARCHITECTURE.md     — Documentación técnica detallada
└── src/
    ├── main.ts             — Entry point JSON: compile, download, preview
    ├── main-js.ts          — Entry point JS: execute, download, preview
    ├── parser.ts           — JSON parse → normalize → validate → compile
    ├── state.ts            — Estado global (logs, processing)
    ├── types.ts            — LogEntry
    ├── vite-env.d.ts       — Declaraciones Vite (worker imports)
    ├── style.css           — Tema oscuro + preview
    ├── schema/
    │   ├── types.ts        — PresentationSchema + DNT + 15 ElementDef types
    │   └── validator.ts    — normalize() + validate() con type guards
    ├── engine/
    │   ├── runtime.ts      — Schema → DNT: layout, posiciones, estilos
    │   └── theme.ts        — 4 temas, resolveStyle(), resolveColor()
    ├── renderers/
    │   ├── pptx.ts         — DNT → pptxgenjs (PPTX)
    │   ├── pdf.ts          — DNT → jsPDF (PDF)
    │   └── html.ts         — DNT → HTML string (preview JSON mode)
    ├── modes/
    │   ├── library.ts      — Ejecutor JS: polyfill require, intercept writeFile
    │   └── js-preview.ts   — pptxgenjs _slideObjects → HTML (preview JS mode)
    ├── editor/
    │   └── setup.ts        — Monaco editor + workers compartido
    └── lib/
        ├── samples.ts      — 9 slides de ejemplo para ambos modos
        └── pptx-to-pdf.ts  — JS mode: pptxgenjs instance → PDF
```

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Lenguaje | TypeScript 5.6 (strict) |
| Bundler | Vite 6 |
| Editor | Monaco Editor 0.52 |
| PPTX | PptxGenJS 3.12 |
| PDF | jsPDF 2.4 |
| UI | Vanilla HTML/CSS |
| Backend | Ninguno (browser-first) |

---

## Desarrollo

```bash
npm install
npm run dev       # Servidor de desarrollo (Vite HMR)
npm run build     # Build de producción (tsc + vite)
npm run preview   # Preview del build
```
