import { useEffect, useState } from 'react';
import { Award, X } from 'lucide-react';
import { AssessmentView } from './components/AssessmentView';
import { CurriculumView } from './components/CurriculumView';
import { LaymanExplainerView } from './components/LaymanExplainerView';
import { LeaderboardView, ProfileView } from './components/LeaderboardAndProfileView';
import { MiniGameHub } from './components/MiniGameHub';
import { ResultsAndRecapView } from './components/ResultsAndRecapView';
import { TopNav } from './components/TopNav';
import {
  BADGE_DEFINITIONS,
  createInitialProgressState,
  loadProgressState,
  saveProgressState,
} from './data/badgesAndPeers';
import { evaluateUnlockedBadges } from './engine/gamification';
import { decodeSharedProfilePayload } from './engine/profileShare';
import type {
  AppProgressState,
  AppTab,
  AssessmentAttempt,
  EditableUserProfile,
  SharedProfilePayload,
} from './types';

interface RewardToast {
  title: string;
  detail: string;
}

export default function App() {
  const [state, setState] = useState<AppProgressState>(() => loadProgressState());
  const [activeTab, setActiveTab] = useState<AppTab>('kurikulum');
  const [selectedModuleId, setSelectedModuleId] = useState<number>(2);
  const [rekapSubView, setRekapSubView] = useState<'hasil' | 'rekap'>('rekap');
  const [preselectedAssessmentModuleId, setPreselectedAssessmentModuleId] = useState<number | null>(
    null
  );
  const [toast, setToast] = useState<RewardToast | null>(null);
  const [sharedProfile, setSharedProfile] = useState<SharedProfilePayload | null>(() => {
    try {
      const token = new URLSearchParams(window.location.search).get('profil');
      return token ? decodeSharedProfilePayload(token) : null;
    } catch {
      return null;
    }
  });

  const dismissSharedProfile = () => {
    setSharedProfile(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('profil');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore history restriction
    }
  };

  useEffect(() => {
    saveProgressState(state);
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const applyProgressUpdate = (
    updater: (prev: AppProgressState) => { next: AppProgressState; xpGained: number; reason?: string }
  ) => {
    let pendingToast: RewardToast | null = null;

    setState((prev) => {
      const { next, xpGained, reason } = updater(prev);
      const nextWithXp: AppProgressState = {
        ...next,
        profile: {
          ...next.profile,
          xp: next.profile.xp + xpGained,
          lastActiveDate: new Date().toISOString().slice(0, 10),
        },
        weeklyXpEarned: next.weeklyXpEarned + xpGained,
      };

      const nextBadgeIds = evaluateUnlockedBadges(nextWithXp, BADGE_DEFINITIONS);
      const newlyUnlocked = nextBadgeIds.filter((id) => !prev.unlockedBadgeIds.includes(id));

      let badgeBonusXp = 0;
      for (const bId of newlyUnlocked) {
        const def = BADGE_DEFINITIONS.find((b) => b.id === bId);
        if (def) badgeBonusXp += def.xpBonus;
      }

      const finalState: AppProgressState = {
        ...nextWithXp,
        profile: {
          ...nextWithXp.profile,
          xp: nextWithXp.profile.xp + badgeBonusXp,
        },
        weeklyXpEarned: nextWithXp.weeklyXpEarned + badgeBonusXp,
        unlockedBadgeIds: nextBadgeIds,
      };

      if (newlyUnlocked.length > 0) {
        const firstBadge = BADGE_DEFINITIONS.find((b) => b.id === newlyUnlocked[0]);
        pendingToast = {
          title: `Lencana Baru: ${firstBadge?.title ?? 'Pencapaian'}`,
          detail: `+${xpGained + badgeBonusXp} XP ditambahkan ke profil.`,
        };
      } else if (xpGained > 0 && reason) {
        pendingToast = {
          title: `+${xpGained} XP Diperoleh`,
          detail: reason,
        };
      }

      return finalState;
    });

    queueMicrotask(() => {
      if (pendingToast) setToast(pendingToast);
    });
  };

  const handleMarkRead = (moduleId: number) => {
    applyProgressUpdate((prev) => {
      const existing = prev.modules[moduleId] ?? {
        moduleId,
        readCompleted: false,
        labCompleted: false,
        checkpointPassed: false,
      };
      if (existing.readCompleted) return { next: prev, xpGained: 0 };
      return {
        next: {
          ...prev,
          modules: {
            ...prev.modules,
            [moduleId]: {
              ...existing,
              readCompleted: true,
              lastAccessedAt: new Date().toISOString().slice(0, 10),
            },
          },
        },
        xpGained: 40,
        reason: `Konsep Modul ${String(moduleId).padStart(2, '0')} selesai dipelajari.`,
      };
    });
  };

  const handleMarkLaymanUnderstood = (moduleId: number) => {
    applyProgressUpdate((prev) => {
      const existingIds = prev.understoodLaymanModuleIds ?? [];
      if (existingIds.includes(moduleId)) return { next: prev, xpGained: 0 };
      return {
        next: {
          ...prev,
          understoodLaymanModuleIds: [...existingIds, moduleId],
        },
        xpGained: 15,
        reason: `Topik ${String(moduleId).padStart(2, '0')} Bahasa Awam dipahami!`,
      };
    });
  };

  const handleCompleteLab = (moduleId: number) => {
    applyProgressUpdate((prev) => {
      const existing = prev.modules[moduleId] ?? {
        moduleId,
        readCompleted: false,
        labCompleted: false,
        checkpointPassed: false,
      };
      const isFirstTime = !existing.labCompleted;
      return {
        next: {
          ...prev,
          modules: {
            ...prev.modules,
            [moduleId]: {
              ...existing,
              labCompleted: true,
              lastAccessedAt: new Date().toISOString().slice(0, 10),
            },
          },
        },
        xpGained: isFirstTime ? 60 : 10,
        reason: isFirstTime
          ? `Tantangan Lab Python Modul ${String(moduleId).padStart(2, '0')} tuntas.`
          : `Latihan ulang Lab Modul ${String(moduleId).padStart(2, '0')} berhasil.`,
      };
    });
  };

  const handlePassCheckpoint = (moduleId: number) => {
    applyProgressUpdate((prev) => {
      const existing = prev.modules[moduleId] ?? {
        moduleId,
        readCompleted: false,
        labCompleted: false,
        checkpointPassed: false,
      };
      if (existing.checkpointPassed) return { next: prev, xpGained: 0 };
      return {
        next: {
          ...prev,
          modules: {
            ...prev.modules,
            [moduleId]: {
              ...existing,
              checkpointPassed: true,
              lastAccessedAt: new Date().toISOString().slice(0, 10),
            },
          },
        },
        xpGained: 40,
        reason: `Cek Pemahaman Modul ${String(moduleId).padStart(2, '0')} lulus.`,
      };
    });
  };

  const handleCompleteMiniGame = (res: {
    gameId: string;
    moduleId: number;
    score: number;
    maxScore: number;
    stars: number;
    xpEarned: number;
  }) => {
    applyProgressUpdate((prev) => {
      const old = prev.miniGames[res.gameId];
      const nextRec = {
        gameId: res.gameId,
        moduleId: res.moduleId,
        bestScore: Math.max(old?.bestScore ?? 0, res.score),
        maxScore: res.maxScore,
        stars: Math.max(old?.stars ?? 0, res.stars),
        plays: (old?.plays ?? 0) + 1,
        lastPlayedAt: new Date().toISOString().slice(0, 10),
      };
      return {
        next: {
          ...prev,
          miniGames: {
            ...prev.miniGames,
            [res.gameId]: nextRec,
          },
        },
        xpGained: res.xpEarned,
        reason: `Mini-Game Modul ${String(res.moduleId).padStart(2, '0')} selesai (${res.stars} bintang).`,
      };
    });
  };

  const handleFinishAssessment = (attempt: AssessmentAttempt) => {
    applyProgressUpdate((prev) => ({
      next: {
        ...prev,
        assessments: [attempt, ...prev.assessments],
      },
      xpGained: attempt.xpEarned,
      reason: `${attempt.title} selesai dengan skor ${attempt.score} (${attempt.grade}).`,
    }));
    setRekapSubView('hasil');
    setActiveTab('rekap');
  };

  const handleUpdateProfile = (updates: EditableUserProfile) => {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        ...updates,
      },
    }));
    setToast({
      title: 'Profil Berhasil Disimpan',
      detail: `Data ${updates.name} kini aktif dan siap dibagikan.`,
    });
  };

  const handleResetProgress = () => {
    const fresh = createInitialProgressState();
    setState(fresh);
    setSelectedModuleId(1);
    setToast({
      title: 'Progres Direset',
      detail: 'Data pembelajaran dikembalikan ke kondisi awal.',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <TopNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'rekap') setRekapSubView('rekap');
        }}
        userName={state.profile.name}
        userPhotoUrl={state.profile.photoDataUrl}
      />

      {/* Shared Profile Viewer Modal when opened via ?profil=... link */}
      {sharedProfile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="incoming-shared-profile-title"
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 no-print"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <p className="text-[11px] font-semibold text-blue-300">
                  KARTU PROFIL DIBAGIKAN · PYDASAR STUDIO
                </p>
                <h2 id="incoming-shared-profile-title" className="text-lg font-bold mt-0.5">
                  {sharedProfile.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={dismissSharedProfile}
                aria-label="Tutup kartu profil dibagikan"
                className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-blue-700">
                  Level {sharedProfile.level} · {sharedProfile.levelTitle} · Peringkat #{sharedProfile.rank}
                </p>
                <p className="text-xs font-mono text-slate-500 tabular-nums">
                  NIM {sharedProfile.nim} · Kelas {sharedProfile.kelas}
                </p>
                <p className="text-xs text-slate-600">
                  {[sharedProfile.prodi, sharedProfile.institusi, sharedProfile.semester]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>

              {sharedProfile.bio && (
                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 italic">
                  “{sharedProfile.bio}”
                </p>
              )}

              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center tabular-nums">
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <p className="text-sm font-bold font-mono text-slate-900">{sharedProfile.xp}</p>
                  <p className="text-[11px] text-slate-500">XP</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <p className="text-sm font-bold font-mono text-slate-900">
                    {sharedProfile.completedModules}/13
                  </p>
                  <p className="text-[11px] text-slate-500">Modul</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <p className="text-sm font-bold font-mono text-slate-900">
                    {sharedProfile.totalStars}
                  </p>
                  <p className="text-[11px] text-slate-500">Bintang</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <p className="text-sm font-bold font-mono text-slate-900">
                    {sharedProfile.badgesCount}
                  </p>
                  <p className="text-[11px] text-slate-500">Lencana</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={dismissSharedProfile}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
                >
                  Tutup &amp; Buka PyDasar Studio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Non-intrusive XP / Badge Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-5 z-50 max-w-xs bg-slate-900 text-white rounded-xl px-4 py-3 shadow-lg border border-slate-700 flex items-start gap-2.5 no-print"
        >
          <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{toast.title}</p>
            <p className="text-xs text-slate-300 mt-0.5">{toast.detail}</p>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Tutup notifikasi"
            className="text-slate-400 hover:text-white p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {activeTab === 'kurikulum' && (
          <CurriculumView
            state={state}
            selectedModuleId={selectedModuleId}
            onSelectModule={setSelectedModuleId}
            onMarkRead={handleMarkRead}
            onCompleteLab={handleCompleteLab}
            onPassCheckpoint={handlePassCheckpoint}
            onCompleteMiniGame={handleCompleteMiniGame}
            onStartAssessmentForModule={(modId) => {
              setPreselectedAssessmentModuleId(modId);
              setActiveTab('asesmen');
            }}
          />
        )}

        {activeTab === 'awam' && (
          <LaymanExplainerView
            understoodModuleIds={state.understoodLaymanModuleIds ?? []}
            onMarkUnderstood={handleMarkLaymanUnderstood}
            onGoToCurriculumModule={(modId) => {
              setSelectedModuleId(modId);
              setActiveTab('kurikulum');
            }}
            onGoToMiniGames={() => setActiveTab('minigame')}
          />
        )}

        {activeTab === 'minigame' && (
          <MiniGameHub
            records={state.miniGames}
            onCompleteGame={handleCompleteMiniGame}
          />
        )}

        {activeTab === 'asesmen' && (
          <AssessmentView
            preselectedModuleId={preselectedAssessmentModuleId}
            onClearPreselected={() => setPreselectedAssessmentModuleId(null)}
            onFinishAttempt={handleFinishAssessment}
          />
        )}

        {activeTab === 'rekap' && (
          <ResultsAndRecapView
            key={`${rekapSubView}-${state.assessments[0]?.id ?? 'none'}`}
            state={state}
            initialSubView={rekapSubView}
            onGoToModule={(modId) => {
              setSelectedModuleId(modId);
              setActiveTab('kurikulum');
            }}
            onGoToAssessment={() => setActiveTab('asesmen')}
          />
        )}

        {activeTab === 'peringkat' && <LeaderboardView state={state} />}

        {activeTab === 'profil' && (
          <ProfileView
            state={state}
            onUpdateProfile={handleUpdateProfile}
            onResetProgress={handleResetProgress}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12 no-print">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>PyDasar Studio · Mata Kuliah Dasar Pemrograman (Python)</span>
          <span>13 Modul · Bahasa Awam · Lab Interaktif · 27 Mini-Game · Asesmen &amp; Rekap</span>
        </div>
      </footer>
    </div>
  );
}
