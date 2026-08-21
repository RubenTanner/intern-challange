// Game loop stuff - uses requestAnimationFrame driver

export const createLoop = ({ update, render, maxStep = 0.05 } = {}) => {
  let rafId = null;
  let last = null;
  let running = false;
  let paused = false;

  const frame = (now) => {
    rafId = requestAnimationFrame(frame);
    if (last === null) {
      last = now;
      return;
    }
    const dt = Math.min((now - last) / 1000, maxStep);
    last = now;
    if (!paused) update?.(dt);
    render?.(dt);
  };

  return {
    start() {
      // pause if youre nice to it
      if (running) return;
      running = true;
      last = null;
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      // pause if you piss it off
      if (!running) return;
      running = false;
      cancelAnimationFrame(rafId);
      rafId = null;
    },
    pause() {
      // no more loop for oyu
      paused = true;
    },
    resume() {
      // as it says on the tin
      paused = false;
      last = null;
    },
    get paused() {
      // is the game paused
      return paused;
    },
    get running() {
      //you guessed it...is the game running
      return running;
    },
  };
};
