import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  Crosshair,
  Pause,
  Play,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  canCollectWaypoint,
  CHARACTER_ARCADE_CONFIGS,
  evaluateBinarySearchStep,
  isArraySorted,
  swapAdjacentIfNeeded,
  type CharacterTheme,
} from '../data/characterArcadeConfigs';
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

class SynthAudio {
  ctx: AudioContext | null = null;
  muted = false;

  play(kind: 'pickup' | 'hurt' | 'jump' | 'shoot' | 'shield' | 'pulse' | 'win') {
    if (this.muted || typeof window === 'undefined') return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
      // Ignore AudioContext restriction
    }
  }
}

function getBinaryBoxRect(index: number): Rect {
  const boxW = 74;
  const boxH = 66;
  const gap = 12;
  const totalW = 8 * boxW + 7 * gap;
  const startX = (CANVAS_W - totalW) / 2;
  return { x: startX + index * (boxW + gap), y: 158, w: boxW, h: boxH };
}

function getSortBarCenterX(index: number): number {
  const gap = 118;
  const startX = (CANVAS_W - 4 * gap) / 2;
  return startX + index * gap;
}

function countSortInversions(arr: number[], order: 'asc' | 'desc'): number {
  let inv = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (order === 'asc' ? arr[i] > arr[j] : arr[i] < arr[j]) inv++;
    }
  }
  return inv;
}

function countBinarySteps(arr: number[], target: number): number {
  let low = 0;
  let high = arr.length - 1;
  let steps = 0;
  while (low <= high && steps < 10) {
    steps++;
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) break;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return steps;
}

