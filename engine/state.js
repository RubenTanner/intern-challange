export const createStates = (states = {}) => {
  let current = null;

  return {
    get current() {
      return current;
    },

    is: (name) => current === name,

    change(name, ...args) {
      if (!(name in states)) throw new Error(`unknown state: ${name}`);
      states[current]?.exit?.();
      current = name;
      states[name]?.enter?.(...args);
    },

    update(dt) {
      states[current]?.update?.(dt);
    },

    render(dt) {
      states[current]?.render?.(dt);
    },
  };
};
