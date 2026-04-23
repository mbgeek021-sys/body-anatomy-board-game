(function () {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const TRIVIA = [
    {
      category: "Bones",
      q: "How many bones are in the adult human body?",
      choices: ["206", "180", "250", "300"],
      a: "206"
    },
    {
      category: "Heart",
      q: "How many chambers does the heart have?",
      choices: ["2", "3", "4", "5"],
      a: "4"
    },
    {
      category: "Brain",
      q: "Which organ controls the nervous system?",
      choices: ["Liver", "Brain", "Lung", "Kidney"],
      a: "Brain"
    },
    {
      category: "Muscles",
      q: "Which muscle helps breathing?",
      choices: ["Diaphragm", "Biceps", "Quadriceps", "Deltoid"],
      a: "Diaphragm"
    },
    {
      category: "Blood",
      q: "Red blood cells carry what?",
      choices: ["Oxygen", "Sugar", "Water", "Fat"],
      a: "Oxygen"
    }
  ];

  function players() {
    if (!Array.isArray(state.players)) state.players = [];
    return state.players;
  }

  function currentPlayerSafe() {
    const list = players();
    if (!list.length) return null;

    if (typeof state.currentPlayerIndex !== "number") {
      state.currentPlayerIndex = 0;
    }

    if (state.currentPlayerIndex < 0 || state.currentPlayerIndex >= list.length) {
      state.currentPlayerIndex = 0;
    }

    return list[state.currentPlayerIndex] || null;
  }

  function boardSpaces() {
    if (typeof window.getBoardSpaces === "function") {
      return window.getBoardSpaces() || [];
    }
    return [];
  }

  function maxPosition() {
    const spaces = boardSpaces();
    return Math.max(0, spaces.length - 1);
  }

  function renderNow() {
    if (typeof window.safeRender === "function") {
      window.safeRender();
    }
  }

  function addLog(message) {
    if (!Array.isArray(state.eventLog)) state.eventLog = [];
    state.eventLog.push({
      id: Date.now() + Math.random(),
      message
    });
  }

  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function tileTypeAt(pos) {
    const spaces = boardSpaces();
    const tile = spaces[pos];
    return tile ? tile.type : "normal";
  }

  function soundLevel(name) {
    const settings = state.soundSettings || {};
    const master = (settings.master ?? 80) / 100;
    const specific = (settings[name] ?? 80) / 100;
    return master * specific;
  }

  function beep(freq, duration, gain) {
    if (state.audioMuted) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!window.__audioCtx) {
        window.__audioCtx = new AudioCtx();
      }

      const ctx = window.__audioCtx;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.value = gain;

      osc.connect(g);
      g.connect(ctx.destination);

      osc.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000);
      osc.stop(ctx.currentTime + duration / 1000);
    } catch {}
  }

  function playDiceSound() {
    const level = soundLevel("dice");
    beep(420, 70, 0.02 * level);
    setTimeout(() => beep(520, 80, 0.02 * level), 70);
  }

  function playGood() {
    const level = soundLevel("effects");
    beep(620, 120, 0.03 * level);
    setTimeout(() => beep(780, 120, 0.025 * level), 110);
  }

  function playBad() {
    const level = soundLevel("effects");
    beep(240, 180, 0.03 * level);
  }

  function playTriviaTick() {
    const level = soundLevel("trivia");
    beep(500, 50, 0.01 * level);
  }

  async function movePlayerBy(player, amount) {
    const end = maxPosition();
    const dir = amount >= 0 ? 1 : -1;
    const steps = Math.abs(amount);

    for (let i = 0; i < steps; i++) {
      player.position += dir;

      if (player.position < 0) player.position = 0;
      if (player.position > end) player.position = end;

      const spaces = boardSpaces();
      const space = spaces[player.position];

      if (space && typeof window.createTrailAt === "function") {
        window.createTrailAt(space);
      }

      if (typeof window.pulseLanding === "function") {
        window.pulseLanding(player.position);
      }

      renderNow();
      await wait(220);
    }
  }

  async function nextTurn() {
    const list = players();
    if (!list.length) return;

    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % list.length;
    renderNow();
  }

  function showCard(card) {
    state.feedback = {
      ok: card.ok,
      text: `${card.title}: ${card.text}`
    };
    state.lastCard = { text: card.text };
    addLog(card.text);
    renderNow();
  }

  async function applySimpleCard(player, kind) {
    if (kind === "health") {
      const card = randomItem([
        { title: "Health Card", text: "Wash your hands. Move forward 3 spaces.", move: 3, ok: true },
        { title: "Health Card", text: "Healthy meal boost. Gain 1 point.", score: 1, ok: true },
        { title: "Health Card", text: "Strong recovery. Gain 1 shield.", shield: 1, ok: true }
      ]);

      showCard(card);
      playGood();
      await wait(700);

      if (card.move) await movePlayerBy(player, card.move);
      if (card.score) player.score = (player.score || 0) + card.score;
      if (card.shield) player.shields = (player.shields || 0) + card.shield;
      return;
    }

    if (kind === "risk") {
      const card = randomItem([
        { title: "Risk Card", text: "Did not cover cough. Move back 2.", move: -2, ok: false },
        { title: "Risk Card", text: "You feel weak. Lose 1 point.", score: -1, ok: false },
        { title: "Risk Card", text: "Miss next turn.", skip: 1, ok: false }
      ]);

      showCard(card);
      playBad();
      await wait(700);

      if (card.move) await movePlayerBy(player, card.move);
      if (card.score) player.score = Math.max(0, (player.score || 0) + card.score);
      if (card.skip) player.skip = (player.skip || 0) + card.skip;
      return;
    }

    if (kind === "chance") {
      const card = randomItem([
        { title: "Chance Card", text: "Referral approved. Move forward 2.", move: 2, ok: true },
        { title: "Chance Card", text: "Lucky break. Gain 1 shield.", shield: 1, ok: true },
        { title: "Chance Card", text: "Quick recovery. Gain 2 points.", score: 2, ok: true }
      ]);

      showCard(card);
      playGood();
      await wait(700);

      if (card.move) await movePlayerBy(player, card.move);
      if (card.score) player.score = (player.score || 0) + card.score;
      if (card.shield) player.shields = (player.shields || 0) + card.shield;
      return;
    }

    if (kind === "quarantine") {
      const card = {
        title: "Surgery Card",
        text: "Recovery time. Miss next turn.",
        skip: 1,
        ok: false
      };

      showCard(card);
      playBad();
      await wait(700);

      player.skip = (player.skip || 0) + 1;
    }
  }

  async function triggerTrivia(player) {
    const q = randomItem(TRIVIA);

    state.trivia = {
      category: q.category,
      q: q.q,
      choices: q.choices,
      answer: q.a,
      playerId: player.id
    };

    state.timer = 20;
    renderNow();

    clearInterval(window.__triviaTimer);

    window.__triviaTimer = setInterval(async function () {
      state.timer -= 1;

      if (state.timer <= 5 && state.timer > 0) {
        playTriviaTick();
      }

      if (state.timer <= 0) {
        clearInterval(window.__triviaTimer);
        state.trivia = null;
        state.feedback = {
          ok: false,
          text: `${player.name} ran out of time.`
        };
        state.lastCard = { text: `${player.name} ran out of time.` };
        addLog(`${player.name} ran out of time.`);
        playBad();
        renderNow();
        await wait(300);
        nextTurn();
      } else {
        renderNow();
      }
    }, 1000);
  }

  window.submitTrivia = async function (choice) {
    if (!state.trivia) return;

    clearInterval(window.__triviaTimer);

    const player = currentPlayerSafe();
    if (!player) {
      state.trivia = null;
      renderNow();
      return;
    }

    const correct = choice === state.trivia.answer;

    if (correct) {
      player.score = (player.score || 0) + 2;
      state.feedback = {
        ok: true,
        text: `${player.name} answered correctly! +2 points.`
      };
      state.lastCard = { text: `${player.name} answered correctly.` };
      addLog(`${player.name} answered correctly.`);
      playGood();
      state.trivia = null;
      renderNow();
      await wait(250);
      await movePlayerBy(player, 1);
    } else {
      state.feedback = {
        ok: false,
        text: `${player.name} answered incorrectly.`
      };
      state.lastCard = { text: `${player.name} answered incorrectly.` };
      addLog(`${player.name} answered incorrectly.`);
      playBad();
      state.trivia = null;
      renderNow();
    }

    await wait(300);
    nextTurn();
  };

  async function resolveLanding(player) {
    if (player.position >= maxPosition()) {
      state.feedback = {
        ok: true,
        text: `${player.name} reached the Brain and wins!`
      };
      state.lastCard = { text: `${player.name} reached the Brain and wins!` };
      addLog(`${player.name} wins the game!`);
      playGood();
      renderNow();
      return;
    }

    const type = tileTypeAt(player.position);

    if (type === "health") {
      await applySimpleCard(player, "health");
      renderNow();
      await wait(250);
      await nextTurn();
      return;
    }

    if (type === "risk") {
      await applySimpleCard(player, "risk");
      renderNow();
      await wait(250);
      await nextTurn();
      return;
    }

    if (type === "chance") {
      await applySimpleCard(player, "chance");
      renderNow();
      await wait(250);
      await nextTurn();
      return;
    }

    if (type === "quarantine") {
      await applySimpleCard(player, "quarantine");
      renderNow();
      await wait(250);
      await nextTurn();
      return;
    }

    await triggerTrivia(player);
  }

  window.handleRoll = async function () {
    const player = currentPlayerSafe();
    if (!player || state.isRolling) return;

    if ((player.skip || 0) > 0) {
      player.skip -= 1;
      state.feedback = {
        ok: false,
        text: `${player.name} missed a turn.`
      };
      state.lastCard = { text: `${player.name} missed a turn.` };
      addLog(`${player.name} missed a turn.`);
      renderNow();
      await wait(350);
      await nextTurn();
      return;
    }

    state.isRolling = true;
    renderNow();

    const roll = Math.floor(Math.random() * 6) + 1;

    playDiceSound();

    if (typeof window.showDiceRoll === "function") {
      await window.showDiceRoll(roll);
    }

    state.lastRoll = roll;
    state.lastCard = { text: `${player.name} rolled ${roll}.` };
    addLog(`${player.name} rolled ${roll}.`);

    await movePlayerBy(player, roll);

    state.isRolling = false;
    renderNow();

    await wait(180);
    await resolveLanding(player);
  };

  window.setSoundLevels = function () {
    /* kept for compatibility with app.js */
  };
})();
