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
  "corporate-dark": {
    name: "Corporate Dark",
    colors: {
      primary: "38BDF8", secondary: "1E3A5F", accent: "F87171",
      background: "0F172A", surface: "1E293B", text: "F1F5F9",
      textSecondary: "94A3B8", border: "334155", success: "4ADE80",
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
    return expandTheme(themeRef as unknown as Record<string, unknown>)
  }
  const name = typeof themeRef === "string" ? themeRef : "corporate-light"
  const builtIn = DEFAULT_THEMES[name]
  if (builtIn) return expandTheme(builtIn as unknown as Record<string, unknown>)
  return expandTheme(DEFAULT_THEMES["corporate-light"] as unknown as Record<string, unknown>)
}

function expandTheme(t: Record<string, unknown>): ResolvedTheme {
  const colors = t.colors as Record<string, string> | undefined
  const c: Record<string, string> = colors ? { ...colors } : {}

  // Flattened theme: { primary: "#xxx", background: "#xxx", ... }
  if (Object.keys(c).length === 0) {
    const flatKeys = ["primary", "secondary", "accent", "background", "surface", "text", "textSecondary", "border", "success"]
    for (const k of flatKeys) {
      if (typeof t[k] === "string") c[k] = t[k] as string
    }
  }

  // Legacy fallback
  if (Object.keys(c).length === 0 && t.primaryColor) {
    c.primary = t.primaryColor as string
    c.secondary = (t.secondaryColor as string) || ""
    c.accent = (t.accentColor as string) || ""
    c.background = (t.backgroundColor as string) || "FFFFFF"
    c.text = (t.textColor as string) || (t.color as string) || "333333"
    c.surface = (t.surfaceColor as string) || ""
    c.textSecondary = (t.textSecondaryColor as string) || ""
    c.border = (t.borderColor as string) || ""
  }

  const fonts = t.fonts as Record<string, string> | undefined || {}

  return {
    colors: {
      primary: c.primary || "1A5276",
      secondary: c.secondary || "2E86C1",
      accent: c.accent || "F39C12",
      background: c.background || "FFFFFF",
      surface: c.surface || "F8F9FA",
      text: c.text || "2C3E50",
      textSecondary: c.textSecondary || "7F8C8D",
      border: c.border || "E0E0E0",
      success: c.success || "27AE60",
    },
    fonts: {
      heading: fonts.heading || "Calibri",
      body: fonts.body || "Calibri",
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
  try {
    const base = { ...DEFAULT_STYLE, ...defaults }
    const colorRef = (elementStyle?.color as string) || base.color
    const bgRef = (elementStyle?.bgColor as string) || base.bgColor
    return {
      color: resolveColor(colorRef, resolvedTheme),
      bgColor: bgRef === "transparent" ? "" : resolveColor(bgRef, resolvedTheme),
      fontSize: elementStyle?.fontSize !== undefined ? (elementStyle.fontSize as number) : base.fontSize,
      bold: elementStyle?.bold !== undefined ? (elementStyle.bold as boolean) : base.bold,
      italic: elementStyle?.italic !== undefined ? (elementStyle.italic as boolean) : base.italic,
      align: (elementStyle?.align as "left" | "center" | "right") || base.align,
      fontFace: resolveFont((elementStyle?.fontFace as string) || base.fontFace, resolvedTheme),
      padding: elementStyle?.padding !== undefined ? (elementStyle.padding as number) : base.padding,
    }
  } catch {
    return { color: "333333", bgColor: "", fontSize: 14, bold: false, italic: false, align: "left", fontFace: "Calibri", padding: 4 }
  }
}

export function resolveColor(ref: string, theme: ResolvedTheme): string {
  if (!ref || ref === "transparent") return ""
  try {
    if (theme.colors[ref]) return theme.colors[ref]
    if (/^[0-9A-Fa-f]{6}$/.test(ref) || /^#[0-9A-Fa-f]{6}$/.test(ref)) return ref.replace("#", "")
  } catch {}
  return ref
}

function resolveFont(ref: string, theme: ResolvedTheme): string {
  if (ref === "heading") return theme.fonts.heading
  if (ref === "body") return theme.fonts.body
  return ref
}
