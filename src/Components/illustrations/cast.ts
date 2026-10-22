import { HAIR, SKIN, type CharacterSpec, type HairStyle, type Accessory, type Outfit } from "./Character";

/**
 * The fixed illustrated cast used across marketing visuals. Every sample
 * profile on the public site maps to one of these — they are characters,
 * not depictions of real creators.
 */
export const CAST = {
  brandManager: { skin: SKIN[1], hair: HAIR[0], hairStyle: "bob", outfit: "blazer", outfitColor: "#1E2A5A", accessory: "earrings", bg: ["#E4E8FF", "#C9D2FF"] },
  brandLead: { skin: SKIN[3], hair: HAIR[3], hairStyle: "short", outfit: "blazer", outfitColor: "#2B3A67", accessory: "glasses", bg: ["#E3F0FF", "#C3DBFF"] },
  marketer: { skin: SKIN[0], hair: HAIR[4], hairStyle: "ponytail", outfit: "turtleneck", outfitColor: "#5B4BFF", bg: ["#EEE9FF", "#D9D0FF"] },
  beauty: { skin: SKIN[1], hair: HAIR[1], hairStyle: "wavy", outfit: "tee", outfitColor: "#F472B6", accessory: "earrings", bg: ["#FFE4F0", "#FBC8DE"] },
  tech: { skin: SKIN[2], hair: HAIR[0], hairStyle: "short", outfit: "hoodie", outfitColor: "#3B82F6", accessory: "headphones", bg: ["#DDEBFF", "#B9D5FF"] },
  fitness: { skin: SKIN[3], hair: HAIR[0], hairStyle: "buzz", outfit: "tee", outfitColor: "#10B981", accessory: "headband", bg: ["#DBF7EC", "#B4EDD7"] },
  travel: { skin: SKIN[1], hair: HAIR[2], hairStyle: "ponytail", outfit: "tee", outfitColor: "#F59E0B", accessory: "camera", bg: ["#FFF1D6", "#FFDFA3"] },
  lifestyle: { skin: SKIN[2], hair: HAIR[5], hairStyle: "bun", outfit: "turtleneck", outfitColor: "#8B5CF6", accessory: "earrings", bg: ["#EFE7FF", "#D9C8FF"] },
  food: { skin: SKIN[4], hair: HAIR[0], hairStyle: "curly", outfit: "tee", outfitColor: "#EF4444", bg: ["#FFE5E0", "#FFC9BF"] },
  gaming: { skin: SKIN[0], hair: HAIR[3], hairStyle: "short", outfit: "hoodie", outfitColor: "#7C3AED", accessory: "headphones", bg: ["#E9E3FF", "#CBBEFF"] },
  fashion: { skin: SKIN[4], hair: HAIR[0], hairStyle: "long", outfit: "blazer", outfitColor: "#0F172A", accessory: "earrings", bg: ["#F1F1F6", "#DADBE6"] },
} satisfies Record<string, CharacterSpec>;

export type CastKey = keyof typeof CAST;

const NICHE_TO_CAST: Record<string, CastKey> = {
  beauty: "beauty",
  skincare: "beauty",
  tech: "tech",
  technology: "tech",
  gaming: "gaming",
  fitness: "fitness",
  health: "fitness",
  travel: "travel",
  lifestyle: "lifestyle",
  food: "food",
  fashion: "fashion",
};

function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

const HAIR_STYLES: HairStyle[] = ["short", "long", "bun", "curly", "buzz", "ponytail", "bob", "wavy"];
const OUTFITS: Outfit[] = ["tee", "hoodie", "turtleneck", "blazer"];
const ACCESSORIES: Accessory[] = ["none", "glasses", "earrings", "none", "headphones"];
const OUTFIT_COLORS = ["#5B4BFF", "#3B82F6", "#F472B6", "#10B981", "#F59E0B", "#8B5CF6", "#0EA5E9", "#EF4444"];
const BGS: [string, string][] = [
  ["#E4E8FF", "#C9D2FF"],
  ["#FFE4F0", "#FBC8DE"],
  ["#DBF7EC", "#B4EDD7"],
  ["#FFF1D6", "#FFDFA3"],
  ["#EFE7FF", "#D9C8FF"],
  ["#DDEBFF", "#B9D5FF"],
];

/**
 * Deterministic illustrated character for any name — the default avatar for
 * accounts without an uploaded photo. Niche, when known, picks the niche
 * outfit/accessory so cards stay meaningful.
 */
export function characterFor(name: string, niche?: string | null): CharacterSpec {
  const h = hash(name || "creator");
  const key = niche ? NICHE_TO_CAST[niche.toLowerCase()] : undefined;
  const base: CharacterSpec = key
    ? { ...CAST[key] }
    : {
        skin: SKIN[h % SKIN.length],
        hair: HAIR[(h >>> 3) % HAIR.length],
        hairStyle: HAIR_STYLES[(h >>> 6) % HAIR_STYLES.length],
        outfit: OUTFITS[(h >>> 9) % OUTFITS.length],
        outfitColor: OUTFIT_COLORS[(h >>> 12) % OUTFIT_COLORS.length],
        accessory: ACCESSORIES[(h >>> 15) % ACCESSORIES.length],
        bg: BGS[(h >>> 18) % BGS.length],
      };
  // Vary skin/hair per name even within a niche so a grid never repeats a face.
  if (key) {
    base.skin = SKIN[h % SKIN.length];
    base.hair = HAIR[(h >>> 3) % HAIR.length];
    base.hairStyle = HAIR_STYLES[(h >>> 6) % HAIR_STYLES.length];
  }
  return base;
}
