export type AspectPreset = "16:9" | "1:1" | "4:5" | "9:16" | "custom";

export type BackgroundMode = "solid" | "linear" | "radial" | "image" | "blurShot";

export type ImageFit = "cover" | "contain" | "custom";

export type FrameType = "none" | "macWindow" | "iphone15";

export type OverlayVertical = "top" | "center" | "bottom";

export type OverlayTextAlign = "left" | "center" | "right";

export type OverlayTextTransform = "none" | "uppercase" | "lowercase" | "capitalize";

export type RedactionRegion = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ArrowDeco = {
  id: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
};

export type HighlightDeco = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
};

export type OverlayFontId =
  | "inter"
  | "dmSans"
  | "fraunces"
  | "jetbrains"
  | "system"
  | "poppins"
  | "montserrat"
  | "playfairDisplay"
  | "spaceGrotesk"
  | "nunito"
  | "outfit"
  | "lora"
  | "oswald"
  | "ibmPlexSans"
  | "sourceSans3"
  | "merriweather"
  | "raleway";

export const OVERLAY_FONT_STACKS: Record<OverlayFontId, string> = {
  inter: "'Inter', ui-sans-serif, system-ui, sans-serif",
  dmSans: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
  fraunces: "'Fraunces', ui-serif, Georgia, serif",
  jetbrains: "'JetBrains Mono', ui-monospace, monospace",
  system:
    "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  poppins: "'Poppins', ui-sans-serif, system-ui, sans-serif",
  montserrat: "'Montserrat', ui-sans-serif, system-ui, sans-serif",
  playfairDisplay: "'Playfair Display', ui-serif, Georgia, serif",
  spaceGrotesk: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  nunito: "'Nunito', ui-sans-serif, system-ui, sans-serif",
  outfit: "'Outfit', ui-sans-serif, system-ui, sans-serif",
  lora: "'Lora', ui-serif, Georgia, serif",
  oswald: "'Oswald', ui-sans-serif, system-ui, sans-serif",
  ibmPlexSans: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
  sourceSans3: "'Source Sans 3', ui-sans-serif, system-ui, sans-serif",
  merriweather: "'Merriweather', ui-serif, Georgia, serif",
  raleway: "'Raleway', ui-sans-serif, system-ui, sans-serif",
};

export type ComposerState = {
  aspect: AspectPreset;
  customAspectW: number;
  customAspectH: number;
  paddingPct: number;
  background: {
    mode: BackgroundMode;
    solid: string;
    linearAngle: number;
    linearFrom: string;
    linearTo: string;
    radialFrom: string;
    radialTo: string;
    radialCenterX: number;
    radialCenterY: number;
    imageDataUrl: string | null;
    imageFit: ImageFit;
    imageScalePct: number;
    imagePosX: number;
    imagePosY: number;
    blurAmount: number;
    blurOpacity: number;
  };
  radius: number;
  shadow: {
    blur: number;
    spread: number;
    offsetX: number;
    offsetY: number;
    color: string;
  };
  chrome: {
    showTrafficLights: boolean;
    titleBarHeight: number;
  };
  frameType: FrameType;
  /** Move the whole frame (Mac / iPhone / plain) inside the padded canvas. Values are % of canvas width (X) and height (Y), 0 = centered. */
  frameOnCanvas: {
    offsetXPct: number;
    offsetYPct: number;
  };
  /** Uniform scale of the whole frame chrome; 100 = max fit (current layout). Lower leaves room to shift without clipping. */
  frameSizePct: number;
  subject: {
    scale: number;
    positionX: number;
    positionY: number;
    cropTop: number;
    cropRight: number;
    cropBottom: number;
    cropLeft: number;
  };
  overlay: {
    enabled: boolean;
    title: string;
    subtitle: string;
    align: OverlayTextAlign;
    vertical: OverlayVertical;
    insetPct: number;
    titleColor: string;
    subtitleColor: string;
    titleSize: number;
    subtitleSize: number;
    shadow: boolean;
    fontId: OverlayFontId;
    titleFontWeight: number;
    subtitleFontWeight: number;
    titleLetterSpacing: number;
    subtitleLetterSpacing: number;
    titleLineHeight: number;
    subtitleLineHeight: number;
    /** Space between title and subtitle, px */
    titleSubtitleGap: number;
    /** Subtitle opacity 0–1 */
    subtitleOpacity: number;
    /** Max width of caption block as % of row (50–100) */
    maxWidthPct: number;
    titleTextTransform: OverlayTextTransform;
    subtitleTextTransform: OverlayTextTransform;
  };
  redactions: RedactionRegion[];
  arrows: ArrowDeco[];
  highlights: HighlightDeco[];
};

