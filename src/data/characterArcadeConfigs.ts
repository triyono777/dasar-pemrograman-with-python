import type { BugArchetype, Rect } from '../engine/arcadePhysics';
import type { CharacterArcadeVariant } from '../types';

export type ArcadeMechanicKind =
  | 'maze_collect'
  | 'ordered_waypoint'
  | 'lane_runner'
  | 'courier_deliver'
  | 'binary_search_arena'
  | 'platformer_action'
  | 'arena_shooter'
  | 'character_sort_swap';

export interface CharacterTheme {
  botName: string;
  bodyColor: string;
  strokeColor: string;
  eyeColor: string;
  antennaColor: string;
  arenaBg: string;
  gridColor: string;
}

export interface MazeTokenSpec {
  label: string;
  pyType: string;
  x: number;
  y: number;
}

export interface MazeRoundSpec {
  targetType: string;
  prompt: string;
  tokens: MazeTokenSpec[];
}

export interface WaypointStepSpec {
  stepOrder: number;
  label: string;
  x: number;
  y: number;
}

export interface WaypointRoundSpec {
  prompt: string;
  steps: WaypointStepSpec[];
}

export interface LaneRunnerRoundSpec {
  varLabel: string;
  prompt: string;
  gates: [string, string, string];
  correctLane: 0 | 1 | 2;
}

export interface CourierPairSpec {
  keyLabel: string;
  vaultLabel: string;
  keyX: number;
  keyY: number;
  vaultX: number;
  vaultY: number;
}

export interface CourierRoundSpec {
  prompt: string;
  pairs: CourierPairSpec[];
  decoyVaults: { label: string; x: number; y: number }[];
}

export interface BinarySearchRoundSpec {
  prompt: string;
  array: number[];
  target: number;
}

export interface PlatformerRoundSpec {
  prompt: string;
  items: { label: string; valid: boolean; x: number; y: number }[];
}

export interface ShooterEnemyWaveItem {
  archetype: BugArchetype;
  label: string;
  x: number;
  y: number;
  hp: number;
  speed: number;
  radius: number;
}

export interface ShooterWaveSpec {
  prompt: string;
  enemies: ShooterEnemyWaveItem[];
}

export interface SortSwapRoundSpec {
  prompt: string;
  order: 'asc' | 'desc';
  array: number[];
}

export interface ActionButtonLabels {
  action1: string;
  action2: string;
  action3: string;
  hint: string;
}

export interface CharacterArcadeConfig {
  variant: CharacterArcadeVariant;
  mechanic: ArcadeMechanicKind;
  isActionVariant: boolean;
  theme: CharacterTheme;
  actionLabels?: ActionButtonLabels;
  walls?: Rect[];
  platforms?: Rect[];
  spikes?: number[];
  mazeRounds?: MazeRoundSpec[];
  waypointRounds?: WaypointRoundSpec[];
  laneRounds?: LaneRunnerRoundSpec[];
  courierRounds?: CourierRoundSpec[];
  binaryRounds?: BinarySearchRoundSpec[];
  platformerRounds?: PlatformerRoundSpec[];
  shooterWaves?: ShooterWaveSpec[];
  sortRounds?: SortSwapRoundSpec[];
}

/* ==================== PURE HELPERS (UNIT-TESTED) ==================== */

export function canCollectWaypoint(stepOrder: number, nextExpectedOrder: number): boolean {
  return stepOrder === nextExpectedOrder;
}

export interface BinarySearchStepResult {
  outcome: 'found' | 'narrow_right' | 'narrow_left' | 'wrong_index';
  expectedMid: number;
  nextLow: number;
  nextHigh: number;
}

export function evaluateBinarySearchStep(
  arr: number[],
  low: number,
  high: number,
  target: number,
  chosenIndex: number
): BinarySearchStepResult {
  const expectedMid = Math.floor((low + high) / 2);
  if (chosenIndex !== expectedMid) {
    return {
      outcome: 'wrong_index',
      expectedMid,
      nextLow: low,
      nextHigh: high,
    };
  }
  const midVal = arr[expectedMid];
  if (midVal === target) {
    return { outcome: 'found', expectedMid, nextLow: expectedMid, nextHigh: expectedMid };
  }
  if (midVal < target) {
    return { outcome: 'narrow_right', expectedMid, nextLow: expectedMid + 1, nextHigh: high };
  }
  return { outcome: 'narrow_left', expectedMid, nextLow: low, nextHigh: expectedMid - 1 };
}

export function isArraySorted(arr: number[], order: 'asc' | 'desc'): boolean {
  for (let i = 0; i < arr.length - 1; i++) {
    if (order === 'asc' && arr[i] > arr[i + 1]) return false;
    if (order === 'desc' && arr[i] < arr[i + 1]) return false;
  }
  return true;
}

