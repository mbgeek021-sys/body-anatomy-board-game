window.audioEnabled = true;
window.audioStarted = false;
window.audioCtx = null;
window.masterGain = null;
window.musicTimer = null;

window.ensureAudio = function () {
  if (window.audioCtx) return window.audioCtx;

  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;

  window.audioCtx = new AC();

  window.masterGain = window.audioCtx.createGain();
  window.masterGain.gain.value = 0.85;
  window.masterGain.connect(window.audioCtx.destination);

  return window.audioCtx;
};

window.resumeAudio = async function () {
  const ctx = window.ensureAudio();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    try { await ctx.resume(); } catch {}
  }
};

window.playTone = async function (
  freq = 440,
  duration = 0.25,
  type = "sine",
  volume = 0.16,
  when = 0
) {
  if (!window.audioEnabled) return;

  const ctx = window.ensureAudio();
  if (!ctx) return;

  await window.resumeAudio();

  const now = ctx.currentTime + when;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(window.masterGain);

  osc.start(now);
  osc.stop(now + duration + 0.05);
};

/* ---------- NEW LOFI MUSIC ---------- */

window.stopAmbient = function () {
  clearInterval(window.musicTimer);
  window.musicTimer = null;
};

window.playLofiBar = async function () {
  const notes = [
    261.63, // C
    329.63, // E
    392.00, // G
    329.63, // E
    293.66, // D
    349.23, // F
    440.00, // A
    349.23  // F
  ];

  let t = 0;

  for (let i = 0; i < notes.length; i++) {
    window.playTone(notes[i], 0.55, "triangle", 0.07, t);
    window.playTone(notes[i] / 2, 0.55, "sine", 0.035, t); // bass
    t += 0.6;
  }
};

window.startAmbient = async function () {
  if (!window.audioEnabled) return;
  if (window.musicTimer) return;

  await window.resumeAudio();

  window.playLofiBar();

  window.musicTimer = setInterval(() => {
    window.playLofiBar();
  }, 4800);
};

/* ---------- GAME SOUNDS ---------- */

window.playClick = function () {
  window.playTone(650, 0.06, "square", 0.14);
};

window.playDiceSound = async function () {
  for (let i = 0; i < 7; i++) {
    window.playTone(240 + i * 50, 0.06, "triangle", 0.16, i * 0.05);
  }
};

window.playMoveSound = async function () {
  window.playTone(420, 0.08, "triangle", 0.10);
};

window.playCorrectSound = async function () {
  window.playTone(523, 0.10, "triangle", 0.18, 0);
  window.playTone(659, 0.12, "triangle", 0.18, 0.10);
  window.playTone(783, 0.16, "triangle", 0.18, 0.22);
};

window.playWrongSound = async function () {
  window.playTone(280, 0.12, "sawtooth", 0.18, 0);
  window.playTone(220, 0.14, "sawtooth", 0.18, 0.10);
};

window.playMissTurnSound = async function () {
  window.playTone(260, 0.10, "square", 0.18, 0);
  window.playTone(210, 0.14, "square", 0.18, 0.10);
};

window.playGameStartSound = async function () {
  window.playTone(392, 0.12, "triangle", 0.18, 0);
  window.playTone(523, 0.14, "triangle", 0.18, 0.10);
  window.playTone(659, 0.20, "triangle", 0.18, 0.22);
};

window.startGameAudio = async function () {
  if (window.audioStarted) return;

  window.audioStarted = true;
  await window.resumeAudio();
  await window.startAmbient();
};

window.toggleAudio = async function () {
  window.audioEnabled = !window.audioEnabled;

  if (!window.audioEnabled) {
    window.stopAmbient();
    return;
  }

  await window.startAmbient();
};
