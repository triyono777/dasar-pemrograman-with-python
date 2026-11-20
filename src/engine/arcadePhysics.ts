// Pure, deterministic 2D arcade physics, collision, enemy policy & scoring helpers

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ArcadeParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export function clampDt(rawSeconds: number): number {
  if (!Number.isFinite(rawSeconds) || rawSeconds < 0) return 0;
  return Math.min(rawSeconds, 0.05);
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function circleDistance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay);
}

export function moveWithWallCollision(
  pos: Vec2,
  size: number,
  dx: number,
  dy: number,
  bounds: { width: number; height: number },
  walls: Rect[]
): Vec2 {
  const half = size / 2;
  let nx = clamp(pos.x + dx, half + 6, bounds.width - half - 6);
  const testX: Rect = { x: nx - half, y: pos.y - half, w: size, h: size };
  for (const w of walls) {
    if (rectsOverlap(testX, w)) {
      nx = pos.x;
      break;
    }
  }

  let ny = clamp(pos.y + dy, half + 6, bounds.height - half - 6);
  const testY: Rect = { x: nx - half, y: ny - half, w: size, h: size };
  for (const w of walls) {
    if (rectsOverlap(testY, w)) {
      ny = pos.y;
      break;
    }
  }

  return { x: nx, y: ny };
}

export interface PlatformerBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  onGround: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
}

export function stepPlatformerBody(
  body: PlatformerBody,
  input: { moveX: number; jumpPressed: boolean; jumpHeld: boolean; dashActive: boolean },
  platforms: Rect[],
  dt: number,
  boundsWidth: number,
  groundY: number
): { body: PlatformerBody; jumped: boolean; landed: boolean } {
  const GRAVITY = 1280;
  const MOVE_SPEED = input.dashActive ? 460 : 250;
  const JUMP_VEL = -540;

  let vx = input.moveX * MOVE_SPEED;
  let vy = body.vy;
  let coyoteTimer = body.onGround ? 0.11 : Math.max(0, body.coyoteTimer - dt);
  let jumpBufferTimer = input.jumpPressed ? 0.12 : Math.max(0, body.jumpBufferTimer - dt);
  let jumped = false;

  if (jumpBufferTimer > 0 && coyoteTimer > 0) {
    vy = JUMP_VEL;
    coyoteTimer = 0;
    jumpBufferTimer = 0;
    jumped = true;
  }

  // Variable jump cut on early release
  if (!input.jumpHeld && vy < -180) {
    vy *= 0.82;
  }

  vy += GRAVITY * dt;
  vy = Math.min(vy, 760);

  let nextX = clamp(body.x + vx * dt, 10, boundsWidth - body.w - 10);
  let nextY = body.y + vy * dt;
  let onGround = false;

  // One-way platforms landing check (when falling)
  if (vy >= 0) {
    const prevBottom = body.y + body.h;
    const nextBottom = nextY + body.h;
    for (const p of platforms) {
      const horizOverlap = nextX + body.w > p.x + 4 && nextX < p.x + p.w - 4;
      if (horizOverlap && prevBottom <= p.y + 8 && nextBottom >= p.y) {
        nextY = p.y - body.h;
        vy = 0;
        onGround = true;
        break;
      }
    }
  }

  if (nextY + body.h >= groundY) {
    nextY = groundY - body.h;
    vy = 0;
    onGround = true;
  }

  const landed = !body.onGround && onGround;

  return {
    body: {
      ...body,
      x: nextX,
      y: nextY,
      vx,
      vy,
      onGround,
      coyoteTimer,
      jumpBufferTimer,
    },
    jumped,
    landed,
  };
}

export type BugArchetype = 'chaser' | 'charger' | 'orbiter';

