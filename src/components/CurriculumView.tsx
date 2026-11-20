import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Code2,
  Gamepad2,
  ClipboardCheck,
  Star,
} from 'lucide-react';
import { CURRICULUM_MODULES } from '../data/curriculum';
import { HERO_LAB_IMAGE } from '../data/badgesAndPeers';
import { MINI_GAMES } from '../data/minigames';
import { calculateLevelInfo, countCompletedModules, countTotalMiniGameStars } from '../engine/gamification';
import type { AppProgressState, CurriculumModule } from '../types';
import { PythonLab } from './PythonLab';
import { MiniGamePlayer } from './MiniGamePlayer';

interface CurriculumViewProps {
  state: AppProgressState;
  selectedModuleId: number;
  onSelectModule: (moduleId: number) => void;
  onMarkRead: (moduleId: number) => void;
  onCompleteLab: (moduleId: number) => void;
  onPassCheckpoint: (moduleId: number) => void;
  onCompleteMiniGame: (result: {
    gameId: string;
    moduleId: number;
    score: number;
    maxScore: number;
    stars: number;
    xpEarned: number;
  }) => void;
  onStartAssessmentForModule: (moduleId: number) => void;
}

type ModuleSubTab = 'konsep' | 'lab' | 'minigame' | 'checkpoint';

