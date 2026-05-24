export const SAMPLE_CHATGPT_PPT = `// Generado por ChatGPT - Presentaci\u00f3n sobre Anemia
const pptxgen = require('pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'ChatGPT';
pptx.title = 'Presentaci\u00f3n sobre la Anemia';

function addTitle(slide, title) {
  slide.addText(title, {
    x: 0.5, y: 0.3, w: 12, h: 0.6,
    fontSize: 26, bold: true, color: 'B22222'
  });
}

function addFooter(slide) {
  slide.addText('Presentaci\u00f3n Educativa - Anemia', {
    x: 0.4, y: 7, w: 4, h: 0.3, fontSize: 10, color: '666666'
  });
}

// Portada
{
  const slide = pptx.addSlide();
  slide.background = { color: 'FFF5F5' };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 0.25,
    fill: { color: 'B22222' }
  });
  slide.addText('ANEMIA', {
    x: 1, y: 1.5, w: 5, h: 1,
    fontSize: 30, bold: true, color: 'B22222'
  });
  slide.addText('Definici\u00f3n, causas, s\u00edntomas y prevenci\u00f3n', {
    x: 1, y: 2.5, w: 7, h: 0.6, fontSize: 18, color: '333333'
  });
  addFooter(slide);
}

// \u00bfQu\u00e9 es la anemia?
{
  const slide = pptx.addSlide();
  addTitle(slide, '\u00bfQu\u00e9 es la anemia?');
  slide.addText([
    { text: 'La anemia es una condici\u00f3n en la que el cuerpo tiene insuficientes gl\u00f3bulos rojos.' },
    { text: ' Reduce el transporte de ox\u00edgeno.', options: { bold: true } }
  ], { x: 0.8, y: 1.2, w: 11.5, h: 1, fontSize: 20, color: '333333' });
  slide.addText('Consecuencias:', {
    x: 0.9, y: 3, w: 4, h: 0.4, fontSize: 18, bold: true, color: 'B22222'
  });
  slide.addText([
    { text: '\u2022 Fatiga y debilidad', options: { breakLine: true } },
    { text: '\u2022 Falta de concentraci\u00f3n', options: { breakLine: true } },
    { text: '\u2022 Mareos y palidez' }
  ], { x: 1.2, y: 3.6, w: 5, h: 2, fontSize: 18, color: '444444' });
  addFooter(slide);
}

// Causas
{
  const slide = pptx.addSlide();
  addTitle(slide, 'Principales causas');
  const causes = [
    'Mala alimentaci\u00f3n o baja ingesta de hierro',
    'P\u00e9rdida de sangre por menstruaci\u00f3n',
    'Problemas de absorci\u00f3n intestinal',
    'Enfermedades cr\u00f3nicas', 'D\u00e9ficit de vitaminas'
  ];
  causes.forEach((cause, i) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.3 + i * 0.9, w: 0.5, h: 0.5,
      fill: { color: 'B22222' }, radius: 0.1
    });
    slide.addText(cause, {
      x: 1.5, y: 1.35 + i * 0.9, w: 9, h: 0.4, fontSize: 20, color: '333333'
    });
  });
  addFooter(slide);
}

// Prevenci\u00f3n
{
  const slide = pptx.addSlide();
  addTitle(slide, 'Prevenci\u00f3n');
  const foods = ['Carnes rojas', 'Espinaca', 'Lentejas', 'H\u00edgado'];
  foods.forEach((food, i) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: 1 + (i % 2) * 4, y: 2 + Math.floor(i / 2) * 1, w: 3, h: 0.7,
      fill: { color: 'FFE4E1' }, line: { color: 'B22222', pt: 1 }
    });
    slide.addText(food, {
      x: 1, y: 2.2 + Math.floor(i / 2) * 1, w: 3, h: 0.3,
      fontSize: 18, bold: true, color: 'B22222', align: 'center'
    });
  });
  addFooter(slide);
}

// Conclusi\u00f3n
{
  const slide = pptx.addSlide();
  addTitle(slide, 'Conclusi\u00f3n');
  slide.addText(
    'La anemia puede prevenirse y tratarse con buena alimentaci\u00f3n y atenci\u00f3n m\u00e9dica.',
    { x: 1, y: 2, w: 10, h: 1.5, fontSize: 24, align: 'center', color: '333333', bold: true }
  );
  addFooter(slide);
}

pptx.writeFile({ fileName: 'Presentacion_Anemia.pptx' });`

