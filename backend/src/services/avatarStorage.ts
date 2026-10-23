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

// multer's fileFilter only sees the client-declared Content-Type of the
// multipart field, which the uploader controls and can set to anything —
// it never looks at the bytes. Trusting it alone means a request can claim
// `image/png` while actually uploading arbitrary content (HTML, a script,
// anything up to the 5MB limit), which then gets stored and served back
// with a `Content-Type: image/png` response header derived from the file
// extension, not its real content. This sniffs the file's actual magic
// bytes and is the only thing that decides the extension/stored type —
// the client's declared Content-Type is never trusted for that.
export function sniffAvatarExt(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return 'png';
  }
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61
  ) {
    return 'gif';
  }
  return null;
}

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
