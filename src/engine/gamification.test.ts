import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLeaderboard,
  calculateLevelInfo,
  calculateStars,
  evaluateUnlockedBadges,
  generateRecapCsv,
  gradeAssessment,
  scoreToGrade,
} from './gamification';
import type { AppProgressState, AssessmentQuestion, BadgeDefinition, PeerStudent } from '../types';

test('level calculation scales XP accurately', () => {
  const l1 = calculateLevelInfo(0);
  assert.equal(l1.level, 1);
  assert.equal(l1.progressPercent, 0);

  const l2 = calculateLevelInfo(250);
  assert.equal(l2.level, 2);

  const l10 = calculateLevelInfo(7500);
  assert.equal(l10.level, 10);
  assert.equal(l10.progressPercent, 100);
});

test('assessment grading computes score, letter grade, and perfect XP bonus', () => {
  const questions: AssessmentQuestion[] = [
    { id: 'q1', moduleId: 1, difficulty: 'Dasar', prompt: 'P1', options: ['A', 'B'], correctIndex: 0, explanation: 'E1' },
    { id: 'q2', moduleId: 2, difficulty: 'Dasar', prompt: 'P2', options: ['A', 'B'], correctIndex: 1, explanation: 'E2' },
  ];

  const perfect = gradeAssessment({
    id: 'att-1',
    mode: 'cepat',
    title: 'Kuis Cepat',
    questions,
    selectedIndices: { q1: 0, q2: 1 },
    durationSeconds: 45,
    completedAt: '2026-11-19T10:00:00Z',
  });

  assert.equal(perfect.score, 100);
  assert.equal(perfect.grade, 'A');
  assert.equal(perfect.xpEarned, 100); // 2*20 + 60 bonus
  assert.equal(scoreToGrade(72), 'B');
  assert.equal(calculateStars(9, 10), 3);
  assert.equal(calculateStars(5, 10), 1);
});

test('leaderboard ranks user dynamically against classmates and unlocks badges', () => {
  const state: AppProgressState = {
    profile: {
      name: 'Nadia Putri',
      nim: '24010012',
      kelas: 'IF-1A',
      prodi: 'Teknik Informatika',
      institusi: 'Universitas Teknologi Nusantara',
      semester: 'Semester 1',
      email: 'nadia@kampus.ac.id',
      bio: 'Belajar Python bersama kelas IF-1A.',
      avatarId: 'student',
      xp: 900,
      streakDays: 3,
      lastActiveDate: '2026-11-19',
    },
    modules: {
      1: { moduleId: 1, readCompleted: true, labCompleted: true, checkpointPassed: true },
    },
    miniGames: {
      'mg-1': { gameId: 'mg-1', moduleId: 1, bestScore: 3, maxScore: 3, stars: 3, plays: 1, lastPlayedAt: '2026-11-19' },
    },
    assessments: [],
    unlockedBadgeIds: [],
    weeklyXpEarned: 400,
  };

  const peers: PeerStudent[] = [
    { id: 'p1', name: 'Raka Pratama', kelas: 'IF-1A', xp: 1200, weeklyXp: 300, miniGameStars: 8, completedModules: 4, badgesCount: 4 },
    { id: 'p2', name: 'Dina Sari', kelas: 'IF-1B', xp: 600, weeklyXp: 500, miniGameStars: 5, completedModules: 2, badgesCount: 2 },
  ];

  const totalBoard = buildLeaderboard(state, peers, 'total');
  assert.equal(totalBoard[0].name, 'Raka Pratama');
  assert.equal(totalBoard[1].isCurrentUser, true);
  assert.equal(totalBoard[1].rank, 2);

  const weeklyBoard = buildLeaderboard(state, peers, 'weekly');
  assert.equal(weeklyBoard[0].name, 'Dina Sari');

  const badges: BadgeDefinition[] = [
    { id: 'badge-first-step', title: 'Langkah Pertama', description: 'D1', category: 'Kurikulum', xpBonus: 50 },
    { id: 'badge-arcade-starter', title: 'Pemain Mini-Game', description: 'D2', category: 'Mini-Game', xpBonus: 50 },
  ];
  const unlocked = evaluateUnlockedBadges(state, badges);
  assert.equal(unlocked.includes('badge-first-step'), true);
  assert.equal(unlocked.includes('badge-arcade-starter'), true);

  const csv = generateRecapCsv('Nadia Putri', '24010012', 'IF-1A', [
    {
      moduleId: 1,
      title: 'Konsep Dasar',
      category: 'Fondasi',
      readCompleted: true,
      labCompleted: true,
      checkpointPassed: true,
      miniGameStars: 3,
      miniGameBestPct: 100,
      assessmentAccuracyPct: 100,
      assessmentAnsweredCount: 2,
      masteryPct: 100,
      statusLabel: 'Tuntas',
    },
  ]);
  assert.equal(csv.includes('Nadia Putri,24010012,IF-1A,1,Konsep Dasar'), true);
});
