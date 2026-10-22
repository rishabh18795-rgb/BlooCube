import { useId } from "react";

/**
 * BlooCube illustration system — a single vector character style used for
 * every marketing visual, demo profile and default avatar. Soft radial
 * shading gives a rounded, studio-lit look without shipping raster renders.
 *
 * These characters are illustrations, never stand-ins for real people: real
 * users keep their own uploaded photo (see CreatorAvatar).
 */

export type HairStyle = "short" | "long" | "bun" | "curly" | "buzz" | "ponytail" | "bob" | "wavy";
export type Accessory = "none" | "glasses" | "headphones" | "earrings" | "cap" | "headband" | "camera";
export type Outfit = "tee" | "blazer" | "hoodie" | "turtleneck";

export interface CharacterSpec {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  outfit: Outfit;
  outfitColor: string;
  accessory?: Accessory;
  /** Two-stop background tint; omit for a transparent background. */
  bg?: [string, string];
}

export const SKIN = ["#F7D7BE", "#EDBE9A", "#D49B74", "#B07850", "#80553A"] as const;
export const HAIR = ["#231815", "#4A2C20", "#7A4528", "#1B1A2E", "#A85F2A", "#3B2A4D"] as const;

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  const r = c((n >> 16) & 255);
  const g = c((n >> 8) & 255);
  const b = c(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function HairBack({ style, fill }: { style: HairStyle; fill: string }) {
  switch (style) {
    case "long":
      return <path d="M33 54c-3-26 12-36 27-36s30 10 27 36l4 40c-8 6-18 4-22-2H51c-4 6-14 8-22 2z" fill={fill} />;
    case "wavy":
      return <path d="M32 56c-4-28 12-38 28-38s32 10 28 38c2 10 6 16 2 26-6 10-16 8-20 2H50c-4 6-14 8-20-2-4-10 0-16 2-26z" fill={fill} />;
    case "bob":
      return <path d="M34 54c-2-24 12-34 26-34s28 10 26 34l2 22c-6 4-14 4-18 0H50c-4 4-12 4-18 0z" fill={fill} />;
    case "ponytail":
      return <path d="M82 40c12 4 16 20 10 36-2 6-8 8-10 2 4-10 4-24 0-38z" fill={fill} />;
    case "bun":
      return <circle cx="60" cy="19" r="10" fill={fill} />;
    default:
      return null;
  }
}

function HairFront({ style, fill }: { style: HairStyle; fill: string }) {
  const hi = shade(fill, 0.12);
  switch (style) {
    case "buzz":
      return <path d="M38 48c0-16 10-24 22-24s22 8 22 24c-6-8-14-11-22-11s-16 3-22 11z" fill={fill} opacity="0.92" />;
    case "curly":
      return (
        <g fill={fill}>
          {[
            [40, 40, 8], [48, 31, 9], [59, 27, 9], [70, 30, 9], [79, 38, 8], [83, 48, 6], [37, 49, 6],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} />
          ))}
          <circle cx="56" cy="29" r="4" fill={hi} opacity="0.5" />
        </g>
      );
    case "long":
    case "wavy":
    case "bob":
      return (
        <g>
          <path d="M37 52c-1-18 10-28 24-28 13 0 23 9 23 26-8-2-16-8-20-16-6 10-16 16-27 18z" fill={fill} />
          <path d="M50 30c6-3 14-3 20 1" stroke={hi} strokeWidth="2" strokeLinecap="round" opacity="0.5" fill="none" />
        </g>
      );
    case "bun":
    case "ponytail":
      return (
        <g>
          <path d="M37 50c0-17 10-26 23-26s23 9 23 26c-4-7-12-12-23-12s-19 5-23 12z" fill={fill} />
          <path d="M48 30c7-4 17-4 24 0" stroke={hi} strokeWidth="2" strokeLinecap="round" opacity="0.5" fill="none" />
        </g>
      );
    case "short":
    default:
      return (
        <g>
          <path d="M37 51c-2-18 9-28 24-28 14 0 24 9 22 27-3-7-8-11-14-12-8 4-20 6-32 13z" fill={fill} />
          <path d="M52 28c6-2 13-1 18 2" stroke={hi} strokeWidth="2" strokeLinecap="round" opacity="0.5" fill="none" />
        </g>
      );
  }
}

function OutfitShape({ outfit, color, uid }: { outfit: Outfit; color: string; uid: string }) {
  const dark = shade(color, -0.14);
  return (
    <g>
      <path d="M16 122c2-20 18-32 44-32s42 12 44 32z" fill={`url(#${uid}-cloth)`} />
      {outfit === "blazer" && (
        <g>
          <path d="M52 91l8 16 8-16 6 2-14 29-14-29z" fill="#fff" opacity="0.92" />
          <path d="M46 93l14 29-10-1-12-24z" fill={dark} />
          <path d="M74 93l-14 29 10-1 12-24z" fill={dark} />
        </g>
      )}
      {outfit === "hoodie" && (
        <g>
          <path d="M40 94c6 10 34 10 40 0" stroke={dark} strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M54 102v10M66 102v10" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        </g>
      )}
      {outfit === "turtleneck" && <path d="M48 86h24v8c-8 4-16 4-24 0z" fill={dark} />}
      {outfit === "tee" && <path d="M50 91c4 6 16 6 20 0" stroke={dark} strokeWidth="3" fill="none" strokeLinecap="round" />}
    </g>
  );
}

