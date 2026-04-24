(function () {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const TRIVIA = [
    { category: "Bones", q: "How many bones are in the adult human body?", choices: ["206", "180", "250", "300"], a: "206" },
    { category: "Heart", q: "How many chambers does the heart have?", choices: ["2", "3", "4", "5"], a: "4" },
    { category: "Brain", q: "Which organ controls the nervous system?", choices: ["Liver", "Brain", "Lung", "Kidney"], a: "Brain" },
    { category: "Muscles", q: "Which muscle helps breathing?", choices: ["Diaphragm", "Biceps", "Quadriceps", "Deltoid"], a: "Diaphragm" },
    { category: "Digestive", q: "Which organ stores bile?", choices: ["Gallbladder", "Heart", "Lungs", "Brain"], a: "Gallbladder" },
    { category: "Respiratory", q: "Which organ exchanges oxygen and carbon dioxide?", choices: ["Lungs", "Stomach", "Spleen", "Pancreas"], a: "Lungs" },
    { category: "Skeletal", q: "The femur is located in the:", choices: ["Thigh", "Forearm", "Chest", "Skull"], a: "Thigh" },
    { category: "Urinary", q: "Which organ stores urine?", choices: ["Bladder", "Liver", "Colon", "Appendix"], a: "Bladder" }
  ];

  const CARD_DATA = {
    health: [
      { title: "HEALTH CARD", icon: "🟩", text: "Healthy boost! Gain 1 point.", ok: true, score: 1 },
      { title: "HEALTH CARD", icon: "🧼", text: "Washed your hands. Move forward 2.", ok: true, move: 2 },
      { title: "HEALTH CARD", icon: "🛡️", text: "Immune shield gained.", ok: true, shield: 1 }
    ],
    risk: [
      { title: "RISK CARD", icon: "🟥", text: "Didn’t cover cough. Lose 1 point.", ok: false, score: -1 },
      { title: "RISK CARD", icon: "⚠️", text: "Contamination risk. Move back 2.", ok: false, back: 2 },
      { title: "RISK CARD", icon: "🤧", text: "Feeling sick. Miss next turn.", ok: false, skip: 1 }
    ],
    chance: [
      { title: "CHANCE CARD", icon: "🟦", text: "Referral approved. Move forward 2.", ok: true, move: 2 },
      { title: "CHANCE CARD", icon: "✨", text: "Lucky break! Gain 2 points.", ok: true, score: 2 },
      { title: "CHANCE CARD", icon: "💫", text: "Shortcut found. Move forward 3.", ok: true, move: 3 }
    ],
    quarantine: [
      { title: "QUARANTINE CARD", icon: "🟨", text: "Recovery time. Miss next turn.", ok: false, skip: 1 }
    ]
  };

  function getPlayers() {
    if (!Array.isArray(window.state.players)) window.state.players = [];
    return window.state.players;
  }

  function getCurrentPlayer() {
    const list = getPlayers();
    if (!list.length) return null;
    if (typeof window.state.currentPlayerIndex !== "number") window.state.currentPlayerIndex = 0;
    if (window.state.currentPlayerIndex < 0 || window.state.currentPlayerIndex >= list.length) window.state.currentPlayerIndex = 0;
    return list[window.state.currentPlayerIndex] || null;
  }

  function getBoardSpacesSafe() {
    if (typeof window.getBoardSpaces === "function") {
      const spaces = window.getBoardSpaces();
      return Array.isArray(spaces) ? spaces : [];
    }
    return [];
  }

  function getMaxPosition() {
    return Math.max(0, getBoardSpacesSafe().length - 1);
  }

  function rerender() {
    if (typeof window.safeRender === "function") window.safeRender();
  }

  function addLog(message) {
    if (!Array.isArray(window.state.eventLog)) window.state.eventLog = [];
    window.state.eventLog.push({ id: Date.now() + Math.random(), message });
  }

  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getTileType(position) {
    const spaces = getBoardSpacesSafe();
    const tile = spaces[position];
    return tile ? tile.type : "normal";
  }

  function sound(fnName) {
    try {
      if (typeof window[fnName] === "function") window[fnName]();
    } catch {}
  }

  function showPremiumCard(card) {
    return new Promise((resolve) => {
      document.getElementById("premiumCardOverlay")?.remove();

      const overlay = document.createElement("div");
      overlay.id = "premiumCardOverlay";
      overlay.style.cssText = `
        position:fixed;
        inset:0;
        z-index:3500;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:22px;
        background:rgba(6,14,22,.62);
        backdrop-filter:blur(8px);
      `;

      overlay.innerHTML = `
        <div style="
          width:min(420px,100%);
          border-radius:34px;
          padding:26px;
          text-align:center;
          background:linear-gradient(180deg,#f7f1e7,#e6dac8);
          color:#22384a;
          border:1px solid rgba(255,255,255,.35);
          box-shadow:0 30px 70px rgba(0,0,0,.38);
        ">
          <div style="
            width:84px;
            height:84px;
            margin:0 auto 16px;
            border-radius:26px;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:42px;
            background:${card.ok ? "linear-gradient(135deg,#8fc4bc,#93b3df)" : "linear-gradient(135deg,#d49aaa,#d5af7b)"};
            box-shadow:0 16px 28px rgba(0,0,0,.18);
          ">
            ${card.icon}
          </div>

          <div style="
            font-size:13px;
            font-weight:1000;
            letter-spacing:.20em;
            color:${card.ok ? "#5e918a" : "#a06f67"};
            margin-bottom:10px;
          ">
            ${card.title}
          </div>

          <div style="
            font-size:30px;
            line-height:1.05;
            font-weight:1000;
            letter-spacing:-.03em;
            margin-bottom:12px;
          ">
            Card Drawn!
          </div>

          <div style="
            font-size:17px;
            line-height:1.45;
            color:#5c6872;
            margin-bottom:22px;
          ">
            ${card.text}
          </div>

          <button id="premiumCardDoneBtn" style="
            width:100%;
            height:54px;
            border:none;
            border-radius:18px;
            cursor:pointer;
            font-weight:1000;
            color:white;
            background:${card.ok ? "linear-gradient(135deg,#78b7ad,#5f9f96)" : "linear-gradient(135deg,#c98b99,#b97985)"};
            box-shadow:0 12px 22px rgba(0,0,0,.18);
          ">
            Continue
          </button>
        </div>
      `;

      document.body.appendChild(overlay);

      const done = () => {
        overlay.remove();
        resolve();
      };

      document.getElementById("premiumCardDoneBtn")?.addEventListener("click", done);

      setTimeout(done, 2200);
    });
  }

  async function movePlayer(player, steps) {
    const spaces = getBoardSpacesSafe();
    const max = getMaxPosition();

    for (let i = 0; i < steps; i++) {
      player.position += 1;
      if (player.position > max) player.position = max;

      const currentSpace = spaces[player.position];

      if (currentSpace && typeof window.createTrailAt === "function") window.createTrailAt(currentSpace);
      if (typeof window.pulseLanding === "function") window.pulseLanding(player.position);

      rerender();
      await wait(220);
    }
  }

  async function moveBackPlayer(player, steps) {
    const spaces = getBoardSpacesSafe();

    for (let i = 0; i < steps; i++) {
      player.position -= 1;
      if (player.position < 0) player.position = 0;

      const currentSpace = spaces[player.position];

      if (currentSpace && typeof window.createTrailAt === "function") window.createTrailAt(currentSpace);
      if (typeof window.pulseLanding === "function") window.pulseLanding(player.position);

      rerender();
      await wait(220);
    }
  }

  async function nextTurn() {
    const list = getPlayers();
    if (!list.length) return;
    window.state.currentPlayerIndex = (window.state.currentPlayerIndex + 1) % list.length;
    rerender();
  }

  async function triggerTrivia(player) {
    const q = randomItem(TRIVIA);

    window.state.trivia = {
      category: q.category,
      q: q.q,
      choices: q.choices,
      answer: q.a,
      playerId: player.id
    };

    window.state.timer = 20;
    rerender();

    clearInterval(window.__triviaTimer);

    window.__triviaTimer = setInterval(async function () {
      window.state.timer -= 1;

      if (window.state.timer <= 5 && window.state.timer > 0) sound("playTriviaTickSound");

      if (window.state.timer <= 0) {
        clearInterval(window.__triviaTimer);
        window.state.trivia = null;
        window.state.feedback = { ok: false, text: `${player.name} ran out of time.` };
        window.state.lastCard = { text: `${player.name} ran out of time.` };
        addLog(`${player.name} ran out of time.`);
        sound("playWrongSound");
        rerender();
        await wait(250);
        await nextTurn();
      } else {
        rerender();
      }
    }, 1000);
  }

  window.submitTrivia = async function (choice) {
    if (!window.state.trivia) return;

    clearInterval(window.__triviaTimer);

    const player = getCurrentPlayer();
    if (!player) {
      window.state.trivia = null;
      rerender();
      return;
    }

    const correct = choice === window.state.trivia.answer;

    if (correct) {
      player.score = (player.score || 0) + 2;
      window.state.feedback = { ok: true, text: `${player.name} answered correctly! +2 points.` };
      window.state.lastCard = { text: `${player.name} answered correctly.` };
      addLog(`${player.name} answered correctly.`);
      sound("playCorrectSound");
      window.state.trivia = null;
      rerender();
      await wait(250);
      await movePlayer(player, 1);
    } else {
      window.state.feedback = { ok: false, text: `${player.name} answered incorrectly.` };
      window.state.lastCard = { text: `${player.name} answered incorrectly.` };
      addLog(`${player.name} answered incorrectly.`);
      sound("playWrongSound");
      window.state.trivia = null;
      rerender();
    }

    await wait(250);
    await nextTurn();
  };

  async function applyCard(player, card) {
    window.state.feedback = { ok: card.ok, text: card.text };
    window.state.lastCard = { text: card.text };
    addLog(`${player.name}: ${card.text}`);

    sound(card.ok ? "playCardSound" : "playWrongSound");
    rerender();

    await showPremiumCard(card);

    if (card.score) player.score = Math.max(0, (player.score || 0) + card.score);
    if (card.shield) player.shields = (player.shields || 0) + card.shield;
    if (card.skip) player.skip = (player.skip || 0) + card.skip;
    if (card.move) await movePlayer(player, card.move);
    if (card.back) await moveBackPlayer(player, card.back);

    rerender();
  }

  async function resolveLanding(player) {
    if (player.position >= getMaxPosition()) {
      window.state.feedback = { ok: true, text: `${player.name} reached the Brain and wins!` };
      window.state.lastCard = { text: `${player.name} reached the Brain and wins!` };
      addLog(`${player.name} wins the game!`);
      sound("playWinSound");
      rerender();
      return;
    }

    const type = getTileType(player.position);

    if (type === "health" || type === "risk" || type === "chance" || type === "quarantine") {
      const card = randomItem(CARD_DATA[type]);
      await applyCard(player, card);
      await wait(250);
      await nextTurn();
      return;
    }

    await triggerTrivia(player);
  }

  window.handleRoll = async function () {
    const player = getCurrentPlayer();
    if (!player || window.state.isRolling) return;

    if ((player.skip || 0) > 0) {
      player.skip -= 1;
      window.state.feedback = { ok: false, text: `${player.name} missed a turn.` };
      window.state.lastCard = { text: `${player.name} missed a turn.` };
      addLog(`${player.name} missed a turn.`);
      sound("playMissTurnSound");
      rerender();
      await wait(300);
      await nextTurn();
      return;
    }

    window.state.isRolling = true;
    rerender();

    const roll = Math.floor(Math.random() * 6) + 1;

    sound("playDiceSound");

    if (typeof window.showDiceRoll === "function") await window.showDiceRoll(roll);

    window.state.lastRoll = roll;
    window.state.lastCard = { text: `${player.name} rolled ${roll}.` };
    addLog(`${player.name} rolled ${roll}.`);

    await movePlayer(player, roll);

    window.state.isRolling = false;
    rerender();

    await wait(150);
    await resolveLanding(player);
  };
})();
