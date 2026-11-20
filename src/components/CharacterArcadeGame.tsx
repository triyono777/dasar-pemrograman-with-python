import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
  Crosshair,
} from 'lucide-react';
import {
  circleDistance,
  clamp,
  clampDt,
  createParticlePool,
  emitParticles,
  moveWithWallCollision,
  rectsOverlap,
  stepEnemyPolicy,
  stepParticlePool,
  stepPlatformerBody,
  type ArcadeParticle,
  type BugEnemy,
  type PlatformerBody,
  type Rect,
} from '../engine/arcadePhysics';
import type { CharacterArcadeVariant } from '../types';

interface CharacterArcadeGameProps {
  variant: CharacterArcadeVariant;
  title: string;
  onFinish: (score: number, maxScore: number) => void;
}

type GamePhase = 'title' | 'playing' | 'paused' | 'victory' | 'gameover';

interface HudSnapshot {
  phase: GamePhase;
  score: number;
  maxScore: number;
  hp: number;
  maxHp: number;
  round: number;
  maxRounds: number;
  objectiveText: string;
  feedbackText: string;
  cooldown1Pct: number;
  cooldown2Pct: number;
  cooldown3Pct: number;
  playerX: number;
  playerY: number;
  actionCount: number;
}

const CANVAS_W = 760;
const CANVAS_H = 420;

// Lightweight procedural Web Audio API sound effects
class SynthAudio {
  ctx: AudioContext | null = null;
  muted = false;

  play(kind: 'pickup' | 'hurt' | 'jump' | 'shoot' | 'shield' | 'pulse' | 'win') {
    if (this.muted || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.ctx) this.ctx = new AudioCtx();
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const jitter = 0.94 + Math.random() * 0.12;
      if (kind === 'pickup') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520 * jitter, now);
        osc.frequency.exponentialRampToValueAtTime(780 * jitter, now + 0.11);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (kind === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260 * jitter, now);
        osc.frequency.exponentialRampToValueAtTime(490 * jitter, now + 0.1);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (kind === 'shoot') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(640 * jitter, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.08);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (kind === 'shield' || kind === 'pulse') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(kind === 'shield' ? 380 : 190, now);
        osc.frequency.exponentialRampToValueAtTime(kind === 'shield' ? 620 : 540, now + 0.22);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.26);
      } else if (kind === 'hurt') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(190, now);
        osc.frequency.exponentialRampToValueAtTime(85, now + 0.18);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.21);
      } else if (kind === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.09);
        osc.frequency.setValueAtTime(784, now + 0.18);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch {
      // AudioContext unavailable in restricted environments
    }
  }
}

/* ==================== GAME DATA CONFIGS ==================== */

const MAZE_WALLS: Rect[] = [
  { x: 185, y: 76, w: 32, h: 145 },
  { x: 355, y: 188, w: 32, h: 155 },
  { x: 525, y: 76, w: 32, h: 145 },
  { x: 260, y: 112, w: 120, h: 28 },
];

const MAZE_ROUNDS = [
  {
    targetType: 'int',
    prompt: 'Target Ronde 1: Kumpulkan semua nilai bertipe int (bilangan bulat)',
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
    prompt: 'Target Ronde 2: Kumpulkan semua nilai bertipe bool (True / False)',
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
    prompt: 'Target Ronde 3: Kumpulkan semua nilai bertipe str (teks berkutip)',
    tokens: [
      { label: '"Py"', pyType: 'str', x: 110, y: 325 },
      { label: "'100'", pyType: 'str', x: 455, y: 82 },
      { label: '"A+"', pyType: 'str', x: 660, y: 215 },
      { label: '100', pyType: 'int', x: 295, y: 320 },
      { label: 'False', pyType: 'bool', x: 645, y: 92 },
      { label: '9.5', pyType: 'float', x: 465, y: 325 },
    ],
  },
];

const BRANCH_ROUNDS = [
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
];

const PLATFORMER_PLATFORMS: Rect[] = [
  { x: 95, y: 285, w: 155, h: 16 },
  { x: 305, y: 225, w: 160, h: 16 },
  { x: 520, y: 280, w: 160, h: 16 },
  { x: 215, y: 145, w: 135, h: 16 },
  { x: 455, y: 145, w: 145, h: 16 },
];

const PLATFORMER_ROUNDS = [
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
];

/* ==================== COMPONENT ==================== */

