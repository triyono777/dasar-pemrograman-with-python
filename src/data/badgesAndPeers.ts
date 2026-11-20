import type { AppProgressState, BadgeDefinition, PeerStudent } from '../types';

export const HERO_LAB_IMAGE = '/src/assets/images/hero_python_lab_1795132554556.jpg';
export const STUDENT_AVATAR_IMAGE = '/src/assets/images/avatar_student_coder_1795132554688.jpg';
export const BADGE_EMBLEM_IMAGE = '/src/assets/images/badge_mastery_emblem_1795132554726.jpg';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'badge-first-step',
    title: 'Langkah Pertama',
    description: 'Menyelesaikan minimal 1 modul materi atau lab Python.',
    category: 'Kurikulum',
    xpBonus: 50,
  },
  {
    id: 'badge-lab-coder',
    title: 'Praktisi Lab Kode',
    description: 'Menuntaskan minimal 3 tantangan kode di Lab Python Interaktif.',
    category: 'Kurikulum',
    xpBonus: 80,
  },
  {
    id: 'badge-half-curriculum',
    title: 'Separuh Perjalanan',
    description: 'Mempelajari minimal 7 dari 13 modul Dasar Pemrograman.',
    category: 'Kurikulum',
    xpBonus: 120,
  },
  {
    id: 'badge-master-13',
    title: 'Master 13 Modul',
    description: 'Menyelesaikan seluruh 13 modul kurikulum Dasar Pemrograman.',
    category: 'Kurikulum',
    xpBonus: 250,
  },
  {
    id: 'badge-arcade-starter',
    title: 'Penantang Mini-Game',
    description: 'Menyelesaikan mini-game Python pertama kamu.',
    category: 'Mini-Game',
    xpBonus: 50,
  },
  {
    id: 'badge-star-hunter',
    title: 'Kolektor 10 Bintang',
    description: 'Mengumpulkan minimal 10 bintang dari berbagai mini-game.',
    category: 'Mini-Game',
    xpBonus: 120,
  },
  {
    id: 'badge-perfectionist-game',
    title: 'Presisi Sempurna',
    description: 'Meraih 3 bintang pada minimal 3 mini-game berbeda.',
    category: 'Mini-Game',
    xpBonus: 150,
  },
  {
    id: 'badge-first-assessment',
    title: 'Uji Kompetensi Pertama',
    description: 'Menyelesaikan sesi asesmen evaluasi pertama.',
    category: 'Asesmen',
    xpBonus: 60,
  },
  {
    id: 'badge-honor-roll',
    title: 'Predikat Memuaskan',
    description: 'Meraih skor asesmen minimal 70 (Predikat B atau lebih tinggi).',
    category: 'Asesmen',
    xpBonus: 100,
  },
  {
    id: 'badge-perfect-score',
    title: 'Skor Sempurna 100',
    description: 'Menjawab benar seluruh soal dalam satu sesi asesmen.',
    category: 'Asesmen',
    xpBonus: 180,
  },
  {
    id: 'badge-oop-architect',
    title: 'Arsitek OOP',
    description: 'Menuntaskan tantangan Lab pada modul Dasar OOP atau OOP Lanjutan.',
    category: 'Kurikulum',
    xpBonus: 120,
  },
  {
    id: 'badge-bug-slayer',
    title: 'Pemburu Bug Andal',
    description: 'Menyelesaikan modul Eksepsi & Debugging atau Ujian Komprehensif 13 Modul.',
    category: 'Konsistensi',
    xpBonus: 150,
  },
];

export const PEER_STUDENTS: PeerStudent[] = [
  { id: 'peer-1', name: 'Alya Rahmawati', kelas: 'IF-1A', xp: 2480, weeklyXp: 640, miniGameStars: 26, completedModules: 11, badgesCount: 9 },
  { id: 'peer-2', name: 'Raka Pratama', kelas: 'IF-1A', xp: 2150, weeklyXp: 520, miniGameStars: 22, completedModules: 10, badgesCount: 8 },
  { id: 'peer-3', name: 'Nadia Kusuma', kelas: 'IF-1B', xp: 1840, weeklyXp: 580, miniGameStars: 19, completedModules: 9, badgesCount: 7 },
  { id: 'peer-4', name: 'Dimas Santoso', kelas: 'IF-1A', xp: 1490, weeklyXp: 410, miniGameStars: 15, completedModules: 7, badgesCount: 6 },
  { id: 'peer-5', name: 'Siti Nurhaliza', kelas: 'IF-1B', xp: 1120, weeklyXp: 390, miniGameStars: 12, completedModules: 6, badgesCount: 5 },
  { id: 'peer-6', name: 'Bagas Wijaya', kelas: 'IF-1C', xp: 860, weeklyXp: 310, miniGameStars: 9, completedModules: 4, badgesCount: 4 },
  { id: 'peer-7', name: 'Intan Permata', kelas: 'IF-1B', xp: 620, weeklyXp: 240, miniGameStars: 7, completedModules: 3, badgesCount: 3 },
  { id: 'peer-8', name: 'Fajar Hidayat', kelas: 'IF-1C', xp: 410, weeklyXp: 190, miniGameStars: 4, completedModules: 2, badgesCount: 2 },
  { id: 'peer-9', name: 'Kezia Natalia', kelas: 'IF-1A', xp: 240, weeklyXp: 140, miniGameStars: 2, completedModules: 1, badgesCount: 1 },
];

export const STORAGE_KEY = 'pydasar_studio_progress_v1';

export function createInitialProgressState(): AppProgressState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    profile: {
      name: 'Rafi Maulana',
      nim: '24060120140088',
      kelas: 'IF-1A',
      avatarId: 'student',
      xp: 320,
      streakDays: 3,
      lastActiveDate: today,
    },
    modules: {
      1: {
        moduleId: 1,
        readCompleted: true,
        labCompleted: true,
        checkpointPassed: true,
        lastAccessedAt: today,
      },
    },
    miniGames: {
      'mg-1': {
        gameId: 'mg-1',
        moduleId: 1,
        bestScore: 3,
        maxScore: 3,
        stars: 3,
        plays: 1,
        lastPlayedAt: today,
      },
    },
    assessments: [
      {
        id: 'att-seed-1',
        mode: 'cepat',
        title: 'Kuis Diagnostik Awal',
        completedAt: new Date(Date.now() - 86400000).toISOString(),
        durationSeconds: 92,
        totalQuestions: 4,
        correctCount: 3,
        score: 75,
        grade: 'B+',
        xpEarned: 60,
        answers: [
          { questionId: 'q-1-1', moduleId: 1, selectedIndex: 0, correctIndex: 0, isCorrect: true },
          { questionId: 'q-2-1', moduleId: 2, selectedIndex: 1, correctIndex: 1, isCorrect: true },
          { questionId: 'q-3-1', moduleId: 3, selectedIndex: 1, correctIndex: 0, isCorrect: false },
          { questionId: 'q-4-1', moduleId: 4, selectedIndex: 1, correctIndex: 1, isCorrect: true },
        ],
      },
    ],
    unlockedBadgeIds: ['badge-first-step', 'badge-arcade-starter', 'badge-first-assessment', 'badge-honor-roll'],
    weeklyXpEarned: 320,
  };
}

export function loadProgressState(): AppProgressState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialProgressState();
    const parsed = JSON.parse(raw) as AppProgressState;
    if (!parsed || !parsed.profile || !parsed.modules) return createInitialProgressState();
    return parsed;
  } catch {
    return createInitialProgressState();
  }
}

export function saveProgressState(state: AppProgressState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors in restricted frames
  }
}
