/**
 * Focus collage color presets — sampled from focus-collage-reference.jpg.
 *
 * Preview: `?theme=walnut`, `?theme=espresso`, `?theme=sage`, or `?theme=ink`
 * Prod default: `walnut`.
 */

export const THEME_STORAGE_KEY = "fovea.theme";
export const DEFAULT_THEME_ID = "walnut";
export const COLLAGE_REFERENCE = "/design/focus-collage-reference.jpg";

/** @typedef {{
 *   id: string;
 *   label: string;
 *   description: string;
 *   prodCandidate?: boolean;
 *   reference?: string;
 *   palette: {
 *     label: string;
 *     swatch: string;
 *     bg: string;
 *     center: string;
 *     centerDark: string;
 *     centerGlow: string;
 *     accentSoft: string;
 *     surface: string;
 *     nodes: string[];
 *     line: string;
 *     icon: string;
 *     muted: string;
 *     onAccent: string;
 *     wall?: string;
 *     brandSoft?: string;
 *   };
 *   collage: {
 *     photoFilter: string;
 *     surfaceMix: string;
 *   };
 *   sidebar?: {
 *     dark?: boolean;
 *     bg: string;
 *     surface: string;
 *     border: string;
 *     text: string;
 *     muted: string;
 *     hover: string;
 *     accent: string;
 *   };
 *   header?: {
 *     dark?: boolean;
 *     bg: string;
 *     surface: string;
 *     border: string;
 *     text: string;
 *     muted: string;
 *     hover: string;
 *     accent: string;
 *   };
 * }} FoveaThemePreset */