export function CharacterArcadeGame({ variant, title, onFinish }: CharacterArcadeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<SynthAudio | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const isActionVariant = variant === 'loop_platformer' || variant === 'bug_defender';
  const maxScoreTarget =
    variant === 'maze_types'
      ? 9
      : variant === 'branch_runner'
        ? 5
        : variant === 'loop_platformer'
          ? 8
          : 10;

  const [muted, setMuted] = useState(false);
  const [hud, setHud] = useState<HudSnapshot>({
    phase: 'title',
    score: 0,
    maxScore: maxScoreTarget,
    hp: 3,
    maxHp: 3,
    round: 1,
    maxRounds: variant === 'maze_types' ? 3 : variant === 'branch_runner' ? 5 : variant === 'loop_platformer' ? 2 : 3,
    objectiveText: '',
    feedbackText: '',
    cooldown1Pct: 100,
    cooldown2Pct: 100,
    cooldown3Pct: 100,
    playerX: 120,
    playerY: 210,
    actionCount: 0,
  });

  // Mutable 60Hz simulation state (never causes React re-render per frame!)
  const simRef = useRef({
    phase: 'title' as GamePhase,
    score: 0,
    maxScore: maxScoreTarget,
    hp: 3,
    maxHp: 3,
    round: 0,
    maxRounds: 3,
    objectiveText: '',
    feedbackText: '',
    // Player
    px: 90,
    py: 210,
    facingX: 1,
    facingY: 0,
    walkDist: 0,
    scaleX: 1,
    scaleY: 1,
    invulnTimer: 0,
    hitstopTimer: 0,
    shakeTrauma: 0,
    actionCount: 0,
    // Input hub
    keys: new Set<string>(),
    dpad: { up: false, down: false, left: false, right: false },
    justPressed: new Set<string>(),
    // Particles
    particles: createParticlePool(64),
    // Variant 1: Maze collect
    mazeTokens: [] as { label: string; pyType: string; x: number; y: number; collected: boolean }[],
    // Variant 2: Branch runner
    gateX: CANVAS_W - 70,
    hazardBlobs: [] as { x: number; y: number; vx: number; r: number }[],
    // Variant 3: Loop platformer
    body: {
      x: 56,
      y: 332,
      vx: 0,
      vy: 0,
      w: 32,
      h: 36,
      onGround: true,
      coyoteTimer: 0.11,
      jumpBufferTimer: 0,
    } as PlatformerBody,
    platItems: [] as { label: string; valid: boolean; x: number; y: number; collected: boolean }[],
    platSpikes: [
      { x: 268, y: 356, w: 34, h: 16 },
      { x: 472, y: 356, w: 34, h: 16 },
    ],
    dashTimer: 0,
    dashCd: 0,
    magnetTimer: 0,
    magnetCd: 0,
    // Variant 4: Bug defender
    enemies: [] as BugEnemy[],
    projectiles: [] as { x: number; y: number; vx: number; vy: number; life: number }[],
    shootCd: 0,
    shieldTimer: 0,
    shieldCd: 0,
    pulseTimer: 0,
    pulseCd: 0,
    enemyIdCounter: 1,
    waveSpawned: 0,
  });

  const syncHud = useCallback(() => {
    const s = simRef.current;
    document.body.dataset.state =
      s.phase === 'victory' ? 'gameover' : s.phase;

    let cd1 = 100;
    let cd2 = 100;
    let cd3 = 100;
    if (variant === 'loop_platformer') {
      cd1 = 100;
      cd2 = Math.round(clamp(1 - s.dashCd / 1.4, 0, 1) * 100);
      cd3 = Math.round(clamp(1 - s.magnetCd / 3.0, 0, 1) * 100);
    } else if (variant === 'bug_defender') {
      cd1 = Math.round(clamp(1 - s.shootCd / 0.25, 0, 1) * 100);
      cd2 = Math.round(clamp(1 - s.shieldCd / 4.0, 0, 1) * 100);
      cd3 = Math.round(clamp(1 - s.pulseCd / 5.0, 0, 1) * 100);
    }

    setHud({
      phase: s.phase,
      score: s.score,
      maxScore: s.maxScore,
      hp: s.hp,
      maxHp: s.maxHp,
      round: s.round + 1,
      maxRounds: s.maxRounds,
      objectiveText: s.objectiveText,
      feedbackText: s.feedbackText,
      cooldown1Pct: cd1,
      cooldown2Pct: cd2,
      cooldown3Pct: cd3,
      playerX: Math.round(variant === 'loop_platformer' ? s.body.x : s.px),
      playerY: Math.round(variant === 'loop_platformer' ? s.body.y : s.py),
      actionCount: s.actionCount,
    });
  }, [variant]);

  const spawnBugWave = useCallback((waveIdx: number) => {
    const s = simRef.current;
    const count = waveIdx === 0 ? 3 : waveIdx === 1 ? 3 : 4;
    const spawned: BugEnemy[] = [];
    const archetypes: { type: BugEnemy['archetype']; label: string; hp: number }[] = [
      { type: 'chaser', label: 'ZeroDiv', hp: 2 },
      { type: 'charger', label: 'IndexErr', hp: 2 },
      { type: 'orbiter', label: 'SyntaxOrb', hp: 1 },
    ];
    for (let i = 0; i < count; i++) {
      const arch = archetypes[(i + waveIdx) % archetypes.length];
      const spawnRight = i % 2 === 0;
      const sx = spawnRight ? CANVAS_W - 64 - (i * 22) : 64 + (i * 22);
      const sy = i % 3 === 0 ? 78 : i % 3 === 1 ? CANVAS_H - 78 : CANVAS_H / 2;
      spawned.push({
        id: s.enemyIdCounter++,
        archetype: arch.type,
        label: arch.label,
        x: sx,
        y: sy,
        vx: 0,
        vy: 0,
        hp: arch.hp,
        maxHp: arch.hp,
        radius: 19,
        stateTimer: 1.0 + i * 0.4,
        chargePhase: 'idle',
        chargeDirX: -1,
        chargeDirY: 0,
        orbitAngle: i * 1.8,
        hitFlash: 0,
        koTimer: 0,
      });
    }
    s.enemies = spawned;
    s.objectiveText = `Gelombang ${waveIdx + 1}/3: Tumpas semua Bug memakai Tembak Patch, Perisai & Debug Pulse!`;
  }, []);

  const setupRound = useCallback(
    (roundIdx: number) => {
      const s = simRef.current;
      s.round = roundIdx;

      if (variant === 'maze_types') {
        const cfg = MAZE_ROUNDS[roundIdx];
        s.px = 86;
        s.py = 210;
        s.objectiveText = cfg.prompt;
        s.mazeTokens = cfg.tokens.map((t) => ({ ...t, collected: false }));
      } else if (variant === 'branch_runner') {
        const cfg = BRANCH_ROUNDS[roundIdx];
        s.px = 110;
        s.py = 210;
        s.gateX = CANVAS_W - 86;
        s.objectiveText = cfg.prompt;
        s.hazardBlobs = [
          { x: 340, y: 88, vx: 0, r: 15 },
          { x: 480, y: 210, vx: 0, r: 15 },
          { x: 390, y: 332, vx: 0, r: 15 },
        ];
      } else if (variant === 'loop_platformer') {
        const cfg = PLATFORMER_ROUNDS[roundIdx];
        s.body = {
          x: 56,
          y: 334,
          vx: 0,
          vy: 0,
          w: 32,
          h: 36,
          onGround: true,
          coyoteTimer: 0.11,
          jumpBufferTimer: 0,
        };
        s.objectiveText = cfg.prompt;
        s.platItems = cfg.items.map((it) => ({ ...it, collected: false }));
      } else {
        spawnBugWave(roundIdx);
      }
    },
    [variant, spawnBugWave]
  );

  const startGame = useCallback(() => {
    const s = simRef.current;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    s.phase = 'playing';
    s.score = 0;
    s.maxScore = maxScoreTarget;
    s.hp = 3;
    s.maxHp = 3;
    s.maxRounds =
      variant === 'maze_types' ? 3 : variant === 'branch_runner' ? 5 : variant === 'loop_platformer' ? 2 : 3;
    s.invulnTimer = 0.6;
    s.hitstopTimer = 0;
    s.shakeTrauma = 0;
    s.actionCount = 0;
    s.facingX = 1;
    s.facingY = 0;
    s.px = variant === 'bug_defender' ? CANVAS_W / 2 : 90;
    s.py = CANVAS_H / 2;
    s.keys.clear();
    s.dpad = { up: false, down: false, left: false, right: false };
    s.justPressed.clear();
    s.projectiles = [];
    s.dashTimer = 0;
    s.dashCd = 0;
    s.magnetTimer = 0;
    s.magnetCd = 0;
    s.shootCd = 0;
    s.shieldTimer = 0;
    s.shieldCd = 0;
    s.pulseTimer = 0;
    s.pulseCd = 0;
    s.feedbackText = 'Permainan dimulai!';
    setupRound(0);
    syncHud();
  }, [maxScoreTarget, setupRound, syncHud, variant]);

  // Trigger action button helper (used by both Keyboard and On-Screen Action Buttons)
  const triggerAction = useCallback(
    (actionId: 'action1' | 'action2' | 'action3') => {
      const s = simRef.current;
      if (s.phase !== 'playing') return;
      s.justPressed.add(actionId);
      s.actionCount += 1;
    },
    []
  );

  const togglePause = useCallback(() => {
    const s = simRef.current;
    if (s.phase === 'playing') {
      s.phase = 'paused';
      s.keys.clear();
      syncHud();
    } else if (s.phase === 'paused') {
      s.phase = 'playing';
      syncHud();
    }
  }, [syncHud]);

  // Support ?autostart=1
  useEffect(() => {
    if (!audioRef.current) audioRef.current = new SynthAudio();
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startGame();
    } else {
      simRef.current.phase = 'title';
      setupRound(0);
      syncHud();
    }
  }, [setupRound, startGame, syncHud]);

  // Keyboard listeners + focus-loss key release hygiene
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const s = simRef.current;
      const code = e.code;

      if (s.phase === 'title' && (code === 'Enter' || code === 'Space')) {
        e.preventDefault();
        startGame();
        return;
      }

      if ((code === 'Escape' || code === 'KeyP') && (s.phase === 'playing' || s.phase === 'paused')) {
        e.preventDefault();
        togglePause();
        return;
      }

      if (code === 'KeyM') {
        setMuted((prev) => {
          const next = !prev;
          if (audioRef.current) audioRef.current.muted = next;
          return next;
        });
        return;
      }

      if (code === 'KeyR' && s.phase !== 'title') {
        startGame();
        return;
      }

      if (s.phase !== 'playing') return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
        e.preventDefault();
      }

      if (!s.keys.has(code)) {
        if (code === 'Space' || (variant === 'loop_platformer' && (code === 'ArrowUp' || code === 'KeyW'))) {
          s.justPressed.add('action1');
          s.actionCount += 1;
        }
        if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyQ') {
          s.justPressed.add('action2');
          s.actionCount += 1;
        }
        if (code === 'KeyE' || code === 'KeyF') {
          s.justPressed.add('action3');
          s.actionCount += 1;
        }
      }
      s.keys.add(code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      simRef.current.keys.delete(e.code);
    };

    const clearInputs = () => {
      simRef.current.keys.clear();
      simRef.current.dpad = { up: false, down: false, left: false, right: false };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInputs);
    document.addEventListener('visibilitychange', clearInputs);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInputs);
      document.removeEventListener('visibilitychange', clearInputs);
    };
  }, [startGame, togglePause, variant]);

  // Main 60 FPS requestAnimationFrame Canvas2D loop
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();
    let hudTimer = 0;

    const damagePlayer = (reason: string) => {
      const s = simRef.current;
      if (s.invulnTimer > 0 || s.shieldTimer > 0) return;
      s.hp = Math.max(0, s.hp - 1);
      s.invulnTimer = 1.1;
      s.hitstopTimer = 0.05;
      s.shakeTrauma = 0.65;
      s.feedbackText = reason;
      audioRef.current?.play('hurt');
      const cx = variant === 'loop_platformer' ? s.body.x + s.body.w / 2 : s.px;
      const cy = variant === 'loop_platformer' ? s.body.y + s.body.h / 2 : s.py;
      emitParticles(s.particles, cx, cy, '#EF4444', 14, 170);

      if (s.hp <= 0) {
        s.phase = 'gameover';
      }
      syncHud();
    };

    const stepSimulation = (dt: number) => {
      const s = simRef.current;
      stepParticlePool(s.particles, dt);

      if (s.phase !== 'playing') return;

      s.shakeTrauma = Math.max(0, s.shakeTrauma - dt * 1.8);
      s.scaleX += (1 - s.scaleX) * Math.min(1, dt * 14);
      s.scaleY += (1 - s.scaleY) * Math.min(1, dt * 14);

      if (s.hitstopTimer > 0) {
        s.hitstopTimer = Math.max(0, s.hitstopTimer - dt);
        return;
      }

      if (s.invulnTimer > 0) s.invulnTimer = Math.max(0, s.invulnTimer - dt);

      const moveLeft = s.keys.has('ArrowLeft') || s.keys.has('KeyA') || s.dpad.left;
      const moveRight = s.keys.has('ArrowRight') || s.keys.has('KeyD') || s.dpad.right;
      const moveUp = s.keys.has('ArrowUp') || s.keys.has('KeyW') || s.dpad.up;
      const moveDown = s.keys.has('ArrowDown') || s.keys.has('KeyS') || s.dpad.down;

      const ix = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);
      const iy = (moveDown ? 1 : 0) - (moveUp ? 1 : 0);

      /* ---------- VARIANT 1: MAZE TYPES ---------- */
      if (variant === 'maze_types') {
        const speed = 225;
        const mag = Math.hypot(ix, iy) || 1;
        if (ix !== 0 || iy !== 0) {
          s.facingX = ix / mag;
          s.facingY = iy / mag;
          const prevX = s.px;
          const prevY = s.py;
          const next = moveWithWallCollision(
            { x: s.px, y: s.py },
            30,
            (ix / mag) * speed * dt,
            (iy / mag) * speed * dt,
            { width: CANVAS_W, height: CANVAS_H },
            MAZE_WALLS
          );
          s.px = next.x;
          s.py = next.y;
          s.walkDist += Math.hypot(s.px - prevX, s.py - prevY);
        }

        const targetType = MAZE_ROUNDS[s.round].targetType;
        for (const tok of s.mazeTokens) {
          if (tok.collected) continue;
          if (circleDistance(s.px, s.py, tok.x, tok.y) < 30) {
            tok.collected = true;
            if (tok.pyType === targetType) {
              s.score += 1;
              s.scaleX = 1.22;
              s.scaleY = 0.82;
              s.feedbackText = `Tepat! ${tok.label} bertipe ${tok.pyType}.`;
              audioRef.current?.play('pickup');
              emitParticles(s.particles, tok.x, tok.y, '#10B981', 10, 140);
              syncHud();
            } else {
              damagePlayer(`Salah! ${tok.label} bertipe ${tok.pyType}, bukan ${targetType}.`);
            }
          }
        }

        const remainingValid = s.mazeTokens.filter((t) => !t.collected && t.pyType === targetType).length;
        if (remainingValid === 0 && s.phase === 'playing') {
          if (s.round + 1 < MAZE_ROUNDS.length) {
            audioRef.current?.play('win');
            setupRound(s.round + 1);
            s.feedbackText = `Ronde ${s.round} tuntas! Lanjut tipe data berikutnya.`;
            syncHud();
          } else {
            s.phase = 'victory';
            audioRef.current?.play('win');
            syncHud();
          }
        }
      }

      /* ---------- VARIANT 2: BRANCH RUNNER ---------- */
      if (variant === 'branch_runner') {
        const speed = 235;
        const mag = Math.hypot(ix, iy) || 1;
        if (ix !== 0 || iy !== 0) {
          s.facingX = ix / mag;
          s.facingY = iy / mag;
          const prevX = s.px;
          const prevY = s.py;
          s.px = clamp(s.px + (ix / mag) * speed * dt, 24, CANVAS_W - 24);
          s.py = clamp(s.py + (iy / mag) * speed * dt, 34, CANVAS_H - 34);
          s.walkDist += Math.hypot(s.px - prevX, s.py - prevY);
        }

        // Patrol hazard blobs vertically inside middle zone
        const tSec = performance.now() / 1000;
        s.hazardBlobs.forEach((b, idx) => {
          b.y = clamp(b.y + Math.sin(tSec * (2.1 + idx * 0.5) + idx * 2) * 85 * dt, 44, CANVAS_H - 44);
          if (circleDistance(s.px, s.py, b.x, b.y) < b.r + 16) {
            damagePlayer('Menabrak blok bug! Hindari rintangan saat menuju gerbang.');
            s.px = Math.max(70, s.px - 60);
          }
        });

        // Check gate entry on right edge
        if (s.px >= s.gateX - 18) {
          const laneHeight = CANVAS_H / 3;
          const enteredLane = clamp(Math.floor(s.py / laneHeight), 0, 2);
          const cfg = BRANCH_ROUNDS[s.round];
          if (enteredLane === cfg.correctLane) {
            s.score += 1;
            audioRef.current?.play('pickup');
            emitParticles(s.particles, s.px, s.py, '#10B981', 14, 160);
            if (s.round + 1 < BRANCH_ROUNDS.length) {
              setupRound(s.round + 1);
              s.feedbackText = `Benar! ${cfg.varLabel} masuk ke "${cfg.gates[cfg.correctLane]}".`;
            } else {
              s.phase = 'victory';
              audioRef.current?.play('win');
            }
            syncHud();
          } else {
            damagePlayer(`Keliru! Untuk ${cfg.varLabel}, cabang tepat adalah "${cfg.gates[cfg.correctLane]}".`);
            s.px = 95;
          }
        }
      }

      /* ---------- VARIANT 3: LOOP PLATFORMER (CHAR + 3 ACTION BUTTONS) ---------- */
      if (variant === 'loop_platformer') {
        s.dashTimer = Math.max(0, s.dashTimer - dt);
        s.dashCd = Math.max(0, s.dashCd - dt);
        s.magnetTimer = Math.max(0, s.magnetTimer - dt);
        s.magnetCd = Math.max(0, s.magnetCd - dt);

        const jumpPressed = s.justPressed.has('action1');
        const jumpHeld =
          s.keys.has('Space') || s.keys.has('ArrowUp') || s.keys.has('KeyW');

        if (s.justPressed.has('action2') && s.dashCd <= 0) {
          s.dashTimer = 0.22;
          s.dashCd = 1.4;
          s.scaleX = 1.28;
          s.scaleY = 0.78;
          audioRef.current?.play('shoot');
          emitParticles(s.particles, s.body.x + 16, s.body.y + 18, '#38BDF8', 8, 120);
          s.feedbackText = 'Dash aktif!';
        }

        if (s.justPressed.has('action3') && s.magnetCd <= 0) {
          s.magnetTimer = 1.6;
          s.magnetCd = 3.0;
          audioRef.current?.play('pulse');
          emitParticles(s.particles, s.body.x + 16, s.body.y + 18, '#F59E0B', 12, 130);
          s.feedbackText = 'Medan Saring (Filter) aktif — menarik elemen valid terdekat!';
        }

        if (ix !== 0) s.facingX = ix;
        const moveInput = s.dashTimer > 0 ? s.facingX : ix;

        const stepped = stepPlatformerBody(
          s.body,
          { moveX: moveInput, jumpPressed, jumpHeld, dashActive: s.dashTimer > 0 },
          PLATFORMER_PLATFORMS,
          dt,
          CANVAS_W,
          372
        );
        s.body = stepped.body;
        s.walkDist += Math.abs(s.body.vx * dt);
        if (stepped.jumped) {
          s.scaleX = 0.84;
          s.scaleY = 1.2;
          audioRef.current?.play('jump');
          emitParticles(s.particles, s.body.x + 16, s.body.y + s.body.h, '#94A3B8', 5, 80);
        }
        if (stepped.landed) {
          s.scaleX = 1.22;
          s.scaleY = 0.78;
        }

        const pcx = s.body.x + s.body.w / 2;
        const pcy = s.body.y + s.body.h / 2;

        // Hazard spikes
        const playerRect: Rect = { x: s.body.x + 4, y: s.body.y + 4, w: s.body.w - 8, h: s.body.h - 4 };
        for (const sp of s.platSpikes) {
          if (rectsOverlap(playerRect, sp)) {
            damagePlayer('Terkena jebakan InfiniteLoop! Gunakan tombol Lompat [Space].');
            s.body.vy = -340;
          }
        }

        // Collectibles + Magnet pull for valid tokens
        for (const it of s.platItems) {
          if (it.collected) continue;
          const d = circleDistance(pcx, pcy, it.x, it.y);
          if (s.magnetTimer > 0 && it.valid && d < 190 && d > 1) {
            it.x += ((pcx - it.x) / d) * 260 * dt;
            it.y += ((pcy - it.y) / d) * 260 * dt;
          }
          if (d < 30) {
            it.collected = true;
            if (it.valid) {
              s.score += 1;
              audioRef.current?.play('pickup');
              emitParticles(s.particles, it.x, it.y, '#10B981', 10, 130);
              s.feedbackText = `Tersaring! Elemen ${it.label} memenuhi kondisi.`;
              syncHud();
            } else {
              damagePlayer(`Elemen ${it.label} tidak memenuhi kondisi filter!`);
            }
          }
        }

        const rem = s.platItems.filter((it) => !it.collected && it.valid).length;
        if (rem === 0 && s.phase === 'playing') {
          if (s.round + 1 < PLATFORMER_ROUNDS.length) {
            audioRef.current?.play('win');
            setupRound(s.round + 1);
            s.feedbackText = 'Tahap 1 selesai! Lanjut ke syarat filter berikutnya.';
            syncHud();
          } else {
            s.phase = 'victory';
            audioRef.current?.play('win');
            syncHud();
          }
        }
      }

      /* ---------- VARIANT 4: BUG DEFENDER (CHAR + 3 ACTION BUTTONS) ---------- */
      if (variant === 'bug_defender') {
        s.shootCd = Math.max(0, s.shootCd - dt);
        s.shieldTimer = Math.max(0, s.shieldTimer - dt);
        s.shieldCd = Math.max(0, s.shieldCd - dt);
        s.pulseTimer = Math.max(0, s.pulseTimer - dt);
        s.pulseCd = Math.max(0, s.pulseCd - dt);

        const speed = 220;
        const mag = Math.hypot(ix, iy) || 1;
        if (ix !== 0 || iy !== 0) {
          s.facingX = ix / mag;
          s.facingY = iy / mag;
          const prevX = s.px;
          const prevY = s.py;
          s.px = clamp(s.px + (ix / mag) * speed * dt, 24, CANVAS_W - 24);
          s.py = clamp(s.py + (iy / mag) * speed * dt, 24, CANVAS_H - 24);
          s.walkDist += Math.hypot(s.px - prevX, s.py - prevY);
        }

        // Action 1: Tembak Patch (Space)
        if (s.justPressed.has('action1') && s.shootCd <= 0) {
          s.shootCd = 0.24;
          const fMag = Math.hypot(s.facingX, s.facingY) || 1;
          s.projectiles.push({
            x: s.px + (s.facingX / fMag) * 20,
            y: s.py + (s.facingY / fMag) * 20,
            vx: (s.facingX / fMag) * 440,
            vy: (s.facingY / fMag) * 440,
            life: 1.2,
          });
          s.scaleX = 0.88;
          s.scaleY = 1.14;
          audioRef.current?.play('shoot');
          emitParticles(s.particles, s.px, s.py, '#60A5FA', 4, 90);
        }

        // Action 2: Perisai finally (Q)
        if (s.justPressed.has('action2') && s.shieldCd <= 0) {
          s.shieldTimer = 2.0;
          s.shieldCd = 4.0;
          audioRef.current?.play('shield');
          s.feedbackText = 'Perisai finally aktif (2 detik) — kebal tabrakan bug!';
          emitParticles(s.particles, s.px, s.py, '#34D399', 10, 110);
        }

        // Action 3: Debug Pulse (E)
        if (s.justPressed.has('action3') && s.pulseCd <= 0) {
          s.pulseTimer = 0.38;
          s.pulseCd = 5.0;
          s.shakeTrauma = 0.45;
          audioRef.current?.play('pulse');
          emitParticles(s.particles, s.px, s.py, '#F59E0B', 20, 210);
          let hitCount = 0;
          s.enemies = s.enemies.map((en) => {
            if (en.koTimer > 0) return en;
            if (circleDistance(s.px, s.py, en.x, en.y) <= 185) {
              hitCount++;
              const nextHp = en.hp - 2;
              if (nextHp <= 0) {
                s.score += 1;
                return { ...en, hp: 0, koTimer: 0.35, hitFlash: 0.15, vx: (en.x - s.px) * 1.4, vy: (en.y - s.py) * 1.4 };
              }
              return { ...en, hp: nextHp, hitFlash: 0.12 };
            }
            return en;
          });
          s.feedbackText = hitCount > 0 ? `Debug Pulse menumpas ${hitCount} bug di sekitar!` : 'Debug Pulse dilepaskan!';
          syncHud();
        }

        // Update projectiles
        for (const p of s.projectiles) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
        }
        s.projectiles = s.projectiles.filter(
          (p) => p.life > 0 && p.x > 0 && p.x < CANVAS_W && p.y > 0 && p.y < CANVAS_H
        );

        // Update enemies & collisions
        const nextEnemies: BugEnemy[] = [];
        for (const rawEnemy of s.enemies) {
          let en = stepEnemyPolicy(rawEnemy, { x: s.px, y: s.py }, dt, { width: CANVAS_W, height: CANVAS_H });
          if (en.hp <= 0 && en.koTimer <= 0) continue; // Finished KO dissolve

          if (en.hp > 0) {
            // Projectile hit
            for (const p of s.projectiles) {
              if (p.life > 0 && circleDistance(p.x, p.y, en.x, en.y) < en.radius + 8) {
                p.life = 0;
                en.hp -= 1;
                en.hitFlash = 0.09;
                s.hitstopTimer = 0.035;
                emitParticles(s.particles, en.x, en.y, '#60A5FA', 8, 150);
                if (en.hp <= 0) {
                  en.koTimer = 0.32;
                  en.vx = p.vx * 0.25;
                  en.vy = p.vy * 0.25;
                  s.score += 1;
                  s.shakeTrauma = 0.35;
                  audioRef.current?.play('pickup');
                  emitParticles(s.particles, en.x, en.y, '#F59E0B', 14, 180);
                  s.feedbackText = `Bug ${en.label} berhasil ditangani!`;
                  syncHud();
                } else {
                  audioRef.current?.play('jump');
                }
              }
            }

            // Player collision
            if (en.hp > 0 && circleDistance(s.px, s.py, en.x, en.y) < en.radius + 16) {
              if (s.shieldTimer > 0) {
                // Shield bounces enemy back!
                const dx = en.x - s.px || 1;
                const dy = en.y - s.py || 1;
                const d = Math.hypot(dx, dy) || 1;
                en.x = clamp(en.x + (dx / d) * 48, 28, CANVAS_W - 28);
                en.y = clamp(en.y + (dy / d) * 48, 28, CANVAS_H - 28);
                emitParticles(s.particles, en.x, en.y, '#34D399', 8, 120);
              } else {
                damagePlayer(`Terserang ${en.label}! Gunakan Perisai [Q] atau Tembak Patch [Space].`);
              }
            }
          }
          nextEnemies.push(en);
        }
        s.enemies = nextEnemies;

        if (s.enemies.length === 0 && s.phase === 'playing') {
          if (s.round + 1 < 3) {
            audioRef.current?.play('win');
            setupRound(s.round + 1);
            s.feedbackText = `Gelombang ${s.round} bersih! Gelombang baru mendekat.`;
            syncHud();
          } else {
            s.phase = 'victory';
            audioRef.current?.play('win');
            syncHud();
          }
        }
      }

      s.justPressed.clear();
    };

    const drawPyBot = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      facingX: number,
      facingY: number,
      walkDist: number,
      scaleX: number,
      scaleY: number,
      blink: boolean,
      tagText?: string,
      shieldActive?: boolean
    ) => {
      ctx.save();
      const bob = Math.sin(walkDist * 0.16) * 2.5;
      ctx.translate(cx, cy + bob);
      ctx.scale(scaleX, scaleY);

      // Ground shadow
      ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 17 - bob * 0.5, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shield ring
      if (shieldActive) {
        ctx.strokeStyle = '#34D399';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      if (blink) ctx.globalAlpha = 0.55;

      // Feet
      const legOffset = Math.sin(walkDist * 0.2) * 3;
      ctx.fillStyle = '#1E40AF';
      ctx.fillRect(-9, 10 + legOffset, 6, 6);
      ctx.fillRect(3, 10 - legOffset, 6, 6);

      // Antenna
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(0, -21);
      ctx.stroke();
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(0, -22, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Robot body (Cobalt Blue Python Bot)
      ctx.fillStyle = '#2563EB';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-14, -14, 28, 26, 8);
      ctx.fill();
      ctx.stroke();

      // Visor screen
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.roundRect(-10, -9, 20, 12, 4);
      ctx.fill();

      // Expressive Eyes pointing toward facing direction
      const ex = clamp(facingX * 2.5, -2.5, 2.5);
      const ey = clamp(facingY * 1.5, -1.5, 1.5);
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(-4 + ex, -3 + ey, 2.4, 0, Math.PI * 2);
      ctx.arc(4 + ex, -3 + ey, 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Chest accent
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(-6, 6, 12, 3);

      // Floating variable tag above head (e.g. Branch Runner)
      if (tagText) {
        ctx.globalAlpha = 1;
        ctx.font = '600 12px "IBM Plex Mono", monospace';
        const tw = ctx.measureText(tagText).width + 14;
        ctx.fillStyle = '#F8FAFC';
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-tw / 2, -45, tw, 20, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0F172A';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, 0, -35);
      }

      ctx.restore();
    };

    const renderFrame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const s = simRef.current;
      ctx.save();

      // Trauma screen shake
      if (s.shakeTrauma > 0) {
        const amt = s.shakeTrauma * s.shakeTrauma * 9;
        ctx.translate((Math.random() - 0.5) * amt, (Math.random() - 0.5) * amt);
      }

      // Arena Backdrop
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Subtle architectural grid
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
      ctx.lineWidth = 1;
      for (let gx = 40; gx < CANVAS_W; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, CANVAS_H);
        ctx.stroke();
      }
      for (let gy = 40; gy < CANVAS_H; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(CANVAS_W, gy);
        ctx.stroke();
      }

      /* ---------- RENDER VARIANT 1: MAZE TYPES ---------- */
      if (variant === 'maze_types') {
        for (const w of MAZE_WALLS) {
          ctx.fillStyle = '#1E293B';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(w.x, w.y, w.w, w.h, 8);
          ctx.fill();
          ctx.stroke();
        }

        const tSec = performance.now() / 1000;
        for (const tok of s.mazeTokens) {
          if (tok.collected) continue;
          const floatY = Math.sin(tSec * 3 + tok.x) * 3;
          ctx.fillStyle = '#F8FAFC';
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(tok.x - 32, tok.y - 16 + floatY, 64, 32, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#0F172A';
          ctx.font = '600 13px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tok.label, tok.x, tok.y + floatY);
        }

        drawPyBot(
          ctx,
          s.px,
          s.py,
          s.facingX,
          s.facingY,
          s.walkDist,
          s.scaleX,
          s.scaleY,
          s.invulnTimer > 0 && Math.floor(performance.now() / 80) % 2 === 0
        );
      }

      /* ---------- RENDER VARIANT 2: BRANCH RUNNER ---------- */
      if (variant === 'branch_runner') {
        const laneH = CANVAS_H / 3;
        const cfg = BRANCH_ROUNDS[s.round] ?? BRANCH_ROUNDS[0];

        // Lane dividers
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
        ctx.setLineDash([8, 8]);
        for (let l = 1; l < 3; l++) {
          ctx.beginPath();
          ctx.moveTo(0, l * laneH);
          ctx.lineTo(CANVAS_W, l * laneH);
          ctx.stroke();
        }
        ctx.setLineDash([]);

        // 3 Condition Gates on right side
        cfg.gates.forEach((label, idx) => {
          const gy = idx * laneH + 14;
          const gh = laneH - 28;
          ctx.fillStyle = '#1E293B';
          ctx.strokeStyle = '#3B82F6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(s.gateX - 42, gy, 118, gh, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#E2E8F0';
          ctx.font = '600 12px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, s.gateX + 17, gy + gh / 2);
        });

        // Moving bug hazards
        for (const b of s.hazardBlobs) {
          ctx.fillStyle = '#DC2626';
          ctx.strokeStyle = '#FCA5A5';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '700 10px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('BUG', b.x, b.y);
        }

        drawPyBot(
          ctx,
          s.px,
          s.py,
          s.facingX,
          s.facingY,
          s.walkDist,
          s.scaleX,
          s.scaleY,
          s.invulnTimer > 0 && Math.floor(performance.now() / 80) % 2 === 0,
          cfg.varLabel
        );
      }

      /* ---------- RENDER VARIANT 3: LOOP PLATFORMER ---------- */
      if (variant === 'loop_platformer') {
        // Floor
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(0, 372, CANVAS_W, CANVAS_H - 372);
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, 372, CANVAS_W, 4);

        // Platforms
        for (const p of PLATFORMER_PLATFORMS) {
          ctx.fillStyle = '#334155';
          ctx.strokeStyle = '#60A5FA';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(p.x, p.y, p.w, p.h, 6);
          ctx.fill();
          ctx.stroke();
        }

        // Spikes
        for (const sp of s.platSpikes) {
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.moveTo(sp.x, sp.y + sp.h);
          ctx.lineTo(sp.x + sp.w / 2, sp.y);
          ctx.lineTo(sp.x + sp.w, sp.y + sp.h);
          ctx.closePath();
          ctx.fill();
        }

        // Magnet aura
        if (s.magnetTimer > 0) {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(s.body.x + s.body.w / 2, s.body.y + s.body.h / 2, 110, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Token numbers
        for (const it of s.platItems) {
          if (it.collected) continue;
          ctx.fillStyle = '#F8FAFC';
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(it.x, it.y, 19, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#0F172A';
          ctx.font = '700 13px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(it.label, it.x, it.y);
        }

        drawPyBot(
          ctx,
          s.body.x + s.body.w / 2,
          s.body.y + s.body.h / 2,
          s.facingX,
          0,
          s.walkDist,
          s.scaleX,
          s.scaleY,
          s.invulnTimer > 0 && Math.floor(performance.now() / 80) % 2 === 0
        );
      }

      /* ---------- RENDER VARIANT 4: BUG DEFENDER ---------- */
      if (variant === 'bug_defender') {
        // Debug Pulse shockwave visual
        if (s.pulseTimer > 0) {
          const prog = 1 - s.pulseTimer / 0.38;
          ctx.strokeStyle = `rgba(245, 158, 11, ${1 - prog})`;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(s.px, s.py, 26 + prog * 165, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Aim direction indicator
        const fMag = Math.hypot(s.facingX, s.facingY) || 1;
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.px + (s.facingX / fMag) * 22, s.py + (s.facingY / fMag) * 22);
        ctx.lineTo(s.px + (s.facingX / fMag) * 44, s.py + (s.facingY / fMag) * 44);
        ctx.stroke();

        // Projectiles
        for (const p of s.projectiles) {
          ctx.fillStyle = '#38BDF8';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Enemies with distinct silhouettes & telegraph cues
        for (const en of s.enemies) {
          ctx.save();
          if (en.koTimer > 0) {
            ctx.globalAlpha = clamp(en.koTimer / 0.35, 0, 1);
          }

          // Charger attack telegraph line!
          if (en.archetype === 'charger' && en.chargePhase === 'telegraph') {
            ctx.strokeStyle = 'rgba(249, 115, 22, 0.85)';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(en.x, en.y);
            ctx.lineTo(en.x + en.chargeDirX * 140, en.y + en.chargeDirY * 140);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          const fill =
            en.hitFlash > 0
              ? '#FFFFFF'
              : en.archetype === 'chaser'
                ? '#DC2626'
                : en.archetype === 'charger'
                  ? '#EA580C'
                  : '#9333EA';

          ctx.fillStyle = fill;
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 2;

          if (en.archetype === 'charger') {
            // Diamond silhouette for Charger
            ctx.beginPath();
            ctx.moveTo(en.x, en.y - en.radius);
            ctx.lineTo(en.x + en.radius, en.y);
            ctx.lineTo(en.x, en.y + en.radius);
            ctx.lineTo(en.x - en.radius, en.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else if (en.archetype === 'orbiter') {
            // Hexagon silhouette for Orbiter
            ctx.beginPath();
            for (let k = 0; k < 6; k++) {
              const a = (Math.PI / 3) * k;
              const hx = en.x + Math.cos(a) * en.radius;
              const hy = en.y + Math.sin(a) * en.radius;
              if (k === 0) ctx.moveTo(hx, hy);
              else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else {
            // Circle silhouette for Chaser
            ctx.beginPath();
            ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          // Label below enemy with crisp outline for readability during overlap
          ctx.font = '600 10px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.strokeText(en.label, en.x, en.y + en.radius + 12);
          ctx.fillStyle = '#F8FAFC';
          ctx.fillText(en.label, en.x, en.y + en.radius + 12);
          ctx.restore();
        }

        drawPyBot(
          ctx,
          s.px,
          s.py,
          s.facingX,
          s.facingY,
          s.walkDist,
          s.scaleX,
          s.scaleY,
          s.invulnTimer > 0 && Math.floor(performance.now() / 80) % 2 === 0,
          undefined,
          s.shieldTimer > 0
        );
      }

      // Pooled particles
      for (let i = 0; i < s.particles.length; i++) {
        const pt: ArcadeParticle = s.particles[i];
        if (!pt.active) continue;
        ctx.globalAlpha = clamp(pt.life / pt.maxLife, 0, 1);
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    const tick = (now: number) => {
      const dt = clampDt((now - lastTs) / 1000);
      lastTs = now;
      stepSimulation(dt);
      renderFrame();

      hudTimer += dt;
      if (hudTimer >= 0.12 && simRef.current.phase === 'playing') {
        hudTimer = 0;
        syncHud();
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [setupRound, syncHud, variant]);

  const setDpadDir = (dir: 'up' | 'down' | 'left' | 'right', active: boolean) => {
    simRef.current.dpad[dir] = active;
  };

  const nudgeDir = (dir: 'up' | 'down' | 'left' | 'right') => {
    simRef.current.dpad[dir] = true;
    window.setTimeout(() => {
      simRef.current.dpad[dir] = false;
    }, 150);
  };

  return (
    <div
      data-testid="character-arcade-root"
      data-game-phase={hud.phase}
      data-player-x={hud.playerX}
      data-player-y={hud.playerY}
      data-score={hud.score}
      data-action-count={hud.actionCount}
      className="max-w-[760px] mx-auto space-y-2.5"
    >
      {/* World-Matched Top HUD Bar */}
      <div className="bg-slate-900 text-slate-100 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 border border-slate-800">
        <div className="flex flex-wrap items-center gap-5 tabular-nums">
          {/* Vitality HP Sockets */}
          <div className="flex items-center gap-1.5" aria-label={`Nyawa ${hud.hp} dari ${hud.maxHp}`}>
            <span className="text-[11px] font-semibold text-slate-400 mr-1">HP</span>
            {Array.from({ length: hud.maxHp }, (_, idx) => (
              <svg key={idx} viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path
                  d="M12 21s-7-4.6-9.2-8.8C1.2 9.1 3 5.5 6.5 5.5c2 0 3.4 1.1 4.3 2.4h2.4c.9-1.3 2.3-2.4 4.3-2.4 3.5 0 5.3 3.6 3.7 6.7C19 16.4 12 21 12 21z"
                  fill={idx < hud.hp ? '#EF4444' : 'none'}
                  stroke={idx < hud.hp ? '#FCA5A5' : '#475569'}
                  strokeWidth="2"
                />
              </svg>
            ))}
          </div>

          <div className="h-5 w-px bg-slate-700" aria-hidden="true" />

          <div>
            <span className="text-[11px] text-slate-400 mr-2">SKOR</span>
            <span className="text-lg font-bold font-mono text-white">
              {hud.score} / {hud.maxScore}
            </span>
          </div>

          <div className="h-5 w-px bg-slate-700" aria-hidden="true" />

          <div>
            <span className="text-[11px] text-slate-400 mr-2">BABAK</span>
            <span className="text-sm font-semibold font-mono text-amber-300">
              {hud.round}/{hud.maxRounds}
            </span>
          </div>
        </div>

        {/* Utility Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              setMuted((m) => {
                const next = !m;
                if (audioRef.current) audioRef.current.muted = next;
                return next;
              });
            }}
            aria-label={muted ? 'Nyalakan suara' : 'Bisukan suara'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              togglePause();
            }}
            disabled={hud.phase !== 'playing' && hud.phase !== 'paused'}
            aria-label={hud.phase === 'paused' ? 'Lanjutkan permainan' : 'Jeda permainan'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
          >
            {hud.phase === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              startGame();
            }}
            aria-label="Ulangi permainan"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Objective Readout */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-blue-950 font-mono">{hud.objectiveText}</span>
        {hud.feedbackText && <span className="text-slate-600">{hud.feedbackText}</span>}
      </div>

      {/* Canvas Viewport Stage */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[760/420] w-full">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-full block"
        />

        {/* Title Overlay */}
        {hud.phase === 'title' && (
          <div className="absolute inset-0 bg-slate-950/82 flex flex-col items-center justify-center p-6 text-center text-white">
            <svg viewBox="0 0 64 64" className="w-14 h-14 mb-3" aria-hidden="true">
              <rect x="12" y="16" width="40" height="34" rx="10" fill="#2563EB" stroke="#93C5FD" strokeWidth="2.5" />
              <rect x="18" y="23" width="28" height="14" rx="4" fill="#0F172A" />
              <circle cx="26" cy="30" r="3.5" fill="#38BDF8" />
              <circle cx="38" cy="30" r="3.5" fill="#38BDF8" />
              <line x1="32" y1="16" x2="32" y2="8" stroke="#F59E0B" strokeWidth="3" />
              <circle cx="32" cy="7" r="4" fill="#FBBF24" />
            </svg>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-md">{hud.objectiveText}</p>
            <button
              type="button"
              data-start="true"
              onClick={startGame}
              className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              Mulai Bermain
            </button>
            <p className="text-[11px] text-slate-400 mt-5 font-mono">
              {variant === 'loop_platformer'
                ? 'A/D atau Panah: Gerak · Space: Lompat · Shift: Dash · E: Saring · P: Jeda'
                : variant === 'bug_defender'
                  ? 'WASD/Panah: Gerak · Space: Tembak Patch · Q: Perisai · E: Debug Pulse · P: Jeda'
                  : 'WASD / Tombol Panah / D-Pad Layar: Gerakkan Karakter · P: Jeda'}
            </p>
          </div>
        )}

        {/* Pause Modal */}
        {hud.phase === 'paused' && (
          <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center p-6">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 text-center text-white space-y-4 max-w-xs w-full">
              <h3 className="text-lg font-bold">Permainan Dijeda</h3>
              <p className="text-xs text-slate-300 tabular-nums">
                Skor sementara: {hud.score}/{hud.maxScore} · HP: {hud.hp}/{hud.maxHp}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={togglePause}
                  className="w-full py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 rounded-lg"
                >
                  Lanjutkan
                </button>
                <button
                  type="button"
                  onClick={startGame}
                  className="w-full py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg"
                >
                  Ulangi Dari Awal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Victory / Game Over Modal */}
        {(hud.phase === 'victory' || hud.phase === 'gameover') && (
          <div className="absolute inset-0 bg-slate-950/85 flex items-center justify-center p-6">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 text-center text-white space-y-5 max-w-sm w-full">
              <div className="space-y-1">
                <p
                  className={`text-xs font-bold ${
                    hud.phase === 'victory' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {hud.phase === 'victory' ? 'MISI BERHASIL' : 'NYAWA HABIS'}
                </p>
                <h3 className="text-xl font-bold">
                  {hud.phase === 'victory' ? 'Arena Tuntas!' : 'Coba Lagi!'}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950/70 rounded-xl p-3.5 tabular-nums">
                <div>
                  <p className="text-[11px] text-slate-400">Skor Tercapai</p>
                  <p className="text-lg font-bold font-mono">
                    {hud.score} / {hud.maxScore}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Sisa HP</p>
                  <p className="text-lg font-bold font-mono">
                    {hud.hp} / {hud.maxHp}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  data-start="true"
                  onClick={startGame}
                  className="px-4 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg whitespace-nowrap"
                >
                  Main Lagi
                </button>
                <button
                  type="button"
                  onClick={() => onFinishRef.current(hud.score, hud.maxScore)}
                  className="px-4 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 rounded-lg whitespace-nowrap"
                >
                  Simpan Skor &amp; Klaim XP
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unified On-Screen Movement & Action Controls Dock */}
      <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Movement Controls (D-Pad or Left/Right) */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-500 hidden md:inline">Gerak:</span>
          {variant === 'loop_platformer' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Gerak Kiri"
                onPointerDown={() => setDpadDir('left', true)}
                onPointerUp={() => setDpadDir('left', false)}
                onPointerLeave={() => setDpadDir('left', false)}
                onClick={() => nudgeDir('left')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-blue-600 active:text-white text-slate-800 text-xs font-semibold select-none"
              >
                <ArrowLeft className="w-4 h-4" />
                Kiri
              </button>
              <button
                type="button"
                aria-label="Gerak Kanan"
                onPointerDown={() => setDpadDir('right', true)}
                onPointerUp={() => setDpadDir('right', false)}
                onPointerLeave={() => setDpadDir('right', false)}
                onClick={() => nudgeDir('right')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-blue-600 active:text-white text-slate-800 text-xs font-semibold select-none"
              >
                Kanan
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Gerak Kiri"
                onPointerDown={() => setDpadDir('left', true)}
                onPointerUp={() => setDpadDir('left', false)}
                onPointerLeave={() => setDpadDir('left', false)}
                onClick={() => nudgeDir('left')}
                className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-blue-600 active:text-white text-slate-800 flex items-center justify-center select-none"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  aria-label="Gerak Atas"
                  onPointerDown={() => setDpadDir('up', true)}
                  onPointerUp={() => setDpadDir('up', false)}
                  onPointerLeave={() => setDpadDir('up', false)}
                  onClick={() => nudgeDir('up')}
                  className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-blue-600 active:text-white text-slate-800 flex items-center justify-center select-none"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Gerak Bawah"
                  onPointerDown={() => setDpadDir('down', true)}
                  onPointerUp={() => setDpadDir('down', false)}
                  onPointerLeave={() => setDpadDir('down', false)}
                  onClick={() => nudgeDir('down')}
                  className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-blue-600 active:text-white text-slate-800 flex items-center justify-center select-none"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                aria-label="Gerak Kanan"
                onPointerDown={() => setDpadDir('right', true)}
                onPointerUp={() => setDpadDir('right', false)}
                onPointerLeave={() => setDpadDir('right', false)}
                onClick={() => nudgeDir('right')}
                className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-blue-600 active:text-white text-slate-800 flex items-center justify-center select-none"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Dedicated Action Buttons for Character+Action Games */}
        {isActionVariant ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {variant === 'loop_platformer' ? (
              <>
                <button
                  type="button"
                  onClick={() => triggerAction('action1')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold whitespace-nowrap"
                >
                  <ArrowUp className="w-4 h-4" />
                  Lompat [Space]
                </button>
                <button
                  type="button"
                  onClick={() => triggerAction('action2')}
                  disabled={hud.cooldown2Pct < 100}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-600 text-white text-xs font-semibold whitespace-nowrap tabular-nums"
                >
                  <Zap className="w-4 h-4" />
                  Dash [Shift] {hud.cooldown2Pct < 100 ? `${hud.cooldown2Pct}%` : ''}
                </button>
                <button
                  type="button"
                  onClick={() => triggerAction('action3')}
                  disabled={hud.cooldown3Pct < 100}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-600 text-white text-xs font-semibold whitespace-nowrap tabular-nums"
                >
                  <Sparkles className="w-4 h-4" />
                  Saring [E] {hud.cooldown3Pct < 100 ? `${hud.cooldown3Pct}%` : ''}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => triggerAction('action1')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold whitespace-nowrap"
                >
                  <Crosshair className="w-4 h-4" />
                  Tembak Patch [Space]
                </button>
                <button
                  type="button"
                  onClick={() => triggerAction('action2')}
                  disabled={hud.cooldown2Pct < 100}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-600 text-white text-xs font-semibold whitespace-nowrap tabular-nums"
                >
                  <Shield className="w-4 h-4" />
                  Perisai [Q] {hud.cooldown2Pct < 100 ? `${hud.cooldown2Pct}%` : ''}
                </button>
                <button
                  type="button"
                  onClick={() => triggerAction('action3')}
                  disabled={hud.cooldown3Pct < 100}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-600 text-white text-xs font-semibold whitespace-nowrap tabular-nums"
                >
                  <Zap className="w-4 h-4" />
                  Debug Pulse [E] {hud.cooldown3Pct < 100 ? `${hud.cooldown3Pct}%` : ''}
                </button>
              </>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center sm:text-right">
            Gunakan tombol panah / <span className="font-mono text-slate-700">WASD</span> di keyboard atau D-Pad layar untuk menggerakkan PyBot.
          </p>
        )}
      </div>
    </div>
  );
}
