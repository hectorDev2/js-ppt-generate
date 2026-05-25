export const SAMPLE_PRESENTATION = `{
  "title": "CloudNex - Pitch Deck",
  "theme": "dark",
  "slides": [
    {
      "elements": [
        { "type": "heading", "level": 1, "content": "CLOUDNEX", "style": { "color": "primary", "fontSize": 44 } },
        { "type": "text", "content": "Plataforma SaaS para equipos modernos" },
        { "type": "text", "content": "Infraestructura serverless · Auto-scaling · Zero ops" }
      ]
    },
    {
      "elements": [
        { "type": "heading", "level": 1, "content": "Traction" },
        { "type": "stat", "value": "$2.4M", "label": "ARR", "detail": "+156%" },
        { "type": "stat", "value": "12K", "label": "Usuarios activos", "detail": "+89%" },
        { "type": "stat", "value": "99.9%", "label": "Uptime" }
      ]
    },
    {
      "elements": [
        { "type": "heading", "level": 1, "content": "Roadmap 2026" },
        { "type": "list", "items": ["Q1: MVP Launch - Beta cerrada", "Q2: API Publica - SDKs", "Q3: Enterprise - SSO"] }
      ]
    },
    {
      "elements": [
        { "type": "heading", "level": 1, "content": "Equipo" },
        { "type": "grid", "columns": 2, "items": [
          { "title": "Ana Lopez", "body": "CEO - Ex-Google" },
          { "title": "Carlos Ruiz", "body": "CTO - Arquitecto distribuido" }
        ]}
      ]
    },
    {
      "elements": [
        { "type": "heading", "level": 1, "content": "Listos para el futuro?" },
        { "type": "text", "content": "Primeros 1000 usuarios con 6 meses gratis" }
      ]
    }
  ]
}`

export const SAMPLE_JS_PPT = `// Generado por ChatGPT o Claude - codigo pptxgenjs
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "Presentacion de ejemplo";

function addTitle(slide, text) {
  slide.addText(text, {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 26, bold: true, color: "C0392B"
  });
}

// Slide 1 - Portada
{
  const s = pres.addSlide();
  s.background = { color: "1A1A2E" };
  s.addText("MI PRESENTACION", {
    x: 0.5, y: 1.5, w: 9, h: 1,
    fontSize: 44, bold: true, color: "C8922A"
  });
  s.addText("Subtitulo de ejemplo", {
    x: 0.5, y: 2.8, w: 9, h: 0.5,
    fontSize: 18, color: "F4ECD8"
  });
}

// Slide 2 - Contenido
{
  const s = pres.addSlide();
  addTitle(s, "Contenido");
  s.addText("Este es un ejemplo de texto en la presentacion.", {
    x: 0.8, y: 1.2, w: 8, h: 0.5,
    fontSize: 16, color: "333333"
  });
  s.addText([
    { text: "Punto importante 1", options: { bullet: true, breakLine: true } },
    { text: "Punto importante 2", options: { bullet: true, breakLine: true } },
    { text: "Punto importante 3", options: { bullet: true } }
  ], {
    x: 0.8, y: 2.0, w: 8, h: 2,
    fontSize: 14, color: "444444"
  });
}

// Slide 3 - Cierre
{
  const s = pres.addSlide();
  s.background = { color: "1A1A2E" };
  s.addText("GRACIAS", {
    x: 0.5, y: 2.0, w: 9, h: 1,
    fontSize: 48, bold: true, color: "C8922A",
    align: "center"
  });
}

pres.writeFile({ fileName: "ejemplo.pptx" })
  .then(function() { console.log("Presentacion lista!"); })
  .catch(function(err) { console.error("Error:", err); });`
