/* FULL REPLACE game.js */
/* Adds premium card popup system + uses sound settings if available */

(function () {
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  const CARD_POOLS = {
    health: [
      { title: "HEALTH CARD", icon: "🟩", text: "Wash your hands. Move forward 3 spaces.", move: 3 },
      { title: "HEALTH CARD", icon: "🟩", text: "Healthy meal boost. Roll again next turn.", shield: 1 },
      { title: "HEALTH CARD", icon: "🟩", text: "Stretch break complete. Gain 1 point.", score: 1 }
    ],
    risk: [
      { title: "RISK CARD", icon: "🟥", text: "Didn't cover cough. Go to quarantine.", quarantine: true },
      { title: "RISK CARD", icon: "🟥", text: "Slipped on wet floor. Move back 2.", move: -2 },
      { title: "RISK CARD", icon: "🟥", text: "Missed breakfast. Lose 1 point.", score: -1 }
    ],
    chance: [
      { title: "CHANCE CARD", icon: "🟦", text: "Referral approved. Advance 2 spaces.", move: 2 },
      { title: "CHANCE CARD", icon: "🟦", text: "Lucky break. Gain shield.", shield: 1 },
      { title: "CHANCE CARD", icon: "🟦", text: "Shortcut found. Move forward 4.", move: 4 }
    ],
    surgery: [
      { title: "SURGERY CARD", icon: "🟨", text: "Recovery time. Miss next turn.", skip: 1 }
    ]
  };

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

  function getPlayers() {
    state.players = Array.isArray(state.players) ? state.players : [];
    return state.players;
  }

  function getCurrent() {
    const players = getPlayers();
    if (!players.length) return null;
    if (state.currentPlayerIndex >= players.length) state.currentPlayerIndex = 0;
    return players[state.currentPlayerIndex];
  }

  function boardSpaces() {
    if (typeof window.getBoardSpaces === "function") {
      return window.getBoardSpaces();
    }
    return [];
  }

  function maxPos() {
    const spaces = boardSpaces();
    return Math.max(0, spaces.length - 1);
  }

  function pushLog(message) {
    state.eventLog = Array.isArray(state.eventLog) ? state.eventLog : [];
    state.eventLog.push({
      id: Date.now() + Math.random(),
      message
    });
  }

  function refresh() {
    if (typeof window.safeRender === "function") {
      window.safeRender();
    }
  }

  function soundLevel(name) {
    const settings = state.soundSettings || {};
    const master = (settings.master ?? 80) / 100;
    const specific = (settings[name] ?? 80) / 100;
    return master * specific;
  }

  function beep(freq = 440, duration = 120, gain = .03) {
    if (state.audioMuted) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = window.__audioCtx || new AudioCtx();
      window.__audioCtx = ctx;

      const osc = ctx.createOscillator();
      const g = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;

      g.gain.value = gain;

      osc.connect(g);
      g.connect(ctx.destination);

      osc.start();

      g.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + duration / 1000
      );

      osc.stop(ctx.currentTime + duration / 1000);
    } catch {}
  }

  function playDiceSound() {
    beep(420, 70, .02 * soundLevel("dice"));
    setTimeout(() => beep(520, 80, .02 * soundLevel("dice")), 70);
  }

  function playGood() {
    beep(620, 120, .03 * soundLevel("effects"));
    setTimeout(() => beep(780, 120, .025 * soundLevel("effects")), 110);
  }

  function playBad() {
    beep(240, 180, .03 * soundLevel("effects"));
  }

  function playTriviaTick() {
    beep(500, 50, .01 * soundLevel("trivia"));
  }

  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getTileType(pos) {
    const spaces = boardSpaces();
    const tile = spaces[pos];
    return tile?.type || "normal";
  }

  async function movePlayer(player, amount) {
    const end = maxPos();

    const dir = amount >= 0 ? 1 : -1;
    const steps = Math.abs(amount);

    for (let i = 0; i < steps; i++) {
      player.position += dir;

      if (player.position < 0) player.position = 0;
      if (player.position > end) player.position = end;

      const spaces = boardSpaces();
      const space = spaces[player.position];

      if (typeof window.createTrailAt === "function") {
        window.createTrailAt(space);
      }

      if (typeof window.pulseLanding === "function") {
        window.pulseLanding(player.position);
      }

      refresh();
      await wait(220);
    }
  }

  async function nextTurn() {
    const players = getPlayers();
    if (!players.length) return;

    state.currentPlayerIndex =
      (state.currentPlayerIndex + 1) % players.length;

    refresh();
  }

  async function applyCard(player, card) {
    state.cardPopup = card;
    refresh();

    await wait(1700);

    state.cardPopup = null;
    refresh();

    if (card.move) {
      await movePlayer(player, card.move);
    }

    if (card.score) {
      player.score = (player.score || 0) + card.score;
    }

    if (card.shield) {
      player.shields = (player.shields || 0) + card.shield;
    }

    if (card.skip) {
      player.skip = (player.skip || 0) + card.skip;
    }

    if (card.quarantine) {
      player.skip = (player.skip || 0) + 1;
      player.position = Math.max(0, player.position - 2);
      refresh();
    }

    pushLog(`${player.name}: ${card.text}`);
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
    refresh();

    clearInterval(window.__triviaTimer);

    window.__triviaTimer = setInterval(() => {
      state.timer -= 1;

      if (state.timer <= 5 && state.timer > 0) {
        playTriviaTick();
      }

      if (state.timer <= 0) {
        clearInterval(window.__triviaTimer);
        state.trivia = null;
        pushLog(`${player.name} ran out of time.`);
        playBad();
        refresh();
        nextTurn();
      } else {
        refresh();
      }
    }, 1000);
  }

  window.submitTrivia = async function (choice) {
    if (!state.trivia) return;

    clearInterval(window.__triviaTimer);

    const player = getCurrent();
    const correct = choice === state.trivia.answer;

    if (correct) {
      player.score = (player.score || 0) + 2;
      pushLog(`${player.name} answered correctly!`);
      playGood();
      await movePlayer(player, 1);
    } else {
      pushLog(`${player.name} answered incorrectly.`);
      playBad();
    }

    state.trivia = null;
    refresh();
    await wait(300);
    nextTurn();
  };

  async function resolveTile(player) {
    const type = getTileType(player.position);

    if (player.position >= maxPos()) {
      state.lastCard = { text: `${player.name} reached the Brain and wins!` };
      pushLog(`${player.name} wins the game!`);
      playGood();
      refresh();
      return;
    }

    if (type === "health") {
      await applyCard(player, randomItem(CARD_POOLS.health));
      playGood();
    }
    else if (type === "risk") {
      await applyCard(player, randomItem(CARD_POOLS.risk));
      playBad();
    }
    else if (type === "chance") {
      await applyCard(player, randomItem(CARD_POOLS.chance));
      playGood();
    }
    else if (type === "quarantine") {
      await applyCard(player, randomItem(CARD_POOLS.surgery));
      playBad();
    }
    else {
      await triggerTrivia(player);
      return;
    }

    refresh();
    await wait(350);
    nextTurn();
  }

  window.handleRoll = async function () {
    const player = getCurrent();
    if (!player || state.isRolling) return;

    if ((player.skip || 0) > 0) {
      player.skip -= 1;
      pushLog(`${player.name} missed a turn.`);
      state.lastCard = { text: `${player.name} missed a turn.` };
      refresh();
      await wait(350);
      nextTurn();
      return;
    }

    state.isRolling = true;
    refresh();

    const roll = Math.floor(Math.random() * 6) + 1;

    playDiceSound();

    if (typeof window.showDiceRoll === "function") {
      await window.showDiceRoll(roll);
    }

    state.lastRoll = roll;
    state.lastCard = { text: `${player.name} rolled ${roll}.` };

    pushLog(`${player.name} rolled ${roll}.`);

    await movePlayer(player, roll);

    state.isRolling = false;
    refresh();

    await wait(220);
    await resolveTile(player);
  };

  window.setSoundLevels = function () {
    /* hook reserved if future audio files used */
  };

})();
