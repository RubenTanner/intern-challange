export const createStorage = (prefix = "") => {
  const keyFor = (key) => `${prefix}${key}`;

  return {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(keyFor(key));
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(keyFor(key), JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(keyFor(key));
      } catch {}
    },
  };
};