export const SAMPLE_CLAUDE_PPT = `const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "Anemia - Presentaci\u00f3n M\u00e9dica";

const RED    = "C0392B";
const DKRED  = "922B21";
const LTRED  = "F1948A";
const WHITE  = "FFFFFF";
const CREAM  = "FDF2F2";
const GRAY   = "7F8C8D";
const DKGRAY = "2C3E50";
const LGRAY  = "ECF0F1";

function addCard(slide, x, y, w, h, titleText, bodyLines, accent) {
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: WHITE },
    shadow: { type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.10 }
  });
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.07, h, fill: { color: accent } });
  slide.addText(titleText, {
    x: x + 0.18, y: y + 0.14, w: w - 0.3, h: 0.32,
    fontSize: 11, bold: true, color: accent, fontFace: "Calibri", margin: 0
  });
  slide.addText(bodyLines, {
    x: x + 0.18, y: y + 0.48, w: w - 0.3, h: h - 0.6,
    fontSize: 10, color: DKGRAY, fontFace: "Calibri", valign: "top", margin: 0
  });
}

// Portada
{
  const s = pres.addSlide();
  s.background = { color: DKRED };
  s.addShape(pres.shapes.OVAL, { x: 6.5, y: -1.5, w: 5.5, h: 5.5, fill: { color: RED, transparency: 55 } });
  s.addText("ANEMIA", {
    x: 0.7, y: 1.0, w: 8.5, h: 1.4,
    fontSize: 72, bold: true, color: WHITE, fontFace: "Georgia", charSpacing: 10, margin: 0
  });
  s.addText("Fisiopatolog\u00eda, Diagn\u00f3stico y Tratamiento", {
    x: 0.7, y: 2.55, w: 8, h: 0.5, fontSize: 20, color: LTRED, fontFace: "Calibri", margin: 0
  });
}

// Definici\u00f3n
{
  const s = pres.addSlide();
  s.background = { color: CREAM };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.05, fill: { color: RED } });
  s.addText("\u00bfQU\u00c9 ES LA ANEMIA?", {
    x: 0.4, y: 0.2, w: 9, h: 0.65,
    fontSize: 28, bold: true, color: WHITE, fontFace: "Georgia", charSpacing: 3, margin: 0
  });
  s.addText(
    "Condici\u00f3n con concentraci\u00f3n de hemoglobina por debajo de lo normal, reduciendo el transporte de ox\u00edgeno.",
    { x: 0.6, y: 1.35, w: 8.8, h: 0.8, fontSize: 12.5, color: DKGRAY, fontFace: "Calibri", italic: true, margin: 0 }
  );
  s.addText("Valores de Hemoglobina (OMS)", {
    x: 0.4, y: 2.5, w: 9, h: 0.35, fontSize: 14, bold: true, color: RED, fontFace: "Calibri", margin: 0
  });
  const groups = [
    ["Hombres adultos", "< 13 g/dL"], ["Mujeres adultas", "< 12 g/dL"],
    ["Embarazadas", "< 11 g/dL"], ["Ni\u00f1os 6-59m", "< 11 g/dL"],
  ];
  groups.forEach(([g, v], i) => {
    const x = 0.4 + (i < 2 ? 0 : 1) * 4.7;
    const y = 3.0 + (i % 2) * 0.9;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.4, h: 0.75, fill: { color: i % 2 === 0 ? WHITE : LGRAY } });
    s.addText(g, { x: x + 0.15, y: y + 0.12, w: 2.8, h: 0.5, fontSize: 11, color: DKGRAY, fontFace: "Calibri", margin: 0 });
    s.addText(v, { x: x + 3.0, y: y + 0.1, w: 1.2, h: 0.55, fontSize: 14, bold: true, color: RED, fontFace: "Calibri", align: "center", margin: 0 });
  });
}

// Causas
{
  const s = pres.addSlide();
  s.background = { color: CREAM };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.05, fill: { color: RED } });
  s.addText("CAUSAS M\u00c1S FRECUENTES", {
    x: 0.4, y: 0.2, w: 9, h: 0.65, fontSize: 26, bold: true, color: WHITE, fontFace: "Georgia", charSpacing: 2, margin: 0
  });
  const cards = [
    { title: "Deficiencia de Hierro", body: "Causa m\u00e1s com\u00fan. Dieta pobre, malabsorci\u00f3n, p\u00e9rdidas cr\u00f3nicas." },
    { title: "D\u00e9ficit de B12/Folato", body: "Anemia megalobl\u00e1stica. Dieta vegana, malabsorci\u00f3n, gastritis." },
    { title: "Enfermedad Cr\u00f3nica", body: "Inflamaci\u00f3n cr\u00f3nica, IRC, c\u00e1ncer, autoinmunes." },
    { title: "P\u00e9rdida Aguda", body: "Trauma, cirug\u00eda, hemorragia digestiva." },
    { title: "Hem\u00f3lisis", body: "Destrucci\u00f3n prematura de eritrocitos. Talasemia, malaria." },
    { title: "Insuf. Medular", body: "Aplasia, infiltraci\u00f3n, mielodisplasia." },
  ];
  cards.forEach((c, i) => addCard(s, 0.25 + (i % 3) * 3.22, 1.2 + Math.floor(i / 3) * 2.15, 3.0, 1.95,
    c.title, [{ text: c.body }], RED));
}

// S\u00edntomas
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.05, fill: { color: DKRED } });
  s.addText("S\u00cdNTOMAS Y SIGNOS", {
    x: 0.4, y: 0.2, w: 9, h: 0.65, fontSize: 26, bold: true, color: WHITE, fontFace: "Georgia", charSpacing: 2, margin: 0
  });
  s.addText("S\u00edntomas", { x: 0.35, y: 1.15, w: 4.5, h: 0.4, fontSize: 14, bold: true, color: RED, fontFace: "Calibri", margin: 0 });
  s.addText(["Fatiga", "Disnea", "Palpitaciones", "Cefalea"].map(t => ({ text: t, options: { bullet: true, breakLine: true } })),
    { x: 0.35, y: 1.6, w: 4.3, h: 3.5, fontSize: 12, color: DKGRAY, fontFace: "Calibri" });
  s.addText("Signos", { x: 5.15, y: 1.15, w: 4.5, h: 0.4, fontSize: 14, bold: true, color: RED, fontFace: "Calibri", margin: 0 });
  s.addText(["Palidez", "Taquicardia", "Soplo", "Glositis"].map(t => ({ text: t, options: { bullet: true, breakLine: true } })),
    { x: 5.15, y: 1.6, w: 4.3, h: 3.5, fontSize: 12, color: DKGRAY, fontFace: "Calibri" });
}

// Tratamiento
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.05, fill: { color: DKRED } });
  s.addText("TRATAMIENTO", {
    x: 0.4, y: 0.2, w: 9, h: 0.65, fontSize: 26, bold: true, color: WHITE, fontFace: "Georgia", charSpacing: 2, margin: 0
  });
  const tx = [
    { title: "Hierro", body: "VO: sulfato ferroso 150-200 mg/d\u00eda por 3-6 meses.", color: RED },
    { title: "B12/Folato", body: "Cianocobalamina IM 1000 \u00b5g/sem. \u00c1c. f\u00f3lico 5 mg/d\u00eda.", color: "8E44AD" },
    { title: "EPO", body: "Eritropoyetina en anemia renal o quimioterapia.", color: "2874A6" },
    { title: "Transfusi\u00f3n", body: "Reservada para Hb <7 g/dL o inestabilidad.", color: "B7950B" },
    { title: "TMO", body: "Trasplante m\u00e9dula \u00f3sea en aplasia severa.", color: "1A5276" },
    { title: "Causa base", body: "Tratar hemorragias, inflamaci\u00f3n, nutrici\u00f3n.", color: "117A65" },
  ];
  tx.forEach((c, i) => addCard(s, 0.25 + (i % 3) * 3.22, 1.15 + Math.floor(i / 3) * 2.2, 3.0, 2.0,
    c.title, [{ text: c.body }], c.color));
}

// Conclusiones
{
  const s = pres.addSlide();
  s.background = { color: DKRED };
  s.addShape(pres.shapes.OVAL, { x: 6.5, y: -1.2, w: 5, h: 5, fill: { color: RED, transparency: 60 } });
  s.addText("CONCLUSIONES", {
    x: 0.6, y: 0.3, w: 8.5, h: 0.7, fontSize: 36, bold: true, color: WHITE, fontFace: "Georgia", charSpacing: 5, margin: 0
  });
  const pts = [
    "La anemia afecta a ~1,620 millones de personas globalmente.",
    "La deficiencia de hierro es >50% de todos los casos.",
    "Diagn\u00f3stico temprano con hemograma y ferritina.",
    "Tratar la causa subyacente, no solo la Hb.",
    "Prevenci\u00f3n nutricional y de salud p\u00fablica costo-efectiva.",
  ];
  pts.forEach((txt, i) => {
    s.addShape(pres.shapes.OVAL, { x: 0.5, y: 1.25 + i * 0.82, w: 0.38, h: 0.38, fill: { color: LTRED } });
    s.addText(String(i + 1), { x: 0.5, y: 1.25 + i * 0.82, w: 0.38, h: 0.38, fontSize: 12, bold: true, color: DKRED, fontFace: "Calibri", align: "center", margin: 0 });
    s.addText(txt, { x: 1.05, y: 1.28 + i * 0.82, w: 8.2, h: 0.55, fontSize: 12, color: WHITE, fontFace: "Calibri", margin: 0 });
  });
}

pres.writeFile({ fileName: "Anemia_Presentacion_Claude.pptx" })
  .then(() => console.log("Presentaci\u00f3n creada"))
  .catch(err => { console.error("Error:", err); process.exit(1); });`
