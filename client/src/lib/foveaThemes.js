/**
 * Focus collage color presets — sampled from focus-collage-reference.jpg.
 *
 * Preview: `?theme=walnut`, `?theme=pearl`, `?theme=snow`, `?theme=mono`, …
 * Prod default: `ember`.
 */

export const THEME_STORAGE_KEY = "fovea.theme";
export const DEFAULT_THEME_ID = "ember";
export const COLLAGE_REFERENCE = "/design/focus-collage-reference.jpg";

const NEUTRAL_PRIORITIES = {
  p0: { bg: "#f0f0f0", fg: "#404040", border: "#d4d4d4" },
  p1: { bg: "#ececec", fg: "#525252", border: "#d4d4d4" },
  p2: { bg: "#e8e8e8", fg: "#666666", border: "#d4d4d4" },
  p3: { bg: "#f5f5f5", fg: "#737373", border: "#e5e5e5" },
};

const WARM_NEUTRAL_PRIORITIES = {
  p0: { bg: "#f0ebe4", fg: "#4a433c", border: "#d4ccc2" },
  p1: { bg: "#ece6de", fg: "#5c544c", border: "#d0c8be" },
  p2: { bg: "#e8e2da", fg: "#6b635a", border: "#ccc4ba" },
  p3: { bg: "#f5f0ea", fg: "#7a7268", border: "#ddd6cc" },
};

const LIGHT_WHITE_PRIORITIES = {
  p0: { bg: "#fafafa", fg: "#404040", border: "#e5e5e5" },
  p1: { bg: "#f7f7f7", fg: "#525252", border: "#e8e8e8" },
  p2: { bg: "#f5f5f5", fg: "#666666", border: "#ebebeb" },
  p3: { bg: "#fcfcfc", fg: "#8a8a8a", border: "#f0f0f0" },
};

/** Fixed priority colors — same on every theme. */
export const SEMANTIC_PRIORITIES = {
  p0: { bg: "#fef2f2", fg: "#dc2626", border: "#fca5a5" },
  p1: { bg: "#fff7ed", fg: "#ea580c", border: "#fdba74" },
  p2: { bg: "#f5f5f4", fg: "#57534e", border: "#d6d3d1" },
  p3: { bg: "#fafaf9", fg: "#a8a29e", border: "#e7e5e4" },
};

