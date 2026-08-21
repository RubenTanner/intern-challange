import { createLoop } from "/engine/loop.js";
import { createInput } from "/engine/input.js";
import { createRenderer } from "/engine/renderer.js";
import { createAudio } from "/engine/audio.js";
import { createParticles } from "/engine/particles.js";
import { createStorage } from "/engine/storage.js";
import { createStates } from "/engine/state.js";
import { overlaps, inset, clamp, damp } from "/engine/entity.js";
import { VIEW, CAMERA, COLORS } from "./config.js";
import { LEVELS, parseLevel, updateMovers } from "./levels.js";
import { createPlayer, updatePlayer, ridePlatform } from "./player.js";
import { drawBackground, drawLevel, drawPlayer } from "./render.js";

const canvas = document.querySelector("#game");
const r = createRenderer(canvas, VIEW);
const storage = createStorage("basic.");
const audio = createAudio({ storage });
const particles = createParticles(256);
const input = createInput({
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  jump: ["Space", "ArrowUp", "KeyW"],
  pause: ["Escape"],
  restart: ["KeyR"],
});

const $ = (sel) => document.querySelector(sel);
const overlays = {
  menu: $("#overlay-menu"),
  paused: $("#overlay-paused"),
  clear: $("#overlay-clear"),
  win: $("#overlay-win"),
};
const hud = { level: $("#hud-level"), coins: $("#hud-coins") };
const showOverlay = (name) => {
  for (const [key, el] of Object.entries(overlays)) el.hidden = key !== name;
};

// --- run state ---
let levelIndex = 0;
let level = null;
let player = null;
let time = 0;
let clearTimer = 0;
let coinsBanked = 0; // collected in finished levels
let deaths = 0;
const totalCoins = LEVELS.reduce(
  (sum, l) => sum + parseLevel(l).coins.length,
  0,
);

const coinsHere = () => level.coins.filter((c) => c.taken).length;
const updateHud = () => {
  hud.level.textContent = `${levelIndex + 1}/${LEVELS.length} · ${level.name}`;
  hud.coins.textContent = `● ${coinsBanked + coinsHere()}/${totalCoins}`;
};

const loadLevel = (index) => {
  levelIndex = index;
  level = parseLevel(LEVELS[index]);
  player = createPlayer(level.start);
  time = 0;
  particles.clear();
  r.camera.x = clamp(
    player.x - VIEW.width / 2,
    0,
    Math.max(0, level.width - VIEW.width),
  );
  r.camera.y = clamp(
    player.y - VIEW.height / 2,
    0,
    Math.max(0, level.height - VIEW.height),
  );
  updateHud();
};

const updateCamera = (dt) => {
  const cx = r.camera.x + VIEW.width / 2;
  const cy = r.camera.y + VIEW.height / 2;
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  let tx = r.camera.x;
  let ty = r.camera.y;
  if (px > cx + CAMERA.deadZoneW / 2) tx += px - (cx + CAMERA.deadZoneW / 2);
  if (px < cx - CAMERA.deadZoneW / 2) tx += px - (cx - CAMERA.deadZoneW / 2);
  if (py > cy + CAMERA.deadZoneH / 2) ty += py - (cy + CAMERA.deadZoneH / 2);
  if (py < cy - CAMERA.deadZoneH / 2) ty += py - (cy - CAMERA.deadZoneH / 2);
  r.camera.x = damp(
    r.camera.x,
    clamp(tx, 0, Math.max(0, level.width - VIEW.width)),
    CAMERA.followRate,
    dt,
  );
  r.camera.y = damp(
    r.camera.y,
    clamp(ty, 0, Math.max(0, level.height - VIEW.height)),
    CAMERA.followRate,
    dt,
  );
};

const die = () => {
  deaths += 1;
  audio.tone({
    freq: 320,
    end: 60,
    duration: 0.35,
    type: "sawtooth",
    volume: 0.12,
  });
  r.shake(6, 0.3);
  particles.emit({
    x: player.x + player.w / 2,
    y: player.y + player.h / 2,
    count: 18,
    speed: [80, 240],
    angle: -Math.PI / 2,
    spread: Math.PI * 2,
    life: [0.3, 0.6],
    size: [2, 5],
    color: COLORS.player,
    gravity: 900,
  });
  loadLevel(levelIndex); // coins in the current level reset with it
};

