window.getAudioCtx = function(){
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!window.__bodyGameAudioCtx) window.__bodyGameAudioCtx = new AudioCtx();
  return window.__bodyGameAudioCtx;
};

window.unlockAudio = async function(){
  const ctx = window.getAudioCtx();
  if (!ctx) return null;
  if (ctx.state === 'suspended') await ctx.resume();
  return ctx;
};

window.playTone = function(ctx, freq, start, duration, type='sine', gainValue=.03){
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
};

window.playDiceSound = async function(){
  const ctx = await window.unlockAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  window.playTone(ctx,150,now,.08,'triangle',.05);
  window.playTone(ctx,210,now+.06,.08,'triangle',.05);
};
