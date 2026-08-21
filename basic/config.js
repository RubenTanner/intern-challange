export const TILE = 32;

export const VIEW = {
  width: 960,
  height: 540,
};

export const PHYSICS = {
  gravity: 2200,
  maxFall: 900,
};

export const PLAYER = {
  w: 22,
  h: 28,
  accel: 2600, // acceleration
  airAccel: 1800, // acceletation but in the air
  friction: 12,
  maxSpeed: 260,
  jumpVelocity: 620,
  jumpCutFactor: 0.4, // releasing jump early multiplies upward vy by this
  coyoteTime: 0.1, // seconds of grace after walking off a ledge
  jumpBuffer: 0.12, // seconds a jump press is remembered before landing
};

export const MOVER = {
  range: TILE * 2.5, // amplitude of platform patrol
  speed: 1.6, // radians/s of the sine patrol
};

export const CAMERA = {
  deadZoneW: 220,
  deadZoneH: 140,
  followRate: 8,
};

export const COLORS = {
  bg: "#131722",
  bgFar: "#1a2030",
  solid: "#e8e4da",
  solidEdge: "#c9c3b4",
  mover: "#7fd1c0",
  hazard: "#ef6461",
  coin: "#f4c95d",
  player: "#5aa9e6",
  playerEdge: "#3f7fb5",
  exit: "#a48be0",
  text: "#e8e4da",
};