export const defaultComposerState = (): ComposerState => ({
  aspect: "16:9",
  customAspectW: 16,
  customAspectH: 9,
  paddingPct: 0,
  background: {
    mode: "blurShot",
    solid: "#fafafa",
    linearAngle: 135,
    linearFrom: "#f4f4f5",
    linearTo: "#e4e4e7",
    radialFrom: "#fafafa",
    radialTo: "#d4d4d8",
    radialCenterX: 50,
    radialCenterY: 40,
    imageDataUrl: null,
    imageFit: "cover",
    imageScalePct: 100,
    imagePosX: 50,
    imagePosY: 50,
    blurAmount: 24,
    blurOpacity: 0.85,
  },
  radius: 12,
  shadow: {
    blur: 48,
    spread: 0,
    offsetX: 0,
    offsetY: 24,
    color: "rgba(0,0,0,0.18)",
  },
  chrome: {
    showTrafficLights: true,
    titleBarHeight: 36,
  },
  frameType: "macWindow",
  frameOnCanvas: {
    offsetXPct: 0,
    offsetYPct: 0,
  },
  frameSizePct: 66,
  subject: {
    scale: 1,
    positionX: 0,
    positionY: 0,
    cropTop: 0,
    cropRight: 0,
    cropBottom: 0,
    cropLeft: 0,
  },
  overlay: {
    enabled: false,
    title: "",
    subtitle: "",
    align: "left",
    vertical: "bottom",
    insetPct: 7,
    titleColor: "#ffffff",
    subtitleColor: "#ffffff",
    titleSize: 28,
    subtitleSize: 14,
    shadow: true,
    fontId: "inter",
    titleFontWeight: 600,
    subtitleFontWeight: 400,
    titleLetterSpacing: 0,
    subtitleLetterSpacing: 0,
    titleLineHeight: 1.2,
    subtitleLineHeight: 1.4,
    titleSubtitleGap: 4,
    subtitleOpacity: 0.9,
    maxWidthPct: 100,
    titleTextTransform: "none",
    subtitleTextTransform: "none",
  },
  redactions: [],
  arrows: [],
  highlights: [],
});

/** Matches Tailwind: screens below `sm` (640px). */
const MOBILE_VIEWPORT_MQ = "(max-width: 639px)";

const MOBILE_COMPOSER_DEFAULTS: Partial<ComposerState> = {
  aspect: "9:16",
  frameType: "iphone15",
  paddingPct: 8,
  shadow: {
    blur: 40,
    spread: 0,
    offsetX: 0,
    offsetY: 18,
    color: "rgba(0,0,0,0.16)",
  },
};

export type CaptureViewportPreset = "desktop" | "mobile";

/** Composer defaults aligned with the landing-page capture mode (not browser width alone). */
export function getDefaultComposerStateForCapturePreset(
  preset: CaptureViewportPreset,
): ComposerState {
  if (preset === "mobile") {
    return mergeComposerState(MOBILE_COMPOSER_DEFAULTS);
  }
  return defaultComposerState();
}

/** Initial composer before capture: narrow screens assume mobile preset to match landing default. */
export function getDefaultComposerState(): ComposerState {
  return getDefaultComposerStateForCapturePreset(
    isNarrowTouchViewport() ? "mobile" : "desktop",
  );
}

export function isNarrowTouchViewport(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia(MOBILE_VIEWPORT_MQ).matches
  );
}

export function aspectRatioValue(
  state: Pick<ComposerState, "aspect" | "customAspectW" | "customAspectH">,
): number {
  if (state.aspect === "custom") {
    const w = Math.max(1, state.customAspectW);
    const h = Math.max(1, state.customAspectH);
    return w / h;
  }
  switch (state.aspect) {
    case "16:9":
      return 16 / 9;
    case "1:1":
      return 1;
    case "4:5":
      return 4 / 5;
    case "9:16":
      return 9 / 16;
    default:
      return 16 / 9;
  }
}

/** Merge a partial or older saved preset onto current defaults (safe for localStorage). */
export function mergeComposerState(p: Partial<ComposerState>): ComposerState {
  const d = defaultComposerState();
  return {
    ...d,
    ...p,
    background: { ...d.background, ...p.background },
    chrome: { ...d.chrome, ...p.chrome },
    frameOnCanvas: { ...d.frameOnCanvas, ...p.frameOnCanvas },
    subject: { ...d.subject, ...p.subject },
    overlay: { ...d.overlay, ...p.overlay },
    shadow: { ...d.shadow, ...p.shadow },
    redactions: p.redactions ?? d.redactions,
    arrows: p.arrows ?? d.arrows,
    highlights: p.highlights ?? d.highlights,
  };
}
