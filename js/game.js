(function () {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const TRIVIA = [
    { category: "Bones", q: "How many bones are in the adult human body?", choices: ["206", "180", "250", "300"], a: "206" },
    { category: "Heart", q: "How many chambers does the heart have?", choices: ["2", "3", "4", "5"], a: "4" },
    { category: "Brain", q: "Which organ controls the nervous system?", choices: ["Liver", "Brain", "Lung", "Kidney"], a: "Brain" },
    { category: "Muscles", q: "Which muscle helps breathing?", choices: ["Diaphragm", "Biceps", "Quadriceps", "Deltoid"], a: "Diaphragm" }
  ];

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

  function sound(name) {
    try {
      if (typeof window[name] === "function") window[name]();
    } catch {}
  }

  function showWinner(player) {
    document.getElementById("winnerOverlay")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "winnerOverlay";
    overlay.style.cssText = `
      position:fixed;
      inset:0;
      z-index:4200;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
      background:rgba(6,14,22,.72);
      backdrop-filter:blur(10px);
    `;

    overlay.innerHTML = `
      <div style="
        width:min(520px,100%);
        border-radius:34px;
        padding:30px;
        text-align:center;
        background:linear-gradient(180deg,#f7f1e7,#e6dac8);
        color:#24394c;
        border:1px solid rgba(255,255,255,.35);
        box-shadow:0 30px 70px rgba(0,0,0,.38);
      ">
        <div style="
          width:92px;
          height:92px;
          margin:0 auto 18px;
          border-radius:28px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:44px;
          background:linear-gradient(135deg,#ffd87a,#ffb347);
          box-shadow:0 18px 28px rgba(0,0,0,.18);
        ">🏆</div>

        <div style="
          font-size:13px;
          font-weight:1000;
          letter-spacing:.22em;
          color:#9b7d39;
          margin-bottom:10px;
        ">
          WINNER
        </div>

        <div style="
          font-size:38px;
          line-height:1;
          font-weight:1000;
          letter-spacing:-.04em;
          margin-bottom:10px;
        ">
          ${player.name} Wins!
        </div>

        <div style="
          font-size:17px;
          line-height:1.45;
          color:#60707c;
          margin-bottom:24px;
        ">
          Reached the Brain first and completed the anatomy journey.
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <button id="playAgainBtn" style="
            height:56px;
            border:none;
            border-radius:18px;
            cursor:pointer;
            font-weight:1000;
            color:white;
            background:linear-gradient(135deg,#78b7ad,#5f9f96);
          ">
            Play Again
          </button>

          <button id="winnerLobbyBtn" style="
            height:56px;
            border:none;
            border-radius:18px;
            cursor:pointer;
            font-weight:1000;
            color:#24394c;
            background:rgba(255,255,255,.72);
          ">
            Lobby
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("playAgainBtn")?.addEventListener("click", () => {
      overlay.remove();

      const players = getPlayers();
      players.forEach(p => {
        p.position = 0;
        p.score = 0;
        p.shields = 0;
        p.skip = 0;
      });

      window.state.currentPlayerIndex = 0;
      window.state.lastRoll = null;
      window.state.lastCard = { text: "New game started." };
      window.state.feedback = null;
      window.state.eventLog = [{ id: Date.now(), message: "New game started." }];
      rerender();
    });

    document.getElementById("winnerLobbyBtn")?.addEventListener("click", () => {
      overlay.remove();
      window.state.entered = false;
      rerender();
    });
  }

  async function movePlayer(player, steps) {
    const spaces = getBoardSpacesSafe();
    const max = getMaxPosition();

    for (let i = 0; i < steps; i++) {
      player.position += 1;
      if (player.position > max) player.position = max;

      const tile = spaces[player.position];

      if (tile && typeof window.createTrailAt === "function") window.createTrailAt(tile);
      if (typeof window.pulseLanding === "function") window.pulseLanding(player.position);

      rerender();
      await wait(220);
    }
  }

  async function nextTurn() {
    const players = getPlayers();
    if (!players.length) return;
    window.state.currentPlayerIndex = (window.state.currentPlayerIndex + 1) % players.length;
    rerender();
  }

  async function triggerTrivia(player) {
    const q = randomItem(TRIVIA);

    window.state.trivia = {
      category: q.category,
      q: q.q,
      choices: q.choices,
      answer: q.a
    };

    window.state.timer = 20;
    rerender();

    clearInterval(window.__triviaTimer);

    window.__triviaTimer = setInterval(async () => {
      window.state.timer--;

      if (window.state.timer <= 5 && window.state.timer > 0) sound("playTriviaTickSound");

      if (window.state.timer <= 0) {
        clearInterval(window.__triviaTimer);
        window.state.trivia = null;
        window.state.feedback = { ok: false, text: `${player.name} ran out of time.` };
        sound("playWrongSound");
        rerender();
        await wait(300);
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
    if (!player) return;

    const correct = choice === window.state.trivia.answer;

    if (correct) {
      player.score = (player.score || 0) + 2;
      window.state.feedback = { ok: true, text: `${player.name} answered correctly! +2 points.` };
      sound("playCorrectSound");
      window.state.trivia = null;
      rerender();
      await movePlayer(player, 1);
    } else {
      window.state.feedback = { ok: false, text: `${player.name} answered incorrectly.` };
      sound("playWrongSound");
      window.state.trivia = null;
      rerender();
    }

    await wait(250);
    await nextTurn();
  };

  async function resolveLanding(player) {
    if (player.position >= getMaxPosition()) {
      window.state.feedback = { ok: true, text: `${player.name} reached the Brain and wins!` };
      addLog(`${player.name} wins!`);
      sound("playWinSound");
      rerender();

      await wait(700);
      showWinner(player);
      return;
    }

    await triggerTrivia(player);
  }

  window.handleRoll = async function () {
    const player = getCurrentPlayer();
    if (!player || window.state.isRolling) return;

    if ((player.skip || 0) > 0) {
      player.skip--;
      window.state.feedback = { ok: false, text: `${player.name} missed a turn.` };
      sound("playMissTurnSound");
      rerender();
      await wait(250);
      await nextTurn();
      return;
    }

    window.state.isRolling = true;
    rerender();

    const roll = Math.floor(Math.random() * 6) + 1;

    sound("playDiceSound");

    if (typeof window.showDiceRoll === "function") {
      await window.showDiceRoll(roll);
    }

    window.state.lastRoll = roll;
    window.state.lastCard = { text: `${player.name} rolled ${roll}.` };
    addLog(`${player.name} rolled ${roll}.`);

    await movePlayer(player, roll);

    window.state.isRolling = false;
    rerender();

    await wait(180);
    await resolveLanding(player);
  };
})();
