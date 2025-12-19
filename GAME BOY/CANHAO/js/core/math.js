// js/core/math.js

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

export function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function distXY(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

export function angleBetween(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function normalize(dx, dy) {
  const len = Math.hypot(dx, dy) || 1;
  return {
    x: dx / len,
    y: dy / len,
    len,
  };
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
