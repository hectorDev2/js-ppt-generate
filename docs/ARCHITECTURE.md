# AI Document Runtime Platform

## Arquitectura

```
JSON Schema Universal (input)
  → Parser (validación JSON + schema)
  → Runtime Engine (resolución de temas, layout)
  → Document Node Tree (DNT)
    → PPTX Renderer (pptxgenjs)
    → PDF Renderer (jsPDF)
```

## Flujo

1. El usuario pega un JSON siguiendo el **JSON Schema Universal**
2. El **Parser** valida contra el schema y reporta errores/warnings
3. El **Runtime Engine** resuelve temas, colores, fuentes y calcula posiciones
4. El **Document Node Tree (DNT)** es la representación intermedia resuelta
5. Los **Renderers** toman el DNT y producen PPTX o PDF consistentes

## JSON Schema Universal

```json
{
  "version": "1.0",
  "type": "presentation",
  "theme": "corporate-light | dark | minimal",
  "slides": [
    {
      "layout": "cover | section | content | closing | blank",
      "elements": [
        { "type": "heading", "level": 1, "content": "Título" },
        { "type": "text", "content": "Texto" },
        { "type": "list", "items": ["item1", "item2"] },
        { "type": "table", "headers": [...], "rows": [[...]] },
        { "type": "grid", "columns": 3, "items": [{ "title": "...", "body": "..." }] },
        { "type": "stat", "value": "$2M", "label": "ARR" },
        { "type": "quote", "text": "...", "author": "..." },
        { "type": "shape", "shape": "rect | circle | line", "fill": "primary" },
        { "type": "image", "src": "data:..." },
        { "type": "divider" }
      ]
    }
  ]
}
```

## Temas

| Tema | Fondo | Acento | Ideal para |
|------|-------|--------|------------|
| `corporate-light` | Blanco | Azul | Empresarial |
| `dark` | Oscuro | Dorado | Pitch decks |
| `minimal` | Blanco | Negro | Documentos |

Los colores se referencian por nombre: `primary`, `secondary`, `accent`, `background`, `surface`, `text`, `textSecondary`, `border`, `success`.

## Elementos Soportados

| Tipo | Descripción |
|------|-------------|
| `heading` | Títulos con nivel 1-3 |
| `text` | Párrafos de texto |
| `list` | Listas bullets/ordenadas |
| `table` | Tablas con headers y rows |
| `grid` | Grid de cards con icono, título, cuerpo |
| `stat` | Tarjetas de métricas/KPIs |
| `quote` | Citas destacadas con autor |
| `shape` | Figuras (rect, circle, line) |
| `image` | Imágenes base64 o URL |
| `divider` | Línea separadora horizontal |

## Estructura del Proyecto

```
src/
  schema/
    types.ts     — JSON Schema Universal + DNT types
    validator.ts — Validación de schema
  engine/
    theme.ts     — Sistema de temas y resolución de estilos
    runtime.ts   — Compilación schema → DNT
  renderers/
    pptx.ts      — DNT → pptxgenjs
    pdf.ts       — DNT → jsPDF
  parser.ts      — Parser unificado (JSON → validación → DNT)
  main.ts        — Entry point
  state.ts       — Estado global
  types.ts       — LogEntry
  lib/samples.ts — Sample JSON
  style.css      — Estilos
```

## Stack

| Capa | Tecnología |
|------|-----------|
| Runtime | TypeScript + Vite |
| Editor | Monaco Editor |
| Renderer PPTX | PptxGenJS |
| Renderer PDF | jsPDF |
| UI | Vanilla (sin framework) |
| Backend | Ninguno (browser-first) |
