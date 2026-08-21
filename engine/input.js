export const createInput = (actionMap = {}) => {
  // kinda like keybinds
  const keyToAction = new Map();
  for (const [action, keys] of Object.entries(actionMap)) {
    for (const key of keys) keyToAction.set(key, action);
  }

  const down = new Set();
  const pressed = new Set();
  const anyListeners = new Set();
  const cleanups = [];

  const press = (action) => {
    if (action && !down.has(action)) pressed.add(action);
    if (action) down.add(action);
  };
  const release = (action) => down.delete(action);

  const onKeyDown = (e) => {
    const action = keyToAction.get(e.code);
    if (action) e.preventDefault();
    if (!e.repeat) {
      for (const fn of anyListeners) fn();
      if (action) press(action);
    }
  };
  const onKeyUp = (e) => release(keyToAction.get(e.code));
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  cleanups.push(() => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  });

  const listen = (el, type, fn, opts) => {
    el.addEventListener(type, fn, opts);
    cleanups.push(() => el.removeEventListener(type, fn, opts));
  };

  return {
    isDown: (action) => down.has(action),
    wasPressed: (action) => pressed.has(action),
    endFrame: () => pressed.clear(),

    // "press anything to restart" screens.
    onAny(fn) {
      anyListeners.add(fn);
      return () => anyListeners.delete(fn);
    },

    // A DOM element acting as a held button (on-screen d-pad, jump button).
    bindButton(el, action) {
      const start = (e) => {
        e.preventDefault();
        for (const fn of anyListeners) fn();
        press(action);
      };
      const stop = (e) => {
        e.preventDefault();
        release(action);
      };
      listen(el, "pointerdown", start);
      listen(el, "pointerup", stop);
      listen(el, "pointercancel", stop);
      listen(el, "pointerleave", stop);
    },

    // A touch surface: tap fires `tap` as a one-frame press, swiping down
    // holds `swipeDown` until the finger lifts.
    bindTouch(el, { tap, swipeDown } = {}) {
      let startY = 0;
      let startT = 0;
      let held = null;
      const start = (e) => {
        e.preventDefault();
        for (const fn of anyListeners) fn();
        startY = e.clientY;
        startT = performance.now();
        held = null;
        el.setPointerCapture?.(e.pointerId);
      };
      const move = (e) => {
        if (held === null && swipeDown && e.clientY - startY > 30) {
          held = swipeDown;
          press(held);
        }
      };
      const end = (e) => {
        e.preventDefault();
        if (held) {
          release(held);
          held = null;
        } else if (tap && performance.now() - startT < 400) {
          press(tap);
          release(tap); // one-frame pulse; wasPressed() still sees it
        }
      };
      listen(el, "pointerdown", start);
      listen(el, "pointermove", move);
      listen(el, "pointerup", end);
      listen(el, "pointercancel", end);
    },

    destroy() {
      for (const fn of cleanups) fn();
      cleanups.length = 0;
      anyListeners.clear();
      down.clear();
      pressed.clear();
    },
  };
};
