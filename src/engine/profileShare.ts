import type { AppProgressState, EditableUserProfile, SharedProfilePayload } from '../types';
import {
  calculateLevelInfo,
  countCompletedModules,
  countTotalMiniGameStars,
} from './gamification';

export const MAX_BIO_LENGTH = 180;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function validateProfileInput(input: EditableUserProfile): string | null {
  const name = input.name.trim();
  const nim = input.nim.trim();
  const kelas = input.kelas.trim();
  const prodi = input.prodi.trim();
  const institusi = input.institusi.trim();
  const email = input.email.trim();
  const bio = input.bio.trim();

  if (name.length < 2) {
    return 'Nama lengkap minimal terdiri dari 2 karakter.';
  }
  if (nim.length < 4) {
    return 'NIM / Nomor Induk minimal terdiri dari 4 karakter.';
  }
  if (kelas.length < 2) {
    return 'Kelas praktikum wajib diisi (contoh: IF-1A).';
  }
  if (prodi.length < 2) {
    return 'Program studi wajib diisi (contoh: Teknik Informatika).';
  }
  if (institusi.length > 80) {
    return 'Nama kampus/institusi maksimal 80 karakter.';
  }
  if (email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Format email tidak valid (contoh: nama@kampus.ac.id).';
  }
  if (bio.length > MAX_BIO_LENGTH) {
    return `Bio singkat maksimal ${MAX_BIO_LENGTH} karakter.`;
  }
  return null;
}

export function buildSharedProfilePayload(
  state: AppProgressState,
  rank: number
): SharedProfilePayload {
  const levelInfo = calculateLevelInfo(state.profile.xp);
  return {
    name: state.profile.name,
    nim: state.profile.nim,
    kelas: state.profile.kelas,
    prodi: state.profile.prodi,
    institusi: state.profile.institusi,
    semester: state.profile.semester,
    bio: state.profile.bio,
    xp: state.profile.xp,
    level: levelInfo.level,
    levelTitle: levelInfo.title,
    rank,
    completedModules: countCompletedModules(state),
    totalStars: countTotalMiniGameStars(state),
    badgesCount: state.unlockedBadgeIds.length,
    streakDays: state.profile.streakDays,
  };
}

export function buildProfileShareText(
  payload: SharedProfilePayload,
  totalStudents: number,
  shareUrl?: string
): string {
  const lines = [
    `Profil Belajar PyDasar Studio — ${payload.name}`,
    `NIM: ${payload.nim} · Kelas ${payload.kelas} · ${payload.prodi}`,
  ];
  if (payload.institusi.trim()) {
    lines.push(`Institusi: ${payload.institusi} (${payload.semester})`);
  }
  lines.push(
    `Level ${payload.level} (${payload.levelTitle}) · ${payload.xp} XP · Peringkat #${payload.rank}/${totalStudents}`,
    `Progres: ${payload.completedModules}/13 Modul · ${payload.totalStars} Bintang Mini-Game · ${payload.badgesCount} Lencana`
  );
  if (payload.bio.trim()) {
    lines.push(`Bio: "${payload.bio.trim()}"`);
  }
  if (shareUrl) {
    lines.push(`Lihat kartu profil: ${shareUrl}`);
  }
  return lines.join('\n');
}

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(token: string): string {
  const padded = token.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + '='.repeat(padLen));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeSharedProfilePayload(payload: SharedProfilePayload): string {
  return toBase64Url(JSON.stringify(payload));
}

export function decodeSharedProfilePayload(token: string): SharedProfilePayload | null {
  try {
    const raw = fromBase64Url(token);
    const parsed = JSON.parse(raw) as Partial<SharedProfilePayload>;
    if (
      !parsed ||
      typeof parsed.name !== 'string' ||
      typeof parsed.nim !== 'string' ||
      typeof parsed.xp !== 'number'
    ) {
      return null;
    }
    return {
      name: parsed.name.slice(0, 80),
      nim: parsed.nim.slice(0, 40),
      kelas: typeof parsed.kelas === 'string' ? parsed.kelas.slice(0, 30) : '-',
      prodi: typeof parsed.prodi === 'string' ? parsed.prodi.slice(0, 80) : '-',
      institusi: typeof parsed.institusi === 'string' ? parsed.institusi.slice(0, 80) : '',
      semester: typeof parsed.semester === 'string' ? parsed.semester.slice(0, 30) : '',
      bio: typeof parsed.bio === 'string' ? parsed.bio.slice(0, MAX_BIO_LENGTH) : '',
      xp: Math.max(0, Math.round(parsed.xp)),
      level: typeof parsed.level === 'number' ? Math.max(1, Math.round(parsed.level)) : 1,
      levelTitle: typeof parsed.levelTitle === 'string' ? parsed.levelTitle.slice(0, 40) : 'Pemula',
      rank: typeof parsed.rank === 'number' ? Math.max(1, Math.round(parsed.rank)) : 1,
      completedModules:
        typeof parsed.completedModules === 'number' ? Math.max(0, Math.min(13, parsed.completedModules)) : 0,
      totalStars: typeof parsed.totalStars === 'number' ? Math.max(0, parsed.totalStars) : 0,
      badgesCount: typeof parsed.badgesCount === 'number' ? Math.max(0, parsed.badgesCount) : 0,
      streakDays: typeof parsed.streakDays === 'number' ? Math.max(0, parsed.streakDays) : 0,
    };
  } catch {
    return null;
  }
}

