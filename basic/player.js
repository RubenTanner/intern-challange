// Player controller: movement feel lives here.
//
// Coyote time, jump buffering and variable jump height are all timers in
// plain state — nothing here touches the DOM or a clock other than the
// loop's dt.

import { createEntity } from '/engine/entity.js';
import { applyGravity, moveBody } from '/engine/physics.js';
import { PLAYER, PHYSICS } from './config.js';

export const createPlayer = (start) => ({
  ...createEntity({
    x: start.x - PLAYER.w / 2,
    y: start.y - PLAYER.h,
    w: PLAYER.w,
    h: PLAYER.h,
  }),
  facing: 1,
  coyote: 0, // time remaining to jump after leaving ground
  buffer: 0, // time remaining for a buffered jump press
  squashX: 1, // render-only squash & stretch
  squashY: 1,
  wasOnGround: false,
});

export const updatePlayer = (player, input, solids, audio, particles, dt) => {
  // --- horizontal ---
  const dir = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
  const accel = player.onGround ? PLAYER.accel : PLAYER.airAccel;
  if (dir !== 0) {
    player.vx += dir * accel * dt;
    player.vx = Math.max(-PLAYER.maxSpeed, Math.min(PLAYER.maxSpeed, player.vx));
    player.facing = dir;
  } else {
    player.vx *= Math.exp(-PLAYER.friction * dt);
    if (Math.abs(player.vx) < 4) player.vx = 0;
  }

  // --- jump timers ---
  player.coyote = player.onGround ? PLAYER.coyoteTime : Math.max(0, player.coyote - dt);
  player.buffer = input.wasPressed('jump') ? PLAYER.jumpBuffer : Math.max(0, player.buffer - dt);

  if (player.buffer > 0 && player.coyote > 0) {
    player.vy = -PLAYER.jumpVelocity;
    player.coyote = 0;
    player.buffer = 0;
    player.squashX = 0.7; // stretch tall on take-off
    player.squashY = 1.3;
    audio.tone({ freq: 300, end: 640, duration: 0.14, type: 'square', volume: 0.08 });
  }

  // variable jump height: releasing jump while rising cuts the ascent
  if (!input.isDown('jump') && player.vy < 0) {
    player.vy *= 1 - (1 - PLAYER.jumpCutFactor) * Math.min(1, dt * 20);
  }

  // --- integrate & collide ---
  applyGravity(player, PHYSICS, dt);
  moveBody(player, solids, dt);

  // landing: thud, dust, squash flat
  if (player.onGround && !player.wasOnGround) {
    player.squashX = 1.35;
    player.squashY = 0.65;
    audio.thud({ duration: 0.07, volume: 0.15, cutoff: 300 });
    particles.emit({
      x: player.x + player.w / 2,
      y: player.y + player.h,
      count: 6,
      speed: [30, 90],
      angle: -Math.PI / 2,
      spread: Math.PI,
      life: [0.15, 0.35],
      size: [2, 4],
      color: '#c9c3b4',
      drag: 4,
    });
  }
  player.wasOnGround = player.onGround;

  // squash & stretch relaxes back to 1
  player.squashX += (1 - player.squashX) * Math.min(1, dt * 12);
  player.squashY += (1 - player.squashY) * Math.min(1, dt * 12);
};

// Riding a moving platform: if the player finished last frame standing on a
// mover, apply the delta the mover travelled this frame before physics runs.
export const ridePlatform = (player, movers) => {
  const m = movers.find((mv) => mv === player.groundedOn);
  if (m) {
    player.x += m.dx;
    player.y += m.dy;
  }
};