export const THEME_PRESETS = {
  /** Charcoal nav + espresso header — current prod default */
  walnut: {
    id: "walnut",
    label: "Walnut",
    description: "Charcoal nav, espresso header, cream paper, honey-gold accents.",
    prodCandidate: true,
    reference: COLLAGE_REFERENCE,
    palette: {
      label: "Walnut",
      swatch: "#7a5c42",
      bg: "#f9f6ee",
      center: "#7a5c42",
      centerDark: "#5c4532",
      centerGlow: "rgba(122, 92, 66, 0.22)",
      accentSoft: "#f0e8dc",
      surface: "#fdfaf4",
      nodes: ["#4a382c", "#5c4638", "#6e5644", "#2a231c"],
      line: "#e5d9c8",
      icon: "#2a231c",
      muted: "#8a7b6b",
      onAccent: "#ffffff",
      wall: "#ebe3d4",
      brandSoft: "#f0e8dc",
    },
    collage: {
      photoFilter: "sepia(0.22) saturate(0.92) brightness(1.02)",
      surfaceMix: "#e8dcc8",
    },
    sidebar: {
      dark: true,
      bg: "#2a231c",
      surface: "#332a22",
      border: "#453a30",
      text: "#faf6f0",
      muted: "#b5a696",
      hover: "#3a3028",
      accent: "#d4b896",
    },
    header: {
      dark: true,
      bg: "#1a1410",
      surface: "#241d18",
      border: "#3a322a",
      text: "#f5f0ea",
      muted: "#a8998a",
      hover: "#2e261f",
      accent: "#c9a882",
    },
  },

  /** Deep image shadows — darkest chrome */
  espresso: {
    id: "espresso",
    label: "Espresso",
    description: "Near-black chrome from collage shadows, cream paper, tan accents.",
    reference: COLLAGE_REFERENCE,
    palette: {
      label: "Espresso",
      swatch: "#4e4224",
      bg: "#f8ecd6",
      center: "#8d7851",
      centerDark: "#4e4224",
      centerGlow: "rgba(78, 66, 36, 0.2)",
      accentSoft: "#f0e4d0",
      surface: "#faf6f0",
      nodes: ["#141610", "#302914", "#4e4224", "#74592f"],
      line: "#dfd2bf",
      icon: "#141610",
      muted: "#8d7851",
      onAccent: "#ffffff",
      wall: "#e8dcc8",
      brandSoft: "#f0e4d0",
    },
    collage: {
      photoFilter: "sepia(0.18) saturate(0.9) brightness(1.01)",
      surfaceMix: "#dfd2bf",
    },
    sidebar: {
      dark: true,
      bg: "#302914",
      surface: "#3a3224",
      border: "#4e4224",
      text: "#f8ecd6",
      muted: "#c2ad8d",
      hover: "#4e4224",
      accent: "#c2ad8d",
    },
    header: {
      dark: true,
      bg: "#141610",
      surface: "#1e1a14",
      border: "#302914",
      text: "#f6f0e6",
      muted: "#ac8c5d",
      hover: "#302914",
      accent: "#c2ad8d",
    },
  },

  /** Forest sage content on walnut-style dark chrome */
  sage: {
    id: "sage",
    label: "Sage",
    description: "Charcoal-sage nav, deep forest header, cream paper, herb accents.",
    reference: COLLAGE_REFERENCE,
    palette: {
      label: "Sage",
      swatch: "#5a6b4f",
      bg: "#f9f6ee",
      center: "#5a6b4f",
      centerDark: "#3d4538",
      centerGlow: "rgba(90, 107, 79, 0.22)",
      accentSoft: "#f0e8dc",
      surface: "#fdfaf4",
      nodes: ["#2c3228", "#3d4538", "#5a6b4f", "#1a1e18"],
      line: "#e5d9c8",
      icon: "#2a231c",
      muted: "#8a7b6b",
      onAccent: "#ffffff",
      wall: "#ebe3d4",
      brandSoft: "#f0e8dc",
    },
    collage: {
      photoFilter: "sepia(0.18) saturate(0.9) brightness(1.02) hue-rotate(8deg)",
      surfaceMix: "#e8dcc8",
    },
    sidebar: {
      dark: true,
      bg: "#2c3228",
      surface: "#353d32",
      border: "#454f42",
      text: "#faf6f0",
      muted: "#b5a696",
      hover: "#3d4538",
      accent: "#d4b896",
    },
    header: {
      dark: true,
      bg: "#1a1e18",
      surface: "#242820",
      border: "#3a4038",
      text: "#f5f0ea",
      muted: "#a8998a",
      hover: "#2c3228",
      accent: "#c9a882",
    },
  },

  /** Polaroid borders — minimal light chrome, ink charcoal */
  /** Charcoal ink chrome — neutral sibling to walnut / espresso / sage */
  ink: {
    id: "ink",
    label: "Ink",
    description: "Charcoal nav, ink-black header, cream paper, neutral accents.",
    reference: COLLAGE_REFERENCE,
    palette: {
      label: "Ink",
      swatch: "#302914",
      bg: "#f9f6ee",
      center: "#4e4224",
      centerDark: "#302914",
      centerGlow: "rgba(48, 41, 20, 0.18)",
      accentSoft: "#f0e8dc",
      surface: "#fdfaf4",
      nodes: ["#141610", "#302914", "#4e4224", "#2a231c"],
      line: "#e5d9c8",
      icon: "#2a231c",
      muted: "#8a7b6b",
      onAccent: "#ffffff",
      wall: "#ebe3d4",
      brandSoft: "#f0e8dc",
    },
    collage: {
      photoFilter: "sepia(0.1) saturate(0.86) brightness(1.02)",
      surfaceMix: "#e8dcc8",
    },
    sidebar: {
      dark: true,
      bg: "#2a231c",
      surface: "#332a22",
      border: "#453a30",
      text: "#faf6f0",
      muted: "#b5a696",
      hover: "#3a3028",
      accent: "#d4b896",
    },
    header: {
      dark: true,
      bg: "#141610",
      surface: "#1e1a14",
      border: "#302914",
      text: "#f5f0ea",
      muted: "#a8998a",
      hover: "#2a231c",
      accent: "#c9a882",
    },
  },
};

export function getSidebarTokens(preset) {
  if (preset.sidebar) return preset.sidebar;

  const p = preset.palette;
  return {
    dark: false,
    bg: p.surface,
    surface: p.surface,
    border: p.line,
    text: p.icon,
    muted: p.muted,
    hover: p.accentSoft,
    accent: p.center,
  };
}

export function getHeaderTokens(preset) {
  if (preset.header) {
    return { dark: Boolean(preset.header.dark), ...preset.header };
  }
  const sidebar = getSidebarTokens(preset);
  return { dark: Boolean(sidebar.dark), ...sidebar };
}

export function resolveThemeId(candidate) {
  if (candidate && THEME_PRESETS[candidate]) return candidate;
  if (candidate === "dark-sage") return "sage";
  if (
    candidate === "polaroid" ||
    candidate === "honey" ||
    candidate === "instant" ||
    candidate === "terracotta" ||
    candidate === "mist" ||
    candidate === "oak"
  ) {
    return DEFAULT_THEME_ID;
  }
  return DEFAULT_THEME_ID;
}

export function getStoredThemeId() {
  if (typeof window === "undefined") return DEFAULT_THEME_ID;

  const fromUrl = new URLSearchParams(window.location.search).get("theme");
  if (fromUrl) return resolveThemeId(fromUrl);

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return resolveThemeId(stored);
}

export function getThemePreset(id = DEFAULT_THEME_ID) {
  return THEME_PRESETS[resolveThemeId(id)];
}

export function listThemePresets() {
  return Object.values(THEME_PRESETS);
}
