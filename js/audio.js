window.audioEnabled = true;
window.audioStarted = false;
window.audioCtx = null;
window.masterGain = null;
window.ambientGain = null;
window.noiseNode = null;
window.noiseFilter = null;
window.lfoOsc = null;
window.lfoGain = null;
window.ambientPulseTimer = null;

window.ensureAudio = function(){
  if (window.audioCtx) return window.audioCtx;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  window.audioCtx = new AudioContextClass();

  window.masterGain = window.audioCtx.createGain();
  window.masterGain.gain.value = 0.28;
  window.masterGain.connect(window.audioCtx.destination);

  return window.audioCtx;
};

window.resumeAudio = async function(){
  const ctx = window.ensureAudio();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch {}
  }
};

window.playTone = async function(freq = 440, duration = 0.15, type = 'sine', volume = 0.08, when = 0){
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
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(window.masterGain);

  osc.start(now);
  osc.stop(now + duration + 0.03);
};

window.playClick = function(){
  window.playTone(620, 0.05, 'square', 0.04);
};

window.playDiceSound = async function(){
  if (!window.audioEnabled) return;
  for (let i = 0; i < 6; i++) {
    await window.playTone(220 + i * 40, 0.04, 'triangle', 0.04, i * 0.04);
  }
};

window.playGameStartSound = async function(){
  if (!window.audioEnabled) return;
  await window.playTone(392, 0.12, 'triangle', 0.06, 0);
  await window.playTone(523.25, 0.16, 'triangle', 0.07, 0.10);
  await window.playTone(659.25, 0.22, 'triangle', 0.08, 0.22);
};

window.playCorrectSound = async function(){
  if (!window.audioEnabled) return;
  await window.playTone(523.25, 0.10, 'triangle', 0.07, 0);
  await window.playTone(659.25, 0.12, 'triangle', 0.08, 0.10);
  await window.playTone(783.99, 0.16, 'triangle', 0.09, 0.22);
};

window.playWrongSound = async function(){
  if (!window.audioEnabled) return;
  await window.playTone(280, 0.10, 'sawtooth', 0.06, 0);
  await window.playTone(220, 0.14, 'sawtooth', 0.07, 0.09);
  await window.playTone(180, 0.18, 'sawtooth', 0.07, 0.20);
};

window.playMissTurnSound = async function(){
  if (!window.audioEnabled) return;
  await window.playTone(260, 0.08, 'square', 0.05, 0);
  await window.playTone(210, 0.12, 'square', 0.06, 0.08);
};

window.playMoveSound = async function(){
  if (!window.audioEnabled) return;
  await window.playTone(420, 0.05, 'triangle', 0.03, 0);
};

window.stopAmbient = function(){
  clearInterval(window.ambientPulseTimer);
  window.ambientPulseTimer = null;

  try { window.noiseNode?.stop(); } catch {}
  try { window.lfoOsc?.stop(); } catch {}

  window.noiseNode = null;
  window.noiseFilter = null;
  window.lfoOsc = null;
  window.lfoGain = null;
  window.ambientGain = null;
};

window.startAmbient = async function(){
  if (!window.audioEnabled) return;
  if (window.ambientGain) return;

  const ctx = window.ensureAudio();
  if (!ctx) return;
  await window.resumeAudio();

  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.18;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 520;
  filter.Q.value = 0.6;

  const gain = ctx.createGain();
  gain.gain.value = 0.02;

  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.08;

  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.004;

  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(window.masterGain);

  noise.start();
  lfo.start();

  window.noiseNode = noise;
  window.noiseFilter = filter;
  window.ambientGain = gain;
  window.lfoOsc = lfo;
  window.lfoGain = lfoGain;

  window.ambientPulseTimer = setInterval(() => {
    const t = ctx.currentTime;
    const pulse = ctx.createOscillator();
    const pulseGain = ctx.createGain();

    pulse.type = 'triangle';
    pulse.frequency.setValueAtTime(140 + Math.random() * 30, t);

    pulseGain.gain.setValueAtTime(0.0001, t);
    pulseGain.gain.linearRampToValueAtTime(0.012, t + 0.04);
    pulseGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

    pulse.connect(pulseGain);
    pulseGain.connect(window.masterGain);

    pulse.start(t);
    pulse.stop(t + 1.25);
  }, 2600);
};

window.startGameAudio = async function(){
  if (window.audioStarted) return;
  window.audioStarted = true;
  await window.resumeAudio();
  await window.startAmbient();
};

window.toggleAudio = async function(){
  window.audioEnabled = !window.audioEnabled;

  if (!window.audioEnabled) {
    window.stopAmbient();
    return;
  }

  await window.startAmbient();
};
