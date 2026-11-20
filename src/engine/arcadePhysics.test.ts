import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampDt,
  createParticlePool,
  emitParticles,
  moveWithWallCollision,
  stepEnemyPolicy,
  stepParticlePool,
  stepPlatformerBody,
  type BugEnemy,
} from './arcadePhysics';

test('clampDt caps large frame deltas safely', () => {
  assert.equal(clampDt(0.016), 0.016);
  assert.equal(clampDt(0.5), 0.05);
  assert.equal(clampDt(-1), 0);
});

test('moveWithWallCollision prevents passing through solid walls and clamps to arena bounds', () => {
  const walls = [{ x: 100, y: 80, w: 40, h: 120 }];
  const blocked = moveWithWallCollision(
    { x: 84, y: 120 },
    28,
    12,
    0,
    { width: 640, height: 400 },
    walls
  );
  // 84 + 12 + 14 = 110 > 100, so X movement is blocked cleanly
  assert.equal(blocked.x, 84);

  const open = moveWithWallCollision(
    { x: 50, y: 120 },
    28,
    10,
    -15,
    { width: 640, height: 400 },
    walls
  );
  assert.equal(open.x, 60);
  assert.equal(open.y, 105);
});

test('stepPlatformerBody supports jumping, coyote time, landing on platforms, and dash speed', () => {
  const platforms = [{ x: 120, y: 240, w: 120, h: 16 }];
  const startBody = {
    x: 50,
    y: 300,
    vx: 0,
    vy: 0,
    w: 32,
    h: 36,
    onGround: true,
    coyoteTimer: 0.11,
    jumpBufferTimer: 0,
  };

  const { body: afterJump, jumped } = stepPlatformerBody(
    startBody,
    { moveX: 1, jumpPressed: true, jumpHeld: true, dashActive: false },
    platforms,
    0.016,
    720,
    336
  );
  assert.equal(jumped, true);
  assert.equal(afterJump.vy < 0, true);
  assert.equal(afterJump.x > startBody.x, true);

  // Dash moves faster horizontally than normal walk
  const { body: normalWalk } = stepPlatformerBody(
    startBody,
    { moveX: 1, jumpPressed: false, jumpHeld: false, dashActive: false },
    platforms,
    0.02,
    720,
    336
  );
  const { body: dashMove } = stepPlatformerBody(
    startBody,
    { moveX: 1, jumpPressed: false, jumpHeld: false, dashActive: true },
    platforms,
    0.02,
    720,
    336
  );
  assert.equal(dashMove.x > normalWalk.x, true);
});

test('stepEnemyPolicy executes distinct chaser, charger telegraph, and orbiter behaviors', () => {
  const baseEnemy: BugEnemy = {
    id: 1,
    archetype: 'charger',
    label: 'IndexError',
    x: 300,
    y: 200,
    vx: 0,
    vy: 0,
    hp: 2,
    maxHp: 2,
    radius: 18,
    stateTimer: 0.01,
    chargePhase: 'idle',
    chargeDirX: 0,
    chargeDirY: 0,
    orbitAngle: 0,
    hitFlash: 0,
    koTimer: 0,
  };

  // Charger enters visible telegraph phase when player is in range
  const telegraphed = stepEnemyPolicy(baseEnemy, { x: 150, y: 200 }, 0.02, { width: 720, height: 420 });
  assert.equal(telegraphed.chargePhase, 'telegraph');
  assert.equal(telegraphed.chargeDirX < 0, true);

  // Orbiter updates orbit angle
  const orbiter = stepEnemyPolicy(
    { ...baseEnemy, archetype: 'orbiter', orbitAngle: 0 },
    { x: 150, y: 200 },
    0.05,
    { width: 720, height: 420 }
  );
  assert.equal(orbiter.orbitAngle > 0, true);
});

test('pooled particle ring buffer emits and decays without allocating new array slots', () => {
  const pool = createParticlePool(12);
  emitParticles(pool, 100, 100, '#1D4ED8', 6);
  assert.equal(pool.filter((p) => p.active).length, 6);
  for (let i = 0; i < 30; i++) {
    stepParticlePool(pool, 0.03);
  }
  assert.equal(pool.filter((p) => p.active).length, 0);
  assert.equal(pool.length, 12);
});
