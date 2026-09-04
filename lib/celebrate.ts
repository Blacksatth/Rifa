/**
 * Utilidades de "celebración" para reforzar momentos de éxito en la UI.
 *
 * - `celebrate()`: dispara confetti + un sonido sutil + vibración (si el
 *   dispositivo lo permite). Se usa, por ejemplo, al reservar un número.
 *
 * Todas las funciones degradan silenciosamente si el navegador no soporta
 * la característica (por ejemplo, sin AudioContext o sin vibración).
 */

import confetti from "canvas-confetti";

/** Reproduce un pequeño "ding" ascendente con Web Audio API (sin archivos). */
function playSuccessSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Ding principal (nota aguda)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);

    // Armónico (nota más grave, da cuerpo)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.value = 440;
    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.5);
  } catch (error) {
    console.error("Error reproduciendo sonido:", error);
  }
}

/** Vibra brevemente si el dispositivo lo permite. */
function vibrate() {
  try {
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate(80);
    }
  } catch (error) {
    console.error("Error vibrando:", error);
  }
}

/** Lanza confetti festivo desde los bordes inferiores. */
function fireConfetti() {
  const defaults = {
    spread: 90,
    ticks: 120,
    gravity: 0.9,
    decay: 0.92,
    startVelocity: 32,
    zIndex: 9999,
    colors: [
      "#a78bfa",
      "#8b5cf6",
      "#34d399",
      "#fbbf24",
      "#38bdf8",
      "#f472b6",
    ],
  };

  confetti({
    ...defaults,
    particleCount: 60,
    angle: 60,
    origin: { x: 0, y: 0.7 },
  });

  confetti({
    ...defaults,
    particleCount: 60,
    angle: 120,
    origin: { x: 1, y: 0.7 },
  });
}

/**
 * Celebra un éxito: confetti + sonido + vibración.
 * Todo es opcional y degrada silenciosamente donde no aplica.
 */
export function celebrate() {
  if (typeof window === "undefined") {
    return;
  }

  fireConfetti();
  playSuccessSound();
  vibrate();
}