export interface BugEnemy {
  id: number;
  archetype: BugArchetype;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  radius: number;
  stateTimer: number;
  chargePhase: 'idle' | 'telegraph' | 'charging';
  chargeDirX: number;
  chargeDirY: number;
  orbitAngle: number;
  hitFlash: number;
  koTimer: number; // >0 means dissolving/toppling
}

export function stepEnemyPolicy(
  enemy: BugEnemy,
  playerPos: Vec2,
  dt: number,
  bounds: { width: number; height: number }
): BugEnemy {
  if (enemy.koTimer > 0) {
    return {
      ...enemy,
      x: enemy.x + enemy.vx * dt,
      y: enemy.y + enemy.vy * dt,
      koTimer: Math.max(0, enemy.koTimer - dt),
    };
  }

  const next = { ...enemy, hitFlash: Math.max(0, enemy.hitFlash - dt) };
  const dx = playerPos.x - next.x;
  const dy = playerPos.y - next.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  if (next.archetype === 'chaser') {
    const speed = 78;
    next.vx = ux * speed;
    next.vy = uy * speed;
    next.x += next.vx * dt;
    next.y += next.vy * dt;
  } else if (next.archetype === 'charger') {
    next.stateTimer -= dt;
    if (next.chargePhase === 'idle') {
      const speed = 46;
      next.x += ux * speed * dt;
      next.y += uy * speed * dt;
      if (next.stateTimer <= 0 && dist < 340) {
        next.chargePhase = 'telegraph';
        next.stateTimer = 0.55; // Visible telegraph windup
        next.chargeDirX = ux;
        next.chargeDirY = uy;
      }
    } else if (next.chargePhase === 'telegraph') {
      if (next.stateTimer <= 0) {
        next.chargePhase = 'charging';
        next.stateTimer = 0.45;
      }
    } else {
      const dashSpeed = 290;
      next.x += next.chargeDirX * dashSpeed * dt;
      next.y += next.chargeDirY * dashSpeed * dt;
      if (next.stateTimer <= 0) {
        next.chargePhase = 'idle';
        next.stateTimer = 1.6;
      }
    }
  } else {
    // Orbiter circles at medium distance then drifts subtly toward player
    next.orbitAngle += 1.6 * dt;
    const desiredRadius = 145;
    const targetX = playerPos.x + Math.cos(next.orbitAngle) * desiredRadius;
    const targetY = playerPos.y + Math.sin(next.orbitAngle) * desiredRadius;
    const ox = targetX - next.x;
    const oy = targetY - next.y;
    const oDist = Math.hypot(ox, oy) || 1;
    const speed = 115;
    next.x += (ox / oDist) * speed * dt;
    next.y += (oy / oDist) * speed * dt;
  }

  next.x = clamp(next.x, next.radius + 8, bounds.width - next.radius - 8);
  next.y = clamp(next.y, next.radius + 8, bounds.height - next.radius - 8);
  return next;
}

export function createParticlePool(capacity: number): ArcadeParticle[] {
  return Array.from({ length: capacity }, () => ({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 0.35,
    size: 4,
    color: '#3B82F6',
  }));
}

export function emitParticles(
  pool: ArcadeParticle[],
  x: number,
  y: number,
  color: string,
  count: number,
  speed = 130
): void {
  let spawned = 0;
  for (let i = 0; i < pool.length && spawned < count; i++) {
    const p = pool[i];
    if (!p.active) {
      const angle = (Math.PI * 2 * spawned) / count + (i % 3) * 0.22;
      const spd = speed * (0.55 + ((i * 37) % 10) * 0.08);
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.maxLife = 0.28 + ((i * 19) % 5) * 0.05;
      p.life = p.maxLife;
      p.size = 3 + (i % 3);
      p.color = color;
      spawned++;
    }
  }
}

export function stepParticlePool(pool: ArcadeParticle[], dt: number): void {
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i];
    if (!p.active) continue;
    p.life -= dt;
    if (p.life <= 0) {
      p.active = false;
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.94;
    p.vy *= 0.94;
  }
}