/** @typedef {{
 *   id: string;
 *   label: string;
 *   description: string;
 *   prodCandidate?: boolean;
 *   neutral?: boolean;
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

  /** Cool gray chrome — neutral paper, no warm honey tones */
  stone: {
    id: "stone",
    label: "Stone",
    description: "Cool gray chrome, flat neutral paper, monochrome accents.",
    neutral: true,
    reference: COLLAGE_REFERENCE,
    palette: {
      label: "Stone",
      swatch: "#525252",
      bg: "#f4f4f2",
      center: "#525252",
      centerDark: "#3d3d3d",
      centerGlow: "rgba(82, 82, 82, 0.12)",
      accentSoft: "#ebebeb",
      surface: "#f9f9f8",
      nodes: ["#262626", "#3d3d3d", "#525252", "#171717"],
      line: "#d4d4d4",
      icon: "#262626",
      muted: "#737373",
      onAccent: "#ffffff",
      wall: "#e5e5e5",
      brandSoft: "#ebebeb",
      brand: "#262626",
      brandDark: "#171717",
    },
    collage: {
      photoFilter: "grayscale(0.55) saturate(0.45) brightness(1.03) contrast(0.96)",
      surfaceMix: "#e5e5e5",
    },
    sidebar: {
      dark: true,
      bg: "#292929",
      surface: "#333333",
      border: "#454545",
      text: "#f5f5f5",
      muted: "#a3a3a3",
      hover: "#3d3d3d",
      accent: "#d4d4d4",
    },
    header: {
      dark: true,
      bg: "#171717",
      surface: "#212121",
      border: "#333333",
      text: "#f5f5f5",
      muted: "#a3a3a3",
      hover: "#292929",
      accent: "#d4d4d4",
    },
    priorities: NEUTRAL_PRIORITIES,
  },

  /** Light airy gray — softest neutral paper */
  ash: {
    id: "ash",
    label: "Ash",
    description: "Soft gray chrome, bright neutral paper, quiet accents.",
    neutral: true,
    reference: COLLAGE_REFERENCE,
    palette: {
      label: "Ash",
      swatch: "#6b6b6b",
      bg: "#f8f8f7",
      center: "#6b6b6b",
      centerDark: "#4a4a4a",
      centerGlow: "rgba(107, 107, 107, 0.1)",
      accentSoft: "#f0f0ef",
      surface: "#fcfcfb",
      nodes: ["#3a3a3a", "#4a4a4a", "#6b6b6b", "#2a2a2a"],
      line: "#e0e0de",
      icon: "#3a3a3a",
      muted: "#8a8a88",
      onAccent: "#ffffff",
      wall: "#ececea",
      brandSoft: "#f0f0ef",
      brand: "#3a3a3a",
      brandDark: "#2a2a2a",
    },
    collage: {
      photoFilter: "grayscale(0.4) saturate(0.5) brightness(1.04) contrast(0.95)",
      surfaceMix: "#ececea",
    },
    sidebar: {
      dark: true,
      bg: "#353535",
      surface: "#3f3f3f",
      border: "#525252",
      text: "#f8f8f7",
      muted: "#b0b0ae",
      hover: "#454545",
      accent: "#d8d8d6",
    },
    header: {
      dark: true,
      bg: "#222222",
      surface: "#2c2c2c",
      border: "#404040",
      text: "#f8f8f7",
      muted: "#b0b0ae",
      hover: "#353535",
      accent: "#d8d8d6",
    },
    priorities: NEUTRAL_PRIORITIES,
  },

  /** Bright white chrome — lightest neutral, airy sidebar + header */
  white: {
    id: "white",
    label: "White",
    description: "Light gray chrome, bright white paper, soft neutral accents.",
    neutral: true,
    reference: COLLAGE_REFERENCE,
    palette: {
      label: "White",
      swatch: "#e8e8e8",
      bg: "#ffffff",
      center: "#525252",
      centerDark: "#3d3d3d",
      centerGlow: "rgba(82, 82, 82, 0.08)",
      accentSoft: "#f7f7f7",
      surface: "#ffffff",
      nodes: ["#404040", "#525252", "#666666", "#2a2a2a"],
      line: "#ebebeb",
      icon: "#262626",
      muted: "#8a8a8a",
      onAccent: "#ffffff",
      wall: "#f5f5f5",
      brandSoft: "#f5f5f5",
      brand: "#262626",
      brandDark: "#171717",
    },
    collage: {
      photoFilter: "grayscale(0.35) saturate(0.4) brightness(1.06) contrast(0.94)",
      surfaceMix: "#f0f0f0",
    },
    sidebar: {
      dark: false,
      bg: "#fafafa",
      surface: "#ffffff",
      border: "#ebebeb",
      text: "#262626",
      muted: "#8a8a8a",
      hover: "#f0f0f0",
      accent: "#525252",
    },
    header: {
      dark: false,
      bg: "#ffffff",
      surface: "#fafafa",
      border: "#ebebeb",
      text: "#262626",
      muted: "#8a8a8a",
      hover: "#f5f5f5",
      accent: "#404040",
    },
    priorities: LIGHT_WHITE_PRIORITIES,
  },

  /** Pure bright white — minimal gray, maximum lightness */
  snow: {
    id: "snow",
    label: "Snow",
    description: "Pure white chrome, crisp paper, barely-there borders.",
    neutral: true,
    reference: COLLAGE_REFERENCE,
    palette: {
      label: "Snow",
      swatch: "#f5f5f5",
      bg: "#ffffff",
      center: "#4a4a4a",
      centerDark: "#333333",
      centerGlow: "rgba(74, 74, 74, 0.06)",
      accentSoft: "#fafafa",
      surface: "#ffffff",
      nodes: ["#333333", "#4a4a4a", "#666666", "#1a1a1a"],
      line: "#f0f0f0",
      icon: "#1a1a1a",
      muted: "#9a9a9a",
      onAccent: "#ffffff",
      wall: "#fafafa",
      brandSoft: "#fafafa",
      brand: "#1a1a1a",
      brandDark: "#0a0a0a",
    },
    collage: {
      photoFilter: "grayscale(0.28) saturate(0.35) brightness(1.08) contrast(0.92)",
      surfaceMix: "#f5f5f5",
    },
    sidebar: {
      dark: false,
      bg: "#ffffff",
      surface: "#ffffff",
      border: "#f0f0f0",
      text: "#1a1a1a",
      muted: "#9a9a9a",
      hover: "#f7f7f7",
      accent: "#4a4a4a",
    },
    header: {
      dark: false,
      bg: "#ffffff",
      surface: "#ffffff",
      border: "#f0f0f0",
      text: "#1a1a1a",
      muted: "#9a9a9a",
      hover: "#f7f7f7",
      accent: "#333333",
    },
    priorities: {
      p0: { bg: "#fcfcfc", fg: "#333333", border: "#f0f0f0" },
      p1: { bg: "#fafafa", fg: "#4a4a4a", border: "#f2f2f2" },
      p2: { bg: "#f7f7f7", fg: "#666666", border: "#f0f0f0" },
      p3: { bg: "#ffffff", fg: "#9a9a9a", border: "#f5f5f5" },
    },
  },

  /** Soft ivory white — barely warm, still airy */
  pearl: {
    id: "pearl",
    label: "Pearl",
    description: "Ivory white chrome, warm paper glow, gentle accents.",
    neutral: true,
    reference: COLLAGE_REFERENCE,
    palette: {
      label: "Pearl",
      swatch: "#f2efe8",
      bg: "#fffefb",
      center: "#5c574f",
      centerDark: "#454038",
      centerGlow: "rgba(92, 87, 79, 0.08)",
      accentSoft: "#faf8f4",
      surface: "#fffefb",
      nodes: ["#454038", "#5c574f", "#7a746a", "#2e2a26"],
      line: "#eeeae3",
      icon: "#2e2a26",
      muted: "#9a948a",
      onAccent: "#ffffff",
      wall: "#f8f5ef",
      brandSoft: "#faf8f4",
      brand: "#2e2a26",
      brandDark: "#1a1816",
    },
    collage: {
      photoFilter: "grayscale(0.2) saturate(0.45) brightness(1.07) sepia(0.04)",
      surfaceMix: "#f2efe8",
    },
    sidebar: {
      dark: false,
      bg: "#fdfbf7",
      surface: "#fffefb",
      border: "#eeeae3",
      text: "#2e2a26",
      muted: "#9a948a",
      hover: "#f8f5ef",
      accent: "#5c574f",
    },
    header: {
      dark: false,
      bg: "#fffefb",
      surface: "#fdfbf7",
      border: "#eeeae3",
      text: "#2e2a26",
      muted: "#9a948a",
      hover: "#f8f5ef",
      accent: "#454038",
    },
    priorities: {
      p0: { bg: "#faf8f4", fg: "#454038", border: "#eeeae3" },
      p1: { bg: "#f8f5ef", fg: "#5c574f", border: "#ebe6de" },
      p2: { bg: "#f5f2eb", fg: "#7a746a", border: "#e8e3da" },
      p3: { bg: "#fdfbf7", fg: "#9a948a", border: "#f0ebe3" },
    },
  },

  /** Cool icy white — faint blue-gray tint */
  frost: {
    id: "frost",
    label: "Frost",
    description: "Icy white chrome, cool paper, steel-gray accents.",
    neutral: true,
    reference: COLLAGE_REFERENCE,
    palette: {
      label: "Frost",
      swatch: "#e8ecf0",
      bg: "#fbfcfd",
      center: "#5a6570",
      centerDark: "#434c56",
      centerGlow: "rgba(90, 101, 112, 0.08)",
      accentSoft: "#f5f7f9",
      surface: "#ffffff",
      nodes: ["#434c56", "#5a6570", "#7a8490", "#2a3140"],
      line: "#e8ecf0",
      icon: "#2a3140",
      muted: "#8a94a0",
      onAccent: "#ffffff",
      wall: "#f0f3f6",
      brandSoft: "#f5f7f9",
      brand: "#2a3140",
      brandDark: "#1a1f28",
    },
    collage: {
      photoFilter: "grayscale(0.32) saturate(0.38) brightness(1.07) hue-rotate(6deg)",
      surfaceMix: "#e8ecf0",
    },
    sidebar: {
      dark: false,
      bg: "#f7f9fb",
      surface: "#ffffff",
      border: "#e8ecf0",
      text: "#2a3140",
      muted: "#8a94a0",
      hover: "#f0f3f6",
      accent: "#5a6570",
    },
    header: {
      dark: false,
      bg: "#ffffff",
      surface: "#f7f9fb",
      border: "#e8ecf0",
      text: "#2a3140",
      muted: "#8a94a0",
      hover: "#f0f3f6",
      accent: "#434c56",
    },
    priorities: {
      p0: { bg: "#f5f7f9", fg: "#434c56", border: "#e4e8ec" },
      p1: { bg: "#f2f4f7", fg: "#5a6570", border: "#e8ecf0" },
      p2: { bg: "#eef1f4", fg: "#7a8490", border: "#e0e4e8" },
      p3: { bg: "#fafbfc", fg: "#8a94a0", border: "#eceef0" },
    },
  },

  /** Natural linen white — soft cream paper, light chrome */
  linen: {
    id: "linen",
    label: "Linen",
    description: "Cream-white chrome, natural paper, muted taupe accents.",
    neutral: true,
    reference: COLLAGE_REFERENCE,
    palette: {
      label: "Linen",
      swatch: "#ebe6dc",
      bg: "#faf9f6",
      center: "#6b6358",
      centerDark: "#524a42",
      centerGlow: "rgba(107, 99, 88, 0.08)",
      accentSoft: "#f5f3ee",
      surface: "#fcfaf6",
      nodes: ["#524a42", "#6b6358", "#8a8074", "#3a3530"],
      line: "#ebe6dc",
      icon: "#3a3530",
      muted: "#9a9288",
      onAccent: "#ffffff",
      wall: "#f2efe8",
      brandSoft: "#f5f3ee",
      brand: "#3a3530",
      brandDark: "#2a2622",
    },
    collage: {
      photoFilter: "grayscale(0.25) saturate(0.42) brightness(1.06) sepia(0.06)",
      surfaceMix: "#ebe6dc",
    },
    sidebar: {
      dark: false,
      bg: "#f7f5f0",
      surface: "#fcfaf6",
      border: "#ebe6dc",
      text: "#3a3530",
      muted: "#9a9288",
      hover: "#f2efe8",
      accent: "#6b6358",
    },
    header: {
      dark: false,
      bg: "#fcfaf6",
      surface: "#f7f5f0",
      border: "#ebe6dc",
      text: "#3a3530",
      muted: "#9a9288",
      hover: "#f2efe8",
      accent: "#524a42",
    },
    priorities: {
      p0: { bg: "#f5f3ee", fg: "#524a42", border: "#ebe6dc" },
      p1: { bg: "#f2efe8", fg: "#6b6358", border: "#e8e3d8" },
      p2: { bg: "#efebe3", fg: "#8a8074", border: "#e4dfd6" },
      p3: { bg: "#f9f7f2", fg: "#9a9288", border: "#eee9e0" },
    },
  },

  /** Blue-gray cool neutral */
  slate: {
    id: "slate",
    label: "Slate",
    description: "Blue-gray chrome, cool paper, muted steel accents.",
    neutral: true,
    reference: COLLAGE_REFERENCE,
    palette: {
      label: "Slate",
      swatch: "#5b6570",
      bg: "#f5f6f8",
      center: "#5b6570",
      centerDark: "#434c56",
      centerGlow: "rgba(91, 101, 112, 0.12)",
      accentSoft: "#ebedf0",
      surface: "#fafbfc",
      nodes: ["#2a3140", "#434c56", "#5b6570", "#1a1f28"],
      line: "#d8dce2",
      icon: "#2a3140",
      muted: "#7a8490",
      onAccent: "#ffffff",
      wall: "#e4e8ec",
      brandSoft: "#ebedf0",
      brand: "#2a3140",
      brandDark: "#1a1f28",
    },
    collage: {
      photoFilter: "grayscale(0.48) saturate(0.42) brightness(1.02) hue-rotate(8deg)",
      surfaceMix: "#e4e8ec",
    },
    sidebar: {
      dark: true,
      bg: "#2a3140",
      surface: "#343c4c",
      border: "#454f5e",
      text: "#f5f6f8",
      muted: "#a8b0ba",
      hover: "#3a4354",
      accent: "#c8d0d8",
    },
    header: {
      dark: true,
      bg: "#1a1f28",
      surface: "#242a34",
      border: "#343c4c",
      text: "#f5f6f8",
      muted: "#a8b0ba",
      hover: "#2a3140",
      accent: "#c8d0d8",
    },
    priorities: NEUTRAL_PRIORITIES,
  },

  /** High-contrast dark neutral */
  graphite: {
    id: "graphite",
    label: "Graphite",
    description: "Deep charcoal chrome, crisp gray paper, strong contrast.",
    neutral: true,
    reference: COLLAGE_REFERENCE,
    palette: {
      label: "Graphite",
      swatch: "#404040",
      bg: "#f2f2f2",
      center: "#404040",
      centerDark: "#2a2a2a",
      centerGlow: "rgba(64, 64, 64, 0.14)",
      accentSoft: "#e8e8e8",
      surface: "#f7f7f7",
      nodes: ["#1a1a1a", "#2a2a2a", "#404040", "#0f0f0f"],
      line: "#cccccc",
      icon: "#1a1a1a",
      muted: "#6b6b6b",
      onAccent: "#ffffff",
      wall: "#e0e0e0",
      brandSoft: "#e8e8e8",
      brand: "#1a1a1a",
      brandDark: "#0f0f0f",
    },
    collage: {
      photoFilter: "grayscale(0.65) saturate(0.35) brightness(1.02) contrast(1.02)",
      surfaceMix: "#e0e0e0",
    },
    sidebar: {
      dark: true,
      bg: "#1f1f1f",
      surface: "#292929",
      border: "#3a3a3a",
      text: "#f2f2f2",
      muted: "#9a9a9a",
      hover: "#333333",
      accent: "#cccccc",
    },
    header: {
      dark: true,
      bg: "#0f0f0f",
      surface: "#1a1a1a",
      border: "#2a2a2a",
      text: "#f2f2f2",
      muted: "#9a9a9a",
      hover: "#1f1f1f",
      accent: "#cccccc",
    },
    priorities: NEUTRAL_PRIORITIES,
  },

  /** Warm graphite — charcoal brown chrome, taupe paper, soft contrast */
  ember: {
    id: "ember",
    label: "Ember",
    description: "Warm charcoal chrome, taupe paper, graphite contrast with a soft glow.",
    neutral: true,
    reference: COLLAGE_REFERENCE,
    palette: {
      label: "Ember",
      swatch: "#4a433c",
      bg: "#f0ebe4",
      center: "#4a433c",
      centerDark: "#332e28",
      centerGlow: "rgba(74, 67, 60, 0.14)",
      accentSoft: "#e8e2da",
      surface: "#f5f1eb",
      nodes: ["#1f1c18", "#2a2622", "#4a433c", "#141210"],
      line: "#d4ccc2",
      icon: "#2a2622",
      muted: "#7a7268",
      onAccent: "#ffffff",
      wall: "#ddd6cc",
      brandSoft: "#e8e2da",
      brand: "#2a2622",
      brandDark: "#1f1c18",
    },
    collage: {
      photoFilter: "grayscale(0.45) saturate(0.55) brightness(1.03) sepia(0.08)",
      surfaceMix: "#ddd6cc",
    },
    sidebar: {
      dark: true,
      bg: "#2a2622",
      surface: "#332e28",
      border: "#453f38",
      text: "#f0ebe4",
      muted: "#a89e92",
      hover: "#3a3530",
      accent: "#c4b8a8",
    },
    header: {
      dark: true,
      bg: "#1f1c18",
      surface: "#2a2622",
      border: "#3a3530",
      text: "#f0ebe4",
      muted: "#a89e92",
      hover: "#332e28",
      accent: "#c4b8a8",
    },
    priorities: WARM_NEUTRAL_PRIORITIES,
  },

  /** Pure black & white — no color, maximum contrast */
  mono: {
    id: "mono",
    label: "Mono",
    description: "Black chrome, white paper, grayscale only.",
    neutral: true,
    reference: COLLAGE_REFERENCE,
    palette: {
      label: "Mono",
      swatch: "#000000",
      bg: "#fafafa",
      center: "#000000",
      centerDark: "#000000",
      centerGlow: "rgba(0, 0, 0, 0.1)",
      accentSoft: "#f0f0f0",
      surface: "#ffffff",
      nodes: ["#000000", "#262626", "#525252", "#0a0a0a"],
      line: "#e0e0e0",
      icon: "#000000",
      muted: "#666666",
      onAccent: "#ffffff",
      wall: "#ebebeb",
      brandSoft: "#f0f0f0",
      brand: "#000000",
      brandDark: "#000000",
    },
    collage: {
      photoFilter: "grayscale(1) saturate(0) contrast(1.05)",
      surfaceMix: "#e0e0e0",
    },
    sidebar: {
      dark: true,
      bg: "#000000",
      surface: "#0a0a0a",
      border: "#262626",
      text: "#ffffff",
      muted: "#a3a3a3",
      hover: "#1a1a1a",
      accent: "#ffffff",
    },
    header: {
      dark: true,
      bg: "#000000",
      surface: "#0a0a0a",
      border: "#262626",
      text: "#ffffff",
      muted: "#a3a3a3",
      hover: "#1a1a1a",
      accent: "#ffffff",
    },
    priorities: {
      p0: { bg: "#f5f5f5", fg: "#000000", border: "#000000" },
      p1: { bg: "#ebebeb", fg: "#262626", border: "#525252" },
      p2: { bg: "#e5e5e5", fg: "#404040", border: "#737373" },
      p3: { bg: "#fafafa", fg: "#666666", border: "#d4d4d4" },
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

export function getThemePriorities() {
  return SEMANTIC_PRIORITIES;
}

export function resolveThemeId(candidate) {
  if (candidate && THEME_PRESETS[candidate]) return candidate;
  if (candidate === "dark-sage") return "sage";
  if (candidate === "neutral") return "stone";
  if (candidate === "gray" || candidate === "grey") return "stone";
  if (candidate === "light") return "white";
  if (candidate === "ivory" || candidate === "cream") return "pearl";
  if (candidate === "icy" || candidate === "ice") return "frost";
  if (candidate === "natural" || candidate === "canvas") return "linen";
  if (candidate === "mono" || candidate === "monochrome" || candidate === "bw" || candidate === "blackwhite") {
    return "mono";
  }
  if (candidate === "warm-graphite" || candidate === "warmgraphite") return "ember";
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
