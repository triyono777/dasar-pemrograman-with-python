import type {
  AppProgressState,
  AssessmentAnswerRecord,
  AssessmentAttempt,
  AssessmentMode,
  AssessmentQuestion,
  BadgeDefinition,
  CurriculumModule,
  LeaderboardRow,
  PeerStudent,
} from '../types';

export interface LevelInfo {
  level: number;
  title: string;
  currentXp: number;
  levelMinXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

const LEVEL_THRESHOLDS: { level: number; minXp: number; title: string }[] = [
  { level: 1, minXp: 0, title: 'Pemula Algoritma' },
  { level: 2, minXp: 250, title: 'Penjelajah Sintaks' },
  { level: 3, minXp: 600, title: 'Pengendali Alur' },
  { level: 4, minXp: 1050, title: 'Perancang Fungsi' },
  { level: 5, minXp: 1600, title: 'Kolektor Struktur Data' },
  { level: 6, minXp: 2250, title: 'Analis Algoritma' },
  { level: 7, minXp: 3000, title: 'Arsitek Objek' },
  { level: 8, minXp: 3900, title: 'Pemburu Eksepsi' },
  { level: 9, minXp: 4900, title: 'Asisten Praktikum' },
  { level: 10, minXp: 6000, title: 'Master Python Dasar' },
];

export function calculateLevelInfo(xp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(xp));
  let current = LEVEL_THRESHOLDS[0];
  let next = LEVEL_THRESHOLDS[1];

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (safeXp >= LEVEL_THRESHOLDS[i].minXp) {
      current = LEVEL_THRESHOLDS[i];
      next = LEVEL_THRESHOLDS[i + 1] ?? {
        level: current.level,
        minXp: current.minXp + 1200,
        title: current.title,
      };
    }
  }

  const span = Math.max(1, next.minXp - current.minXp);
  const progressPercent =
    current.level === LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].level
      ? 100
      : Math.min(100, Math.round(((safeXp - current.minXp) / span) * 100));

  return {
    level: current.level,
    title: current.title,
    currentXp: safeXp,
    levelMinXp: current.minXp,
    nextLevelXp: next.minXp,
    progressPercent,
  };
}

export function scoreToGrade(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

export function calculateStars(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  const ratio = score / maxScore;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.65) return 2;
  if (ratio >= 0.35) return 1;
  return 0;
}

export function gradeAssessment(params: {
  id: string;
  mode: AssessmentMode;
  title: string;
  questions: AssessmentQuestion[];
  selectedIndices: Record<string, number>;
  durationSeconds: number;
  completedAt: string;
}): AssessmentAttempt {
  const answers: AssessmentAnswerRecord[] = params.questions.map((q) => {
    const selectedIndex = params.selectedIndices[q.id] ?? -1;
    return {
      questionId: q.id,
      moduleId: q.moduleId,
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect: selectedIndex === q.correctIndex,
    };
  });

  const totalQuestions = params.questions.length;
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const score = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);
  const grade = scoreToGrade(score);
  const baseXp = correctCount * 20;
  const perfectBonus = totalQuestions > 0 && correctCount === totalQuestions ? 60 : 0;
  const xpEarned = baseXp + perfectBonus;

  return {
    id: params.id,
    mode: params.mode,
    title: params.title,
    completedAt: params.completedAt,
    durationSeconds: Math.max(1, params.durationSeconds),
    totalQuestions,
    correctCount,
    score,
    grade,
    xpEarned,
    answers,
  };
}

export function countCompletedModules(state: AppProgressState): number {
  return Object.values(state.modules).filter(
    (m) => m.readCompleted || m.labCompleted || m.checkpointPassed
  ).length;
}

export function countFullyMasteredModules(state: AppProgressState): number {
  return Object.values(state.modules).filter(
    (m) => m.readCompleted && m.labCompleted && m.checkpointPassed
  ).length;
}

export function countTotalMiniGameStars(state: AppProgressState): number {
  return Object.values(state.miniGames).reduce((sum, r) => sum + r.stars, 0);
}

export function evaluateUnlockedBadges(
  state: AppProgressState,
  allBadges: BadgeDefinition[]
): string[] {
  const unlocked = new Set<string>(state.unlockedBadgeIds);
  const completedMods = countCompletedModules(state);
  const labCompletedCount = Object.values(state.modules).filter((m) => m.labCompleted).length;
  const gamesPlayed = Object.values(state.miniGames).length;
  const totalStars = countTotalMiniGameStars(state);
  const threeStarGames = Object.values(state.miniGames).filter((g) => g.stars === 3).length;
  const hasPerfectAssessment = state.assessments.some((a) => a.score === 100);
  const hasPassingAssessment = state.assessments.some((a) => a.score >= 70);
  const hasComprehensive = state.assessments.some((a) => a.mode === 'komprehensif');
  const oopModulesDone = Boolean(state.modules[11]?.labCompleted || state.modules[12]?.labCompleted);
  const debugModuleDone = Boolean(state.modules[13]?.labCompleted || state.miniGames['mg-13']?.stars);

  const checks: Record<string, boolean> = {
    'badge-first-step': completedMods >= 1 || labCompletedCount >= 1,
    'badge-lab-coder': labCompletedCount >= 3,
    'badge-half-curriculum': completedMods >= 7,
    'badge-master-13': completedMods >= 13,
    'badge-arcade-starter': gamesPlayed >= 1,
    'badge-star-hunter': totalStars >= 10,
    'badge-perfectionist-game': threeStarGames >= 3,
    'badge-first-assessment': state.assessments.length >= 1,
    'badge-honor-roll': hasPassingAssessment,
    'badge-perfect-score': hasPerfectAssessment,
    'badge-oop-architect': oopModulesDone,
    'badge-bug-slayer': debugModuleDone || hasComprehensive,
  };

  for (const badge of allBadges) {
    if (checks[badge.id]) {
      unlocked.add(badge.id);
    }
  }

  return Array.from(unlocked);
}

