export const SAMPLE_PRESENTATION = `{
  "title": "Test Preview",
  "theme": "dark",
  "slides": [
    {
      "elements": [
        { "type": "heading", "level": 1, "content": "PORTADA DE PRUEBA", "style": { "color": "primary", "fontSize": 44 } },
        { "type": "text", "content": "Subtitulo centrado", "style": { "align": "center", "fontSize": 16 } },
        { "type": "divider" },
        { "type": "label", "content": "Enero 2026", "style": { "color": "accent", "fontSize": 10 } }
      ]
    },
    {
      "elements": [
        { "type": "heading", "level": 2, "content": "Metricas clave" },
        { "type": "stat", "value": "$2.4M", "label": "ARR", "detail": "+156% YoY" },
        { "type": "stat", "value": "12K", "label": "Usuarios", "detail": "+89% QoQ" },
        { "type": "stat", "value": "99.9%", "label": "Uptime" }
      ]
    },
    {
      "elements": [
        { "type": "heading", "level": 2, "content": "Comparativa de planes" },
        { "type": "table", "headers": ["Plan", "Precio", "Usuarios", "Soporte"], "rows": [
          ["Starter", "$29/mes", "5", "Email"],
          ["Pro", "$99/mes", "50", "Priority"],
          ["Enterprise", "Custom", "Ilimitado", "24/7"]
        ]}
      ]
    },
    {
      "elements": [
        { "type": "heading", "level": 2, "content": "Timeline del proyecto" },
        { "type": "timeline", "items": [
          { "phase": "Q1", "period": "Ene-Mar", "title": "MVP Launch", "items": ["Beta cerrada", "Onboarding", "Feedback loop"] },
          { "phase": "Q2", "period": "Abr-Jun", "title": "Public API", "items": ["SDKs", "Documentacion", "Rate limiting"] },
          { "phase": "Q3", "period": "Jul-Sep", "title": "Enterprise", "items": ["SSO", "RBAC", "Audit logs"] }
        ]}
      ]
    },
    {
      "elements": [
        { "type": "heading", "level": 2, "content": "Equipo" },
        { "type": "grid", "columns": 3, "items": [
          { "icon": "\uD83D\uDC68", "title": "Ana Lopez", "body": "CEO - Ex-Google" },
          { "icon": "\uD83D\uDC69", "title": "Carlos Ruiz", "body": "CTO - Arquitecto" },
          { "icon": "\uD83E\uDDD1", "title": "Maria Diaz", "body": "CPO - Producto" }
        ]}
      ]
    },
    {
      "elements": [
        { "type": "heading", "level": 2, "content": "Arquitectura" },
        { "type": "flow", "nodes": [
          { "id": "1", "label": "Client", "sublabel": "Web/Mobile" },
          { "id": "2", "label": "API Gateway", "sublabel": "REST/WS" },
          { "id": "3", "label": "Workers", "sublabel": "Auto-scale" },
          { "id": "4", "label": "DB", "sublabel": "PostgreSQL" }
        ]}
      ]
    },
    {
      "elements": [
        { "type": "heading", "level": 2, "content": "Placement manual", "placement": { "x": 2, "y": 0.5 }, "style": { "fontSize": 28, "color": "accent", "align": "center" } },
        { "type": "shape", "shape": "rect", "fill": "primary", "placement": { "x": 1, "y": 1.8, "w": 3, "h": 2 } },
        { "type": "shape", "shape": "rect", "fill": "secondary", "placement": { "x": 6, "y": 1.8, "w": 3, "h": 2 } },
        { "type": "shape", "shape": "circle", "fill": "accent", "placement": { "x": 3.5, "y": 2.5, "w": 3, "h": 1.5 } }
      ]
    },
    {
      "elements": [
        { "type": "heading", "level": 2, "content": "Dos columnas" },
        { "type": "column", "position": "left", "elements": [
          { "type": "text", "content": "Ventajas:\\n- Rapido\\n- Seguro\\n- Escalable", "style": { "fontSize": 13 } }
        ]},
        { "type": "column", "position": "right", "elements": [
          { "type": "text", "content": "Tecnologias:\\n- Node.js\\n- PostgreSQL\\n- Redis", "style": { "fontSize": 13 } }
        ]}
      ]
    },
    {
      "elements": [
        { "type": "heading", "level": 1, "content": "GRACIAS", "style": { "fontSize": 48, "color": "primary", "align": "center" } },
        { "type": "quote", "text": "La innovacion distingue a los lideres de los seguidores", "author": "Steve Jobs" },
        { "type": "divider" },
        { "type": "list", "items": ["contacto@empresa.com", "www.empresa.com", "@empresa en redes"] }
      ]
    }
  ]
}`

