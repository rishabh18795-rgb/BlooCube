"use client";

import { useState } from "react";
import Image from "next/image";
import { BadgeCheck } from "lucide-react";

const PALETTE = [
  "from-rose-400 to-pink-500",
  "from-orange-400 to-amber-500",
  "from-violet-400 to-indigo-500",
  "from-sky-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-fuchsia-400 to-purple-500",
];

function paletteFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function initialsFor(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface CreatorAvatarProps {
  name: string;
  photoUrl?: string | null;
  verified?: boolean;
  className?: string;
  badgeClassName?: string;
  sizes?: string;
}

/**
 * Creator avatar. Renders a real photo when `photoUrl` is given, falling
 * back to a deterministic gradient + initials otherwise (and automatically
 * if the photo fails to load). Photos currently wired in are licensed
 * stock photography (Unsplash License — free for commercial use) used as
 * temporary demo placeholders for the seeded demo accounts, not photos of
 * real BlooCube creators — see src/lib/creatorPhotos.ts.
 */
export default function CreatorAvatar({ name, photoUrl, verified, className = "", badgeClassName = "", sizes = "160px" }: CreatorAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const gradient = paletteFor(name);
  const showPhoto = photoUrl && !imgFailed;

  return (
    <div className={`relative ${className}`}>
      {showPhoto ? (
        <Image
          src={photoUrl}
          alt={`Portrait of ${name}, a BlooCube demo creator profile`}
          fill
          sizes={sizes}
          className="object-cover rounded-2xl"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div
          className={`w-full h-full rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold select-none`}
          aria-hidden="true"
        >
          {initialsFor(name)}
        </div>
      )}
      {verified && (
        <span
          className={`absolute -bottom-1.5 -right-1.5 inline-flex items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5 p-0.5 ${badgeClassName}`}
          title="Verified creator"
        >
          <BadgeCheck className="w-4 h-4 text-brand-indigo" fill="currentColor" stroke="white" />
        </span>
      )}
    </div>
  );
}
