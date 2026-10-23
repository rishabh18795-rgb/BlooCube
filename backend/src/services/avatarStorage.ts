import fs from 'fs';
import path from 'path';

// Avatars are stored next to the SQLite database file itself, so they
// automatically land on the same Railway Volume as prod.db in production
// (persistent across deploys/restarts) without needing a separate env var
// or a new paid object-storage provider.
function resolveDataDir(): string {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  const filePath = dbUrl.replace(/^file:/, '');
  return path.dirname(path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath));
}

export const AVATAR_DIR = path.join(resolveDataDir(), 'avatars');
fs.mkdirSync(AVATAR_DIR, { recursive: true });

export const AVATAR_URL_PREFIX = '/uploads/avatars/';

export const ALLOWED_AVATAR_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
};

// Confines deletion to AVATAR_DIR regardless of what's stored in avatarUrl —
// defense in depth even though the value is always server-generated.
export function avatarPathFromUrl(avatarUrl: string): string | null {
  if (!avatarUrl.startsWith(AVATAR_URL_PREFIX)) return null;
  return path.join(AVATAR_DIR, path.basename(avatarUrl));
}

export function deleteAvatarFile(avatarUrl: string | null | undefined) {
  if (!avatarUrl) return;
  const filePath = avatarPathFromUrl(avatarUrl);
  if (!filePath) return;
  fs.unlink(filePath, () => {
    // Best-effort cleanup; a missing file is not an error worth surfacing.
  });
}
