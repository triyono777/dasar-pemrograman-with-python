export type AppTab = 'kurikulum' | 'minigame' | 'asesmen' | 'rekap' | 'peringkat' | 'profil';

export type MiniGameEngineType =
  | 'sequencer'
  | 'classifier'
  | 'branch_sim'
  | 'function_forge'
  | 'collection_vault'
  | 'algo_arena'
  | 'oop_debug_lab'
  | 'char_move'
  | 'char_action';

export type CharacterArcadeVariant =
  | 'maze_types'
  | 'branch_runner'
  | 'loop_platformer'
  | 'bug_defender'
  | 'algo_waypoint'
  | 'operator_gates'
  | 'list_index_maze'
  | 'dict_key_courier'
  | 'binary_search_dash'
  | 'func_factory_jump'
  | 'recursion_tower'
  | 'oop_blueprint_shooter'
  | 'poly_morph_arena'
  | 'sort_swamp_action';

export interface ConceptBlock {
  title: string;
  summary: string;
  code: string;
  keyTakeaway: string;
}

export interface CheckpointQuestion {
  id: string;
  prompt: string;
  code?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LabChallenge {
  title: string;
  instruction: string;
  starterCode: string;
  solutionCode: string;
  mockInputs?: string[];
  expectedOutputIncludes?: string[];
  expectedVariables?: Record<string, string | number | boolean>;
  hint: string;
}

export interface CurriculumModule {
  id: number;
  slug: string;
  shortTitle: string;
  title: string;
  category: 'Fondasi' | 'Alur Kontrol' | 'Modularisasi' | 'Struktur Data & Algoritma' | 'OOP & Kualitas Kode';
  durationMinutes: number;
  xpReward: number;
  overview: string;
  objectives: string[];
  concepts: ConceptBlock[];
  sandboxStarter: string;
  sandboxInputs?: string[];
  labChallenge: LabChallenge;
  checkpoints: CheckpointQuestion[];
  miniGameId: string;
}

export interface SequencerRound {
  prompt: string;
  contextCode?: string;
  correctSteps: string[];
  explanation: string;
}

export interface ClassifierItem {
  expression: string;
  promptHint?: string;
  correctCategory: string;
  explanation: string;
}

export interface BranchScenario {
  code: string;
  inputLabel: string;
  inputValue: string;
  branches: string[];
  correctBranchIndex: number;
  expectedOutput: string;
  explanation: string;
}

export interface FunctionForgeRound {
  prompt: string;
  codeTemplate: string;
  slots: {
    label: string;
    options: string[];
    correct: string;
  }[];
  sampleCall: string;
  expectedResult: string;
  explanation: string;
}

export interface CollectionVaultRound {
  prompt: string;
  collectionType: 'list' | 'tuple' | 'dict' | 'set';
  initialVisual: string;
  codeSnippet: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AlgoArenaConfig {
  mode: 'bubble_sort' | 'binary_search';
  title: string;
  initialArray: number[];
  target?: number;
  description: string;
}

export interface OopDebugRound {
  mode: 'bug_hunt' | 'oop_blueprint';
  title: string;
  scenario: string;
  codeLines: string[];
  bugLineIndex?: number;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface MiniGameSpec {
  id: string;
  moduleId: number;
  title: string;
  subtitle: string;
  engine: MiniGameEngineType;
  xpReward: number;
  estimatedMinutes: number;
  sequencerRounds?: SequencerRound[];
  classifierCategories?: string[];
  classifierItems?: ClassifierItem[];
  branchScenarios?: BranchScenario[];
  functionRounds?: FunctionForgeRound[];
  collectionRounds?: CollectionVaultRound[];
  algoStages?: AlgoArenaConfig[];
  oopDebugRounds?: OopDebugRound[];
  arcadeVariant?: CharacterArcadeVariant;
}

export interface AssessmentQuestion {
  id: string;
  moduleId: number;
  difficulty: 'Dasar' | 'Menengah' | 'Lanjut';
  prompt: string;
  code?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type AssessmentMode = 'cepat' | 'modul' | 'komprehensif';

export interface AssessmentAnswerRecord {
  questionId: string;
  moduleId: number;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
}

export interface AssessmentAttempt {
  id: string;
  mode: AssessmentMode;
  title: string;
  completedAt: string;
  durationSeconds: number;
  totalQuestions: number;
  correctCount: number;
  score: number;
  grade: string;
  xpEarned: number;
  answers: AssessmentAnswerRecord[];
}

export interface MiniGameRecord {
  gameId: string;
  moduleId: number;
  bestScore: number;
  maxScore: number;
  stars: number;
  plays: number;
  lastPlayedAt: string;
}

export interface ModuleProgress {
  moduleId: number;
  readCompleted: boolean;
  labCompleted: boolean;
  checkpointPassed: boolean;
  lastAccessedAt?: string;
}

export interface UserProfile {
  name: string;
  nim: string;
  kelas: string;
  prodi: string;
  institusi: string;
  semester: string;
  email: string;
  bio: string;
  avatarId: 'student' | 'cobalt' | 'emerald' | 'amber';
  photoDataUrl?: string;
  xp: number;
  streakDays: number;
  lastActiveDate: string;
}

export type EditableUserProfile = Pick<
  UserProfile,
  'name' | 'nim' | 'kelas' | 'prodi' | 'institusi' | 'semester' | 'email' | 'bio' | 'avatarId' | 'photoDataUrl'
>;

export interface SharedProfilePayload {
  name: string;
  nim: string;
  kelas: string;
  prodi: string;
  institusi: string;
  semester: string;
  bio: string;
  xp: number;
  level: number;
  levelTitle: string;
  rank: number;
  completedModules: number;
  totalStars: number;
  badgesCount: number;
  streakDays: number;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  category: 'Kurikulum' | 'Mini-Game' | 'Asesmen' | 'Konsistensi';
  xpBonus: number;
}

export interface PeerStudent {
  id: string;
  name: string;
  kelas: string;
  xp: number;
  weeklyXp: number;
  miniGameStars: number;
  completedModules: number;
  badgesCount: number;
}

export interface LeaderboardRow {
  id: string;
  rank: number;
  name: string;
  kelas: string;
  level: number;
  levelTitle: string;
  xp: number;
  weeklyXp: number;
  miniGameStars: number;
  completedModules: number;
  badgesCount: number;
  isCurrentUser: boolean;
}

export interface PythonVariableSnapshot {
  name: string;
  value: string;
  pyType: string;
}

export interface PythonExecutionResult {
  success: boolean;
  output: string[];
  variables: PythonVariableSnapshot[];
  errorType?: string;
  errorMessage?: string;
  errorLine?: number;
  executionMs: number;
}

export interface AppProgressState {
  profile: UserProfile;
  modules: Record<number, ModuleProgress>;
  miniGames: Record<string, MiniGameRecord>;
  assessments: AssessmentAttempt[];
  unlockedBadgeIds: string[];
  weeklyXpEarned: number;
}
