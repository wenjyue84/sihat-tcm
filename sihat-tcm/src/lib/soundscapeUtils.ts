import { DiagnosisSession } from "@/types/database";
import { extractConstitutionType } from "./tcm-utils";

/**
 * Five Elements in TCM:
 * - Wood (木) - Liver (肝)
 * - Fire (火) - Heart (心)
 * - Earth (土) - Spleen (脾)
 * - Metal (金) - Lung (肺)
 * - Water (水) - Kidney (肾)
 */

export type ElementType = "wood" | "fire" | "earth" | "metal" | "water";

export interface SoundscapeConfig {
  /** Primary element sound (required) */
  primary: ElementType;
  /** Secondary element sound for harmony (optional) */
  secondary?: ElementType;
  /** White noise/ambient layer (rain, wind, etc.) */
  ambient?: "rain" | "wind" | "water" | "none";
  /** Whether to include Guqin melody */
  includeGuqin: boolean;
  /** Whether to include meditation guidance */
  includeMeditation: boolean;
}

/**
 * Determine which sounds to play based on TCM diagnosis profile
 * 
 * Five Elements Theory:
 * - Wood (Liver) needs Metal (bells) to control it, or Water (rain) to nourish it
 * - Fire (Heart) needs Water to control it
 * - Earth (Spleen) needs steady, drum-like rhythms
 * - Metal (Lung) needs Fire to control it, or Earth to nourish it
 * - Water (Kidney) needs Earth to control it, or Metal to nourish it
 * 
 * TCM Sleep Connection:
 * - Water element (肾, Kidney) governs sleep and rest. Water sounds (flowing, rain) 
 *   help calm the Shen (spirit) and promote deep, restorative sleep.
 * - Rain sounds create white noise that masks disturbances and aligns with Water's 
 *   cooling, calming nature in TCM theory.
 */
export function determineSoundscape(diagnosis: DiagnosisSession | null): SoundscapeConfig {
  // Default soundscape for balanced state (emphasize water/rain for sleep)
  const defaultConfig: SoundscapeConfig = {
    primary: "water",
    secondary: "metal",
    ambient: "rain",
    includeGuqin: true,
    includeMeditation: true,
  };

  if (!diagnosis) {
    return defaultConfig;
  }

  const constitution = extractConstitutionType(diagnosis.constitution || "");
  const constitutionLower = constitution.toLowerCase();
  const diagnosisData = diagnosis.full_report?.diagnosis;
  const pattern =
    (typeof diagnosisData === "object" &&
      diagnosisData !== null &&
      "pattern_differentiation" in diagnosisData
      ? (diagnosisData as any).pattern_differentiation?.toLowerCase()
      : "") ||
    diagnosis.primary_diagnosis?.toLowerCase() ||
    "";

  // Damp Heat - needs cooling (Water) and clearing (Metal)
  if (constitutionLower.includes("damp") && constitutionLower.includes("heat")) {
    return {
      primary: "water",
      secondary: "metal",
      ambient: "rain",
      includeGuqin: true,
      includeMeditation: true,
    };
  }

  // Heat/Fire patterns - need Water to control
  if (
    constitutionLower.includes("heat") ||
    constitutionLower.includes("fire") ||
    pattern.includes("heart fire") ||
    pattern.includes("心火")
  ) {
    return {
      primary: "water",
      secondary: "metal",
      ambient: "rain",
      includeGuqin: true,
      includeMeditation: true,
    };
  }

  // Liver/Wood issues - need Metal to control, or Water to nourish
  if (
    constitutionLower.includes("liver") ||
    pattern.includes("liver qi stagnation") ||
    pattern.includes("肝气郁结") ||
    pattern.includes("wood")
  ) {
    return {
      primary: "metal",
      secondary: "water",
      ambient: "rain",
      includeGuqin: true,
      includeMeditation: true,
    };
  }

  // Spleen/Earth deficiency - needs steady rhythms (Earth) and Fire to nourish
  if (
    constitutionLower.includes("spleen") ||
    constitutionLower.includes("earth") ||
    pattern.includes("spleen qi deficiency") ||
    pattern.includes("脾气虚") ||
    constitutionLower.includes("damp")
  ) {
    return {
      primary: "earth",
      secondary: "fire",
      ambient: "none",
      includeGuqin: true,
      includeMeditation: true,
    };
  }

  // Lung/Metal issues - need Fire to control, or Earth to nourish
  if (
    pattern.includes("lung") ||
    pattern.includes("肺") ||
    pattern.includes("metal")
  ) {
    return {
      primary: "fire",
      secondary: "earth",
      ambient: "wind",
      includeGuqin: true,
      includeMeditation: true,
    };
  }

  // Kidney/Water deficiency - need Earth to control, or Metal to nourish
  if (
    constitutionLower.includes("kidney") ||
    constitutionLower.includes("water") ||
    pattern.includes("kidney") ||
    pattern.includes("肾")
  ) {
    return {
      primary: "earth",
      secondary: "metal",
      ambient: "water",
      includeGuqin: true,
      includeMeditation: true,
    };
  }

  // Yin deficiency - generally needs Water and Metal
  if (constitutionLower.includes("yin") && constitutionLower.includes("deficiency")) {
    return {
      primary: "water",
      secondary: "metal",
      ambient: "rain",
      includeGuqin: true,
      includeMeditation: true,
    };
  }

  // Yang deficiency - generally needs Fire and Earth
  if (constitutionLower.includes("yang") && constitutionLower.includes("deficiency")) {
    return {
      primary: "fire",
      secondary: "earth",
      ambient: "none",
      includeGuqin: true,
      includeMeditation: true,
    };
  }

  // Default: balanced state with calming sounds
  return defaultConfig;
}

