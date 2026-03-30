/**
 * White-Label Runtime Theming
 * 
 * Allows organizations to customize:
 * - Brand colors (primary, accent, background)
 * - Logo and favicon
 * - Font family
 * - Border radius
 * - Custom CSS overrides
 * 
 * Theme is loaded from org settings and applied via CSS custom properties.
 */

export type WhiteLabelTheme = {
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  fontFamily?: string;
  borderRadius?: string;
  customCss?: string;
  companyName?: string;
};

const DEFAULT_THEME: WhiteLabelTheme = {
  primaryColor: "oklch(0.696 0.17 162.48)",
  accentColor: "oklch(0.696 0.17 162.48)",
  borderRadius: "0.625rem",
  fontFamily: "'Inter', system-ui, sans-serif",
};

let currentTheme: WhiteLabelTheme = { ...DEFAULT_THEME };
let styleElement: HTMLStyleElement | null = null;

/**
 * Apply a white-label theme to the application.
 * Injects CSS custom properties and optional custom CSS.
 */
export function applyTheme(theme: WhiteLabelTheme): void {
  currentTheme = { ...DEFAULT_THEME, ...theme };

  // Create or update style element
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = "whitelabel-theme";
    document.head.appendChild(styleElement);
  }

  const css = `
    :root {
      ${currentTheme.primaryColor ? `--primary: ${currentTheme.primaryColor};` : ""}
      ${currentTheme.accentColor ? `--accent: ${currentTheme.accentColor};` : ""}
      ${currentTheme.backgroundColor ? `--background: ${currentTheme.backgroundColor};` : ""}
      ${currentTheme.foregroundColor ? `--foreground: ${currentTheme.foregroundColor};` : ""}
      ${currentTheme.borderRadius ? `--radius: ${currentTheme.borderRadius};` : ""}
      ${currentTheme.fontFamily ? `--font-sans: ${currentTheme.fontFamily};` : ""}
    }
    ${currentTheme.customCss || ""}
  `;

  styleElement.textContent = css;

  // Update favicon if provided
  if (currentTheme.faviconUrl) {
    const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (link) {
      link.href = currentTheme.faviconUrl;
    }
  }

  // Update document title if company name provided
  if (currentTheme.companyName) {
    document.title = `${currentTheme.companyName} - Learning Platform`;
  }
}

/**
 * Reset theme to defaults.
 */
export function resetTheme(): void {
  currentTheme = { ...DEFAULT_THEME };
  if (styleElement) {
    styleElement.textContent = "";
  }
}

/**
 * Get the current theme.
 */
export function getCurrentTheme(): WhiteLabelTheme {
  return { ...currentTheme };
}

/**
 * Load theme from organization settings.
 */
export function loadThemeFromSettings(settings: Record<string, unknown> | null): void {
  if (!settings?.whiteLabel) return;
  const wl = settings.whiteLabel as WhiteLabelTheme;
  applyTheme(wl);
}
