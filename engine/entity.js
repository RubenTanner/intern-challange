export const createEntity = (props = {}) => ({
  // entity is the rectangle
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  vx: 0,
  vy: 0,
  onGround: false,
  ...props,
});

export const rect = (x, y, w, h) => ({ x, y, w, h }); // bounding box

export const overlaps = (
  a,
  b, //is the rectangle a overlapping rectangle b?
) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export const pointInRect = (
  px,
  py,
  r, //is the point (px, py) inside rectangle r?
) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;

export const centerX = (r) => r.x + r.w / 2;
export const centerY = (r) => r.y + r.h / 2;
export const inset = (
  r,
  dx,
  dy = dx, // returns a new rectangle inset by dx, dy
) => rect(r.x + dx, r.y + dy, r.w - dx * 2, r.h - dy * 2);

export const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi); //clamp v to the range [lo, hi]

export const lerp = (a, b, t) => a + (b - a) * t; // linear interpolation (big word that basically is blend...thank you DR Matt)

export const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt)); // same as above but damping