/**
 * Get audio file path for an element
 * These paths should point to MP3 files in the public directory
 */
export function getElementAudioPath(element: ElementType): string {
  const fileMap: Record<ElementType, string> = {
    wood: "https://actions.google.com/sounds/v1/nature/forest_wind.ogg",
    fire: "https://actions.google.com/sounds/v1/ambiences/fire.ogg",
    earth: "https://actions.google.com/sounds/v1/nature/nature_sounds_night.ogg",
    metal: "https://actions.google.com/sounds/v1/alarms/temple_bell.ogg",
    water: "https://actions.google.com/sounds/v1/water/stream_water.ogg",
  };
  return fileMap[element];
}

/**
 * Get ambient sound path
 */
export function getAmbientAudioPath(ambient: "rain" | "wind" | "water" | "none"): string | null {
  if (ambient === "none") return null;
  const fileMap: Record<"rain" | "wind" | "water", string> = {
    rain: "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg",
    wind: "https://actions.google.com/sounds/v1/nature/strong_wind.ogg",
    water: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg",
  };
  return fileMap[ambient];
}

/**
 * Get Guqin melody path
 */
export function getGuqinAudioPath(): string {
  // Using meditation sound as fallback for Guqin
  return "https://actions.google.com/sounds/v1/relax/meditation.ogg";
}

/**
 * Get meditation guidance audio path
 */
export function getMeditationAudioPath(language: "en" | "zh" | "ms" = "en"): string {
  // Currently using generic relaxation music as we don't have voice files
  return "https://actions.google.com/sounds/v1/relax/meditation.ogg";
}

/**
 * Get element description for UI
 */
export function getElementDescription(element: ElementType, language: "en" | "zh" | "ms" = "en"): string {
  const descriptions: Record<ElementType, Record<"en" | "zh" | "ms", string>> = {
    wood: {
      en: "Wood Element - Bells & Chimes",
      zh: "木元素 - 钟声与铃声",
      ms: "Elemen Kayu - Loceng & Cincin",
    },
    fire: {
      en: "Fire Element - Warm Tones",
      zh: "火元素 - 温暖音调",
      ms: "Elemen Api - Nada Hangat",
    },
    earth: {
      en: "Earth Element - Steady Drums",
      zh: "土元素 - 稳定鼓声",
      ms: "Elemen Tanah - Gendang Mantap",
    },
    metal: {
      en: "Metal Element - Metallic Tones",
      zh: "金元素 - 金属音调",
      ms: "Elemen Logam - Nada Logam",
    },
    water: {
      en: "Water Element - Flowing Sounds",
      zh: "水元素 - 流动声音",
      ms: "Elemen Air - Bunyi Mengalir",
    },
  };
  return descriptions[element][language];
}

