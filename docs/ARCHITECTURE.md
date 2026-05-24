# PPTX Generator

## Qué hace

Ejecuta JavaScript generado por IA (ChatGPT, Claude, etc.) que usa `pptxgenjs` y descarga el PPTX generado.

## Cómo funciona

```
JS code (requiere('pptxgenjs'))
  → Monaco Editor
  → Botón "Generar PPTX"
  → Ejecuta el código con pptxgenjs
  → pptx.writeFile() descarga el .pptx
  → Logs en panel derecho
```

## Soporte

Solo `require('pptxgenjs')`. Cualquier código que use la API de pptxgenjs funciona:
- `new pptxgen()`, `addSlide()`, `addText()`, `addShape()`, `addTable()`
- `pptx.writeFile({ fileName })` descarga automáticamente

## Estructura

```
src/
  main.ts       — Entry point, editor, UI handlers
  state.ts      — Estado global (logs, processing)
  types.ts      — Tipos (LogEntry)
  style.css     — Estilos
  lib/samples.ts — Sample de ChatGPT
  modes/library.ts — Ejecutor con require('pptxgenjs')
```

## Build

```bash
npm run dev    # Desarrollo
npm run build  # Producción
```
