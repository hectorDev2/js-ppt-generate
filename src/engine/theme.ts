import type { ThemeDef, ResolvedTheme } from "../schema/types.js"

const DEFAULT_THEMES: Record<string, ThemeDef> = {
  "corporate-light": {
    name: "Corporate Light",
    colors: {
      primary: "1A5276", secondary: "2E86C1", accent: "F39C12",
      background: "FFFFFF", surface: "F8F9FA", text: "2C3E50",
      textSecondary: "7F8C8D", border: "E0E0E0", success: "27AE60",
    },
    fonts: { heading: "Calibri", body: "Calibri" },
  },
  "dark": {
    name: "Dark",
    colors: {
      primary: "C8922A", secondary: "0F3460", accent: "E94560",
      background: "1A1A2E", surface: "16213E", text: "F4ECD8",
      textSecondary: "8899AA", border: "2A2A3E", success: "2ECC71",
    },
    fonts: { heading: "Calibri", body: "Calibri" },
  },
  "minimal": {
    name: "Minimal",
    colors: {
      primary: "000000", secondary: "333333", accent: "666666",
      background: "FFFFFF", surface: "F5F5F5", text: "111111",
      textSecondary: "888888", border: "DDDDDD", success: "2ECC71",
    },
    fonts: { heading: "Arial", body: "Arial" },
  },
}

const DEFAULT_STYLE = {
  color: "text",
  bgColor: "transparent",
  fontSize: 18,
  bold: false,
  italic: false,
  align: "left" as const,
  fontFace: "body",
  padding: 8,
}

export function resolveTheme(themeRef: string | ThemeDef | undefined): ResolvedTheme {
  if (typeof themeRef === "object" && themeRef) {
    return expandTheme(themeRef)
  }
  const name = typeof themeRef === "string" ? themeRef : "corporate-light"
  const builtIn = DEFAULT_THEMES[name]
  if (builtIn) return expandTheme(builtIn)
  return expandTheme(DEFAULT_THEMES["corporate-light"])
}

function expandTheme(t: ThemeDef): ResolvedTheme {
  return {
    colors: {
      primary: t.colors.primary || "1A5276",
      secondary: t.colors.secondary || "2E86C1",
      accent: t.colors.accent || "F39C12",
      background: t.colors.background || "FFFFFF",
      surface: t.colors.surface || "F8F9FA",
      text: t.colors.text || "2C3E50",
      textSecondary: t.colors.textSecondary || "7F8C8D",
      border: t.colors.border || "E0E0E0",
      success: t.colors.success || "27AE60",
      ...t.colors,
    },
    fonts: {
      heading: t.fonts?.heading || "Calibri",
      body: t.fonts?.body || "Calibri",
    },
  }
}

export function resolveStyle(
  elementStyle: Record<string, unknown> | undefined,
  resolvedTheme: ResolvedTheme,
  defaults: Partial<typeof DEFAULT_STYLE> = {},
): {
  color: string
  bgColor: string
  fontSize: number
  bold: boolean
  italic: boolean
  align: "left" | "center" | "right"
  fontFace: string
  padding: number
} {
  const base = { ...DEFAULT_STYLE, ...defaults }

  const colorRef = elementStyle?.color as string || base.color
  const bgRef = elementStyle?.bgColor as string || base.bgColor

  return {
    color: resolveColor(colorRef, resolvedTheme),
    bgColor: bgRef === "transparent" ? "" : resolveColor(bgRef, resolvedTheme),
    fontSize: (elementStyle?.fontSize as number) || base.fontSize,
    bold: (elementStyle?.bold as boolean) || base.bold,
    italic: (elementStyle?.italic as boolean) || base.italic,
    align: (elementStyle?.align as "left" | "center" | "right") || base.align,
    fontFace: resolveFont((elementStyle?.fontFace as string) || base.fontFace, resolvedTheme),
    padding: (elementStyle?.padding as number) || base.padding,
  }
}

export function resolveColor(ref: string, theme: ResolvedTheme): string {
  if (!ref || ref === "transparent") return ""
  if (theme.colors[ref]) return theme.colors[ref]
  if (/^[0-9A-Fa-f]{6}$/.test(ref) || /^#[0-9A-Fa-f]{6}$/.test(ref)) return ref.replace("#", "")
  return ref
}

function resolveFont(ref: string, theme: ResolvedTheme): string {
  if (ref === "heading") return theme.fonts.heading
  if (ref === "body") return theme.fonts.body
  return ref
}
