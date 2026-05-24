export const SAMPLE_PRESENTATION = `{
  "version": "1.0",
  "type": "presentation",
  "theme": "dark",
  "slides": [
    {
      "layout": "cover",
      "elements": [
        { "type": "shape", "shape": "rect", "fill": "primary", "height": 0.06 },
        { "type": "heading", "level": 1, "content": "CLOUDNEX", "style": { "color": "primary", "fontSize": 56 } },
        { "type": "heading", "level": 2, "content": "Plataforma SaaS para equipos modernos" },
        { "type": "text", "content": "Infraestructura serverless · Auto-scaling · Zero ops" }
      ]
    },
    {
      "layout": "content",
      "elements": [
        { "type": "heading", "level": 1, "content": "Traction" },
        { "type": "stat", "value": "$2.4M", "label": "ARR", "detail": "+156%" },
        { "type": "stat", "value": "12K", "label": "Usuarios activos", "detail": "+89%" },
        { "type": "stat", "value": "99.9%", "label": "Uptime" }
      ]
    },
    {
      "layout": "content",
      "elements": [
        { "type": "heading", "level": 1, "content": "Roadmap 2026" },
        { "type": "divider" },
        {
          "type": "list",
          "items": [
            "Q1 — MVP Launch: Beta cerrada con 50 empresas",
            "Q2 — API P\u00fablica: SDKs para Python, Go, Rust",
            "Q3 — Enterprise: SSO, audit logs, compliance",
            "Q4 — Marketplace: Plugins de terceros"
          ]
        }
      ]
    },
    {
      "layout": "content",
      "elements": [
        { "type": "heading", "level": 1, "content": "CloudNex vs Tradicional" },
        {
          "type": "table",
          "headers": ["\u00c1rea", "Tradicional", "CloudNex"],
          "rows": [
            ["Setup", "Semanas", "Minutos"],
            ["Costo", "Fijo alto", "Pago por uso"],
            ["Escalado", "Manual", "Auto-scaling"],
            ["Mantenimiento", "24/7", "Zero ops"]
          ]
        }
      ]
    },
    {
      "layout": "content",
      "elements": [
        { "type": "heading", "level": 1, "content": "Equipo" },
        {
          "type": "grid",
          "columns": 3,
          "items": [
            { "title": "Ana L\u00f3pez", "body": "CEO · Ex-Google, 10 a\u00f1os en cloud" },
            { "title": "Carlos Ruiz", "body": "CTO · Arquitecto distribuido" },
            { "title": "Mar\u00eda Paz", "body": "CPO · Product-led growth" }
          ]
        }
      ]
    },
    {
      "layout": "content",
      "elements": [
        { "type": "heading", "level": 1, "content": "Lo que dicen nuestros clientes" },
        { "type": "quote", "text": "Pasamos de 2 semanas de setup a 10 minutos. Incre\u00edble.", "author": "TechCorp CTO" }
      ]
    },
    {
      "layout": "closing",
      "elements": [
        { "type": "shape", "shape": "rect", "fill": "primary", "height": 0.06 },
        { "type": "heading", "level": 1, "content": "\u00bfListo para el futuro?", "style": { "color": "primary" } },
        { "type": "text", "content": "Primeros 1000 usuarios con 6 meses gratis" }
      ]
    }
  ]
}`
