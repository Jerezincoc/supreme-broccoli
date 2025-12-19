// js/core/loop.js

export function createLoop({ update, draw }) {
  let running = false;
  let rafId = 0;

  // timestep fixo (60fps)
  const FIXED_DT = 1 / 60;
  const MAX_ACCUM = 0.25; // evita spiral of death

  let last = performance.now() / 1000;
  let acc = 0;

  function frame() {
    if (!running) return;

    const now = performance.now() / 1000;
    let delta = now - last;
    last = now;

    // clamp de delta
    if (delta < 0) delta = 0;
    if (delta > MAX_ACCUM) delta = MAX_ACCUM;

    acc += delta;

    // roda update em passos fixos
    while (acc >= FIXED_DT) {
      update(FIXED_DT);
      acc -= FIXED_DT;
    }

    draw();
    rafId = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now() / 1000;
      acc = 0;
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
    isRunning() {
      return running;
    }
  };
}
