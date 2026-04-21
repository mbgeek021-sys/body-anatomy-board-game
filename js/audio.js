window.audioEnabled = true;
window.audioStarted = false;
window.audioCtx = null;
window.masterGain = null;

window.ensureAudio = function () {
  if (window.audioCtx) return window.audioCtx;

  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;

  window.audioCtx = new AC();

  window.masterGain = window.audioCtx.createGain();
  window.masterGain.gain.value = 0.9;
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
  duration = 0.18,
  type = "sine",
  volume = 0.18,
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
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(window.masterGain);

  osc.start(now);
  osc.stop(now + duration + 0.05);
};

/* ---------- NO BACKGROUND AUDIO ---------- */

window.startAmbient = async function(){};
window.stopAmbient = function(){};

/* ---------- GAME SOUNDS ---------- */

window.playClick = function () {
  window.playTone(650, 0.06, "square", 0.14);
};

window.playDiceSound = async function () {
  for (let i = 0; i < 7; i++) {
    window.playTone(230 + i * 50, 0.06, "triangle", 0.18, i * 0.05);
  }
};

window.playMoveSound = async function () {
  window.playTone(420, 0.08, "triangle", 0.12);
};

window.playCorrectSound = async function () {
  window.playTone(523, 0.10, "triangle", 0.20, 0);
  window.playTone(659, 0.12, "triangle", 0.20, 0.10);
  window.playTone(783, 0.18, "triangle", 0.22, 0.22);
};

window.playWrongSound = async function () {
  window.playTone(280, 0.12, "sawtooth", 0.20, 0);
  window.playTone(220, 0.16, "sawtooth", 0.20, 0.10);
};

window.playMissTurnSound = async function () {
  window.playTone(260, 0.10, "square", 0.18, 0);
  window.playTone(210, 0.14, "square", 0.18, 0.10);
};

window.playGameStartSound = async function () {
  window.playTone(392, 0.12, "triangle", 0.20, 0);
  window.playTone(523, 0.14, "triangle", 0.20, 0.10);
  window.playTone(659, 0.22, "triangle", 0.22, 0.22);
};

window.startGameAudio = async function () {
  if (window.audioStarted) return;

  window.audioStarted = true;
  await window.resumeAudio();
};

window.toggleAudio = async function () {
  window.audioEnabled = !window.audioEnabled;
};
