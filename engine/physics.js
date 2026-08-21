import { overlaps } from "./entity.js"; // for collisions BANG boom

export const applyGravity = (body, { gravity, maxFall }, dt) => {
  // who doesnt love some gravity?
  body.vy = Math.min(body.vy + gravity * dt, maxFall);
};

const resolveX = (body, solids, dir) => {
  // dir is +1 for right, -1 for left
  for (const s of solids) {
    if (!overlaps(body, s)) continue;
    if (dir > 0) body.x = s.x - body.w;
    else body.x = s.x + s.w;
    body.vx = 0;
    body.hitWall = true;
  }
};

const resolveY = (body, solids, dir) => {
  // dir is +1 for down, -1 for up
  for (const s of solids) {
    if (!overlaps(body, s)) continue;
    if (dir > 0) {
      body.y = s.y - body.h;
      body.onGround = true;
      body.groundedOn = s;
    } else {
      body.y = s.y + s.h;
      body.hitCeiling = true;
    }
    body.vy = 0;
  }
};

export const moveBody = (body, solids, dt, maxSweep = 8) => {
  // maxSweep is the maximum distance to sweep in one step, to avoid tunneling through thin solids
  body.onGround = false;
  body.hitWall = false;
  body.hitCeiling = false;
  body.groundedOn = null;

  const dx = body.vx * dt;
  const dy = body.vy * dt;
  const steps = Math.max(
    1,
    Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / maxSweep),
  );

  for (let i = 0; i < steps; i++) {
    if (dx !== 0) {
      body.x += dx / steps;
      resolveX(body, solids, Math.sign(dx));
      if (body.hitWall) break; // stop moving if we hit a wall
    }
  }
  for (let i = 0; i < steps; i++) {
    if (dy !== 0) {
      body.y += dy / steps;
      resolveY(body, solids, Math.sign(dy));
      if (body.onGround || body.hitCeiling) break;
    }
  }
};