export const SAMPLE_JS_PPT = `// Ejemplo: 9 slides con stats, tabla, timeline, grid, flow, shapes, columnas
var pptxgen = require("pptxgenjs");
var pres = new pptxgen();
pres.layout = "LAYOUT_16x9";

// Slide 1: Portada
(function() {
  var s = pres.addSlide();
  s.background = { color: "1A1A2E" };
  s.addText("PORTADA DE PRUEBA", { x: 0.35, y: 0.35, w: 9.3, h: 0.65, fontSize: 44, bold: true, color: "C8922A" });
  s.addText("Subtitulo centrado", { x: 0.35, y: 1.08, w: 9.3, h: 0.33, fontSize: 16, color: "F4ECD8", align: "center" });
  s.addShape(pres.ShapeType.rect, { x: 0.35, y: 1.53, w: 9.3, h: 0.02, fill: { color: "2A2A3E" }, line: { type: "none" } });
  s.addText("Enero 2026", { x: 0.35, y: 1.65, w: 9.3, h: 0.3, fontSize: 11, bold: true, color: "E94560" });
})();

// Slide 2: Stats
(function() {
  var s = pres.addSlide();
  s.background = { color: "1A1A2E" };
  s.addText("Metricas clave", { x: 0.35, y: 0.43, w: 9.3, h: 0.35, fontSize: 22, bold: true, color: "C8922A" });
  var stats = [
    { v: "$2.4M", l: "ARR", d: "+156% YoY" },
    { v: "12K", l: "Usuarios", d: "+89% QoQ" },
    { v: "99.9%", l: "Uptime", d: "" }
  ];
  for (var i = 0; i < stats.length; i++) {
    var st = stats[i];
    var sx = 0.35 + i * 3.1;
    s.addText(st.v, { x: sx, y: 0.93, w: 3, h: 0.55, fontSize: 28, bold: true, color: "C8922A" });
    s.addText(st.l, { x: sx, y: 1.55, w: 3, h: 0.3, fontSize: 12, color: "F4ECD8", valign: "top" });
    if (st.d) s.addText(st.d, { x: sx, y: 1.85, w: 3, h: 0.25, fontSize: 10, color: "8899AA", valign: "top" });
  }
})();

// Slide 3: Table
(function() {
  var s = pres.addSlide();
  s.background = { color: "1A1A2E" };
  s.addText("Comparativa de planes", { x: 0.35, y: 0.43, w: 9.3, h: 0.35, fontSize: 22, bold: true, color: "C8922A" });
  var hdr = function(t) { return { text: t, options: { bold: true, color: "C8922A", fill: { color: "16213E" } } } };
  var cel = function(t) { return { text: t, options: { color: "F4ECD8" } } };
  var rw = function(a, b, c, d) { return [cel(a), cel(b), cel(c), cel(d)] };
  s.addTable([
    [hdr("Plan"), hdr("Precio"), hdr("Usuarios"), hdr("Soporte")],
    rw("Starter", "$29/mes", "5", "Email"),
    rw("Pro", "$99/mes", "50", "Priority"),
    rw("Enterprise", "Custom", "Ilimitado", "24/7")
  ], { x: 0.35, y: 1.1, w: 9.3, h: 1.2, fontSize: 11, border: { type: "solid", pt: 0.5, color: "2A2A3E" } });
})();

// Slide 4: Timeline
(function() {
  var s = pres.addSlide();
  s.background = { color: "1A1A2E" };
  s.addText("Timeline del proyecto", { x: 0.35, y: 0.43, w: 9.3, h: 0.35, fontSize: 22, bold: true, color: "C8922A" });
  var items = [
    { phase: "Q1", period: "Ene-Mar", title: "MVP Launch", subs: ["Beta cerrada", "Onboarding", "Feedback loop"] },
    { phase: "Q2", period: "Abr-Jun", title: "Public API", subs: ["SDKs", "Documentacion", "Rate limiting"] },
    { phase: "Q3", period: "Jul-Sep", title: "Enterprise", subs: ["SSO", "RBAC", "Audit logs"] }
  ];
  var ty = 1.1;
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    s.addShape(pres.ShapeType.ellipse, { x: 0.35, y: ty + 0.06, w: 0.12, h: 0.12, fill: { color: "C8922A" }, line: { type: "none" } });
    s.addText(it.period, { x: 0.55, y: ty, w: 1.2, h: 0.22, fontSize: 8, color: "8899AA" });
    s.addText(it.phase + "  " + it.title, { x: 1.8, y: ty, w: 7.5, h: 0.22, fontSize: 12, bold: true, color: "F4ECD8" });
    ty += 0.28;
    for (var j = 0; j < it.subs.length; j++) {
      s.addText("-  " + it.subs[j], { x: 1.8, y: ty, w: 7.5, h: 0.18, fontSize: 10, color: "8899AA" });
      ty += 0.18;
    }
    ty += 0.12;
  }
})();

// Slide 5: Team grid
(function() {
  var s = pres.addSlide();
  s.background = { color: "1A1A2E" };
  s.addText("Equipo", { x: 0.35, y: 0.43, w: 9.3, h: 0.35, fontSize: 22, bold: true, color: "C8922A" });
  var team = [
    { icon: "[A]", title: "Ana Lopez", body: "CEO - Ex-Google" },
    { icon: "[C]", title: "Carlos Ruiz", body: "CTO - Arquitecto" },
    { icon: "[M]", title: "Maria Diaz", body: "CPO - Producto" }
  ];
  for (var i = 0; i < team.length; i++) {
    var m = team[i];
    var cx = 0.35 + i * 3.1;
    s.addShape(pres.ShapeType.rect, { x: cx, y: 0.95, w: 2.9, h: 1.1, fill: { color: "16213E" }, line: { color: "2A2A3E", width: 0.5 } });
    s.addText(m.icon, { x: cx, y: 1.0, w: 2.9, h: 0.45, fontSize: 24, align: "center" });
    s.addText(m.title, { x: cx + 0.1, y: 1.55, w: 2.7, h: 0.25, fontSize: 14, bold: true, color: "C8922A", align: "center" });
    s.addText(m.body, { x: cx + 0.1, y: 1.8, w: 2.7, h: 0.2, fontSize: 10, color: "8899AA", align: "center" });
  }
})();

// Slide 6: Flow
(function() {
  var s = pres.addSlide();
  s.background = { color: "1A1A2E" };
  s.addText("Arquitectura", { x: 0.35, y: 0.43, w: 9.3, h: 0.35, fontSize: 22, bold: true, color: "C8922A" });
  var nodes = ["Client", "API Gateway", "Workers", "DB"];
  var subs = ["Web/Mobile", "REST/WS", "Auto-scale", "PostgreSQL"];
  for (var i = 0; i < nodes.length; i++) {
    var nx = 0.5 + i * 2.3;
    s.addShape(pres.ShapeType.rect, { x: nx, y: 1.5, w: 1.8, h: 0.8, fill: { color: "16213E" }, line: { color: "C8922A", width: 1 } });
    s.addText(nodes[i], { x: nx + 0.05, y: 1.52, w: 1.7, h: 0.4, fontSize: 12, bold: true, color: "F4ECD8", align: "center", valign: "middle" });
    s.addText(subs[i], { x: nx + 0.05, y: 1.92, w: 1.7, h: 0.3, fontSize: 9, color: "8899AA", align: "center", valign: "top" });
    if (i < nodes.length - 1) s.addText("->", { x: nx + 1.8, y: 1.5, w: 0.5, h: 0.8, fontSize: 16, color: "8899AA", align: "center", valign: "middle" });
  }
})();

// Slide 7: Shapes with placement
(function() {
  var s = pres.addSlide();
  s.background = { color: "1A1A2E" };
  s.addText("Placement manual", { x: 2, y: 0.5, w: 6, h: 0.5, fontSize: 28, color: "E94560", align: "center" });
  s.addShape(pres.ShapeType.rect, { x: 1, y: 1.8, w: 3, h: 2, fill: { color: "C8922A" }, line: { type: "none" } });
  s.addShape(pres.ShapeType.rect, { x: 6, y: 1.8, w: 3, h: 2, fill: { color: "0F3460" }, line: { type: "none" } });
  s.addShape(pres.ShapeType.ellipse, { x: 3.5, y: 2.5, w: 3, h: 1.5, fill: { color: "E94560" }, line: { type: "none" } });
})();

// Slide 8: Two columns
(function() {
  var s = pres.addSlide();
  s.background = { color: "1A1A2E" };
  s.addText("Dos columnas", { x: 0.35, y: 0.43, w: 9.3, h: 0.35, fontSize: 22, bold: true, color: "C8922A" });
  s.addText("Ventajas: - Rapido - Seguro - Escalable", { x: 0.45, y: 0.95, w: 4.3, h: 1.8, fontSize: 13, color: "F4ECD8", valign: "top" });
  s.addText("Tecnologias: - Node.js - PostgreSQL - Redis", { x: 5.25, y: 0.95, w: 4.3, h: 1.8, fontSize: 13, color: "F4ECD8", valign: "top" });
})();

// Slide 9: Closing
(function() {
  var s = pres.addSlide();
  s.background = { color: "1A1A2E" };
  s.addText("GRACIAS", { x: 0.35, y: 0.5, w: 9.3, h: 1.1, fontSize: 48, bold: true, color: "C8922A", align: "center" });
  s.addShape(pres.ShapeType.rect, { x: 0.35, y: 1.75, w: 9.3, h: 0.02, fill: { color: "E94560" }, line: { type: "none" } });
  s.addText("La innovacion distingue a los lideres de los seguidores", { x: 0.6, y: 2.0, w: 8.8, h: 0.5, fontSize: 14, italic: true, color: "8899AA" });
  s.addText("-- Steve Jobs", { x: 0.6, y: 2.5, w: 8.8, h: 0.25, fontSize: 11, color: "8899AA" });
  s.addShape(pres.ShapeType.rect, { x: 0.35, y: 3.0, w: 9.3, h: 0.02, fill: { color: "2A2A3E" }, line: { type: "none" } });
  s.addText([
    { text: "contacto@empresa.com", options: { bullet: true, breakLine: true } },
    { text: "www.empresa.com", options: { bullet: true, breakLine: true } },
    { text: "@empresa en redes", options: { bullet: true } }
  ], { x: 0.35, y: 3.2, w: 9.3, h: 1.5, fontSize: 14, color: "F4ECD8" });
})();

pres.writeFile({ fileName: "test.pptx" });`