const states = createStates({
  menu: {
    enter: () => showOverlay("menu"),
    update: () => {
      if (input.wasPressed("jump")) states.change("playing");
    },
  },
  playing: {
    enter: () => showOverlay(null),
    update: (dt) => {
      if (input.wasPressed("pause")) return states.change("paused");
      if (input.wasPressed("restart")) return loadLevel(levelIndex);
      time += dt;

      updateMovers(level.movers, time);
      ridePlatform(player, level.movers);
      updatePlayer(
        player,
        input,
        [...level.solids, ...level.movers],
        audio,
        particles,
        dt,
      );

      for (const c of level.coins) {
        if (
          c.taken ||
          Math.hypot(
            c.x - player.x - player.w / 2,
            c.y - player.y - player.h / 2,
          ) > 22
        )
          continue;
        c.taken = true;
        audio.tone({
          freq: 900,
          end: 1400,
          duration: 0.09,
          type: "triangle",
          volume: 0.1,
        });
        particles.emit({
          x: c.x,
          y: c.y,
          count: 8,
          speed: [40, 110],
          spread: Math.PI * 2,
          life: [0.2, 0.4],
          size: [2, 3],
          color: COLORS.coin,
          shape: "circle",
        });
        updateHud();
      }

      const hitbox = inset(player, 3, 2);
      if (
        player.y > level.height + 100 ||
        level.spikes.some((s) => overlaps(hitbox, s.hit))
      )
        return die();

      if (level.exit && overlaps(player, level.exit)) {
        coinsBanked += coinsHere();
        audio.arp([523, 659, 784, 1047], { type: "triangle", volume: 0.1 });
        states.change(levelIndex + 1 < LEVELS.length ? "clear" : "win");
      }
    },
  },
  clear: {
    enter: () => {
      showOverlay("clear");
      clearTimer = 1.2;
    },
    update: (dt) => {
      clearTimer -= dt;
      if (clearTimer <= 0) {
        loadLevel(levelIndex + 1);
        states.change("playing");
      }
    },
  },
  paused: {
    enter: () => showOverlay("paused"),
    exit: () => showOverlay(null),
    update: () => {
      if (input.wasPressed("pause") || input.wasPressed("jump"))
        states.change("playing");
    },
  },
  win: {
    enter: () => {
      showOverlay("win");
      $("#win-stats").textContent =
        `${coinsBanked}/${totalCoins} coins · ${deaths} ${deaths === 1 ? "respawn" : "respawns"}`;
    },
    update: () => {
      if (input.wasPressed("jump") || input.wasPressed("restart")) {
        coinsBanked = 0;
        deaths = 0;
        loadLevel(0);
        states.change("playing");
      }
    },
  },
});

const loop = createLoop({
  update: (dt) => {
    states.update(dt);
    particles.update(dt);
    input.endFrame();
  },
  render: (dt) => {
    r.begin(dt);
    drawBackground(r, r.camera, level);
    drawLevel(r, level, time);
    particles.draw(r);
    drawPlayer(r, player);
    r.end();
    if (states.is("playing")) updateCamera(dt);
  },
});

// --- DOM wiring: buttons write into the same action map as keys ---
input.bindButton($("#btn-left"), "left");
input.bindButton($("#btn-right"), "right");
input.bindButton($("#btn-jump"), "jump");
input.bindTouch(canvas, { tap: "jump" });
$("#btn-start").addEventListener("click", () => states.change("playing"));
$("#btn-resume").addEventListener("click", () => states.change("playing"));

const muteBtn = $("#btn-mute");
const styleMute = () => {
  muteBtn.textContent = audio.muted ? "SND OFF" : "SND ON";
  muteBtn.setAttribute("aria-pressed", String(audio.muted));
};
muteBtn.addEventListener("click", () => {
  audio.toggleMute();
  styleMute();
});
styleMute();

loadLevel(0);
states.change("menu");
loop.start();

// Dev hook (open /basic/?dev): exposes internals for automated playtests
// and level debugging. Not part of the engine API and never on by default.
if (new URLSearchParams(location.search).has("dev")) {
  window.__dev = {
    states,
    loadLevel,
    get player() {
      return player;
    },
    get level() {
      return level;
    },
  };
}
