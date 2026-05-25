# AI Document Runtime Platform

Plataforma web para generar presentaciones PPTX y PDF desde JSON estructurado o código JavaScript con pptxgenjs. Todo corre en el navegador, sin backend.

## Paginas

| Pagina | URL | Input | Output |
|--------|-----|-------|--------|
| **JSON Mode** | `/index.html` | JSON Schema Universal (`slides[{ elements[] }]`) | PPTX / PDF |
| **JS Mode** | `/js.html` | Codigo JavaScript con `require("pptxgenjs")` | PPTX / PDF |

## Stack

| Capa | Tecnologia |
|------|-----------|
| Runtime | TypeScript + Vite |
| Editor | Monaco Editor |
| Renderer PPTX | PptxGenJS |
| Renderer PDF | jsPDF |
| Backend | Ninguno (browser-first) |

## JSON Schema Universal

```json
{
  "title": "Mi Presentacion",
  "theme": "dark",
  "slides": [
    {
      "elements": [
        { "type": "heading", "level": 1, "content": "Titulo", "style": { "color": "primary" } },
        { "type": "text", "content": "Texto" },
        { "type": "list", "items": ["item1", "item2"] },
        { "type": "table", "headers": ["A", "B"], "rows": [["a1", "b1"]] },
        { "type": "stat", "value": "$2M", "label": "ARR" },
        { "type": "grid", "columns": 2, "items": [{ "title": "...", "body": "..." }] },
        { "type": "quote", "text": "...", "author": "..." },
        { "type": "divider" }
      ]
    }
  ]
}
```

### Temas incorporados

| Tema | Fondo | Acento |
|------|-------|--------|
| `corporate-light` | Blanco | Azul |
| `corporate-dark` | #0F172A | #38BDF8 |
| `dark` | #1A1A2E | #C8922A |
| `minimal` | Blanco | Negro |

### Colores por nombre

`primary`, `secondary`, `accent`, `background`, `surface`, `text`, `textSecondary`, `border`, `success`

## JS Mode

Pega cualquier codigo que use `require("pptxgenjs")` generado por ChatGPT, Claude, etc. La app lo ejecuta con un polyfill que captura la presentacion y permite descargar PPTX y PDF.

Ejemplo:
```javascript
const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
const s = pres.addSlide();
s.addText("Hola", { x: 1, y: 1, w: 5, h: 1, fontSize: 24 });
pres.writeFile({ fileName: "ejemplo.pptx" });
```

## Desarrollo

```bash
npm run dev     # Servidor de desarrollo
npm run build   # Build de produccion
```

## Estructura del proyecto

```
src/
  main.ts           — Entry point JSON mode
  main-js.ts        — Entry point JS mode
  parser.ts         — Parser JSON → DNT
  state.ts          — Estado global (logs)
  types.ts          — Tipos base
  schema/
    types.ts        — JSON Schema + DNT types
    validator.ts    — Validacion y normalizacion
  engine/
    runtime.ts      — Schema → Document Node Tree
    theme.ts        — Temas y resolucion de estilos
  renderers/
    pptx.ts         — DNT → pptxgenjs
    pdf.ts          — DNT → jsPDF
  modes/
    library.ts      — Ejecutor de JS pptxgenjs
  lib/
    samples.ts      — Ejemplos para ambos modos
    pptx-to-pdf.ts  — Captura → PDF (JS mode)
  style.css         — Estilos
```
