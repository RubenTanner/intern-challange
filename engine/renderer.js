//yeah man thank tabnine for alot of this - i still dont fully understand
export const createRenderer = (canvas, { width, height }) => {
  // create a renderer for a canvas, with a virtual width/height (for scaling)
  const ctx = canvas.getContext("2d");
  const camera = { x: 0, y: 0 };
  let scale = 1;
  let shakeTime = 0;
  let shakeMag = 0;
  let shakeX = 0;
  let shakeY = 0;

  const resize = () => {
    // resize canvas to match CSS size, scaled for device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth || width;
    const ch = canvas.clientHeight || height;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    scale = Math.min(canvas.width / width, canvas.height / height);
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  const r = {
    camera,
    width,
    height,

    shake(mag, duration = 0.3) {
      shakeMag = Math.max(shakeMag, mag);
      shakeTime = Math.max(shakeTime, duration);
    },

    begin(dt = 0) {
      if (shakeTime > 0) {
        shakeTime -= dt;
        const m = shakeMag * Math.min(1, shakeTime / 0.2);
        shakeX = (Math.random() * 2 - 1) * m;
        shakeY = (Math.random() * 2 - 1) * m;
        if (shakeTime <= 0) shakeMag = 0;
      } else {
        shakeX = 0;
        shakeY = 0;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.save();
      ctx.translate(-camera.x + shakeX, -camera.y + shakeY);
    },

    end() {
      ctx.restore();
    },

    fixed(fn) {
      ctx.save();
      ctx.translate(camera.x - shakeX * 0.5, camera.y - shakeY * 0.5);
      fn();
      ctx.restore();
    },

    alpha(a, fn) {
      const prev = ctx.globalAlpha;
      ctx.globalAlpha = prev * a;
      fn();
      ctx.globalAlpha = prev;
    },

    rect(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    },

    roundRect(x, y, w, h, radius, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.fill();
    },

    circle(x, y, radius, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    },

    poly(points, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (const [px, py] of points.slice(1)) ctx.lineTo(px, py);
      ctx.closePath();
      ctx.fill();
    },

    line(x1, y1, x2, y2, color, lineWidth = 2) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    },

    text(
      str,
      x,
      y,
      {
        size = 16,
        color = "#fff",
        align = "left",
        font = "sans-serif",
        weight = "600",
      } = {},
    ) {
      ctx.fillStyle = color;
      ctx.font = `${weight} ${size}px ${font}`;
      ctx.textAlign = align;
      ctx.textBaseline = "middle";
      ctx.fillText(str, x, y);
    },

    raw(fn) {
      ctx.save();
      fn(ctx);
      ctx.restore();
    },

    destroy() {
      observer.disconnect();
    },
  };

  return r;
};
