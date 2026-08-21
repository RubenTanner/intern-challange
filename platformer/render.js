// All drawing for the platformer. Pure functions of state — nothing in
// here mutates game objects or reads the DOM.

import { TILE, COLORS, VIEW } from './config.js';

export const drawBackground = (r, camera, level) => {
  r.fixed(() => {
    r.rect(0, 0, VIEW.width, VIEW.height, COLORS.bg);
    // distant shelving silhouettes, parallaxed at 20% of camera speed
    const par = camera.x * 0.2;
    for (let i = -1; i < 8; i++) {
      const x = ((i * 260 - par) % (VIEW.width + 260) + VIEW.width + 260) % (VIEW.width + 260) - 130;
      r.rect(x, VIEW.height - 180, 90, 180, COLORS.bgFar);
      r.rect(x + 110, VIEW.height - 120, 60, 120, COLORS.bgFar);
    }
  });
};

export const drawLevel = (r, level, time) => {
  for (const s of level.solids) {
    r.rect(s.x, s.y, s.w, s.h, COLORS.solid);
    r.rect(s.x, s.y, s.w, 3, '#ffffff');
    r.rect(s.x, s.y + s.h - 3, s.w, 3, COLORS.solidEdge);
  }

  for (const m of level.movers) {
    r.rect(m.x, m.y, m.w, m.h, COLORS.mover);
    r.rect(m.x + 3, m.y + 2, m.w - 6, 2, '#ffffff');
  }

  for (const { draw } of level.spikes) {
    const n = Math.round(draw.w / (TILE / 2));
    const w = draw.w / n;
    for (let i = 0; i < n; i++) {
      const x = draw.x + i * w;
      r.poly(
        [
          [x, draw.y + draw.h],
          [x + w / 2, draw.y + draw.h - 16],
          [x + w, draw.y + draw.h],
        ],
        COLORS.hazard,
      );
    }
  }

  for (const c of level.coins) {
    if (c.taken) continue;
    const bob = Math.sin(time * 4 + c.x * 0.05) * 3;
    // spin: width oscillates so the disc appears to rotate
    const spin = Math.abs(Math.sin(time * 3 + c.x * 0.1));
    r.raw((ctx) => {
      ctx.translate(c.x, c.y + bob);
      ctx.scale(0.4 + spin * 0.6, 1);
      ctx.fillStyle = COLORS.coin;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff3d1';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (level.exit) {
    const e = level.exit;
    const pulse = 0.75 + Math.sin(time * 3) * 0.25;
    r.alpha(pulse, () => r.rect(e.x - 4, e.y - 4, e.w + 8, e.h + 8, COLORS.exit));
    r.rect(e.x, e.y, e.w, e.h, '#2a2140');
    r.circle(e.x + e.w - 7, e.y + e.h / 2, 2.5, COLORS.exit);
  }
};

export const drawPlayer = (r, p) => {
  const w = p.w * p.squashX;
  const h = p.h * p.squashY;
  const x = p.x + p.w / 2 - w / 2;
  const y = p.y + p.h - h; // squash keeps feet planted
  r.rect(x, y, w, h, COLORS.player);
  r.rect(x, y + h - 4, w, 4, COLORS.playerEdge);
  // eyes look where the player faces
  const eyeX = x + w / 2 + p.facing * w * 0.18;
  r.circle(eyeX - 4, y + h * 0.3, 2.5, '#10131c');
  r.circle(eyeX + 4, y + h * 0.3, 2.5, '#10131c');
};
