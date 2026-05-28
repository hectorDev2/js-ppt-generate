// ── JSON Schema Universal (Input Format) ─────────────────────

export interface PresentationSchema {
  version: string
  type: "presentation"
  theme?: string | ThemeDef
  slides: SlideDef[]
  title?: string
  meta?: { title?: string; [key: string]: unknown }
  definitions?: Record<string, ComponentDef>
}

export interface ComponentDef {
  elements: ElementDef[]
}

export interface ThemeDef {
  name?: string
  colors: Record<string, string>
  fonts?: { heading?: string; body?: string }
  background?: string
  primary?: string
  secondary?: string
  accent?: string
  text?: string
  textSecondary?: string
  surface?: string
  border?: string
  success?: string
}

export interface SlideDef {
  id?: string
  layout?: SlideLayout
  background?: string
  elements: ElementDef[]
}

export type SlideLayout = "cover" | "section" | "content" | "closing" | "blank"

export type ElementDef =
  | HeadingDef | TextDef | ImageDef
  | ListDef | TableDef | ShapeDef
  | GridDef | StatDef | QuoteDef | DividerDef
  | LabelDef | CardsDef | ColumnDef | FlowDef | TimelineDef
  | ComponentRefDef | ChartDef

export interface BaseElement {
  style?: Partial<ElementStyle>
  grid?: GridPos
  placement?: Partial<Rect>
}

export interface GridPos {
  col: number    // 1-12
  span: number   // 1-12
  row?: number
}

export interface ElementStyle {
  color: string
  bgColor: string
  fontSize: number
  bold: boolean
  italic: boolean
  align: "left" | "center" | "right"
  fontFace: string
  padding: number
}

export interface HeadingDef extends BaseElement {
  type: "heading"
  level: 1 | 2 | 3
  content: string
}

export interface TextDef extends BaseElement {
  type: "text"
  content: string
}

export interface ImageDef extends BaseElement {
  type: "image"
  src: string
  alt?: string
}

export interface ListDef extends BaseElement {
  type: "list"
  ordered?: boolean
  items: string[]
}

export interface TableDef extends BaseElement {
  type: "table"
  headers: string[]
  rows: string[][]
}

export interface ShapeDef extends BaseElement {
  type: "shape"
  shape: "rect" | "circle" | "line"
  fill?: string
  width?: number
  height?: number
}

export interface GridDef extends BaseElement {
  type: "grid"
  columns: number
  items: GridItem[]
}

export interface GridItem {
  icon?: string
  title?: string
  body?: string
}

export interface StatDef extends BaseElement {
  type: "stat"
  value: string
  label: string
  detail?: string
}

export interface QuoteDef extends BaseElement {
  type: "quote"
  text: string
  author?: string
}

export interface DividerDef extends BaseElement {
  type: "divider"
}

export interface LabelDef extends BaseElement {
  type: "label"
  content: string
}

export interface CardsDef extends BaseElement {
  type: "cards"
  columns?: number
  items: GridItem[]
}

export interface ColumnDef extends BaseElement {
  type: "column"
  position: "left" | "right"
  elements: ElementDef[]
}

export interface FlowDef extends BaseElement {
  type: "flow"
  nodes: FlowNode[]
}

export interface FlowNode {
  id: string
  label: string
  sublabel?: string
}

export interface TimelineDef extends BaseElement {
  type: "timeline"
  items: TimelineItem[]
}

export interface TimelineItem {
  phase: string
  period: string
  title: string
  items: string[]
}

export interface ComponentRefDef extends BaseElement {
  type: "component"
  ref: string
  props?: Record<string, string>
}

export type ChartType = "bar" | "line" | "pie" | "doughnut" | "radar" | "scatter" | "area"

export interface ChartDef extends BaseElement {
  type: "chart"
  chartType: ChartType
  data: ChartSeries[]
  labels?: string[]
  title?: string
  showLegend?: boolean
  showValues?: boolean
  catAxisLabel?: string
  valAxisLabel?: string
}

export interface ChartSeries {
  name: string
  values: number[]
}

// ── Document Node Tree (Resolved Runtime) ────────────────────

export interface DocumentNodeTree {
  slides: SlideNode[]
  theme: ResolvedTheme
  metadata: { title?: string; slideCount: number }
}

export interface SlideNode {
  id: string
  layout: SlideLayout
  background: string
  elements: ElementNode[]
}

export type ElementNode = BaseElementNode & {
  type: string
  content: unknown
}

export interface BaseElementNode {
  type: string
  computed: Rect
  style: ResolvedStyle
  content: unknown
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface ResolvedStyle {
  color: string
  bgColor: string
  fontSize: number
  bold: boolean
  italic: boolean
  align: "left" | "center" | "right"
  fontFace: string
  padding: number
}

export interface ResolvedTheme {
  colors: Record<string, string>
  fonts: { heading: string; body: string }
}
