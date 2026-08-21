export const createAudio = ({ storage, key = "muted" } = {}) => {
  let ctx = null;
  let muted = storage?.get(key, false) ?? false;

  const ensure = () => {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };

  const unlock = () => {
    ensure();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);

  const envelope = (gainNode, t0, volume, duration) => {
    gainNode.gain.setValueAtTime(volume, t0);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  };

  return {
    get muted() {
      return muted;
    },

    toggleMute() {
      muted = !muted;
      storage?.set(key, muted);
      return muted;
    },

    tone({
      freq = 440,
      end = freq,
      duration = 0.12,
      type = "square",
      volume = 0.12,
      delay = 0,
    } = {}) {
      if (muted || !ctx) return;
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(end, 1),
        t0 + duration,
      );
      envelope(gain, t0, volume, duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.02);
    },

    thud({ duration = 0.08, volume = 0.2, cutoff = 400, delay = 0 } = {}) {
      if (muted || !ctx) return;
      const t0 = ctx.currentTime + delay;
      const frames = Math.ceil(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = cutoff;
      const gain = ctx.createGain();
      envelope(gain, t0, volume, duration);
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start(t0);
    },

    arp(
      freqs,
      { step = 0.07, duration = 0.1, type = "square", volume = 0.1 } = {},
    ) {
      freqs.forEach((freq, i) =>
        this.tone({ freq, duration, type, volume, delay: i * step }),
      );
    },
  };
};