export function swapAdjacentIfNeeded(
  arr: number[],
  leftIndex: number,
  order: 'asc' | 'desc'
): { swapped: boolean; nextArray: number[] } {
  if (leftIndex < 0 || leftIndex >= arr.length - 1) {
    return { swapped: false, nextArray: [...arr] };
  }
  const a = arr[leftIndex];
  const b = arr[leftIndex + 1];
  const shouldSwap = order === 'asc' ? a > b : a < b;
  if (!shouldSwap) {
    return { swapped: false, nextArray: [...arr] };
  }
  const nextArray = [...arr];
  nextArray[leftIndex] = b;
  nextArray[leftIndex + 1] = a;
  return { swapped: true, nextArray };
}

/* ==================== 14 CHARACTER ARCADE CONFIGS ==================== */

export const CHARACTER_ARCADE_CONFIGS: Record<CharacterArcadeVariant, CharacterArcadeConfig> = {
  /* ---- EXISTING 4 VARIANTS ---- */
  maze_types: {
    variant: 'maze_types',
    mechanic: 'maze_collect',
    isActionVariant: false,
    theme: {
      botName: 'PyBot',
      bodyColor: '#2563EB',
      strokeColor: '#93C5FD',
      eyeColor: '#38BDF8',
      antennaColor: '#F59E0B',
      arenaBg: '#0B1220',
      gridColor: 'rgba(148, 163, 184, 0.08)',
    },
    walls: [
      { x: 185, y: 76, w: 32, h: 145 },
      { x: 355, y: 188, w: 32, h: 155 },
      { x: 525, y: 76, w: 32, h: 145 },
      { x: 260, y: 112, w: 120, h: 28 },
    ],
    mazeRounds: [
      {
        targetType: 'int',
        prompt: 'Ronde 1: Kumpulkan semua nilai bertipe int (bilangan bulat)',
        tokens: [
          { label: '42', pyType: 'int', x: 105, y: 82 },
          { label: '-7', pyType: 'int', x: 455, y: 95 },
          { label: '2026', pyType: 'int', x: 655, y: 315 },
          { label: '"99"', pyType: 'str', x: 285, y: 315 },
          { label: '3.14', pyType: 'float', x: 645, y: 105 },
          { label: 'True', pyType: 'bool', x: 445, y: 315 },
        ],
      },
      {
        targetType: 'bool',
        prompt: 'Ronde 2: Kumpulkan semua nilai bertipe bool (True / False)',
        tokens: [
          { label: 'True', pyType: 'bool', x: 655, y: 95 },
          { label: 'False', pyType: 'bool', x: 115, y: 330 },
          { label: '5 > 2', pyType: 'bool', x: 455, y: 210 },
          { label: '"True"', pyType: 'str', x: 290, y: 66 },
          { label: '0', pyType: 'int', x: 640, y: 320 },
          { label: '1.0', pyType: 'float', x: 275, y: 245 },
        ],
      },
      {
        targetType: 'str',
        prompt: 'Ronde 3: Kumpulkan semua nilai bertipe str (teks berkutip)',
        tokens: [
          { label: '"Py"', pyType: 'str', x: 110, y: 325 },
          { label: "'100'", pyType: 'str', x: 455, y: 82 },
          { label: '"A+"', pyType: 'str', x: 660, y: 215 },
          { label: '100', pyType: 'int', x: 295, y: 320 },
          { label: 'False', pyType: 'bool', x: 645, y: 92 },
          { label: '9.5', pyType: 'float', x: 465, y: 325 },
        ],
      },
    ],
  },

  branch_runner: {
    variant: 'branch_runner',
    mechanic: 'lane_runner',
    isActionVariant: false,
    theme: {
      botName: 'PyBot',
      bodyColor: '#2563EB',
      strokeColor: '#93C5FD',
      eyeColor: '#38BDF8',
      antennaColor: '#F59E0B',
      arenaBg: '#0B1220',
      gridColor: 'rgba(148, 163, 184, 0.08)',
    },
    laneRounds: [
      {
        varLabel: 'nilai = 88',
        prompt: 'Masuk ke gerbang yang dieksekusi untuk nilai = 88',
        gates: ['if nilai >= 85', 'elif nilai >= 70', 'else'],
        correctLane: 0,
      },
      {
        varLabel: 'suhu = 36.5',
        prompt: 'Masuk ke gerbang yang dieksekusi untuk suhu = 36.5',
        gates: ['if suhu > 37.5', 'elif suhu >= 36.0', 'else'],
        correctLane: 1,
      },
      {
        varLabel: 'angka = 11',
        prompt: 'Masuk ke gerbang yang dieksekusi untuk angka = 11',
        gates: ['if angka % 2 == 0', 'elif angka < 0', 'else (Ganjil > 0)'],
        correctLane: 2,
      },
      {
        varLabel: 'sks = 20',
        prompt: 'Masuk ke gerbang yang dieksekusi untuk sks = 20',
        gates: ['if sks > 24', 'elif sks >= 18', 'else'],
        correctLane: 1,
      },
      {
        varLabel: 'stok = 0',
        prompt: 'Masuk ke gerbang yang dieksekusi untuk stok = 0',
        gates: ['if stok == 0', 'elif stok < 5', 'else'],
        correctLane: 0,
      },
    ],
  },

  loop_platformer: {
    variant: 'loop_platformer',
    mechanic: 'platformer_action',
    isActionVariant: true,
    theme: {
      botName: 'PyRunner',
      bodyColor: '#0284C7',
      strokeColor: '#7DD3FC',
      eyeColor: '#FDE047',
      antennaColor: '#F59E0B',
      arenaBg: '#0B1220',
      gridColor: 'rgba(148, 163, 184, 0.08)',
    },
    actionLabels: {
      action1: 'Lompat [Space]',
      action2: 'Dash [Shift]',
      action3: 'Saring [E]',
      hint: 'A/D atau Panah: Gerak · Space: Lompat · Shift: Dash · E: Saring · P: Jeda',
    },
    platforms: [
      { x: 95, y: 285, w: 155, h: 16 },
      { x: 305, y: 225, w: 160, h: 16 },
      { x: 520, y: 280, w: 160, h: 16 },
      { x: 215, y: 145, w: 135, h: 16 },
      { x: 455, y: 145, w: 145, h: 16 },
    ],
    spikes: [280, 485],
    platformerRounds: [
      {
        prompt: 'Tangkap 4 angka GENAP: [x for x in data if x % 2 == 0]',
        items: [
          { label: '8', valid: true, x: 170, y: 252 },
          { label: '14', valid: true, x: 385, y: 192 },
          { label: '22', valid: true, x: 600, y: 246 },
          { label: '36', valid: true, x: 525, y: 112 },
          { label: '7', valid: false, x: 280, y: 112 },
          { label: '19', valid: false, x: 465, y: 344 },
        ],
      },
      {
        prompt: 'Tangkap 4 angka KELIPATAN 5: [x for x in data if x % 5 == 0]',
        items: [
          { label: '15', valid: true, x: 165, y: 252 },
          { label: '25', valid: true, x: 280, y: 112 },
          { label: '40', valid: true, x: 525, y: 112 },
          { label: '50', valid: true, x: 605, y: 246 },
          { label: '12', valid: false, x: 385, y: 192 },
          { label: '33', valid: false, x: 315, y: 344 },
        ],
      },
    ],
  },

  bug_defender: {
    variant: 'bug_defender',
    mechanic: 'arena_shooter',
    isActionVariant: true,
    theme: {
      botName: 'PyGuard',
      bodyColor: '#1D4ED8',
      strokeColor: '#93C5FD',
      eyeColor: '#34D399',
      antennaColor: '#F59E0B',
      arenaBg: '#0B1220',
      gridColor: 'rgba(148, 163, 184, 0.08)',
    },
    actionLabels: {
      action1: 'Tembak Patch [Space]',
      action2: 'Perisai [Q]',
      action3: 'Debug Pulse [E]',
      hint: 'WASD/Panah: Gerak · Space: Tembak Patch · Q: Perisai · E: Debug Pulse · P: Jeda',
    },
    shooterWaves: [
      {
        prompt: 'Gelombang 1/3: Tumpas ZeroDiv, IndexErr & SyntaxOrb!',
        enemies: [
          { archetype: 'chaser', label: 'ZeroDiv', x: 640, y: 95, hp: 2, speed: 92, radius: 18 },
          { archetype: 'charger', label: 'IndexErr', x: 120, y: 320, hp: 2, speed: 75, radius: 18 },
          { archetype: 'orbiter', label: 'SyntaxOrb', x: 620, y: 320, hp: 2, speed: 95, radius: 18 },
        ],
      },
      {
        prompt: 'Gelombang 2/3: Tangani TypeErr & KeyErr sebelum menabrak!',
        enemies: [
          { archetype: 'chaser', label: 'TypeErr', x: 110, y: 85, hp: 2, speed: 102, radius: 18 },
          { archetype: 'charger', label: 'KeyErr', x: 650, y: 90, hp: 2, speed: 82, radius: 18 },
          { archetype: 'orbiter', label: 'ValueErr', x: 640, y: 330, hp: 2, speed: 105, radius: 18 },
        ],
      },
      {
        prompt: 'Gelombang 3/3: Boss Runtime — gunakan Perisai [Q] & Debug Pulse [E]!',
        enemies: [
          { archetype: 'chaser', label: 'ZeroDiv', x: 100, y: 90, hp: 2, speed: 106, radius: 18 },
          { archetype: 'charger', label: 'IndexErr', x: 660, y: 90, hp: 3, speed: 86, radius: 20 },
          { archetype: 'orbiter', label: 'AttrErr', x: 110, y: 330, hp: 2, speed: 106, radius: 18 },
          { archetype: 'chaser', label: 'NameErr', x: 650, y: 330, hp: 2, speed: 102, radius: 18 },
        ],
      },
    ],
  },

  /* ---- 10 NEW CHARACTER MINI-GAMES ---- */

  // 1. mg-18 (Modul 01) — Ordered Waypoint Maze
  algo_waypoint: {
    variant: 'algo_waypoint',
    mechanic: 'ordered_waypoint',
    isActionVariant: false,
    theme: {
      botName: 'AlgoBot',
      bodyColor: '#0D9488',
      strokeColor: '#5EEAD4',
      eyeColor: '#FEF08A',
      antennaColor: '#38BDF8',
      arenaBg: '#09181D',
      gridColor: 'rgba(94, 234, 212, 0.08)',
    },
    walls: [
      { x: 220, y: 40, w: 28, h: 175 },
      { x: 465, y: 205, w: 28, h: 175 },
      { x: 325, y: 170, w: 110, h: 28 },
    ],
    waypointRounds: [
      {
        prompt: 'Ronde 1 (Luas Segitiga): Sentuh langkah berurutan 1 → 2 → 3 → 4',
        steps: [
          { stepOrder: 1, label: '1. Input alas, t', x: 120, y: 90 },
          { stepOrder: 2, label: '2. luas = 0.5*a*t', x: 375, y: 85 },
          { stepOrder: 3, label: '3. Cek luas > 0', x: 630, y: 115 },
          { stepOrder: 4, label: '4. print(luas)', x: 625, y: 325 },
        ],
      },
      {
        prompt: 'Ronde 2 (Konversi Celcius): Sentuh langkah berurutan 1 → 2 → 3 → 4',
        steps: [
          { stepOrder: 1, label: '1. Input celcius', x: 125, y: 330 },
          { stepOrder: 2, label: '2. float(celcius)', x: 365, y: 315 },
          { stepOrder: 3, label: '3. f = c*9/5+32', x: 635, y: 100 },
          { stepOrder: 4, label: '4. print(f)', x: 375, y: 85 },
        ],
      },
      {
        prompt: 'Ronde 3 (Program Diskon): Sentuh langkah berurutan 1 → 2 → 3 → 4',
        steps: [
          { stepOrder: 1, label: '1. Input total', x: 120, y: 105 },
          { stepOrder: 2, label: '2. Cek >= 100rb', x: 370, y: 325 },
          { stepOrder: 3, label: '3. Potong 10%', x: 625, y: 310 },
          { stepOrder: 4, label: '4. Cetak Struk', x: 625, y: 95 },
        ],
      },
    ],
  },

  // 2. mg-19 (Modul 03) — Operator & Logic Gate Runner
  operator_gates: {
    variant: 'operator_gates',
    mechanic: 'lane_runner',
    isActionVariant: false,
    theme: {
      botName: 'LogicBot',
      bodyColor: '#4F46E5',
      strokeColor: '#A5B4FC',
      eyeColor: '#38BDF8',
      antennaColor: '#F472B6',
      arenaBg: '#101026',
      gridColor: 'rgba(165, 180, 252, 0.08)',
    },
    laneRounds: [
      {
        varLabel: '17 // 5',
        prompt: 'Evaluasi pembagian bulat 17 // 5 lalu masuk gerbang yang benar',
        gates: ['3', '3.4', '2'],
        correctLane: 0,
      },
      {
        varLabel: '17 % 5',
        prompt: 'Evaluasi modulo (sisa bagi) 17 % 5 lalu masuk gerbang yang benar',
        gates: ['3', '2', '5'],
        correctLane: 1,
      },
      {
        varLabel: '2 ** 3 + 1',
        prompt: 'Evaluasi prioritas pangkat 2 ** 3 + 1',
        gates: ['7', '16', '9'],
        correctLane: 2,
      },
      {
        varLabel: 'True and False',
        prompt: 'Evaluasi ekspresi logika True and False',
        gates: ['True', 'False', 'None'],
        correctLane: 1,
      },
      {
        varLabel: 'not (4 > 9)',
        prompt: 'Evaluasi negasi logika not (4 > 9)',
        gates: ['True', 'False', 'Error'],
        correctLane: 0,
      },
    ],
  },

  // 3. mg-20 (Modul 08) — List Indexing & Slicing Warehouse Maze
  list_index_maze: {
    variant: 'list_index_maze',
    mechanic: 'maze_collect',
    isActionVariant: false,
    theme: {
      botName: 'SliceBot',
      bodyColor: '#D97706',
      strokeColor: '#FDE68A',
      eyeColor: '#38BDF8',
      antennaColor: '#34D399',
      arenaBg: '#17120B',
      gridColor: 'rgba(253, 230, 138, 0.08)',
    },
    walls: [
      { x: 170, y: 120, w: 140, h: 26 },
      { x: 430, y: 120, w: 140, h: 26 },
      { x: 170, y: 265, w: 140, h: 26 },
      { x: 430, y: 265, w: 140, h: 26 },
    ],
    mazeRounds: [
      {
        targetType: 'slice1',
        prompt: 'data = [10,20,30,40,50] → Ambil hasil data[1:4]',
        tokens: [
          { label: '20', pyType: 'slice1', x: 240, y: 74 },
          { label: '30', pyType: 'slice1', x: 500, y: 74 },
          { label: '40', pyType: 'slice1', x: 500, y: 340 },
          { label: '10', pyType: 'other', x: 240, y: 340 },
          { label: '50', pyType: 'other', x: 660, y: 205 },
          { label: '60', pyType: 'other', x: 370, y: 205 },
        ],
      },
      {
        targetType: 'step2',
        prompt: 'huruf = ["A","B","C","D","E"] → Ambil hasil huruf[::2]',
        tokens: [
          { label: '"A"', pyType: 'step2', x: 105, y: 74 },
          { label: '"C"', pyType: 'step2', x: 375, y: 205 },
          { label: '"E"', pyType: 'step2', x: 655, y: 340 },
          { label: '"B"', pyType: 'other', x: 505, y: 74 },
          { label: '"D"', pyType: 'other', x: 235, y: 340 },
          { label: '"F"', pyType: 'other', x: 655, y: 74 },
        ],
      },
      {
        targetType: 'neg',
        prompt: 'angka = [5, 15, 25, 35] → Ambil hasil angka[-2:] dan angka[0]',
        tokens: [
          { label: '25', pyType: 'neg', x: 240, y: 74 },
          { label: '35', pyType: 'neg', x: 650, y: 205 },
          { label: '5', pyType: 'neg', x: 240, y: 340 },
          { label: '15', pyType: 'other', x: 505, y: 74 },
          { label: '45', pyType: 'other', x: 505, y: 340 },
          { label: '-1', pyType: 'other', x: 370, y: 205 },
        ],
      },
    ],
  },

  // 4. mg-21 (Modul 09) — Dictionary Key & Set Vault Courier
  dict_key_courier: {
    variant: 'dict_key_courier',
    mechanic: 'courier_deliver',
    isActionVariant: false,
    theme: {
      botName: 'HashBot',
      bodyColor: '#059669',
      strokeColor: '#6EE7B7',
      eyeColor: '#FDE047',
      antennaColor: '#38BDF8',
      arenaBg: '#091813',
      gridColor: 'rgba(110, 231, 183, 0.08)',
    },
    walls: [
      { x: 355, y: 60, w: 28, h: 110 },
      { x: 355, y: 250, w: 28, h: 110 },
    ],
    courierRounds: [
      {
        prompt: 'Ronde 1: Ambil Kunci Dictionary di kiri lalu antar ke Nilai yang cocok di kanan!',
        pairs: [
          { keyLabel: 'mhs["nama"]', vaultLabel: '"Rafi"', keyX: 115, keyY: 95, vaultX: 635, vaultY: 95 },
          { keyLabel: 'mhs["sks"]', vaultLabel: '20', keyX: 115, keyY: 210, vaultX: 635, vaultY: 210 },
          { keyLabel: 'mhs["lulus"]', vaultLabel: 'True', keyX: 115, keyY: 325, vaultX: 635, vaultY: 325 },
        ],
        decoyVaults: [{ label: 'KeyError', x: 485, y: 210 }],
      },
      {
        prompt: 'Ronde 2: A={1,2,3}, B={2,3,4} — Antar operasi Set ke hasil brankasnya!',
        pairs: [
          { keyLabel: 'A & B', vaultLabel: '{2, 3}', keyX: 115, keyY: 110, vaultX: 635, vaultY: 95 },
          { keyLabel: 'A - B', vaultLabel: '{1}', keyX: 115, keyY: 215, vaultX: 635, vaultY: 215 },
          { keyLabel: 'B - A', vaultLabel: '{4}', keyX: 115, keyY: 320, vaultX: 635, vaultY: 330 },
        ],
        decoyVaults: [{ label: '{1, 4}', x: 485, y: 150 }],
      },
      {
        prompt: 'Ronde 3: Method Dictionary — Antar pemanggilan method ke keluaran yang benar!',
        pairs: [
          { keyLabel: 'len(d)', vaultLabel: 'Jumlah key', keyX: 115, keyY: 100, vaultX: 635, vaultY: 100 },
          { keyLabel: 'd.get("x",0)', vaultLabel: 'Default 0', keyX: 115, keyY: 215, vaultX: 635, vaultY: 215 },
          { keyLabel: 'd.keys()', vaultLabel: 'Daftar key', keyX: 115, keyY: 325, vaultX: 635, vaultY: 325 },
        ],
        decoyVaults: [{ label: 'IndexError', x: 485, y: 265 }],
      },
    ],
  },

  // 5. mg-22 (Modul 10) — Binary Search Midpoint Dash
  binary_search_dash: {
    variant: 'binary_search_dash',
    mechanic: 'binary_search_arena',
    isActionVariant: false,
    theme: {
      botName: 'SearchBot',
      bodyColor: '#0284C7',
      strokeColor: '#7DD3FC',
      eyeColor: '#A7F3D0',
      antennaColor: '#F59E0B',
      arenaBg: '#091524',
      gridColor: 'rgba(125, 211, 252, 0.08)',
    },
    binaryRounds: [
      {
        prompt: 'Cari target = 40: Gerakkan SearchBot ke kotak indeks tengah (mid)!',
        array: [4, 9, 15, 22, 31, 40, 55, 68],
        target: 40,
      },
      {
        prompt: 'Cari target = 12: Gerakkan SearchBot ke kotak indeks tengah (mid)!',
        array: [5, 12, 18, 27, 33, 45, 59, 72],
        target: 12,
      },
      {
        prompt: 'Cari target = 64: Gerakkan SearchBot ke kotak indeks tengah (mid)!',
        array: [2, 8, 16, 24, 36, 48, 64, 80],
        target: 64,
      },
    ],
  },

  // 6. mg-23 (Modul 06) — Function Return Platformer + 3 Action Buttons
  func_factory_jump: {
    variant: 'func_factory_jump',
    mechanic: 'platformer_action',
    isActionVariant: true,
    theme: {
      botName: 'FuncRunner',
      bodyColor: '#2563EB',
      strokeColor: '#BFDBFE',
      eyeColor: '#34D399',
      antennaColor: '#FBBF24',
      arenaBg: '#0D1326',
      gridColor: 'rgba(147, 197, 253, 0.08)',
    },
    actionLabels: {
      action1: 'Lompat [Space]',
      action2: 'Dash [Shift]',
      action3: 'Magnet Return [E]',
      hint: 'A/D atau Panah: Gerak · Space: Lompat · Shift: Dash · E: Magnet Return · P: Jeda',
    },
    platforms: [
      { x: 75, y: 290, w: 145, h: 16 },
      { x: 270, y: 240, w: 150, h: 16 },
      { x: 475, y: 290, w: 155, h: 16 },
      { x: 165, y: 155, w: 145, h: 16 },
      { x: 420, y: 140, w: 160, h: 16 },
    ],
    spikes: [245, 450],
    platformerRounds: [
      {
        prompt: 'Tangkap 4 return valid dari: def f(x): return x * 2 + 1 (x = 1..4)',
        items: [
          { label: '3', valid: true, x: 145, y: 256 },
          { label: '5', valid: true, x: 345, y: 206 },
          { label: '7', valid: true, x: 550, y: 256 },
          { label: '9', valid: true, x: 500, y: 106 },
          { label: '4', valid: false, x: 235, y: 120 },
          { label: '8', valid: false, x: 380, y: 344 },
        ],
      },
      {
        prompt: 'Tangkap 4 return valid dari: def kuadrat(n): return n ** 2 (n = 2..5)',
        items: [
          { label: '4', valid: true, x: 145, y: 256 },
          { label: '9', valid: true, x: 235, y: 120 },
          { label: '16', valid: true, x: 500, y: 106 },
          { label: '25', valid: true, x: 550, y: 256 },
          { label: '12', valid: false, x: 345, y: 206 },
          { label: '20', valid: false, x: 640, y: 344 },
        ],
      },
    ],
  },

  // 7. mg-24 (Modul 07) — Recursion & Lambda Tower Platformer + 3 Action Buttons
  recursion_tower: {
    variant: 'recursion_tower',
    mechanic: 'platformer_action',
    isActionVariant: true,
    theme: {
      botName: 'RecurBot',
      bodyColor: '#7C3AED',
      strokeColor: '#DDD6FE',
      eyeColor: '#FDE047',
      antennaColor: '#F472B6',
      arenaBg: '#160D26',
      gridColor: 'rgba(221, 214, 254, 0.08)',
    },
    actionLabels: {
      action1: 'Lompat [Space]',
      action2: 'Dash [Shift]',
      action3: 'Filter Base [E]',
      hint: 'A/D atau Panah: Gerak · Space: Lompat · Shift: Dash · E: Filter Base · P: Jeda',
    },
    platforms: [
      { x: 110, y: 295, w: 145, h: 16 },
      { x: 310, y: 235, w: 145, h: 16 },
      { x: 515, y: 185, w: 155, h: 16 },
      { x: 265, y: 135, w: 150, h: 16 },
      { x: 85, y: 175, w: 125, h: 16 },
    ],
    spikes: [295, 520],
    platformerRounds: [
      {
        prompt: 'Tangkap 4 hasil faktorial valid: 1!, 2!, 3!, 4!',
        items: [
          { label: '1', valid: true, x: 180, y: 262 },
          { label: '2', valid: true, x: 380, y: 202 },
          { label: '6', valid: true, x: 590, y: 152 },
          { label: '24', valid: true, x: 340, y: 102 },
          { label: '12', valid: false, x: 145, y: 142 },
          { label: '18', valid: false, x: 430, y: 344 },
        ],
      },
      {
        prompt: 'Tangkap 4 hasil lambda x: x*3 untuk x = 2, 3, 4, 5',
        items: [
          { label: '6', valid: true, x: 180, y: 262 },
          { label: '9', valid: true, x: 145, y: 142 },
          { label: '12', valid: true, x: 340, y: 102 },
          { label: '15', valid: true, x: 590, y: 152 },
          { label: '10', valid: false, x: 380, y: 202 },
          { label: '14', valid: false, x: 630, y: 344 },
        ],
      },
    ],
  },

  // 8. mg-25 (Modul 11) — OOP Class & Object Defender + 3 Action Buttons
  oop_blueprint_shooter: {
    variant: 'oop_blueprint_shooter',
    mechanic: 'arena_shooter',
    isActionVariant: true,
    theme: {
      botName: 'ClassGuard',
      bodyColor: '#0F766E',
      strokeColor: '#99F6E4',
      eyeColor: '#FDE047',
      antennaColor: '#F59E0B',
      arenaBg: '#09191B',
      gridColor: 'rgba(153, 246, 228, 0.08)',
    },
    actionLabels: {
      action1: 'Tembak self [Space]',
      action2: 'Perisai Encap [Q]',
      action3: 'Init Pulse [E]',
      hint: 'WASD/Panah: Gerak · Space: Tembak self · Q: Perisai Encap · E: Init Pulse · P: Jeda',
    },
    shooterWaves: [
      {
        prompt: 'Gelombang 1/3: Bersihkan anti-pola Class (MissingSelf, GlobalLeak)!',
        enemies: [
          { archetype: 'chaser', label: 'GlobalLeak', x: 630, y: 95, hp: 2, speed: 92, radius: 18 },
          { archetype: 'charger', label: 'MissingSelf', x: 120, y: 320, hp: 2, speed: 78, radius: 18 },
          { archetype: 'orbiter', label: 'NoInitOrb', x: 620, y: 325, hp: 2, speed: 96, radius: 18 },
        ],
      },
      {
        prompt: 'Gelombang 2/3: Amankan atribut privat dari Mutator liar!',
        enemies: [
          { archetype: 'chaser', label: 'RawAttr', x: 110, y: 90, hp: 2, speed: 100, radius: 18 },
          { archetype: 'charger', label: 'BadMethod', x: 650, y: 95, hp: 2, speed: 84, radius: 18 },
          { archetype: 'orbiter', label: 'NullObj', x: 630, y: 330, hp: 2, speed: 104, radius: 18 },
        ],
      },
      {
        prompt: 'Gelombang 3/3: Boss Blueprint OOP — lindungi __init__ dengan Perisai [Q]!',
        enemies: [
          { archetype: 'chaser', label: 'MissingSelf', x: 100, y: 95, hp: 2, speed: 105, radius: 18 },
          { archetype: 'charger', label: 'SpaghettiCls', x: 655, y: 95, hp: 3, speed: 86, radius: 20 },
          { archetype: 'orbiter', label: 'GlobalLeak', x: 110, y: 330, hp: 2, speed: 104, radius: 18 },
          { archetype: 'chaser', label: 'NoInitOrb', x: 650, y: 330, hp: 2, speed: 100, radius: 18 },
        ],
      },
    ],
  },

  // 9. mg-26 (Modul 12) — Inheritance & Polymorphism Arena + 3 Action Buttons
  poly_morph_arena: {
    variant: 'poly_morph_arena',
    mechanic: 'arena_shooter',
    isActionVariant: true,
    theme: {
      botName: 'PolyBot',
      bodyColor: '#6D28D9',
      strokeColor: '#C4B5FD',
      eyeColor: '#34D399',
      antennaColor: '#38BDF8',
      arenaBg: '#130D24',
      gridColor: 'rgba(196, 181, 253, 0.08)',
    },
    actionLabels: {
      action1: 'Override Shot [Space]',
      action2: 'Perisai super() [Q]',
      action3: 'Poly Wave [E]',
      hint: 'WASD/Panah: Gerak · Space: Override Shot · Q: Perisai super() · E: Poly Wave · P: Jeda',
    },
    shooterWaves: [
      {
        prompt: 'Gelombang 1/3: Rapikan subkelas bermasalah (BrokenSuper, RigidCls)!',
        enemies: [
          { archetype: 'chaser', label: 'RigidCls', x: 635, y: 95, hp: 2, speed: 94, radius: 18 },
          { archetype: 'charger', label: 'BrokenSuper', x: 120, y: 325, hp: 2, speed: 80, radius: 18 },
          { archetype: 'orbiter', label: 'TypeClash', x: 625, y: 320, hp: 2, speed: 98, radius: 18 },
        ],
      },
      {
        prompt: 'Gelombang 2/3: Tuntaskan benturan MRO & Method Override!',
        enemies: [
          { archetype: 'chaser', label: 'MROConflict', x: 115, y: 90, hp: 2, speed: 102, radius: 18 },
          { archetype: 'charger', label: 'BadOverride', x: 650, y: 95, hp: 2, speed: 84, radius: 18 },
          { archetype: 'orbiter', label: 'DuckErr', x: 635, y: 330, hp: 2, speed: 104, radius: 18 },
        ],
      },
      {
        prompt: 'Gelombang 3/3: Boss Hierarki OOP — lepaskan Poly Wave [E]!',
        enemies: [
          { archetype: 'chaser', label: 'BrokenSuper', x: 105, y: 95, hp: 2, speed: 106, radius: 18 },
          { archetype: 'charger', label: 'DiamondMRO', x: 655, y: 95, hp: 3, speed: 86, radius: 20 },
          { archetype: 'orbiter', label: 'TypeClash', x: 110, y: 330, hp: 2, speed: 105, radius: 18 },
          { archetype: 'chaser', label: 'BadOverride', x: 650, y: 330, hp: 2, speed: 102, radius: 18 },
        ],
      },
    ],
  },

  // 10. mg-27 (Modul 10) — Interactive Character Bubble Sort & Swap + 3 Action Buttons
  sort_swamp_action: {
    variant: 'sort_swamp_action',
    mechanic: 'character_sort_swap',
    isActionVariant: true,
    theme: {
      botName: 'SortKnight',
      bodyColor: '#B45309',
      strokeColor: '#FDE68A',
      eyeColor: '#38BDF8',
      antennaColor: '#F43F5E',
      arenaBg: '#19120D',
      gridColor: 'rgba(253, 230, 138, 0.08)',
    },
    actionLabels: {
      action1: 'Tukar / Swap [Space]',
      action2: 'Cek Pass [Q]',
      action3: 'Turbo Dash [E]',
      hint: 'A/D atau Panah: Geser · Space: Tukar (Swap) · Q: Cek Pass · E: Turbo Dash · P: Jeda',
    },
    sortRounds: [
      {
        prompt: 'Ronde 1: Urutkan NAIK (Ascending) — berdiri di antara 2 blok lalu tekan Tukar [Space]!',
        order: 'asc',
        array: [34, 12, 28, 19, 45],
      },
      {
        prompt: 'Ronde 2: Urutkan NAIK (Ascending) — gunakan Cek Pass [Q] jika butuh petunjuk pasangan!',
        order: 'asc',
        array: [50, 22, 41, 15, 30],
      },
      {
        prompt: 'Ronde 3: Urutkan TURUN (Descending: Besar → Kecil) dengan Bubble Sort!',
        order: 'desc',
        array: [18, 42, 25, 60, 31],
      },
    ],
  },
};