export function CurriculumView({
  state,
  selectedModuleId,
  onSelectModule,
  onMarkRead,
  onCompleteLab,
  onPassCheckpoint,
  onCompleteMiniGame,
  onStartAssessmentForModule,
}: CurriculumViewProps) {
  const [subTab, setSubTab] = useState<ModuleSubTab>('konsep');
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | CurriculumModule['category']>('Semua');
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  // Checkpoint local answers keyed by `${moduleId}-${questionId}`
  const [checkpointPicks, setCheckpointPicks] = useState<Record<string, number>>({});
  const [checkpointChecked, setCheckpointChecked] = useState<Record<number, boolean>>({});

  const activeModule =
    CURRICULUM_MODULES.find((m) => m.id === selectedModuleId) ?? CURRICULUM_MODULES[0];
  const activeProg = state.modules[activeModule.id] ?? {
    moduleId: activeModule.id,
    readCompleted: false,
    labCompleted: false,
    checkpointPassed: false,
  };
  const moduleMiniGames = MINI_GAMES.filter((g) => g.moduleId === activeModule.id);
  const [selectedModuleGameId, setSelectedModuleGameId] = useState<string>(activeModule.miniGameId);
  const activeMiniGame =
    moduleMiniGames.find((g) => g.id === selectedModuleGameId) ??
    moduleMiniGames[0] ??
    MINI_GAMES[0];
  const activeMiniGameRecord = state.miniGames[activeMiniGame.id];

  const levelInfo = calculateLevelInfo(state.profile.xp);
  const completedModules = countCompletedModules(state);
  const totalStars = countTotalMiniGameStars(state);
  const latestScore = state.assessments[0]?.score;

  const filteredModules =
    categoryFilter === 'Semua'
      ? CURRICULUM_MODULES
      : CURRICULUM_MODULES.filter((m) => m.category === categoryFilter);

  const handleSelectModule = (id: number) => {
    onSelectModule(id);
    setSubTab('konsep');
  };

  const handleCheckCheckpoint = () => {
    setCheckpointChecked((prev) => ({ ...prev, [activeModule.id]: true }));
    const allCorrect = activeModule.checkpoints.every(
      (q) => checkpointPicks[`${activeModule.id}-${q.id}`] === q.correctIndex
    );
    if (allCorrect) {
      onPassCheckpoint(activeModule.id);
    }
  };

  return (
    <div className="space-y-10">
      {/* Editorial Hero Split */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <p className="text-xs font-medium text-blue-700">
                Mata Kuliah Dasar Pemrograman · Bahasa Python · 13 Modul Lengkap
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight max-w-2xl">
                Belajar Dasar Pemrograman Python Lewat Lab Langsung &amp; Mini-Game
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                Kuasai algoritma, tipe data, struktur kendali, fungsi, koleksi, searching &amp; sorting, OOP, hingga debugging — lengkap dengan eksekutor Python interaktif, asesmen, hasil, dan rekap nilai.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#ruang-belajar"
                onClick={() => setSubTab('lab')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
              >
                Lanjut Modul {String(activeModule.id).padStart(2, '0')}
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#ruang-belajar"
                onClick={() => setSubTab('minigame')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <Gamepad2 className="w-4 h-4" />
                Mainkan Mini-Game Modul
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 min-h-[210px]">
            {!heroImgFailed ? (
              <img
                src={HERO_LAB_IMAGE}
                alt="Ilustrasi laboratorium pemrograman Python dengan diagram alir algoritma dan kode"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="w-full h-full lg:h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-blue-50 to-slate-100">
                <Code2 className="w-10 h-10 text-blue-700 mb-2" />
                <p className="text-sm font-semibold text-slate-800">Laboratorium Python Interaktif</p>
              </div>
            )}
          </div>
        </div>

        {/* Full-width 4-column KPI Progress Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <p className="text-xs text-slate-500">Level &amp; XP Aktif</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              Lv. {levelInfo.level} · {state.profile.xp} XP
            </p>
            <p className="text-xs text-slate-500 mt-1">{levelInfo.title}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <p className="text-xs text-slate-500">Progres Kurikulum</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {completedModules} / {CURRICULUM_MODULES.length} Modul
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {Math.round((completedModules / CURRICULUM_MODULES.length) * 100)}% kurikulum dimulai
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <p className="text-xs text-slate-500">Bintang Mini-Game</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {totalStars} / {MINI_GAMES.length * 3} Bintang
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {state.unlockedBadgeIds.length} lencana terbuka
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <p className="text-xs text-slate-500">Skor Asesmen Terakhir</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {latestScore !== undefined ? `${latestScore} / 100` : 'Belum Ada'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {state.assessments.length} riwayat asesmen · Streak {state.profile.streakDays} hari
            </p>
          </div>
        </div>
      </section>

      {/* Main Two-Zone Learning Workspace */}
      <section id="ruang-belajar" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Navigation Column: 13 Curriculum Modules */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Daftar 13 Modul</h2>
              <span className="text-xs text-slate-500 tabular-nums">
                {completedModules}/13 aktif
              </span>
            </div>

            <div className="flex flex-wrap gap-1">
              {(
                [
                  'Semua',
                  'Fondasi',
                  'Alur Kontrol',
                  'Modularisasi',
                  'Struktur Data & Algoritma',
                  'OOP & Kualitas Kode',
                ] as const
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat === 'Struktur Data & Algoritma'
                    ? 'Koleksi & Algo'
                    : cat === 'OOP & Kualitas Kode'
                      ? 'OOP & Debug'
                      : cat}
                </button>
              ))}
            </div>
          </div>

          <ul className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
            {filteredModules.map((mod) => {
              const p = state.modules[mod.id];
              const isSelected = mod.id === activeModule.id;
              const stepsDone = [p?.readCompleted, p?.labCompleted, p?.checkpointPassed].filter(Boolean).length;
              const isDone = stepsDone >= 2;
              const mgStars = state.miniGames[mod.miniGameId]?.stars ?? 0;

              return (
                <li key={mod.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectModule(mod.id)}
                    aria-current={isSelected ? 'true' : undefined}
                    className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors ${
                      isSelected ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-label="Selesai" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" aria-label="Belum selesai" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold leading-snug ${
                          isSelected ? 'text-blue-800' : 'text-slate-900'
                        }`}
                      >
                        {String(mod.id).padStart(2, '0')}. {mod.shortTitle}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {mod.category} · {stepsDone}/3 tahap
                        {mgStars > 0 ? ` · ${mgStars} bintang` : ''}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Right Interactive Module Stage */}
        <div className="lg:col-span-8 space-y-6">
          {/* Module Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-blue-700">
                  Modul {String(activeModule.id).padStart(2, '0')}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeModule.category}</span>
                <span aria-hidden="true">·</span>
                <span>{activeModule.durationMinutes} menit</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">+{activeModule.xpReward} XP</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 leading-snug">
                {activeModule.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {activeModule.overview}
              </p>
            </div>

            {/* Module Stage Navigation Tabs */}
            <div
              role="tablist"
              aria-label="Tahap belajar modul"
              className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit"
            >
              {(
                [
                  { id: 'konsep', label: 'Konsep & Contoh', icon: BookOpen, done: activeProg.readCompleted },
                  { id: 'lab', label: 'Lab Python', icon: Code2, done: activeProg.labCompleted },
                  { id: 'minigame', label: 'Mini-Game Modul', icon: Gamepad2, done: (activeMiniGameRecord?.stars ?? 0) > 0 },
                  { id: 'checkpoint', label: 'Cek Pemahaman', icon: ClipboardCheck, done: activeProg.checkpointPassed },
                ] as const
              ).map((t) => {
                const Icon = t.icon;
                const active = subTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSubTab(t.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                    {t.done && (
                      <CheckCircle2
                        className="w-3.5 h-3.5 text-emerald-600"
                        aria-label="Selesai"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-Tab 1: Konsep & Contoh */}
          {subTab === 'konsep' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-8">
              <div className="space-y-2.5">
                <h3 className="text-sm font-bold text-slate-900">Tujuan Pembelajaran</h3>
                <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-5">
                  {activeModule.objectives.map((obj) => (
                    <li key={obj}>{obj}</li>
                  ))}
                </ul>
              </div>

              <div className="divide-y divide-slate-100">
                {activeModule.concepts.map((concept, idx) => (
                  <div key={concept.title} className={`${idx > 0 ? 'pt-7' : ''} pb-7 last:pb-0 space-y-3`}>
                    <h3 className="text-base font-bold text-slate-900">
                      {idx + 1}. {concept.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{concept.summary}</p>
                    <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs sm:text-sm leading-6 overflow-x-auto">
                      {concept.code}
                    </pre>
                    <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
                      <strong className="text-slate-900">Catatan Penting:</strong> {concept.keyTakeaway}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-slate-600">
                  {activeProg.readCompleted
                    ? 'Materi konsep modul ini sudah ditandai selesai.'
                    : 'Tandai selesai setelah memahami konsep untuk meraih +40 XP.'}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {!activeProg.readCompleted && (
                    <button
                      type="button"
                      onClick={() => onMarkRead(activeModule.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Tandai Selesai (+40 XP)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSubTab('lab')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Buka Lab Python
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 2: Lab Python Interaktif */}
          {subTab === 'lab' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <PythonLab
                moduleId={activeModule.id}
                starterCode={activeModule.sandboxStarter}
                defaultInputs={activeModule.sandboxInputs}
                challenge={activeModule.labChallenge}
                isLabCompleted={activeProg.labCompleted}
                onCompleteChallenge={() => onCompleteLab(activeModule.id)}
              />
            </div>
          )}

          {/* Sub-Tab 3: Mini-Game Khusus Modul */}
          {subTab === 'minigame' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              {moduleMiniGames.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
                  {moduleMiniGames.map((mg) => {
                    const isPicked = mg.id === activeMiniGame.id;
                    return (
                      <button
                        key={mg.id}
                        type="button"
                        onClick={() => setSelectedModuleGameId(mg.id)}
                        className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${
                          isPicked
                            ? 'bg-blue-700 text-white font-semibold'
                            : 'text-slate-600 hover:text-slate-900 font-medium'
                        }`}
                      >
                        {mg.title}
                      </button>
                    );
                  })}
                </div>
              )}
              {activeMiniGameRecord && (
                <div className="flex items-center justify-between text-xs text-slate-600 pb-3 border-b border-slate-100">
                  <span>Rekor terbaik kamu: {activeMiniGameRecord.bestScore}/{activeMiniGameRecord.maxScore}</span>
                  <span className="inline-flex items-center gap-1">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= activeMiniGameRecord.stars ? 'text-amber-500 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </span>
                </div>
              )}
              <MiniGamePlayer
                key={activeMiniGame.id}
                game={activeMiniGame}
                onComplete={onCompleteMiniGame}
                onExit={() => setSubTab('checkpoint')}
              />
            </div>
          )}

          {/* Sub-Tab 4: Cek Pemahaman */}
          {subTab === 'checkpoint' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Cek Pemahaman Modul {String(activeModule.id).padStart(2, '0')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Jawab kedua pertanyaan singkat berikut dengan benar untuk menuntaskan modul (+40 XP).
                  </p>
                </div>
                {activeProg.checkpointPassed && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    Lulus Cek Pemahaman
                  </span>
                )}
              </div>

              <div className="space-y-6">
                {activeModule.checkpoints.map((q, qIdx) => {
                  const pickKey = `${activeModule.id}-${q.id}`;
                  const chosen = checkpointPicks[pickKey];
                  const isChecked = Boolean(checkpointChecked[activeModule.id]);

                  return (
                    <div key={q.id} className="space-y-3 pb-6 border-b border-slate-100 last:border-b-0 last:pb-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {qIdx + 1}. {q.prompt}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => {
                          const selected = chosen === oIdx;
                          let cls = selected
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400';

                          if (isChecked) {
                            if (oIdx === q.correctIndex) {
                              cls = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold';
                            } else if (selected) {
                              cls = 'bg-red-50 border-red-400 text-red-900';
                            }
                          }

                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setCheckpointPicks((prev) => ({ ...prev, [pickKey]: oIdx }));
                                if (isChecked) {
                                  setCheckpointChecked((prev) => ({ ...prev, [activeModule.id]: false }));
                                }
                              }}
                              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${cls}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {isChecked && (
                        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
                          Pembahasan: {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onStartAssessmentForModule(activeModule.id)}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap"
                >
                  Uji Lebih Lanjut di Asesmen Modul Ini -&gt;
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={activeModule.checkpoints.some(
                      (q) => checkpointPicks[`${activeModule.id}-${q.id}`] === undefined
                    )}
                    onClick={handleCheckCheckpoint}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Periksa Jawaban
                  </button>
                  {activeModule.id < CURRICULUM_MODULES.length && (
                    <button
                      type="button"
                      onClick={() => handleSelectModule(activeModule.id + 1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Modul {String(activeModule.id + 1).padStart(2, '0')}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
