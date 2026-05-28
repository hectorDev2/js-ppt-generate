# Arquitectura — js-ppt-generate

---

## Pipeline completo

```
JSON Mode                                    JS Mode
─────────────────────                        ────────────────────
JSON Schema Universal                        Código pptxgenjs
  │                                            │
  ▼                                            ▼
parser.ts                                    library.ts
  normalize() ──► validate()                   polyfill require("pptxgenjs")
  │                                            │
  ▼                                            ▼
runtime.ts                                   pptxgenjs instance
  compile() ──► Document Node Tree              │ _slideObjects internos
  │                                            │
  ├── renderers/pptx.ts  ──► PPTX              ├── writeFile()  ──► PPTX
  ├── renderers/pdf.ts   ──► PDF               ├── pptx-to-pdf   ──► PDF
  └── renderers/html.ts  ──► HTML (preview)    └── js-preview    ──► HTML (preview)
```

## Capas

### 1. Input (Schema → AST)

`src/schema/types.ts` define el `PresentationSchema` — 15 tipos de elementos. `src/parser.ts` parsea JSON, `src/schema/validator.ts` normaliza y valida.

`src/editor/setup.ts` inicializa Monaco Editor con workers para JSON y TypeScript/JavaScript.

### 2. Engine (AST → DNT)

`src/engine/runtime.ts` compila el schema validado al Document Node Tree. Resuelve:
- **Tema**: colores y fuentes vía `src/engine/theme.ts`
- **Layout**: posiciones (x, y, w, h) con stacking vertical o grid 12 columnas
- **Placement**: overrides explícitos (`placement: { x, y, w, h }` en pulgadas)
- **Estilos**: merge de `style` del elemento sobre defaults del tema

El DNT (`DocumentNodeTree`) es la representación intermedia con todo resuelto: posiciones, colores finales, fuentes.

### 3. Renderers (DNT → Output)

Cuatro renderers:

| Renderer | Archivo | Input | Output |
|----------|---------|-------|--------|
| **PPTX** | `renderers/pptx.ts` | DNT | pptxgenjs `Presentation` |
| **PDF** | `renderers/pdf.ts` | DNT | jsPDF `Blob` |
| **HTML** | `renderers/html.ts` | DNT | HTML string (posicionado con CSS) |
| **JS→PDF** | `lib/pptx-to-pdf.ts` | pptxgenjs instance | jsPDF `Blob` |
| **JS→HTML** | `modes/js-preview.ts` | pptxgenjs `_slideObjects` | HTML string |

### 4. Preview UI

Template compartido (`<template id="previewAppTmpl">`) clonado por ambos entry points. Componentes:

- `preview-thumbs`: tira horizontal inferior, scroll horizontal con rueda
- `preview-viewport`: slide enfocado, centrado, zoom controlable
- `preview-controls`: navegación (◀ ▶), contador (3/9), zoom (Fit/100%/75%/50%)

Teclado: ← → (navegar), Home (primer slide), End (último slide).

---

## Document Node Tree (DNT)

Estructura de tipos — `src/schema/types.ts`:

```typescript
DocumentNodeTree {
  slides: SlideNode[]
  theme: ResolvedTheme
  metadata: { title?, slideCount }
}

SlideNode {
  id, layout, background
  elements: ElementNode[]
}

ElementNode {
  type, computed: Rect { x, y, w, h }
  style: ResolvedStyle { color, bgColor, fontSize, bold, italic, align, fontFace, padding }
  content: unknown  // varía por tipo: string, { items: [...] }, etc.
}
```

---

## 15 tipos de elementos

| Categoría | Tipos |
|-----------|-------|
| Texto | `heading`, `text`, `label`, `quote`, `list` |
| Datos | `table`, `stat`, `grid`, `cards` |
| Layout | `column`, `divider` |
| Visual | `shape`, `image` |
| Estructurado | `flow`, `timeline` |

Campos opcionales en todos: `style?: Partial<ElementStyle>`, `grid?: GridPos`, `placement?: Partial<Rect>`.

---

## JS Mode: polyfill interno

`src/modes/library.ts`:

1. `import("pptxgenjs")` dinámico
2. Wrapper del constructor que intercepta `writeFile()` y lo convierte en no-op
3. Polyfill de `require()`: mapea `pptxgenjs` y `pptxgen` al wrapper, `fs` a un stub
4. `new Function("require", "console", "process", code)` ejecuta el código del usuario
5. `lastPres` almacena la instancia para descargas y preview

El preview de JS mode lee `pres.slides[]._slideObjects[]` — los objetos internos de pptxgenjs con posición, estilo y texto — y los renderiza a HTML posicionado.

---

## Sistema de temas

`src/engine/theme.ts` — 4 temas built-in con paletas de 9 colores cada una:

| Tema | Fondo | Acento | Uso |
|------|-------|--------|-----|
| `corporate-light` | `#FFFFFF` | `#1A5276` | Corporativo claro |
| `corporate-dark` | `#0F172A` | `#38BDF8` | Corporativo oscuro |
| `dark` | `#1A1A2E` | `#C8922A` | Pitch decks |
| `minimal` | `#FFFFFF` | `#000000` | Documentos |

`resolveStyle(elementStyle, theme, defaults)` mergea en este orden: DEFAULT_STYLE → defaults del tipo → style del elemento. Booleanos y números usan `!== undefined` (no `||`) para respetar `false` y `0`.

---

## Estructura de archivos

```
src/
├── main.ts                 — Entry point JSON mode
├── main-js.ts              — Entry point JS mode
├── parser.ts               — JSON → normalize → validate → compile
├── state.ts                — Estado global (logs, processing) — snapshot inmutable
├── types.ts                — LogEntry
├── vite-env.d.ts           — Declaraciones Vite
├── style.css               — Tema oscuro con acentos dorados + preview
├── schema/
│   ├── types.ts            — PresentationSchema, ElementDef (15), DNT types
│   └── validator.ts        — normalize() + validate() con isRecord() type guards
├── engine/
│   ├── runtime.ts          — compile(): schema → DNT, layout, posiciones
│   └── theme.ts            — resolveTheme(), resolveStyle(), resolveColor()
├── renderers/
│   ├── pptx.ts             — DNT → pptxgenjs
│   ├── pdf.ts              — DNT → jsPDF Blob
│   └── html.ts             — DNT → HTML string (preview, scale parametrizado)
├── modes/
│   ├── library.ts          — executeJsCode(), downloadPptx(), polyfill require
│   └── js-preview.ts       — pptxgenjs _slideObjects → HTML string (preview)
├── editor/
│   └── setup.ts            — Monaco init, workers, renderLogs, escapeHtml
└── lib/
    ├── samples.ts          — SAMPLE_PRESENTATION + SAMPLE_JS_PPT (9 slides cada uno)
    └── pptx-to-pdf.ts      — pptxgenjs instance → jsPDF Blob
```