export function buildProfileShareUrl(baseHref: string, payload: SharedProfilePayload): string {
  try {
    const url = new URL(baseHref);
    url.searchParams.set('profil', encodeSharedProfilePayload(payload));
    return url.toString();
  } catch {
    return `?profil=${encodeSharedProfilePayload(payload)}`;
  }
}

/**
 * Resizes and center-crops an uploaded image file to a 256x256 JPEG Data URL
 * so it stores reliably inside localStorage and renders sharply on profile cards.
 */
export function processProfilePhotoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File harus berupa gambar (JPG, PNG, atau WebP).'));
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      reject(new Error('Ukuran foto maksimal 5 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file foto.'));
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        reject(new Error('Data foto tidak valid.'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Gambar tidak dapat dimuat. Coba file lain.'));
      img.onload = () => {
        try {
          const size = 256;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.86));
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function loadImageOptional(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

/**
 * Generates a crisp 960x540 PNG Student Profile Card (including custom photo)
 * ready for download or sharing.
 */
export async function renderProfileCardPng(
  payload: SharedProfilePayload,
  photoSrc?: string
): Promise<string> {
  const W = 960;
  const H = 540;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak tersedia.');

  // Clean light editorial card canvas with slate/cobalt accents
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, W, H);

  // Top cobalt header band
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, W, 148);
  ctx.fillStyle = '#1D4ED8';
  ctx.fillRect(0, 144, W, 6);

  // Header brand text
  ctx.fillStyle = '#93C5FD';
  ctx.font = '600 14px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('KARTU PROFIL MAHASISWA · DASAR PEMROGRAMAN PYTHON', 48, 52);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 28px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('PyDasar Studio', 48, 92);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '600 15px "IBM Plex Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`PERINGKAT #${payload.rank} · LV. ${payload.level}`, W - 48, 86);
  ctx.textAlign = 'left';

  // Main white profile panel
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(40, 118, W - 80, 380, 20);
  ctx.fill();
  ctx.stroke();

  // Avatar / Photo box
  const avatarX = 72;
  const avatarY = 152;
  const avatarSize = 132;
  const img = await loadImageOptional(photoSrc);

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 20);
  ctx.clip();
  if (img) {
    ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
  } else {
    ctx.fillStyle = '#1D4ED8';
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    const initials = payload.name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 44px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials || 'PY', avatarX + avatarSize / 2, avatarY + avatarSize / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
  ctx.restore();

  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 20);
  ctx.stroke();

  // Identity text
  const textX = 232;
  ctx.fillStyle = '#1D4ED8';
  ctx.font = '600 14px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(`Level ${payload.level} · ${payload.levelTitle}`, textX, 174);

  ctx.fillStyle = '#0F172A';
  ctx.font = '700 32px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(payload.name, textX, 214);

  ctx.fillStyle = '#475569';
  ctx.font = '500 16px "IBM Plex Mono", monospace';
  ctx.fillText(`NIM ${payload.nim} · Kelas ${payload.kelas}`, textX, 246);

  ctx.fillStyle = '#334155';
  ctx.font = '500 16px "Plus Jakarta Sans", system-ui, sans-serif';
  const academicLine = [payload.prodi, payload.institusi, payload.semester]
    .filter((v) => v && v.trim())
    .join(' · ');
  ctx.fillText(academicLine.slice(0, 72), textX, 276);

  // Bio quote
  if (payload.bio.trim()) {
    ctx.fillStyle = '#64748B';
    ctx.font = '400 15px "Plus Jakarta Sans", system-ui, sans-serif';
    const bioLines = wrapLines(ctx, `"${payload.bio.trim()}"`, W - 144, 2);
    bioLines.forEach((line, idx) => {
      ctx.fillText(line, 72, 326 + idx * 22);
    });
  }

  // Stats strip (4 clean metric tiles)
  const stats = [
    { label: 'TOTAL XP', value: `${payload.xp} XP` },
    { label: 'MODUL TUNTAS', value: `${payload.completedModules} / 13` },
    { label: 'BINTANG MINI-GAME', value: `${payload.totalStars} ★` },
    { label: 'LENCANA TERBUKA', value: `${payload.badgesCount} Lencana` },
  ];
  const tileY = 382;
  const tileW = 192;
  const tileH = 84;
  const tileGap = 16;

  stats.forEach((st, idx) => {
    const tx = 72 + idx * (tileW + tileGap);
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(tx, tileY, tileW, tileH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#64748B';
    ctx.font = '600 11px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(st.label, tx + 16, tileY + 28);

    ctx.fillStyle = '#0F172A';
    ctx.font = '700 22px "IBM Plex Mono", monospace';
    ctx.fillText(st.value, tx + 16, tileY + 62);
  });

  return canvas.toDataURL('image/png');
}
