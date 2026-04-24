(function () {
  window.audioState = window.audioState || {
    muted: false,
    levels: {
      master: 0.8,
      dice: 0.85,
      trivia: 0.8,
      effects: 0.8
    }
  };

  function getAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;

      if (!window.__anatomyAudioCtx) {
        window.__anatomyAudioCtx = new AudioCtx();
      }

      if (window.__anatomyAudioCtx.state === "suspended") {
        window.__anatomyAudioCtx.resume();
      }

      return window.__anatomyAudioCtx;
    } catch {
      return null;
    }
  }

  function getLevel(type) {
    const master = window.audioState.levels.master ?? 0.8;
    const specific = window.audioState.levels[type] ?? 0.8;
    return master * specific;
  }

  function tone(freq, duration, type, volume) {
    if (window.audioState.muted) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;

      const finalVolume = Math.max(0.0001, volume * getLevel(type));

      gain.gain.setValueAtTime(finalVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + duration / 1000
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch {}
  }

  window.setAudioMuted = function (muted) {
    window.audioState.muted = !!muted;
  };

  window.setSoundLevels = function (levels) {
    window.audioState.levels = {
      ...window.audioState.levels,
      ...levels
    };
  };

  window.playDiceSound = function () {
    tone(420, 70, "dice", 0.035);
    setTimeout(() => tone(520, 75, "dice", 0.035), 75);
    setTimeout(() => tone(640, 90, "dice", 0.03), 155);
  };

  window.playCorrectSound = function () {
    tone(620, 110, "effects", 0.04);
    setTimeout(() => tone(780, 120, "effects", 0.035), 115);
    setTimeout(() => tone(940, 130, "effects", 0.025), 235);
  };

  window.playWrongSound = function () {
    tone(260, 180, "effects", 0.04);
    setTimeout(() => tone(190, 180, "effects", 0.03), 120);
  };

  window.playTriviaTickSound = function () {
    tone(520, 50, "trivia", 0.018);
  };

  window.playStartSound = function () {
    tone(440, 100, "effects", 0.032);
    setTimeout(() => tone(660, 120, "effects", 0.034), 100);
  };

  window.playMissTurnSound = function () {
    tone(220, 180, "effects", 0.035);
    setTimeout(() => tone(180, 200, "effects", 0.025), 130);
  };

  window.playCardSound = function () {
    tone(560, 80, "effects", 0.03);
    setTimeout(() => tone(720, 100, "effects", 0.028), 90);
  };

  window.playWinSound = function () {
    tone(520, 100, "effects", 0.04);
    setTimeout(() => tone(680, 100, "effects", 0.04), 110);
    setTimeout(() => tone(840, 140, "effects", 0.04), 220);
    setTimeout(() => tone(1040, 180, "effects", 0.035), 360);
  };

  document.addEventListener("click", () => {
    getAudioContext();
  }, { once: true });
})();
