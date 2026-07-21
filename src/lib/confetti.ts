"use client";

import confetti from "canvas-confetti";

const THEME_COLORS = ["#10b981", "#34d399", "#8b5cf6", "#f59e0b"];

export function fireConfetti() {
  confetti({
    particleCount: 70,
    spread: 65,
    startVelocity: 35,
    origin: { y: 0.7 },
    colors: THEME_COLORS,
  });
}

export function fireBigConfetti() {
  const end = Date.now() + 700;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: THEME_COLORS });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: THEME_COLORS });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