export function buildLeaderboard(
  state: AppProgressState,
  peers: PeerStudent[],
  sortBy: 'total' | 'weekly' | 'minigame'
): LeaderboardRow[] {
  const userCompleted = countCompletedModules(state);
  const userStars = countTotalMiniGameStars(state);
  const userLevel = calculateLevelInfo(state.profile.xp);

  const rows: Omit<LeaderboardRow, 'rank'>[] = peers.map((p) => {
    const lvl = calculateLevelInfo(p.xp);
    return {
      id: p.id,
      name: p.name,
      kelas: p.kelas,
      level: lvl.level,
      levelTitle: lvl.title,
      xp: p.xp,
      weeklyXp: p.weeklyXp,
      miniGameStars: p.miniGameStars,
      completedModules: p.completedModules,
      badgesCount: p.badgesCount,
      isCurrentUser: false,
    };
  });

  rows.push({
    id: 'current-user',
    name: state.profile.name,
    kelas: state.profile.kelas,
    level: userLevel.level,
    levelTitle: userLevel.title,
    xp: state.profile.xp,
    weeklyXp: state.weeklyXpEarned,
    miniGameStars: userStars,
    completedModules: userCompleted,
    badgesCount: state.unlockedBadgeIds.length,
    isCurrentUser: true,
  });

  rows.sort((a, b) => {
    if (sortBy === 'weekly') {
      if (b.weeklyXp !== a.weeklyXp) return b.weeklyXp - a.weeklyXp;
    } else if (sortBy === 'minigame') {
      if (b.miniGameStars !== a.miniGameStars) return b.miniGameStars - a.miniGameStars;
    }
    if (b.xp !== a.xp) return b.xp - a.xp;
    return a.name.localeCompare(b.name);
  });

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

export interface ModuleRecapRow {
  moduleId: number;
  title: string;
  category: CurriculumModule['category'];
  readCompleted: boolean;
  labCompleted: boolean;
  checkpointPassed: boolean;
  miniGameStars: number;
  miniGameBestPct: number | null;
  assessmentAccuracyPct: number | null;
  assessmentAnsweredCount: number;
  masteryPct: number;
  statusLabel: 'Belum Dimulai' | 'Sedang Dipelajari' | 'Tuntas';
}

export function buildModuleRecap(
  state: AppProgressState,
  curriculum: CurriculumModule[]
): ModuleRecapRow[] {
  return curriculum.map((mod) => {
    const prog = state.modules[mod.id] ?? {
      moduleId: mod.id,
      readCompleted: false,
      labCompleted: false,
      checkpointPassed: false,
    };
    const mg = state.miniGames[mod.miniGameId];
    const mgPct = mg && mg.maxScore > 0 ? Math.round((mg.bestScore / mg.maxScore) * 100) : null;

    const moduleAnswers = state.assessments.flatMap((a) =>
      a.answers.filter((ans) => ans.moduleId === mod.id)
    );
    const correctAns = moduleAnswers.filter((a) => a.isCorrect).length;
    const assessmentAccuracyPct =
      moduleAnswers.length > 0 ? Math.round((correctAns / moduleAnswers.length) * 100) : null;

    let masteryPoints = 0;
    if (prog.readCompleted) masteryPoints += 25;
    if (prog.labCompleted) masteryPoints += 25;
    if (prog.checkpointPassed) masteryPoints += 15;
    if (mgPct !== null) masteryPoints += Math.round((mgPct / 100) * 20);
    if (assessmentAccuracyPct !== null) masteryPoints += Math.round((assessmentAccuracyPct / 100) * 15);
    const masteryPct = Math.min(100, masteryPoints);

    const statusLabel: ModuleRecapRow['statusLabel'] =
      masteryPct >= 75
        ? 'Tuntas'
        : masteryPct > 0
          ? 'Sedang Dipelajari'
          : 'Belum Dimulai';

    return {
      moduleId: mod.id,
      title: mod.title,
      category: mod.category,
      readCompleted: prog.readCompleted,
      labCompleted: prog.labCompleted,
      checkpointPassed: prog.checkpointPassed,
      miniGameStars: mg?.stars ?? 0,
      miniGameBestPct: mgPct,
      assessmentAccuracyPct,
      assessmentAnsweredCount: moduleAnswers.length,
      masteryPct,
      statusLabel,
    };
  });
}

export function generateRecapCsv(
  profileName: string,
  nim: string,
  kelas: string,
  rows: ModuleRecapRow[]
): string {
  const header = [
    'Mahasiswa',
    'NIM',
    'Kelas',
    'No Modul',
    'Materi',
    'Kategori',
    'Konsep',
    'Lab Python',
    'Cek Pemahaman',
    'Bintang Mini-Game',
    'Akurasi Asesmen (%)',
    'Penguasaan (%)',
    'Status',
  ];

  const escapeCsv = (val: string | number) => {
    const s = String(val);
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(
      [
        profileName,
        nim,
        kelas,
        r.moduleId,
        r.title,
        r.category,
        r.readCompleted ? 'Selesai' : 'Belum',
        r.labCompleted ? 'Selesai' : 'Belum',
        r.checkpointPassed ? 'Lulus' : 'Belum',
        `${r.miniGameStars}/3`,
        r.assessmentAccuracyPct !== null ? r.assessmentAccuracyPct : '-',
        r.masteryPct,
        r.statusLabel,
      ]
        .map(escapeCsv)
        .join(',')
    );
  }
  return lines.join('\n');
}