export function CharacterArcadeGame({ variant, title, onFinish }: CharacterArcadeGameProps) {
  const cfg = CHARACTER_ARCADE_CONFIGS[variant];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<SynthAudio | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const isHorizontalOnly =
    cfg.mechanic === 'platformer_action' || cfg.mechanic === 'character_sort_swap';

  const getInitialMaxScore = () => {
    if (cfg.mechanic === 'maze_collect') {
      return (cfg.mazeRounds ?? []).reduce(
        (sum, r) => sum + r.tokens.filter((t) => t.pyType === r.targetType).length,
        0
      );
    }
    if (cfg.mechanic === 'ordered_waypoint') {
      return (cfg.waypointRounds ?? []).reduce((sum, r) => sum + r.steps.length, 0);
    }
    if (cfg.mechanic === 'lane_runner') return (cfg.laneRounds ?? []).length;
    if (cfg.mechanic === 'courier_deliver') {
      return (cfg.courierRounds ?? []).reduce((sum, r) => sum + r.pairs.length, 0);
    }
    if (cfg.mechanic === 'binary_search_arena') {
      return (cfg.binaryRounds ?? []).reduce((sum, r) => sum + countBinarySteps(r.array, r.target), 0);
    }
    if (cfg.mechanic === 'platformer_action') {
      return (cfg.platformerRounds ?? []).reduce(
        (sum, r) => sum + r.items.filter((i) => i.valid).length,
        0
      );
    }
    if (cfg.mechanic === 'arena_shooter') {
      return (cfg.shooterWaves ?? []).reduce((sum, w) => sum + w.enemies.length, 0);
    }
    if (cfg.mechanic === 'character_sort_swap') {
      return (cfg.sortRounds ?? []).reduce(
        (sum, r) => sum + Math.max(1, countSortInversions(r.array, r.order)),
        0
      );
    }
    return 10;
  };

  const getMaxRounds = () => {
    if (cfg.mechanic === 'maze_collect') return (cfg.mazeRounds ?? []).length;
    if (cfg.mechanic === 'ordered_waypoint') return (cfg.waypointRounds ?? []).length;
    if (cfg.mechanic === 'lane_runner') return (cfg.laneRounds ?? []).length;
    if (cfg.mechanic === 'courier_deliver') return (cfg.courierRounds ?? []).length;
    if (cfg.mechanic === 'binary_search_arena') return (cfg.binaryRounds ?? []).length;
    if (cfg.mechanic === 'platformer_action') return (cfg.platformerRounds ?? []).length;
    if (cfg.mechanic === 'arena_shooter') return (cfg.shooterWaves ?? []).length;
    if (cfg.mechanic === 'character_sort_swap') return (cfg.sortRounds ?? []).length;
    return 3;
  };

  const getFirstObjective = () => {
    if (cfg.mechanic === 'maze_collect') return cfg.mazeRounds?.[0]?.prompt ?? '';
    if (cfg.mechanic === 'ordered_waypoint') return cfg.waypointRounds?.[0]?.prompt ?? '';
    if (cfg.mechanic === 'lane_runner') return cfg.laneRounds?.[0]?.prompt ?? '';
    if (cfg.mechanic === 'courier_deliver') return cfg.courierRounds?.[0]?.prompt ?? '';
    if (cfg.mechanic === 'binary_search_arena') return cfg.binaryRounds?.[0]?.prompt ?? '';
    if (cfg.mechanic === 'platformer_action') return cfg.platformerRounds?.[0]?.prompt ?? '';
    if (cfg.mechanic === 'arena_shooter') return cfg.shooterWaves?.[0]?.prompt ?? '';
    if (cfg.mechanic === 'character_sort_swap') return cfg.sortRounds?.[0]?.prompt ?? '';
    return '';
  };

  const [muted, setMuted] = useState(false);
  const [hud, setHud] = useState<HudSnapshot>({
    phase: 'title',
    score: 0,
    maxScore: getInitialMaxScore(),
    hp: 3,
    maxHp: 3,
    round: 1,
    maxRounds: getMaxRounds(),
    objectiveText: getFirstObjective(),
    feedbackText: '',
    cooldown1Pct: 100,
    cooldown2Pct: 100,
    cooldown3Pct: 100,
    playerX: 0,
    playerY: 0,
    actionCount: 0,
  });

  const simRef = useRef({
    phase: 'title' as GamePhase,
    score: 0,
    maxScore: getInitialMaxScore(),
    hp: 3,
    maxHp: 3,
    round: 0,
    maxRounds: getMaxRounds(),
    objectiveText: '',
    feedbackText: '',
    actionCount: 0,

    // Movement & animation
    px: 86,
    py: 210,
    facingX: 1,
    facingY: 0,
    walkDist: 0,
    scaleX: 1,
    scaleY: 1,
    invulnTimer: 0,
    hitstopTimer: 0,
    shakeTrauma: 0,

    // Input state
    keys: new Set<string>(),
    dpad: { up: false, down: false, left: false, right: false },
    justPressed: new Set<string>(),

    // Pooled particles
    particles: createParticlePool(120) as ArcadeParticle[],

    // Maze Collect
    mazeTokens: [] as { label: string; pyType: string; x: number; y: number; collected: boolean }[],

    // Ordered Waypoint
    waypoints: [] as { stepOrder: number; label: string; x: number; y: number; collected: boolean }[],
    nextStepOrder: 1,
    wrongBounceCd: 0,

    // Lane Runner
    patrols: [] as { x: number; y: number; vy: number; minY: number; maxY: number }[],

    // Courier Deliver
    courierKeys: [] as { id: number; keyLabel: string; vaultLabel: string; x: number; y: number; delivered: boolean }[],
    courierVaults: [] as { label: string; x: number; y: number; isDecoy: boolean; delivered: boolean }[],
    carryingKeyId: null as number | null,

    // Binary Search Arena
    binaryArray: [] as number[],
    binaryTarget: 0,
    binaryLow: 0,
    binaryHigh: 7,
    binaryStepCd: 0,

    // Platformer
    body: {
      x: 56,
      y: 336,
      w: 28,
      h: 32,
      vx: 0,
      vy: 0,
      onGround: true,
      coyoteTimer: 0.11,
      jumpBufferTimer: 0,
    } as PlatformerBody,
    dashTimer: 0,
    dashCooldown: 0,
    platItems: [] as { label: string; valid: boolean; x: number; y: number; collected: boolean }[],
    magnetTimer: 0,
    magnetCd: 0,

    // Arena Shooter
    enemies: [] as BugEnemy[],
    projectiles: [] as { x: number; y: number; vx: number; vy: number; life: number }[],
    shootCd: 0,
    shieldTimer: 0,
    shieldCd: 0,
    pulseTimer: 0,
    pulseCd: 0,

    // Character Sort Swap
    sortArray: [] as number[],
    sortOrder: 'asc' as 'asc' | 'desc',
    sortActivePair: 0,
    sortHintPair: -1,
    sortHintTimer: 0,
    sortHintCd: 0,
    sortTurboTimer: 0,
    sortTurboCd: 0,
    sortSwapFlashIdx: -1,
    sortSwapFlashTimer: 0,
  });

  const syncHud = useCallback(() => {
    const s = simRef.current;
    let cd2 = 100;
    let cd3 = 100;
    if (cfg.mechanic === 'platformer_action') {
      cd2 = Math.round((1 - clamp(s.dashCooldown / 1.4, 0, 1)) * 100);
      cd3 = Math.round((1 - clamp(s.magnetCd / 3.5, 0, 1)) * 100);
    } else if (cfg.mechanic === 'arena_shooter') {
      cd2 = Math.round((1 - clamp(s.shieldCd / 4.0, 0, 1)) * 100);
      cd3 = Math.round((1 - clamp(s.pulseCd / 5.0, 0, 1)) * 100);
    } else if (cfg.mechanic === 'character_sort_swap') {
      cd2 = Math.round((1 - clamp(s.sortHintCd / 4.0, 0, 1)) * 100);
      cd3 = Math.round((1 - clamp(s.sortTurboCd / 1.8, 0, 1)) * 100);
    }
    const px = cfg.mechanic === 'platformer_action' ? Math.round(s.body.x) : Math.round(s.px);
    const py = cfg.mechanic === 'platformer_action' ? Math.round(s.body.y) : Math.round(s.py);

    document.body.dataset.state = s.phase;
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
      cooldown1Pct: 100,
      cooldown2Pct: cd2,
      cooldown3Pct: cd3,
      playerX: px,
      playerY: py,
      actionCount: s.actionCount,
    });
  }, [cfg.mechanic]);

  const setupRound = useCallback(
    (roundIdx: number) => {
      const s = simRef.current;
      s.round = roundIdx;
      s.invulnTimer = 0.6;
      s.wrongBounceCd = 0;

      if (cfg.mechanic === 'maze_collect') {
        const rd = (cfg.mazeRounds ?? [])[roundIdx];
        if (!rd) return;
        s.px = 86;
        s.py = 210;
        s.objectiveText = rd.prompt;
        s.mazeTokens = rd.tokens.map((t) => ({ ...t, collected: false }));
      } else if (cfg.mechanic === 'ordered_waypoint') {
        const rd = (cfg.waypointRounds ?? [])[roundIdx];
        if (!rd) return;
        s.px = 88;
        s.py = 215;
        s.nextStepOrder = 1;
        s.objectiveText = rd.prompt;
        s.waypoints = rd.steps.map((st) => ({ ...st, collected: false }));
      } else if (cfg.mechanic === 'lane_runner') {
        const rd = (cfg.laneRounds ?? [])[roundIdx];
        if (!rd) return;
        s.px = 78;
        s.py = 210;
        s.objectiveText = `${rd.varLabel} — ${rd.prompt}`;
        s.patrols = [
          { x: 280, y: 95, vy: 112 + roundIdx * 14, minY: 44, maxY: 376 },
          { x: 430, y: 315, vy: -(124 + roundIdx * 14), minY: 44, maxY: 376 },
        ];
      } else if (cfg.mechanic === 'courier_deliver') {
        const rd = (cfg.courierRounds ?? [])[roundIdx];
        if (!rd) return;
        s.px = 235;
        s.py = 210;
        s.carryingKeyId = null;
        s.objectiveText = rd.prompt;
        s.courierKeys = rd.pairs.map((p, idx) => ({
          id: idx,
          keyLabel: p.keyLabel,
          vaultLabel: p.vaultLabel,
          x: p.keyX,
          y: p.keyY,
          delivered: false,
        }));
        s.courierVaults = [
          ...rd.pairs.map((p) => ({
            label: p.vaultLabel,
            x: p.vaultX,
            y: p.vaultY,
            isDecoy: false,
            delivered: false,
          })),
          ...rd.decoyVaults.map((d) => ({
            label: d.label,
            x: d.x,
            y: d.y,
            isDecoy: true,
            delivered: false,
          })),
        ];
      } else if (cfg.mechanic === 'binary_search_arena') {
        const rd = (cfg.binaryRounds ?? [])[roundIdx];
        if (!rd) return;
        s.px = 380;
        s.py = 330;
        s.binaryArray = [...rd.array];
        s.binaryTarget = rd.target;
        s.binaryLow = 0;
        s.binaryHigh = rd.array.length - 1;
        s.binaryStepCd = 0.2;
        s.objectiveText = rd.prompt;
      } else if (cfg.mechanic === 'platformer_action') {
        const rd = (cfg.platformerRounds ?? [])[roundIdx];
        if (!rd) return;
        s.body = {
          x: 56,
          y: 336,
          w: 28,
          h: 32,
          vx: 0,
          vy: 0,
          onGround: true,
          coyoteTimer: 0.11,
          jumpBufferTimer: 0,
        };
        s.dashTimer = 0;
        s.dashCooldown = 0;
        s.magnetTimer = 0;
        s.magnetCd = 0;
        s.objectiveText = rd.prompt;
        s.platItems = rd.items.map((it) => ({ ...it, collected: false }));
      } else if (cfg.mechanic === 'arena_shooter') {
        const wave = (cfg.shooterWaves ?? [])[roundIdx];
        if (!wave) return;
        s.px = 380;
        s.py = 210;
        s.projectiles = [];
        s.objectiveText = wave.prompt;
        s.enemies = wave.enemies.map((e, idx) => ({
          id: roundIdx * 10 + idx + 1,
          archetype: e.archetype,
          label: e.label,
          x: e.x,
          y: e.y,
          vx: 0,
          vy: 0,
          radius: e.radius,
          hp: e.hp,
          maxHp: e.hp,
          stateTimer: 1.1 + idx * 0.35,
          chargePhase: 'idle',
          chargeDirX: 0,
          chargeDirY: 0,
          orbitAngle: idx * 1.8,
          hitFlash: 0,
          koTimer: 0,
        }));
      } else if (cfg.mechanic === 'character_sort_swap') {
        const rd = (cfg.sortRounds ?? [])[roundIdx];
        if (!rd) return;
        s.px = getSortBarCenterX(0) + 59;
        s.py = 335;
        s.sortArray = [...rd.array];
        s.sortOrder = rd.order;
        s.sortActivePair = 0;
        s.sortHintPair = -1;
        s.sortHintTimer = 0;
        s.sortHintCd = 0;
        s.sortTurboTimer = 0;
        s.sortTurboCd = 0;
        s.sortSwapFlashIdx = -1;
        s.sortSwapFlashTimer = 0;
        s.objectiveText = rd.prompt;
      }
    },
    [cfg]
  );

  const startGame = useCallback(() => {
    const s = simRef.current;
    s.phase = 'playing';
    s.score = 0;
    s.maxScore = getInitialMaxScore();
    s.maxRounds = getMaxRounds();
    s.hp = 3;
    s.maxHp = 3;
    s.actionCount = 0;
    s.feedbackText = 'Permainan dimulai!';
    s.shootCd = 0;
    s.shieldTimer = 0;
    s.shieldCd = 0;
    s.pulseTimer = 0;
    s.pulseCd = 0;
    s.particles = createParticlePool(120);
    setupRound(0);
    syncHud();
    audioRef.current?.play('pickup');
  }, [setupRound, syncHud]);

  const togglePause = useCallback(() => {
    const s = simRef.current;
    if (s.phase === 'playing') {
      s.phase = 'paused';
      syncHud();
    } else if (s.phase === 'paused') {
      s.phase = 'playing';
      syncHud();
    }
  }, [syncHud]);

  const triggerAction = useCallback(
    (actionKey: 'action1' | 'action2' | 'action3') => {
      const s = simRef.current;
      if (s.phase !== 'playing') return;
      s.justPressed.add(actionKey);
      s.actionCount += 1;
      syncHud();
    },
    [syncHud]
  );

  const setDpadDir = useCallback((dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => {
    simRef.current.dpad[dir] = pressed;
  }, []);

  const nudgeDir = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      const s = simRef.current;
      if (s.phase !== 'playing') return;
      s.dpad[dir] = true;
      window.setTimeout(() => {
        simRef.current.dpad[dir] = false;
        syncHud();
      }, 150);
    },
    [syncHud]
  );

  useEffect(() => {
    audioRef.current = new SynthAudio();
    const s = simRef.current;
    s.phase = 'title';
    s.maxScore = getInitialMaxScore();
    s.maxRounds = getMaxRounds();
    setupRound(0);

    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        startGame();
      } else {
        syncHud();
      }
    } catch {
      syncHud();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      const sim = simRef.current;
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (sim.phase === 'playing' || sim.phase === 'paused') {
          togglePause();
        }
        return;
      }

      if (sim.phase === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        startGame();
        return;
      }
      if (sim.phase !== 'playing') return;

      if (!sim.keys.has(e.code)) {
        if (e.code === 'Space') {
          sim.justPressed.add('action1');
          sim.actionCount += 1;
        }
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyQ') {
          sim.justPressed.add('action2');
          sim.actionCount += 1;
        }
        if (e.code === 'KeyE') {
          sim.justPressed.add('action3');
          sim.actionCount += 1;
        }
      }
      sim.keys.add(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      simRef.current.keys.delete(e.code);
    };

    const onBlur = () => {
      simRef.current.keys.clear();
      simRef.current.dpad = { up: false, down: false, left: false, right: false };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      delete document.body.dataset.state;
    };
  }, [variant, setupRound, startGame, syncHud, togglePause]);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let hudAccum = 0;

    const damagePlayer = (reason: string) => {
      const s = simRef.current;
      if (s.invulnTimer > 0) return;
      s.hp = Math.max(0, s.hp - 1);
      s.invulnTimer = 1.15;
      s.hitstopTimer = 0.045;
      s.shakeTrauma = 0.65;
      s.feedbackText = reason;
      audioRef.current?.play('hurt');
      const px = cfg.mechanic === 'platformer_action' ? s.body.x + s.body.w / 2 : s.px;
      const py = cfg.mechanic === 'platformer_action' ? s.body.y + s.body.h / 2 : s.py;
      emitParticles(s.particles, px, py, '#EF4444', 12, 165);
      if (s.hp <= 0) {
        s.phase = 'gameover';
        s.feedbackText = 'Nyawa habis! Klik Main Lagi untuk mencoba ulang.';
      }
      syncHud();
    };

    const advanceOrWin = (winMsg: string, nextMsg: string) => {
      const s = simRef.current;
      audioRef.current?.play('win');
      if (s.round + 1 < s.maxRounds) {
        setupRound(s.round + 1);
        s.feedbackText = nextMsg;
      } else {
        s.phase = 'victory';
        s.feedbackText = winMsg;
      }
      syncHud();
    };

    const stepSimulation = (dt: number) => {
      const s = simRef.current;
      if (s.phase !== 'playing') return;

      if (s.hitstopTimer > 0) {
        s.hitstopTimer = Math.max(0, s.hitstopTimer - dt);
        return;
      }

      s.invulnTimer = Math.max(0, s.invulnTimer - dt);
      s.wrongBounceCd = Math.max(0, s.wrongBounceCd - dt);
      s.shakeTrauma = Math.max(0, s.shakeTrauma - dt * 2.2);
      s.scaleX += (1 - s.scaleX) * Math.min(1, dt * 14);
      s.scaleY += (1 - s.scaleY) * Math.min(1, dt * 14);
      stepParticlePool(s.particles, dt);

      const left = s.keys.has('ArrowLeft') || s.keys.has('KeyA') || s.dpad.left;
      const right = s.keys.has('ArrowRight') || s.keys.has('KeyD') || s.dpad.right;
      const up = s.keys.has('ArrowUp') || s.keys.has('KeyW') || s.dpad.up;
      const down = s.keys.has('ArrowDown') || s.keys.has('KeyS') || s.dpad.down;

      const ix = (right ? 1 : 0) - (left ? 1 : 0);
      const iy = (down ? 1 : 0) - (up ? 1 : 0);
      const walls = cfg.walls ?? [];

      /* ---- MECHANIC 1: MAZE COLLECT ---- */
      if (cfg.mechanic === 'maze_collect') {
        const speed = 225;
        const mag = Math.hypot(ix, iy) || 1;
        const dx = ix !== 0 ? (ix / mag) * speed * dt : 0;
        const dy = iy !== 0 ? (iy / mag) * speed * dt : 0;
        if (dx !== 0 || dy !== 0) {
          s.facingX = ix || s.facingX;
          s.facingY = iy;
          const next = moveWithWallCollision(
            { x: s.px, y: s.py },
            28,
            dx,
            dy,
            { width: CANVAS_W, height: CANVAS_H },
            walls
          );
          s.walkDist += Math.hypot(next.x - s.px, next.y - s.py);
          s.px = next.x;
          s.py = next.y;
        }

        const rd = (cfg.mazeRounds ?? [])[s.round];
        if (rd) {
          for (const tok of s.mazeTokens) {
            if (tok.collected) continue;
            if (circleDistance(s.px, s.py, tok.x, tok.y) < 30) {
              tok.collected = true;
              if (tok.pyType === rd.targetType) {
                s.score += 1;
                s.scaleX = 1.24;
                s.scaleY = 0.82;
                s.feedbackText = `Tepat! ${tok.label} cocok dengan target.`;
                audioRef.current?.play('pickup');
                emitParticles(s.particles, tok.x, tok.y, '#34D399', 14, 150);
                syncHud();
              } else {
                damagePlayer(`Kurang tepat! ${tok.label} bukan bagian target.`);
              }
            }
          }
          const remaining = s.mazeTokens.filter(
            (t) => !t.collected && t.pyType === rd.targetType
          ).length;
          if (remaining === 0 && s.phase === 'playing') {
            advanceOrWin('Semua ronde labirin tuntas!', `Ronde ${s.round + 1} selesai! Lanjut ronde berikutnya.`);
          }
        }
      }

      /* ---- MECHANIC 2: ORDERED WAYPOINT ---- */
      if (cfg.mechanic === 'ordered_waypoint') {
        const speed = 225;
        const mag = Math.hypot(ix, iy) || 1;
        const dx = ix !== 0 ? (ix / mag) * speed * dt : 0;
        const dy = iy !== 0 ? (iy / mag) * speed * dt : 0;
        if (dx !== 0 || dy !== 0) {
          s.facingX = ix || s.facingX;
          s.facingY = iy;
          const next = moveWithWallCollision(
            { x: s.px, y: s.py },
            28,
            dx,
            dy,
            { width: CANVAS_W, height: CANVAS_H },
            walls
          );
          s.walkDist += Math.hypot(next.x - s.px, next.y - s.py);
          s.px = next.x;
          s.py = next.y;
        }

        for (const wp of s.waypoints) {
          if (wp.collected) continue;
          if (circleDistance(s.px, s.py, wp.x, wp.y) < 32) {
            if (canCollectWaypoint(wp.stepOrder, s.nextStepOrder)) {
              wp.collected = true;
              s.nextStepOrder += 1;
              s.score += 1;
              s.scaleX = 1.24;
              s.scaleY = 0.82;
              s.feedbackText = `Urutan benar: ${wp.label}!`;
              audioRef.current?.play('pickup');
              emitParticles(s.particles, wp.x, wp.y, '#2DD4BF', 14, 150);
              syncHud();
            } else if (s.wrongBounceCd <= 0) {
              s.wrongBounceCd = 0.75;
              damagePlayer(`Urutan salah! Sentuh langkah #${s.nextStepOrder} dulu, bukan #${wp.stepOrder}.`);
            }
          }
        }
        if (s.waypoints.every((w) => w.collected) && s.phase === 'playing') {
          advanceOrWin('Semua alur flowchart berhasil diselesaikan!', `Flowchart Ronde ${s.round + 1} beres! Lanjut berikutnya.`);
        }
      }

      /* ---- MECHANIC 3: LANE RUNNER ---- */
      if (cfg.mechanic === 'lane_runner') {
        const speed = 235;
        const mag = Math.hypot(ix, iy) || 1;
        if (ix !== 0 || iy !== 0) {
          s.facingX = ix || s.facingX;
          const prevX = s.px;
          const prevY = s.py;
          s.px = clamp(s.px + (ix / mag) * speed * dt, 24, CANVAS_W - 24);
          s.py = clamp(s.py + (iy / mag) * speed * dt, 30, CANVAS_H - 30);
          s.walkDist += Math.hypot(s.px - prevX, s.py - prevY);
        }

        for (const p of s.patrols) {
          p.y += p.vy * dt;
          if (p.y < p.minY || p.y > p.maxY) {
            p.vy = -p.vy;
            p.y = clamp(p.y, p.minY, p.maxY);
          }
          if (circleDistance(s.px, s.py, p.x, p.y) < 28) {
            s.px = 78;
            damagePlayer('Tertabrak blok galat! Hindari rintangan menuju gerbang.');
          }
        }

        if (s.px >= 610) {
          const lane = s.py < 140 ? 0 : s.py < 280 ? 1 : 2;
          const rd = (cfg.laneRounds ?? [])[s.round];
          if (rd) {
            if (lane === rd.correctLane) {
              s.score += 1;
              emitParticles(s.particles, s.px, s.py, '#34D399', 16, 170);
              advanceOrWin('Semua gerbang logika terlewati!', `Benar! Gerbang "${rd.gates[lane]}" cocok untuk ${rd.varLabel}.`);
            } else {
              s.px = 78;
              damagePlayer(`Salah gerbang! Untuk ${rd.varLabel}, gerbang "${rd.gates[lane]}" tidak cocok.`);
            }
          }
        }
      }

      /* ---- MECHANIC 4: COURIER DELIVER ---- */
      if (cfg.mechanic === 'courier_deliver') {
        const speed = 230;
        const mag = Math.hypot(ix, iy) || 1;
        const dx = ix !== 0 ? (ix / mag) * speed * dt : 0;
        const dy = iy !== 0 ? (iy / mag) * speed * dt : 0;
        if (dx !== 0 || dy !== 0) {
          s.facingX = ix || s.facingX;
          s.facingY = iy;
          const next = moveWithWallCollision(
            { x: s.px, y: s.py },
            28,
            dx,
            dy,
            { width: CANVAS_W, height: CANVAS_H },
            walls
          );
          s.walkDist += Math.hypot(next.x - s.px, next.y - s.py);
          s.px = next.x;
          s.py = next.y;
        }

        // Pick up a key on left side if not carrying
        if (s.carryingKeyId === null) {
          for (const k of s.courierKeys) {
            if (k.delivered) continue;
            if (circleDistance(s.px, s.py, k.x, k.y) < 32) {
              s.carryingKeyId = k.id;
              s.scaleX = 1.2;
              s.scaleY = 0.84;
              s.feedbackText = `Membawa ${k.keyLabel} — antar ke brankas nilai yang cocok di kanan!`;
              audioRef.current?.play('jump');
              emitParticles(s.particles, k.x, k.y, '#FBBF24', 10, 120);
              syncHud();
              break;
            }
          }
        } else {
          const carried = s.courierKeys.find((k) => k.id === s.carryingKeyId);
          if (carried) {
            for (const v of s.courierVaults) {
              if (v.delivered) continue;
              if (circleDistance(s.px, s.py, v.x, v.y) < 34) {
                if (!v.isDecoy && v.label === carried.vaultLabel) {
                  carried.delivered = true;
                  v.delivered = true;
                  s.carryingKeyId = null;
                  s.score += 1;
                  s.scaleX = 1.25;
                  s.scaleY = 0.8;
                  s.feedbackText = `Cocok! ${carried.keyLabel} → ${v.label}`;
                  audioRef.current?.play('pickup');
                  emitParticles(s.particles, v.x, v.y, '#34D399', 16, 160);
                  syncHud();
                } else if (s.wrongBounceCd <= 0) {
                  s.wrongBounceCd = 0.85;
                  damagePlayer(`Bukan pasangannya! ${carried.keyLabel} tidak menghasilkan ${v.label}.`);
                }
              }
            }
          }
        }

        if (s.courierKeys.every((k) => k.delivered) && s.phase === 'playing') {
          advanceOrWin('Semua pasangan Dictionary & Set terkirim!', `Ronde ${s.round + 1} tuntas! Lanjut paket berikutnya.`);
        }
      }

      /* ---- MECHANIC 5: BINARY SEARCH ARENA ---- */
      if (cfg.mechanic === 'binary_search_arena') {
        s.binaryStepCd = Math.max(0, s.binaryStepCd - dt);
        const speed = 240;
        const mag = Math.hypot(ix, iy) || 1;
        if (ix !== 0 || iy !== 0) {
          s.facingX = ix || s.facingX;
          const prevX = s.px;
          const prevY = s.py;
          s.px = clamp(s.px + (ix / mag) * speed * dt, 24, CANVAS_W - 24);
          s.py = clamp(s.py + (iy / mag) * speed * dt, 40, CANVAS_H - 28);
          s.walkDist += Math.hypot(s.px - prevX, s.py - prevY);
        }

        if (s.binaryStepCd <= 0) {
          const botRect: Rect = { x: s.px - 14, y: s.py - 14, w: 28, h: 28 };
          for (let i = s.binaryLow; i <= s.binaryHigh; i++) {
            const box = getBinaryBoxRect(i);
            if (rectsOverlap(botRect, box)) {
              const res = evaluateBinarySearchStep(
                s.binaryArray,
                s.binaryLow,
                s.binaryHigh,
                s.binaryTarget,
                i
              );
              s.binaryStepCd = 0.65;
              if (res.outcome === 'found') {
                s.score += 1;
                emitParticles(s.particles, box.x + box.w / 2, box.y + box.h / 2, '#34D399', 18, 170);
                advanceOrWin(
                  'Semua target Binary Search ditemukan!',
                  `Target ${s.binaryTarget} ditemukan di indeks [${i}]! Lanjut larik berikutnya.`
                );
              } else if (res.outcome === 'narrow_right') {
                s.score += 1;
                s.binaryLow = res.nextLow;
                s.py = 330;
                s.feedbackText = `arr[${i}]=${s.binaryArray[i]} < ${s.binaryTarget} → pangkas kiri! low = ${res.nextLow}`;
                audioRef.current?.play('pickup');
                emitParticles(s.particles, box.x + box.w / 2, box.y + box.h / 2, '#38BDF8', 12, 130);
                syncHud();
              } else if (res.outcome === 'narrow_left') {
                s.score += 1;
                s.binaryHigh = res.nextHigh;
                s.py = 330;
                s.feedbackText = `arr[${i}]=${s.binaryArray[i]} > ${s.binaryTarget} → pangkas kanan! high = ${res.nextHigh}`;
                audioRef.current?.play('pickup');
                emitParticles(s.particles, box.x + box.w / 2, box.y + box.h / 2, '#38BDF8', 12, 130);
                syncHud();
              } else {
                s.py = 330;
                damagePlayer(
                  `Bukan mid! Dengan low=${s.binaryLow} & high=${s.binaryHigh}, mid = (${s.binaryLow}+${s.binaryHigh})//2 = ${res.expectedMid}.`
                );
              }
              break;
            }
          }
        }
      }

      /* ---- MECHANIC 6: PLATFORMER ACTION ---- */
      if (cfg.mechanic === 'platformer_action') {
        s.magnetTimer = Math.max(0, s.magnetTimer - dt);
        s.magnetCd = Math.max(0, s.magnetCd - dt);
        s.dashTimer = Math.max(0, s.dashTimer - dt);
        s.dashCooldown = Math.max(0, s.dashCooldown - dt);
        const jumpPressed = s.justPressed.has('action1') || s.keys.has('ArrowUp') || s.keys.has('KeyW');
        const jumpHeld = s.keys.has('Space') || s.keys.has('ArrowUp') || s.keys.has('KeyW');

        let dashed = false;
        if (s.justPressed.has('action2') && s.dashCooldown <= 0) {
          s.dashTimer = 0.22;
          s.dashCooldown = 1.4;
          dashed = true;
        }

        if (s.justPressed.has('action3') && s.magnetCd <= 0) {
          s.magnetTimer = 2.2;
          s.magnetCd = 3.5;
          audioRef.current?.play('shield');
          s.feedbackText = 'Medan Saring aktif — menarik elemen valid terdekat!';
          emitParticles(s.particles, s.body.x + 14, s.body.y + 16, '#F59E0B', 14, 150);
        }

        const platforms = cfg.platforms ?? [];
        const moveInputX = s.dashTimer > 0 && ix === 0 ? (s.facingX >= 0 ? 1 : -1) : ix;
        const res = stepPlatformerBody(
          s.body,
          { moveX: moveInputX, jumpPressed, jumpHeld, dashActive: s.dashTimer > 0 },
          platforms,
          dt,
          CANVAS_W,
          368
        );
        s.body = res.body;
        if (ix !== 0) s.facingX = ix;
        s.walkDist += Math.abs(s.body.vx) * dt;

        if (res.jumped) {
          s.scaleX = 0.78;
          s.scaleY = 1.28;
          audioRef.current?.play('jump');
          emitParticles(s.particles, s.body.x + 14, s.body.y + 32, '#93C5FD', 6, 80);
        }
        if (dashed) {
          s.scaleX = 1.3;
          s.scaleY = 0.76;
          audioRef.current?.play('shoot');
          emitParticles(s.particles, s.body.x + 14, s.body.y + 16, '#38BDF8', 10, 140);
        }
        if (res.landed) {
          s.scaleX = 1.22;
          s.scaleY = 0.8;
        }

        const cx = s.body.x + s.body.w / 2;
        const cy = s.body.y + s.body.h / 2;

        for (const sx of cfg.spikes ?? []) {
          if (rectsOverlap({ x: s.body.x, y: s.body.y, w: s.body.w, h: s.body.h }, { x: sx - 12, y: 350, w: 24, h: 18 })) {
            s.body.vy = -340;
            damagePlayer('Terkena duri hazard! Gunakan Lompat [Space] atau Dash [Shift].');
          }
        }

        for (const it of s.platItems) {
          if (it.collected) continue;
          if (s.magnetTimer > 0 && it.valid) {
            const dist = circleDistance(cx, cy, it.x, it.y);
            if (dist < 180 && dist > 1) {
              it.x += ((cx - it.x) / dist) * 235 * dt;
              it.y += ((cy - it.y) / dist) * 235 * dt;
            }
          }
          if (circleDistance(cx, cy, it.x, it.y) < 30) {
            it.collected = true;
            if (it.valid) {
              s.score += 1;
              s.scaleX = 1.24;
              s.scaleY = 0.82;
              s.feedbackText = `Elemen ${it.label} valid!`;
              audioRef.current?.play('pickup');
              emitParticles(s.particles, it.x, it.y, '#34D399', 14, 150);
              syncHud();
            } else {
              damagePlayer(`Elemen ${it.label} tidak memenuhi kondisi target.`);
            }
          }
        }

        if (s.platItems.filter((i) => i.valid && !i.collected).length === 0 && s.phase === 'playing') {
          advanceOrWin('Semua tantangan platformer tuntas!', `Babak ${s.round + 1} selesai! Lanjut babak berikutnya.`);
        }
      }

      /* ---- MECHANIC 7: ARENA SHOOTER ---- */
      if (cfg.mechanic === 'arena_shooter') {
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

        if (s.justPressed.has('action2') && s.shieldCd <= 0) {
          s.shieldTimer = 2.0;
          s.shieldCd = 4.0;
          audioRef.current?.play('shield');
          s.feedbackText = 'Perisai aktif (2 detik) — kebal & memantulkan musuh!';
          emitParticles(s.particles, s.px, s.py, '#34D399', 10, 110);
        }

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
                return {
                  ...en,
                  hp: 0,
                  koTimer: 0.35,
                  hitFlash: 0.15,
                  vx: (en.x - s.px) * 1.4,
                  vy: (en.y - s.py) * 1.4,
                };
              }
              return { ...en, hp: nextHp, hitFlash: 0.12 };
            }
            return en;
          });
          s.feedbackText =
            hitCount > 0 ? `Gelombang aksi menumpas ${hitCount} target di sekitar!` : 'Gelombang aksi dilepaskan!';
          syncHud();
        }

        for (const p of s.projectiles) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
        }
        s.projectiles = s.projectiles.filter(
          (p) => p.life > 0 && p.x > 0 && p.x < CANVAS_W && p.y > 0 && p.y < CANVAS_H
        );

        const nextEnemies: BugEnemy[] = [];
        for (const rawEnemy of s.enemies) {
          const en = stepEnemyPolicy(rawEnemy, { x: s.px, y: s.py }, dt, {
            width: CANVAS_W,
            height: CANVAS_H,
          });
          if (en.hp <= 0 && en.koTimer <= 0) continue;

          if (en.hp > 0) {
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
                  s.feedbackText = `${en.label} berhasil ditangani!`;
                  syncHud();
                } else {
                  audioRef.current?.play('jump');
                }
              }
            }

            if (en.hp > 0 && circleDistance(s.px, s.py, en.x, en.y) < en.radius + 16) {
              if (s.shieldTimer > 0) {
                const dx = en.x - s.px || 1;
                const dy = en.y - s.py || 1;
                const d = Math.hypot(dx, dy) || 1;
                en.x = clamp(en.x + (dx / d) * 48, 28, CANVAS_W - 28);
                en.y = clamp(en.y + (dy / d) * 48, 28, CANVAS_H - 28);
                emitParticles(s.particles, en.x, en.y, '#34D399', 8, 120);
              } else {
                damagePlayer(`Terserang ${en.label}! Gunakan Perisai [Q] atau Tembak [Space].`);
              }
            }
          }
          nextEnemies.push(en);
        }
        s.enemies = nextEnemies;

        if (s.enemies.length === 0 && s.phase === 'playing') {
          advanceOrWin('Semua gelombang berhasil ditumpas!', `Gelombang ${s.round + 1} bersih! Gelombang baru mendekat.`);
        }
      }

      /* ---- MECHANIC 8: CHARACTER SORT SWAP ---- */
      if (cfg.mechanic === 'character_sort_swap') {
        s.sortHintTimer = Math.max(0, s.sortHintTimer - dt);
        s.sortHintCd = Math.max(0, s.sortHintCd - dt);
        s.sortTurboTimer = Math.max(0, s.sortTurboTimer - dt);
        s.sortTurboCd = Math.max(0, s.sortTurboCd - dt);
        s.sortSwapFlashTimer = Math.max(0, s.sortSwapFlashTimer - dt);

        if (s.justPressed.has('action3') && s.sortTurboCd <= 0) {
          s.sortTurboTimer = 0.65;
          s.sortTurboCd = 1.8;
          audioRef.current?.play('shoot');
          emitParticles(s.particles, s.px, s.py, '#F59E0B', 10, 130);
          s.feedbackText = 'Turbo Dash aktif!';
        }

        const speed = s.sortTurboTimer > 0 ? 430 : 255;
        if (ix !== 0) {
          s.facingX = ix;
          const prevX = s.px;
          s.px = clamp(s.px + ix * speed * dt, 90, CANVAS_W - 90);
          s.walkDist += Math.abs(s.px - prevX);
        }

        // Determine nearest adjacent pair (0..3)
        let bestPair = 0;
        let bestDist = Infinity;
        for (let i = 0; i < s.sortArray.length - 1; i++) {
          const midX = (getSortBarCenterX(i) + getSortBarCenterX(i + 1)) / 2;
          const d = Math.abs(s.px - midX);
          if (d < bestDist) {
            bestDist = d;
            bestPair = i;
          }
        }
        s.sortActivePair = bestPair;

        // Action 2: Cek Pass (Q) highlights next unsorted pair
        if (s.justPressed.has('action2') && s.sortHintCd <= 0) {
          s.sortHintCd = 4.0;
          s.sortHintTimer = 2.6;
          let found = -1;
          for (let i = 0; i < s.sortArray.length - 1; i++) {
            const need =
              s.sortOrder === 'asc'
                ? s.sortArray[i] > s.sortArray[i + 1]
                : s.sortArray[i] < s.sortArray[i + 1];
            if (need) {
              found = i;
              break;
            }
          }
          s.sortHintPair = found;
          audioRef.current?.play('shield');
          s.feedbackText =
            found >= 0
              ? `Petunjuk Cek Pass: tukar pasangan indeks [${found}] & [${found + 1}]!`
              : 'Larik sudah terurut!';
          syncHud();
        }

        // Action 1: Swap (Space)
        if (s.justPressed.has('action1')) {
          const { swapped, nextArray } = swapAdjacentIfNeeded(
            s.sortArray,
            s.sortActivePair,
            s.sortOrder
          );
          if (swapped) {
            s.sortArray = nextArray;
            s.score = Math.min(s.maxScore, s.score + 1);
            s.scaleX = 1.25;
            s.scaleY = 0.8;
            s.sortSwapFlashIdx = s.sortActivePair;
            s.sortSwapFlashTimer = 0.3;
            s.sortHintPair = -1;
            const midX =
              (getSortBarCenterX(s.sortActivePair) + getSortBarCenterX(s.sortActivePair + 1)) / 2;
            audioRef.current?.play('pickup');
            emitParticles(s.particles, midX, 230, '#34D399', 16, 160);
            s.feedbackText = `Tukar berhasil pada indeks [${s.sortActivePair}] ↔ [${s.sortActivePair + 1}]!`;
            if (isArraySorted(s.sortArray, s.sortOrder)) {
              advanceOrWin('Semua larik berhasil diurutkan!', `Larik Ronde ${s.round + 1} sudah terurut sempurna!`);
            } else {
              syncHud();
            }
          } else {
            damagePlayer(
              `Indeks [${s.sortActivePair}] (${s.sortArray[s.sortActivePair]}) & [${s.sortActivePair + 1}] (${s.sortArray[s.sortActivePair + 1]}) sudah sesuai urutan ${s.sortOrder === 'asc' ? 'naik' : 'turun'}!`
            );
          }
        }
      }

      s.justPressed.clear();
    };

    const drawBot = (
      ctx: CanvasRenderingContext2D,
      theme: CharacterTheme,
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

      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(0, 17, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (shieldActive) {
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.9)';
        ctx.fillStyle = 'rgba(52, 211, 153, 0.16)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      if (!blink) {
        const legSwing = Math.sin(walkDist * 0.22) * 3.5;
        ctx.fillStyle = '#334155';
        ctx.fillRect(-8, 10 + legSwing * 0.4, 5, 7);
        ctx.fillRect(3, 10 - legSwing * 0.4, 5, 7);

        ctx.fillStyle = theme.bodyColor;
        ctx.strokeStyle = theme.strokeColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-14, -13, 28, 25, 7);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.roundRect(-10, -8, 20, 10, 4);
        ctx.fill();

        const ex = clamp(facingX, -1, 1) * 2.2;
        const ey = clamp(facingY, -1, 1) * 1.4;
        ctx.fillStyle = theme.eyeColor;
        ctx.beginPath();
        ctx.arc(-4.5 + ex, -3 + ey, 2.5, 0, Math.PI * 2);
        ctx.arc(4.5 + ex, -3 + ey, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = theme.antennaColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -13);
        ctx.lineTo(0, -21);
        ctx.stroke();
        ctx.fillStyle = theme.antennaColor;
        ctx.beginPath();
        ctx.arc(0, -22, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (tagText) {
        ctx.font = '700 11px "IBM Plex Mono", monospace';
        const tw = ctx.measureText(tagText).width + 14;
        ctx.fillStyle = '#FEF3C7';
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-tw / 2, -44, tw, 19, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#78350F';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, 0, -34.5);
      }

      ctx.restore();
    };

    const renderFrame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const s = simRef.current;
      const shake = s.shakeTrauma * s.shakeTrauma * 9;
      const ox = shake > 0.1 ? (Math.random() * 2 - 1) * shake : 0;
      const oy = shake > 0.1 ? (Math.random() * 2 - 1) * shake : 0;

      ctx.save();
      ctx.translate(ox, oy);

      // Themed Arena Background + Grid
      ctx.fillStyle = cfg.theme.arenaBg;
      ctx.fillRect(-10, -10, CANVAS_W + 20, CANVAS_H + 20);
      ctx.strokeStyle = cfg.theme.gridColor;
      ctx.lineWidth = 1;
      for (let gx = 0; gx <= CANVAS_W; gx += 38) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, CANVAS_H);
        ctx.stroke();
      }
      for (let gy = 0; gy <= CANVAS_H; gy += 38) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(CANVAS_W, gy);
        ctx.stroke();
      }

      const drawWalls = (walls: Rect[]) => {
        for (const w of walls) {
          ctx.fillStyle = '#1E293B';
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(w.x, w.y, w.w, w.h, 8);
          ctx.fill();
          ctx.stroke();
        }
      };

      /* ---- RENDER 1: MAZE COLLECT ---- */
      if (cfg.mechanic === 'maze_collect') {
        drawWalls(cfg.walls ?? []);
        for (const tok of s.mazeTokens) {
          if (tok.collected) continue;
          const pulse = Math.sin(performance.now() * 0.005 + tok.x) * 2;
          ctx.fillStyle = '#F8FAFC';
          ctx.strokeStyle = cfg.theme.strokeColor;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(tok.x - 32, tok.y - 16 + pulse, 64, 32, 9);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#0F172A';
          ctx.font = '700 13px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tok.label, tok.x, tok.y + pulse);
        }
        drawBot(ctx, cfg.theme, s.px, s.py, s.facingX, s.facingY, s.walkDist, s.scaleX, s.scaleY, s.invulnTimer > 0 && Math.floor(performance.now() / 80) % 2 === 0);
      }

      /* ---- RENDER 2: ORDERED WAYPOINT ---- */
      if (cfg.mechanic === 'ordered_waypoint') {
        drawWalls(cfg.walls ?? []);
        for (const wp of s.waypoints) {
          if (wp.collected) continue;
          const isNext = wp.stepOrder === s.nextStepOrder;
          const pulse = isNext ? Math.sin(performance.now() * 0.008) * 3 : 0;
          if (isNext) {
            ctx.strokeStyle = 'rgba(45, 212, 191, 0.75)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(wp.x - 74 - pulse, wp.y - 22 - pulse, 148 + pulse * 2, 44 + pulse * 2, 12);
            ctx.stroke();
          }
          ctx.fillStyle = isNext ? '#CCFBF1' : '#F1F5F9';
          ctx.strokeStyle = isNext ? '#0D9488' : '#64748B';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(wp.x - 70, wp.y - 18, 140, 36, 9);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#0F172A';
          ctx.font = '700 11px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(wp.label, wp.x, wp.y);
        }
        drawBot(ctx, cfg.theme, s.px, s.py, s.facingX, s.facingY, s.walkDist, s.scaleX, s.scaleY, s.invulnTimer > 0 && Math.floor(performance.now() / 80) % 2 === 0, `Cari #${s.nextStepOrder}`);
      }

      /* ---- RENDER 3: LANE RUNNER ---- */
      if (cfg.mechanic === 'lane_runner') {
        const rd = (cfg.laneRounds ?? [])[s.round];
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(0, 140);
        ctx.lineTo(CANVAS_W, 140);
        ctx.moveTo(0, 280);
        ctx.lineTo(CANVAS_W, 280);
        ctx.stroke();
        ctx.setLineDash([]);

        if (rd) {
          rd.gates.forEach((gateLabel, laneIdx) => {
            const gy = laneIdx * 140 + 18;
            ctx.fillStyle = 'rgba(30, 58, 138, 0.45)';
            ctx.strokeStyle = cfg.theme.strokeColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(590, gy, 152, 104, 12);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#EFF6FF';
            ctx.font = '700 12px "IBM Plex Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(gateLabel, 666, gy + 52);
          });
        }

        for (const p of s.patrols) {
          ctx.fillStyle = '#DC2626';
          ctx.strokeStyle = '#FCA5A5';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(p.x - 18, p.y - 18, 36, 36, 8);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '700 10px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('BUG', p.x, p.y);
        }

        drawBot(ctx, cfg.theme, s.px, s.py, s.facingX, s.facingY, s.walkDist, s.scaleX, s.scaleY, s.invulnTimer > 0 && Math.floor(performance.now() / 80) % 2 === 0, rd?.varLabel);
      }

      /* ---- RENDER 4: COURIER DELIVER ---- */
      if (cfg.mechanic === 'courier_deliver') {
        drawWalls(cfg.walls ?? []);

        // Zone headers
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = '600 11px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ZONA KUNCI / OPERASI', 118, 28);
        ctx.fillText('ZONA BRANKAS NILAI', 632, 28);

        // Draw vaults on right
        for (const v of s.courierVaults) {
          ctx.fillStyle = v.delivered
            ? 'rgba(16, 185, 129, 0.25)'
            : v.isDecoy
              ? 'rgba(220, 38, 38, 0.35)'
              : 'rgba(15, 118, 110, 0.45)';
          ctx.strokeStyle = v.delivered ? '#34D399' : v.isDecoy ? '#F87171' : '#5EEAD4';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(v.x - 56, v.y - 22, 112, 44, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = v.delivered ? '#A7F3D0' : '#F8FAFC';
          ctx.font = '700 12px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(v.delivered ? `✓ ${v.label}` : v.label, v.x, v.y);
        }

        // Draw unpicked keys on left
        for (const k of s.courierKeys) {
          if (k.delivered || k.id === s.carryingKeyId) continue;
          const pulse = Math.sin(performance.now() * 0.006 + k.id) * 2;
          ctx.fillStyle = '#FEF3C7';
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(k.x - 56, k.y - 18 + pulse, 112, 36, 9);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#78350F';
          ctx.font = '700 12px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(k.keyLabel, k.x, k.y + pulse);
        }

        const carried = s.courierKeys.find((k) => k.id === s.carryingKeyId);
        drawBot(
          ctx,
          cfg.theme,
          s.px,
          s.py,
          s.facingX,
          s.facingY,
          s.walkDist,
          s.scaleX,
          s.scaleY,
          s.invulnTimer > 0 && Math.floor(performance.now() / 80) % 2 === 0,
          carried ? carried.keyLabel : undefined
        );
      }

      /* ---- RENDER 5: BINARY SEARCH ARENA ---- */
      if (cfg.mechanic === 'binary_search_arena') {
        // Target callout header
        ctx.fillStyle = '#E0F2FE';
        ctx.font = '700 14px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `TARGET = ${s.binaryTarget}   |   low = ${s.binaryLow}   |   high = ${s.binaryHigh}   |   mid = (low+high)//2`,
          CANVAS_W / 2,
          62
        );

        // Bracket bar over active [low..high]
        const lowRect = getBinaryBoxRect(s.binaryLow);
        const highRect = getBinaryBoxRect(s.binaryHigh);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lowRect.x, 128);
        ctx.lineTo(lowRect.x, 114);
        ctx.lineTo(highRect.x + highRect.w, 114);
        ctx.lineTo(highRect.x + highRect.w, 128);
        ctx.stroke();

        ctx.fillStyle = '#7DD3FC';
        ctx.font = '600 11px "IBM Plex Mono", monospace';
        ctx.fillText('LOW', lowRect.x + lowRect.w / 2, 104);
        ctx.fillText('HIGH', highRect.x + highRect.w / 2, 104);

        // Sorted array boxes
        s.binaryArray.forEach((val, idx) => {
          const box = getBinaryBoxRect(idx);
          const inRange = idx >= s.binaryLow && idx <= s.binaryHigh;
          ctx.fillStyle = inRange ? '#F8FAFC' : '#1E293B';
          ctx.strokeStyle = inRange ? '#38BDF8' : '#334155';
          ctx.lineWidth = inRange ? 2.5 : 1.5;
          ctx.beginPath();
          ctx.roundRect(box.x, box.y, box.w, box.h, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = inRange ? '#0F172A' : '#475569';
          ctx.font = '700 20px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(val), box.x + box.w / 2, box.y + box.h / 2);

          ctx.fillStyle = inRange ? '#94A3B8' : '#475569';
          ctx.font = '600 11px "IBM Plex Mono", monospace';
          ctx.fillText(`[${idx}]`, box.x + box.w / 2, box.y + box.h + 16);
        });

        drawBot(
          ctx,
          cfg.theme,
          s.px,
          s.py,
          s.facingX,
          s.facingY,
          s.walkDist,
          s.scaleX,
          s.scaleY,
          s.invulnTimer > 0 && Math.floor(performance.now() / 80) % 2 === 0,
          `Cari ${s.binaryTarget}`
        );
      }

      /* ---- RENDER 6: PLATFORMER ACTION ---- */
      if (cfg.mechanic === 'platformer_action') {
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(0, 368, CANVAS_W, 52);
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, 368, CANVAS_W, 4);

        for (const p of cfg.platforms ?? []) {
          ctx.fillStyle = '#1E3A5F';
          ctx.strokeStyle = cfg.theme.strokeColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(p.x, p.y, p.w, p.h, 6);
          ctx.fill();
          ctx.stroke();
        }

        for (const sx of cfg.spikes ?? []) {
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.moveTo(sx - 12, 368);
          ctx.lineTo(sx, 348);
          ctx.lineTo(sx + 12, 368);
          ctx.closePath();
          ctx.fill();
        }

        if (s.magnetTimer > 0) {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(s.body.x + 14, s.body.y + 16, 120, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        for (const it of s.platItems) {
          if (it.collected) continue;
          ctx.fillStyle = '#FEFCE8';
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(it.x, it.y, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#0F172A';
          ctx.font = '700 13px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(it.label, it.x, it.y);
        }

        drawBot(
          ctx,
          cfg.theme,
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

      /* ---- RENDER 7: ARENA SHOOTER ---- */
      if (cfg.mechanic === 'arena_shooter') {
        if (s.pulseTimer > 0) {
          const prog = 1 - s.pulseTimer / 0.38;
          ctx.strokeStyle = `rgba(245, 158, 11, ${1 - prog})`;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(s.px, s.py, 26 + prog * 165, 0, Math.PI * 2);
          ctx.stroke();
        }

        const fMag = Math.hypot(s.facingX, s.facingY) || 1;
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.px + (s.facingX / fMag) * 22, s.py + (s.facingY / fMag) * 22);
        ctx.lineTo(s.px + (s.facingX / fMag) * 44, s.py + (s.facingY / fMag) * 44);
        ctx.stroke();

        for (const p of s.projectiles) {
          ctx.fillStyle = '#38BDF8';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        for (const en of s.enemies) {
          ctx.save();
          if (en.koTimer > 0) ctx.globalAlpha = clamp(en.koTimer / 0.35, 0, 1);

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

          ctx.fillStyle =
            en.hitFlash > 0
              ? '#FFFFFF'
              : en.archetype === 'chaser'
                ? '#DC2626'
                : en.archetype === 'charger'
                  ? '#EA580C'
                  : '#9333EA';
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 2;

          if (en.archetype === 'charger') {
            ctx.beginPath();
            ctx.moveTo(en.x, en.y - en.radius);
            ctx.lineTo(en.x + en.radius, en.y);
            ctx.lineTo(en.x, en.y + en.radius);
            ctx.lineTo(en.x - en.radius, en.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else if (en.archetype === 'orbiter') {
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
            ctx.beginPath();
            ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          ctx.font = '600 10px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.strokeText(en.label, en.x, en.y + en.radius + 12);
          ctx.fillStyle = '#F8FAFC';
          ctx.fillText(en.label, en.x, en.y + en.radius + 12);
          ctx.restore();
        }

        drawBot(
          ctx,
          cfg.theme,
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

      /* ---- RENDER 8: CHARACTER SORT SWAP ---- */
      if (cfg.mechanic === 'character_sort_swap') {
        // Floor platform
        ctx.fillStyle = '#292524';
        ctx.fillRect(0, 354, CANVAS_W, 66);
        ctx.fillStyle = '#57534E';
        ctx.fillRect(0, 354, CANVAS_W, 4);

        // Mode banner
        ctx.fillStyle = '#FDE68A';
        ctx.font = '700 13px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `MODE: ${s.sortOrder === 'asc' ? 'NAIK (Kecil → Besar)' : 'TURUN (Besar → Kecil)'}   |   Pasangan Aktif: [${s.sortActivePair}] ↔ [${s.sortActivePair + 1}]`,
          CANVAS_W / 2,
          44
        );

        // Active pair highlight bracket
        const pairLeftX = getSortBarCenterX(s.sortActivePair);
        const pairRightX = getSortBarCenterX(s.sortActivePair + 1);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(pairLeftX - 44, 82, pairRightX - pairLeftX + 88, 212, 14);
        ctx.stroke();

        // Optional hint ring from Cek Pass [Q]
        if (s.sortHintTimer > 0 && s.sortHintPair >= 0) {
          const hx1 = getSortBarCenterX(s.sortHintPair);
          const hx2 = getSortBarCenterX(s.sortHintPair + 1);
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.roundRect(hx1 - 48, 76, hx2 - hx1 + 96, 224, 16);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw numbered array bars
        const maxVal = Math.max(...s.sortArray, 1);
        s.sortArray.forEach((val, idx) => {
          const cx = getSortBarCenterX(idx);
          const barH = 68 + Math.round((val / maxVal) * 110);
          const barY = 278 - barH;
          const isActive = idx === s.sortActivePair || idx === s.sortActivePair + 1;
          const isFlashing =
            s.sortSwapFlashTimer > 0 &&
            (idx === s.sortSwapFlashIdx || idx === s.sortSwapFlashIdx + 1);

          ctx.fillStyle = isFlashing ? '#10B981' : isActive ? '#FEF3C7' : '#F8FAFC';
          ctx.strokeStyle = isFlashing ? '#6EE7B7' : isActive ? '#F59E0B' : '#64748B';
          ctx.lineWidth = isActive ? 3 : 2;
          ctx.beginPath();
          ctx.roundRect(cx - 34, barY, 68, barH, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isFlashing ? '#FFFFFF' : '#0F172A';
          ctx.font = '700 22px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(val), cx, barY + barH / 2);

          ctx.fillStyle = '#94A3B8';
          ctx.font = '600 11px "IBM Plex Mono", monospace';
          ctx.fillText(`[${idx}]`, cx, 304);
        });

        drawBot(
          ctx,
          cfg.theme,
          s.px,
          s.py,
          s.facingX,
          0,
          s.walkDist,
          s.scaleX,
          s.scaleY,
          s.invulnTimer > 0 && Math.floor(performance.now() / 80) % 2 === 0,
          'Swap [Space]'
        );
      }

      // Render Pooled Particles
      for (const p of s.particles) {
        if (!p.active) continue;
        ctx.save();
        ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.restore();
      }

      ctx.restore();
    };

    const tick = (now: number) => {
      const dt = clampDt((now - lastTime) / 1000);
      lastTime = now;
      stepSimulation(dt);
      renderFrame();

      hudAccum += dt;
      if (hudAccum >= 0.12 && simRef.current.phase === 'playing') {
        hudAccum = 0;
        syncHud();
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [cfg, setupRound, syncHud]);

  const labels = cfg.actionLabels;

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
      {/* Top HUD Bar */}
      <div className="bg-slate-900 text-slate-100 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 border border-slate-800">
        <div className="flex flex-wrap items-center gap-5 tabular-nums">
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
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="w-full h-full block" />

        {/* Title Overlay */}
        {hud.phase === 'title' && (
          <div className="absolute inset-0 bg-slate-950/82 flex flex-col items-center justify-center p-6 text-center text-white">
            <svg viewBox="0 0 64 64" className="w-14 h-14 mb-3" aria-hidden="true">
              <rect
                x="12"
                y="16"
                width="40"
                height="34"
                rx="10"
                fill={cfg.theme.bodyColor}
                stroke={cfg.theme.strokeColor}
                strokeWidth="2.5"
              />
              <rect x="18" y="23" width="28" height="14" rx="4" fill="#0F172A" />
              <circle cx="26" cy="30" r="3.5" fill={cfg.theme.eyeColor} />
              <circle cx="38" cy="30" r="3.5" fill={cfg.theme.eyeColor} />
              <line x1="32" y1="16" x2="32" y2="8" stroke={cfg.theme.antennaColor} strokeWidth="3" />
              <circle cx="32" cy="7" r="4" fill={cfg.theme.antennaColor} />
            </svg>
            <p className="text-[11px] font-mono text-blue-300 mb-1">Karakter: {cfg.theme.botName}</p>
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
              {labels?.hint ?? 'WASD / Tombol Panah / D-Pad Layar: Gerakkan Karakter · P: Jeda'}
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
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-500 hidden md:inline">Gerak:</span>
          {isHorizontalOnly ? (
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
        {cfg.isActionVariant && labels ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => triggerAction('action1')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold whitespace-nowrap"
            >
              {cfg.mechanic === 'platformer_action' ? (
                <ArrowUp className="w-4 h-4" />
              ) : cfg.mechanic === 'character_sort_swap' ? (
                <ArrowLeftRight className="w-4 h-4" />
              ) : (
                <Crosshair className="w-4 h-4" />
              )}
              {labels.action1}
            </button>
            <button
              type="button"
              onClick={() => triggerAction('action2')}
              disabled={hud.cooldown2Pct < 100}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg disabled:bg-slate-200 disabled:text-slate-600 text-white text-xs font-semibold whitespace-nowrap tabular-nums ${
                cfg.mechanic === 'platformer_action'
                  ? 'bg-sky-600 hover:bg-sky-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {cfg.mechanic === 'platformer_action' ? (
                <Zap className="w-4 h-4" />
              ) : cfg.mechanic === 'character_sort_swap' ? (
                <Search className="w-4 h-4" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              {labels.action2} {hud.cooldown2Pct < 100 ? `${hud.cooldown2Pct}%` : ''}
            </button>
            <button
              type="button"
              onClick={() => triggerAction('action3')}
              disabled={hud.cooldown3Pct < 100}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-600 text-white text-xs font-semibold whitespace-nowrap tabular-nums"
            >
              {cfg.mechanic === 'platformer_action' ? (
                <Sparkles className="w-4 h-4" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {labels.action3} {hud.cooldown3Pct < 100 ? `${hud.cooldown3Pct}%` : ''}
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center sm:text-right">
            Gunakan panah / <span className="font-mono text-slate-700">WASD</span> atau D-Pad layar untuk menggerakkan {cfg.theme.botName}.
          </p>
        )}
      </div>
    </div>
  );
}