export default function Character({
  spec,
  className = "",
  title,
}: {
  spec: CharacterSpec;
  className?: string;
  /** Accessible name; omit for decorative use. */
  title?: string;
}) {
  const uid = "c" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const { skin, hair, hairStyle, outfit, outfitColor, accessory = "none", bg } = spec;

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`${uid}-skin`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor={shade(skin, 0.08)} />
          <stop offset="0.65" stopColor={skin} />
          <stop offset="1" stopColor={shade(skin, -0.12)} />
        </radialGradient>
        <linearGradient id={`${uid}-cloth`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={shade(outfitColor, 0.12)} />
          <stop offset="1" stopColor={shade(outfitColor, -0.1)} />
        </linearGradient>
        {bg && (
          <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={bg[0]} />
            <stop offset="1" stopColor={bg[1]} />
          </linearGradient>
        )}
        <clipPath id={`${uid}-clip`}>
          <rect width="120" height="120" />
        </clipPath>
      </defs>
      {title && <title>{title}</title>}

      <g clipPath={`url(#${uid}-clip)`}>
        {bg && <rect width="120" height="120" fill={`url(#${uid}-bg)`} />}
        {bg && <circle cx="92" cy="22" r="26" fill="#fff" opacity="0.18" />}

        <HairBack style={hairStyle} fill={hair} />

        <path d="M52 74h16v16c-4 4-12 4-16 0z" fill={shade(skin, -0.1)} />
        <OutfitShape outfit={outfit} color={outfitColor} uid={uid} />
        {accessory === "headphones" && (
          <path d="M42 96c4-8 32-8 36 0" stroke="#1E1B3A" strokeWidth="5" strokeLinecap="round" fill="none" />
        )}
        {accessory === "camera" && (
          <g>
            <path d="M44 92l16 18 16-18" stroke="#1E1B3A" strokeWidth="1.6" fill="none" />
            <rect x="52" y="104" width="16" height="11" rx="2.5" fill="#1E1B3A" />
            <circle cx="60" cy="109.5" r="3.4" fill="#5B4BFF" />
            <circle cx="61" cy="108.5" r="1" fill="#fff" />
          </g>
        )}

        <ellipse cx="37.5" cy="56" rx="4" ry="5" fill={shade(skin, -0.05)} />
        <ellipse cx="82.5" cy="56" rx="4" ry="5" fill={shade(skin, -0.05)} />
        <ellipse cx="60" cy="54" rx="22.5" ry="25" fill={`url(#${uid}-skin)`} />

        <ellipse cx="48" cy="63" rx="4" ry="2.4" fill="#FF7A9A" opacity="0.28" />
        <ellipse cx="72" cy="63" rx="4" ry="2.4" fill="#FF7A9A" opacity="0.28" />
        <path d="M47.5 49.5q3.5-2.4 7 0M65.5 49.5q3.5-2.4 7 0" stroke={shade(hair, 0.05)} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <ellipse cx="51" cy="56" rx="2.3" ry="2.9" fill="#1F1633" />
        <ellipse cx="69" cy="56" rx="2.3" ry="2.9" fill="#1F1633" />
        <circle cx="51.8" cy="55" r="0.8" fill="#fff" />
        <circle cx="69.8" cy="55" r="0.8" fill="#fff" />
        <path d="M59 59.5q1.6 2.8 -0.6 3.6" stroke={shade(skin, -0.22)} strokeWidth="1.3" strokeLinecap="round" fill="none" />
        <path d="M53.5 67q6.5 5 13 0" stroke="#7A2E3A" strokeWidth="2" strokeLinecap="round" fill="none" />

        <HairFront style={hairStyle} fill={hair} />

        {accessory === "glasses" && (
          <g stroke="#1E1B3A" strokeWidth="1.6" fill="#fff" fillOpacity="0.18">
            <rect x="44" y="51" width="13" height="10" rx="4" />
            <rect x="63" y="51" width="13" height="10" rx="4" />
            <path d="M57 55h6" fill="none" />
          </g>
        )}
        {accessory === "earrings" && (
          <g fill="#F5B83D">
            <circle cx="37" cy="63" r="2" />
            <circle cx="83" cy="63" r="2" />
          </g>
        )}
        {accessory === "headphones" && (
          <g>
            <path d="M35 54c0-22 50-22 50 0" stroke="#1E1B3A" strokeWidth="4" fill="none" strokeLinecap="round" />
            <rect x="30" y="50" width="9" height="14" rx="4" fill="#5B4BFF" />
            <rect x="81" y="50" width="9" height="14" rx="4" fill="#5B4BFF" />
          </g>
        )}
        {accessory === "cap" && (
          <g>
            <path d="M37 44c0-14 10-21 23-21s23 7 23 21z" fill={outfitColor} />
            <path d="M58 42c10-2 22-1 30 3-6 2-18 2-30 1z" fill={shade(outfitColor, -0.15)} />
          </g>
        )}
        {accessory === "headband" && <path d="M38 41c10-9 34-9 44 0" stroke="#FF6B8B" strokeWidth="4" strokeLinecap="round" fill="none" />}
      </g>
    </svg>
  );
}
