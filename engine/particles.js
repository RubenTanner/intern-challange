const randBetween = ([lo, hi]) => lo + Math.random() * (hi - lo); // defo a better way for this

export const createParticles = (max = 256) => {
  //alot of this was stolen im not even gonna lie
  // max 256 at one time because memory stuff
  const pool = Array.from({ length: max }, () => ({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 0,
    size: 0,
    color: "#fff",
    gravity: 0,
    drag: 0,
    shape: "rect",
  }));
  let cursor = 0;

  return {
    emit({
      x,
      y,
      count = 8,
      speed = [40, 120],
      angle = -Math.PI / 2, // up to the sky
      spread = Math.PI / 3,
      life = [0.3, 0.7],
      size = [2, 5],
      color = "#ffffff",
      gravity = 0,
      drag = 0,
      shape = "rect",
      vx = 0, //velocity x
      vy = 0, //i wonder what this could be...
    }) {
      for (let i = 0; i < count; i++) {
        const p = pool[cursor];
        cursor = (cursor + 1) % max;
        const a = angle + (Math.random() - 0.5) * spread;
        const s = randBetween(speed);
        p.active = true;
        p.x = x;
        p.y = y;
        p.vx = vx + Math.cos(a) * s;
        p.vy = vy + Math.sin(a) * s;
        p.maxLife = randBetween(life);
        p.life = p.maxLife;
        p.size = randBetween(size);
        p.color = Array.isArray(color) ? color[i % color.length] : color;
        p.gravity = gravity;
        p.drag = drag;
        p.shape = shape;
      }
    },

    update(dt) {
      for (const p of pool) {
        if (!p.active) continue;
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          continue;
        }
        p.vy += p.gravity * dt;
        const decay = Math.exp(-p.drag * dt);
        p.vx *= decay;
        p.vy *= decay;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    },

    draw(r) {
      for (const p of pool) {
        if (!p.active) continue;
        const t = p.life / p.maxLife;
        r.alpha(t, () => {
          const s = p.size * (0.5 + t * 0.5);
          if (p.shape === "circle") r.circle(p.x, p.y, s / 2, p.color);
          else r.rect(p.x - s / 2, p.y - s / 2, s, s, p.color);
        });
      }
    },

    clear() {
      for (const p of pool) p.active = false;
    },
  };
};
