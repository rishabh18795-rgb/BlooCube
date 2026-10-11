/**
 * Photo lookup for the seeded demo creator accounts only (see
 * backend/prisma/seed.ts). These are licensed stock photographs
 * (Unsplash License — free for commercial use, no permission required),
 * used as temporary placeholders standing in for these specific named
 * demo profiles until real creator photos or a funded AI-generation
 * pass replace them. Any creator not in this map (i.e. every real,
 * non-seed account) falls back to the initials avatar automatically.
 */
const DEMO_CREATOR_PHOTOS: Record<string, string> = {
  "Ananya Kapoor": "/images/creators/ananya.jpg",
  "Rohan Sharma": "/images/creators/rohan.jpg",
  "Mehak Patel": "/images/creators/mehak.jpg",
  "Karan Verma": "/images/creators/karan.jpg",
  "Isha Malhotra": "/images/creators/isha.jpg",
  "Arjun Nair": "/images/creators/arjun.jpg",
};

export function getDemoCreatorPhoto(name: string): string | null {
  return DEMO_CREATOR_PHOTOS[name] || null;
}
