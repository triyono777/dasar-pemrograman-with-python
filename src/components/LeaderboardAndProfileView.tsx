import { useMemo, useState } from 'react';
import { Award, CheckCircle2, Lock, RotateCcw, Star, Trophy } from 'lucide-react';
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
import type { AppProgressState, UserProfile } from '../types';

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
  onUpdateProfile: (updates: Pick<UserProfile, 'name' | 'nim' | 'kelas' | 'avatarId'>) => void;
  onResetProgress: () => void;
}

export function ProfileView({ state, onUpdateProfile, onResetProgress }: ProfileViewProps) {
  const [name, setName] = useState(state.profile.name);
  const [nim, setNim] = useState(state.profile.nim);
  const [kelas, setKelas] = useState(state.profile.kelas);
  const [avatarId, setAvatarId] = useState<UserProfile['avatarId']>(state.profile.avatarId);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [avatarImgFailed, setAvatarImgFailed] = useState(false);
  const [emblemImgFailed, setEmblemImgFailed] = useState(false);

  const levelInfo = calculateLevelInfo(state.profile.xp);
  const completedMods = countCompletedModules(state);
  const totalStars = countTotalMiniGameStars(state);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanNim = nim.trim();
    const cleanKelas = kelas.trim();

    if (cleanName.length < 2) {
      setFormError('Nama lengkap minimal terdiri dari 2 karakter.');
      return;
    }
    if (cleanNim.length < 4) {
      setFormError('NIM minimal terdiri dari 4 karakter.');
      return;
    }
    if (cleanKelas.length < 2) {
      setFormError('Nama kelas wajib diisi (contoh: IF-1A).');
      return;
    }

    setFormError(null);
    onUpdateProfile({
      name: cleanName,
      nim: cleanNim,
      kelas: cleanKelas,
      avatarId,
    });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 3000);
  };

  const initials = state.profile.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderAvatar = (selected: UserProfile['avatarId'], size = 'w-20 h-20') => {
    if (selected === 'student' && !avatarImgFailed) {
      return (
        <img
          src={STUDENT_AVATAR_IMAGE}
          alt={`Avatar mahasiswa ${state.profile.name}`}
          referrerPolicy="no-referrer"
          onError={() => setAvatarImgFailed(true)}
          className={`${size} rounded-2xl object-cover border border-slate-200`}
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
        className={`${size} rounded-2xl flex items-center justify-center font-bold text-xl ${bgMap[selected]}`}
      >
        {initials || 'PY'}
      </div>
    );
  };

  return (
    <section className="space-y-10">
      {/* Top Profile & Identity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Student Identity Summary & Level Bar */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-4">
            {renderAvatar(state.profile.avatarId)}
            <div className="min-w-0">
              <p className="text-xs font-medium text-blue-700">
                Level {levelInfo.level} · {levelInfo.title}
              </p>
              <h1 className="text-xl font-bold text-slate-900 truncate mt-0.5">
                {state.profile.name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                NIM {state.profile.nim} · Kelas {state.profile.kelas}
              </p>
            </div>
          </div>

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
        </div>

        {/* Right: Edit Profile Form */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
        >
          <div>
            <h2 className="text-base font-bold text-slate-900">Pengaturan Profil Mahasiswa</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identitas ini ditampilkan pada Papan Peringkat dan Transkrip Rekap Pembelajaran.
            </p>
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
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700">Gaya Avatar</p>
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
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
              >
                Simpan Profil
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
