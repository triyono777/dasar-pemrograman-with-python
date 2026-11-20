import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Link2,
  Lock,
  RotateCcw,
  Share2,
  Star,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import {
  BADGE_DEFINITIONS,
  BADGE_EMBLEM_IMAGE,
  PEER_STUDENTS,
  STUDENT_AVATAR_IMAGE,
} from '../data/badgesAndPeers';
import {
  buildLeaderboard,
  calculateLevelInfo,
  countCompletedModules,
  countTotalMiniGameStars,
} from '../engine/gamification';
import {
  buildProfileShareText,
  buildProfileShareUrl,
  buildSharedProfilePayload,
  MAX_BIO_LENGTH,
  processProfilePhotoFile,
  renderProfileCardPng,
  validateProfileInput,
} from '../engine/profileShare';
import type { AppProgressState, EditableUserProfile, UserProfile } from '../types';

/* ==================== LEADERBOARD VIEW ==================== */

interface LeaderboardViewProps {
  state: AppProgressState;
}

export function LeaderboardView({ state }: LeaderboardViewProps) {
  const [sortBy, setSortBy] = useState<'total' | 'weekly' | 'minigame'>('total');

  const rows = useMemo(
    () => buildLeaderboard(state, PEER_STUDENTS, sortBy),
    [state, sortBy]
  );

  const userRow = rows.find((r) => r.isCurrentUser)!;
  const personAbove = userRow.rank > 1 ? rows[userRow.rank - 2] : null;
  const topThree = rows.slice(0, 3);

  return (
    <section className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Papan Peringkat Kelas Dasar Pemrograman
          </h1>
          <p className="text-sm text-slate-600">
            Peringkat diperbarui otomatis setiap kali kamu menuntaskan modul, tantangan Lab Python, mini-game, dan asesmen.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {(
            [
              { id: 'total', label: 'Total XP' },
              { id: 'weekly', label: 'Minggu Ini' },
              { id: 'minigame', label: 'Bintang Mini-Game' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSortBy(tab.id)}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                sortBy === tab.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 tabular-nums">
        {topThree.map((entry) => (
          <div
            key={entry.id}
            className={`rounded-2xl border p-5 space-y-3 ${
              entry.isCurrentUser
                ? 'bg-blue-50/70 border-blue-300'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700">
                Peringkat #{entry.rank}
              </span>
              <Trophy
                className={`w-4 h-4 ${
                  entry.rank === 1
                    ? 'text-amber-500'
                    : entry.rank === 2
                      ? 'text-slate-400'
                      : 'text-amber-700'
                }`}
              />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">
                {entry.name} {entry.isCurrentUser ? '(Kamu)' : ''}
              </p>
              <p className="text-xs text-slate-500">
                Kelas {entry.kelas} · Lv. {entry.level} {entry.levelTitle}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-900 text-sm">
                {sortBy === 'weekly'
                  ? `${entry.weeklyXp} XP minggu ini`
                  : sortBy === 'minigame'
                    ? `${entry.miniGameStars} Bintang`
                    : `${entry.xp} XP`}
              </span>
              <span className="text-slate-500">{entry.completedModules}/13 modul</span>
            </div>
          </div>
        ))}
      </div>

      {/* User Rank Callout */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 tabular-nums">
        <div className="space-y-1">
          <p className="text-xs text-slate-300">Posisi Kamu Saat Ini</p>
          <p className="text-lg sm:text-xl font-bold">
            Peringkat #{userRow.rank} dari {rows.length} Mahasiswa · {userRow.xp} XP
          </p>
        </div>
        <p className="text-sm text-slate-200">
          {personAbove
            ? sortBy === 'minigame'
              ? `Butuh ${Math.max(1, personAbove.miniGameStars - userRow.miniGameStars + 1)} bintang lagi untuk menyalip ${personAbove.name}.`
              : sortBy === 'weekly'
                ? `Butuh ${Math.max(1, personAbove.weeklyXp - userRow.weeklyXp + 1)} XP minggu ini lagi untuk menyalip ${personAbove.name}.`
                : `Butuh ${Math.max(1, personAbove.xp - userRow.xp + 1)} XP lagi untuk menyalip ${personAbove.name}.`
            : 'Kamu memimpin di Peringkat #1 kelas! Pertahankan konsistensimu.'}
        </p>
      </div>

      {/* Complete Ranked Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs text-slate-500">
                <th className="py-3.5 px-4 font-semibold w-16">Rank</th>
                <th className="py-3.5 px-4 font-semibold">Mahasiswa</th>
                <th className="py-3.5 px-4 font-semibold">Level</th>
                <th className="py-3.5 px-4 font-semibold text-right">Modul</th>
                <th className="py-3.5 px-4 font-semibold text-right">Bintang</th>
                <th className="py-3.5 px-4 font-semibold text-right">Lencana</th>
                <th className="py-3.5 px-4 font-semibold text-right">
                  {sortBy === 'weekly' ? 'XP Minggu Ini' : 'Total XP'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={row.isCurrentUser ? 'bg-blue-50/70 font-medium' : 'hover:bg-slate-50/70'}
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    #{row.rank}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900">
                      {row.name}
                      {row.isCurrentUser && (
                        <span className="ml-2 text-xs font-semibold text-blue-700">(Kamu)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">Kelas {row.kelas}</p>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-700">
                    Lv. {row.level} · {row.levelTitle}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-700">
                    {row.completedModules}/13
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      {row.miniGameStars}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-700">
                    {row.badgesCount}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    {sortBy === 'weekly' ? row.weeklyXp : row.xp} XP
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ==================== PROFILE & BADGES VIEW ==================== */

interface ProfileViewProps {
  state: AppProgressState;
  onUpdateProfile: (updates: EditableUserProfile) => void;
  onResetProgress: () => void;
}

const SEMESTER_OPTIONS = [
  'Semester 1',
  'Semester 2',
  'Semester 3',
  'Semester 4',
  'Semester 5',
  'Semester 6',
  'Semester 7',
  'Semester 8',
  'Umum / Mandiri',
];

async function copyTextReliable(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below when Clipboard API is blocked inside iframe
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', 'true');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function ProfileView({ state, onUpdateProfile, onResetProgress }: ProfileViewProps) {
  const [name, setName] = useState(state.profile.name);
  const [nim, setNim] = useState(state.profile.nim);
  const [kelas, setKelas] = useState(state.profile.kelas);
  const [prodi, setProdi] = useState(state.profile.prodi);
  const [institusi, setInstitusi] = useState(state.profile.institusi);
  const [semester, setSemester] = useState(state.profile.semester);
  const [email, setEmail] = useState(state.profile.email);
  const [bio, setBio] = useState(state.profile.bio);
  const [avatarId, setAvatarId] = useState<UserProfile['avatarId']>(state.profile.avatarId);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(state.profile.photoDataUrl);

  const [formError, setFormError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [avatarImgFailed, setAvatarImgFailed] = useState(false);
  const [emblemImgFailed, setEmblemImgFailed] = useState(false);

  // Share Modal State
  const [shareOpen, setShareOpen] = useState(false);
  const [copiedMode, setCopiedMode] = useState<'link' | 'text' | 'native' | null>(null);
  const [downloadingCard, setDownloadingCard] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync form fields if user resets progress
  useEffect(() => {
    setName(state.profile.name);
    setNim(state.profile.nim);
    setKelas(state.profile.kelas);
    setProdi(state.profile.prodi);
    setInstitusi(state.profile.institusi);
    setSemester(state.profile.semester);
    setEmail(state.profile.email);
    setBio(state.profile.bio);
    setAvatarId(state.profile.avatarId);
    setPhotoDataUrl(state.profile.photoDataUrl);
  }, [
    state.profile.name,
    state.profile.nim,
    state.profile.kelas,
    state.profile.prodi,
    state.profile.institusi,
    state.profile.semester,
    state.profile.email,
    state.profile.bio,
    state.profile.avatarId,
    state.profile.photoDataUrl,
  ]);

  const levelInfo = calculateLevelInfo(state.profile.xp);
  const completedMods = countCompletedModules(state);
  const totalStars = countTotalMiniGameStars(state);

  const leaderboardRows = useMemo(
    () => buildLeaderboard(state, PEER_STUDENTS, 'total'),
    [state]
  );
  const currentRank = leaderboardRows.find((r) => r.isCurrentUser)?.rank ?? 1;

  const sharePayload = useMemo(
    () => buildSharedProfilePayload(state, currentRank),
    [state, currentRank]
  );

  const shareUrl = useMemo(() => {
    const baseHref = typeof window !== 'undefined' ? window.location.href : 'https://pydasar.app/';
    return buildProfileShareUrl(baseHref, sharePayload);
  }, [sharePayload]);

  const shareSummaryText = useMemo(
    () => buildProfileShareText(sharePayload, leaderboardRows.length, shareUrl),
    [sharePayload, leaderboardRows.length, shareUrl]
  );

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setPhotoLoading(true);
    try {
      const resized = await processProfilePhotoFile(file);
      setPhotoDataUrl(resized);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Gagal memproses foto.');
    } finally {
      setPhotoLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const candidate: EditableUserProfile = {
      name: name.trim(),
      nim: nim.trim(),
      kelas: kelas.trim(),
      prodi: prodi.trim(),
      institusi: institusi.trim(),
      semester: semester.trim() || 'Semester 1',
      email: email.trim(),
      bio: bio.trim(),
      avatarId,
      photoDataUrl,
    };

    const validationError = validateProfileInput(candidate);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    onUpdateProfile(candidate);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 3500);
  };

  const handleCopyShareLink = async () => {
    await copyTextReliable(shareUrl);
    setCopiedMode('link');
    window.setTimeout(() => setCopiedMode(null), 2500);
  };

  const handleCopyShareText = async () => {
    await copyTextReliable(shareSummaryText);
    setCopiedMode('text');
    window.setTimeout(() => setCopiedMode(null), 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `Profil PyDasar Studio — ${state.profile.name}`,
          text: shareSummaryText,
          url: shareUrl,
        });
        setCopiedMode('native');
        window.setTimeout(() => setCopiedMode(null), 2500);
        return;
      } catch {
        // User cancelled or blocked in iframe; fallback to clipboard copy
      }
    }
    await handleCopyShareText();
  };

  const handleDownloadCard = async () => {
    setDownloadingCard(true);
    try {
      const cardPhoto =
        state.profile.photoDataUrl ||
        (state.profile.avatarId === 'student' && !avatarImgFailed ? STUDENT_AVATAR_IMAGE : undefined);
      const pngUrl = await renderProfileCardPng(sharePayload, cardPhoto);
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `kartu-profil-${state.profile.nim || 'pydasar'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloadingCard(false);
    }
  };

  const initials = (name || state.profile.name)
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderAvatar = (
    selected: UserProfile['avatarId'],
    customPhoto?: string,
    size = 'w-20 h-20',
    altName = state.profile.name
  ) => {
    if (customPhoto) {
      return (
        <img
          src={customPhoto}
          alt={`Foto profil ${altName}`}
          className={`${size} rounded-2xl object-cover border border-slate-200 shrink-0`}
        />
      );
    }
    if (selected === 'student' && !avatarImgFailed) {
      return (
        <img
          src={STUDENT_AVATAR_IMAGE}
          alt={`Avatar mahasiswa ${altName}`}
          referrerPolicy="no-referrer"
          onError={() => setAvatarImgFailed(true)}
          className={`${size} rounded-2xl object-cover border border-slate-200 shrink-0`}
        />
      );
    }
    const bgMap = {
      student: 'bg-blue-700 text-white',
      cobalt: 'bg-blue-700 text-white',
      emerald: 'bg-emerald-700 text-white',
      amber: 'bg-amber-600 text-white',
    };
    return (
      <div
        className={`${size} rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 ${bgMap[selected]}`}
      >
        {initials || 'PY'}
      </div>
    );
  };

  return (
    <section className="space-y-10">
      {/* Top Profile & Identity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Student Identity Summary & Share Trigger */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div className="flex items-start gap-4">
            {renderAvatar(state.profile.avatarId, state.profile.photoDataUrl)}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-blue-700">
                Level {levelInfo.level} · {levelInfo.title} · Peringkat #{currentRank}
              </p>
              <h1 className="text-xl font-bold text-slate-900 truncate mt-0.5">
                {state.profile.name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                NIM {state.profile.nim} · Kelas {state.profile.kelas}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {state.profile.prodi}
                {state.profile.semester ? ` · ${state.profile.semester}` : ''}
              </p>
              {state.profile.institusi && (
                <p className="text-xs text-slate-500 mt-0.5 truncate">{state.profile.institusi}</p>
              )}
              {state.profile.email && (
                <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                  {state.profile.email}
                </p>
              )}
            </div>
          </div>

          {state.profile.bio && (
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5">
              “{state.profile.bio}”
            </p>
          )}

          <div className="space-y-2 tabular-nums">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Progres XP Level {levelInfo.level}</span>
              <span className="font-mono text-slate-600">
                {levelInfo.currentXp} / {levelInfo.nextLevelXp} XP ({levelInfo.progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-700 transition-all duration-300"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center tabular-nums">
            <div>
              <p className="text-lg font-bold text-slate-900">{completedMods}/13</p>
              <p className="text-xs text-slate-500">Modul</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{totalStars}</p>
              <p className="text-xs text-slate-500">Bintang</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{state.profile.streakDays} Hari</p>
              <p className="text-xs text-slate-500">Streak</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <Share2 className="w-4 h-4" />
              Bagikan Profil
            </button>
            <button
              type="button"
              onClick={handleDownloadCard}
              disabled={downloadingCard}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {downloadingCard ? 'Membuat...' : 'Kartu PNG'}
            </button>
          </div>
        </div>

        {/* Right: Edit Profile Form */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Pengaturan Profil Mahasiswa</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Lengkapi data diri dan foto profil untuk disimpan, ditampilkan di Papan Peringkat, serta dibagikan.
              </p>
            </div>
          </div>

          {/* Photo Upload & Preview Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            {renderAvatar(avatarId, photoDataUrl, 'w-16 h-16', name || state.profile.name)}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <p className="text-xs font-semibold text-slate-800">Foto Profil</p>
                <p className="text-[11px] text-slate-500">
                  Unggah foto JPG, PNG, atau WebP (maks. 5 MB). Foto otomatis disesuaikan agar tersimpan cepat.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  id="profile-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {photoLoading ? 'Memproses...' : photoDataUrl ? 'Ganti Foto' : 'Unggah Foto'}
                </button>
                {photoDataUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoDataUrl(undefined)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:text-red-700 hover:border-red-200 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Foto
                  </button>
                )}
              </div>
              {photoError && (
                <p role="alert" className="text-xs font-medium text-red-700">
                  {photoError}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label htmlFor="profile-name" className="block text-xs font-semibold text-slate-700">
                Nama Lengkap
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Rafi Maulana"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-nim" className="block text-xs font-semibold text-slate-700">
                NIM / Nomor Induk
              </label>
              <input
                id="profile-nim"
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="24060120140088"
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-kelas" className="block text-xs font-semibold text-slate-700">
                Kelas Praktikum
              </label>
              <input
                id="profile-kelas"
                type="text"
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                placeholder="Contoh: IF-1A"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-prodi" className="block text-xs font-semibold text-slate-700">
                Program Studi
              </label>
              <input
                id="profile-prodi"
                type="text"
                value={prodi}
                onChange={(e) => setProdi(e.target.value)}
                placeholder="Contoh: Teknik Informatika"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-semester" className="block text-xs font-semibold text-slate-700">
                Semester
              </label>
              <select
                id="profile-semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {SEMESTER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-institusi" className="block text-xs font-semibold text-slate-700">
                Kampus / Institusi
              </label>
              <input
                id="profile-institusi"
                type="text"
                value={institusi}
                onChange={(e) => setInstitusi(e.target.value)}
                placeholder="Contoh: Universitas Teknologi Nusantara"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-email" className="block text-xs font-semibold text-slate-700">
                Email Akademik (Opsional)
              </label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@mahasiswa.ac.id"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="profile-bio" className="block text-xs font-semibold text-slate-700">
                  Bio Singkat / Target Belajar
                </label>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {bio.length}/{MAX_BIO_LENGTH}
                </span>
              </div>
              <textarea
                id="profile-bio"
                rows={2}
                maxLength={MAX_BIO_LENGTH}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tuliskan fokus belajarmu di mata kuliah Dasar Pemrograman..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700">
              Gaya Avatar Cadangan {photoDataUrl ? '(aktif jika foto dihapus)' : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'student', label: 'Ilustrasi Mahasiswa' },
                  { id: 'cobalt', label: 'Inisial Biru Kobalt' },
                  { id: 'emerald', label: 'Inisial Zamrud' },
                  { id: 'amber', label: 'Inisial Emas' },
                ] as const
              ).map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setAvatarId(av.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                    avatarId === av.id
                      ? 'bg-blue-50 border-blue-600 text-blue-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {av.label}
                </button>
              ))}
            </div>
          </div>

          {formError && (
            <p role="alert" className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
              {formError}
            </p>
          )}

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
              >
                Simpan Profil
              </button>
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <Share2 className="w-4 h-4" />
                Share Profil
              </button>
              {savedNotice && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  Profil tersimpan
                </span>
              )}
            </div>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-700 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Progres Belajar
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-red-700 font-medium">Yakin reset semua data?</span>
                <button
                  type="button"
                  onClick={() => {
                    onResetProgress();
                    setConfirmReset(false);
                  }}
                  className="px-3 py-1.5 font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  Ya, Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1.5 font-medium text-slate-700 bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Share Profile Dialog */}
      {shareOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-profile-title"
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <h2 id="share-profile-title" className="text-base font-bold text-slate-900">
                  Bagikan Profil Belajar
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bagikan tautan profil, salin ringkasan teks, atau unduh kartu profil PNG beserta fotomu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                aria-label="Tutup jendela bagikan profil"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Visual Profile Card Preview */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                <div className="bg-slate-900 px-5 py-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-blue-300">PyDasar Studio · Kartu Profil</span>
                  <span className="font-mono text-slate-300 tabular-nums">
                    Peringkat #{sharePayload.rank} · Lv. {sharePayload.level}
                  </span>
                </div>
                <div className="p-5 bg-white space-y-4">
                  <div className="flex items-center gap-4">
                    {renderAvatar(
                      state.profile.avatarId,
                      state.profile.photoDataUrl,
                      'w-16 h-16',
                      state.profile.name
                    )}
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-slate-900 truncate">{sharePayload.name}</p>
                      <p className="text-xs font-mono text-slate-500 tabular-nums">
                        NIM {sharePayload.nim} · Kelas {sharePayload.kelas}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 truncate">
                        {[sharePayload.prodi, sharePayload.institusi, sharePayload.semester]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>
                  {sharePayload.bio && (
                    <p className="text-xs text-slate-600 italic">“{sharePayload.bio}”</p>
                  )}
                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center tabular-nums">
                    <div>
                      <p className="text-sm font-bold font-mono text-slate-900">{sharePayload.xp}</p>
                      <p className="text-[11px] text-slate-500">XP</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold font-mono text-slate-900">
                        {sharePayload.completedModules}/13
                      </p>
                      <p className="text-[11px] text-slate-500">Modul</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold font-mono text-slate-900">
                        {sharePayload.totalStars}
                      </p>
                      <p className="text-[11px] text-slate-500">Bintang</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold font-mono text-slate-900">
                        {sharePayload.badgesCount}
                      </p>
                      <p className="text-[11px] text-slate-500">Lencana</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shareable URL Field */}
              <div className="space-y-1.5">
                <label htmlFor="share-profile-url" className="block text-xs font-semibold text-slate-700">
                  Tautan Profil
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="share-profile-url"
                    type="text"
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 min-w-0 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap"
                  >
                    {copiedMode === 'link' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3.5 h-3.5" />
                        Salin Tautan
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyShareText}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap"
                >
                  {copiedMode === 'text' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-700" />
                      Teks Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Salin Ringkasan
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCard}
                  disabled={downloadingCard}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  {downloadingCard ? 'Menyiapkan...' : 'Unduh Kartu PNG'}
                </button>
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap"
                >
                  <Share2 className="w-4 h-4" />
                  {copiedMode === 'native' ? 'Dibagikan' : 'Bagikan Langsung'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Badges Gallery */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            {!emblemImgFailed ? (
              <img
                src={BADGE_EMBLEM_IMAGE}
                alt="Medali lencana pencapaian akademik PyDasar Studio"
                referrerPolicy="no-referrer"
                onError={() => setEmblemImgFailed(true)}
                className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <Award className="w-7 h-7 text-amber-600" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900">Lencana Pencapaian</h2>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                {state.unlockedBadgeIds.length} dari {BADGE_DEFINITIONS.length} lencana telah dibuka
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BADGE_DEFINITIONS.map((badge) => {
            const isUnlocked = state.unlockedBadgeIds.includes(badge.id);
            return (
              <article
                key={badge.id}
                className={`rounded-xl border p-5 flex items-start gap-4 transition-colors ${
                  isUnlocked
                    ? 'bg-white border-amber-300'
                    : 'bg-slate-50/70 border-slate-200 opacity-75'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isUnlocked
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isUnlocked ? <Award className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{badge.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">+{badge.xpBonus} XP</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{badge.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{badge.description}</p>
                  <p
                    className={`text-xs font-semibold pt-1 ${
                      isUnlocked ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {isUnlocked ? 'Terbuka' : 'Terkunci'}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
