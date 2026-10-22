"use client";

import { useState } from "react";
import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import Character, { type CharacterSpec } from "@/Components/illustrations/Character";
import { characterFor } from "@/Components/illustrations/cast";

interface CreatorAvatarProps {
  name: string;
  /** The user's own uploaded photo. Only real, user-provided photos go here. */
  photoUrl?: string | null;
  /** Picks a niche-appropriate illustrated fallback. */
  niche?: string | null;
  /** Explicit illustrated character (marketing sample profiles). */
  character?: CharacterSpec;
  verified?: boolean;
  className?: string;
  badgeClassName?: string;
  rounded?: string;
  sizes?: string;
}

/**
 * Creator avatar. Renders the creator's own uploaded photo when there is one;
 * otherwise (or if it fails to load) an illustrated character from the
 * BlooCube cast, chosen deterministically from the name and niche. Seeded
 * demo accounts and marketing samples therefore never borrow a real
 * person's face.
 */
export default function CreatorAvatar({
  name,
  photoUrl,
  niche,
  character,
  verified,
  className = "",
  badgeClassName = "",
  rounded = "rounded-2xl",
  sizes = "160px",
}: CreatorAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = photoUrl && !imgFailed;

  return (
    <div className={`relative ${className}`}>
      {showPhoto ? (
        <Image
          src={photoUrl}
          alt={`Profile photo of ${name}`}
          fill
          sizes={sizes}
          // User uploads can live on any storage host; skip the optimizer's
          // remotePatterns check rather than crash on an unlisted domain.
          unoptimized={/^https?:\/\//.test(photoUrl)}
          className={`object-cover ${rounded}`}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <Character
          spec={character ?? characterFor(name, niche)}
          className={`absolute inset-0 h-full w-full ${rounded}`}
          title={`Illustrated avatar for ${name}`}
        />
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
