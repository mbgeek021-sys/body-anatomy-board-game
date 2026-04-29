(function () {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const TRIVIA = [
    { q: "How many bones are in an adult body?", choices: ["206", "150", "250", "180"], answer: "206" },
    { q: "Which organ pumps blood?", choices: ["Brain", "Heart", "Liver", "Lung"], answer: "Heart" },
    { q: "Which organ stores urine?", choices: ["Bladder", "Kidney", "Colon", "Liver"], answer: "Bladder" },
    { q: "Largest organ of the body?", choices: ["Skin", "Heart", "Brain", "Liver"], answer: "Skin" }
  ];

  function players() {
    if (!Array.isArray(window.state.players)) window.state.players = [];
    return window.state.players;
  }

  function currentPlayerSafe() {
    const list = players();
    if (!list.length) return null;
    if (typeof window.state.currentPlayerIndex !== "number") window.state.currentPlayerIndex = 0;
    return list[window.state.currentPlayerIndex] || list[0];
  }

  function spaces() {
    if (typeof window.getBoardSpaces === "function") return window.getBoardSpaces();
    return [];
  }

  function maxPos() {
    return Math.max(0, spaces().length - 1);
  }

  function render() {
    if (typeof window.safeRender === "function") window.safeRender();
  }

  function log(message) {
    if (!Array.isArray(window.state.eventLog)) window.state.eventLog = [];
    window.state.eventLog.push({ id: Date.now() + Math.random(), message });
  }

  function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function sound(name) {
    try {
      if (typeof window[name] === "function") window[name]();
    } catch {}
  }

  function nextTurn() {
    const list = players();
    if (!list.length) return;
    window.state.currentPlayerIndex = (window.state.currentPlayerIndex + 1) % list.length;
    render();
  }

  async function moveForward(player, amount) {
    const board = spaces();

    for (let i = 0; i < amount; i++) {
      player.position = Math.min(maxPos(), (player.position || 0) + 1);

      if (board[player.position]) {
        if (typeof window.createTrailAt === "function") window.createTrailAt(board[player.position]);
        if (typeof window.pulseLanding === "function") window.pulseLanding(player.position);
      }

      render();
      await wait(220);

      if (player.position >= maxPos()) break;
    }
  }

  function showWinner(player) {
    const old = document.getElementById("winnerOverlay");
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.id = "winnerOverlay";
    overlay.style.cssText = `
      position:fixed;
      inset:0;
      z-index:5000;
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
        box-shadow:0 30px 70px rgba(0,0,0,.38);
      ">
        <div style="font-size:64px;margin-bottom:12px;">🏆</div>
        <div style="font-size:13px;font-weight:1000;letter-spacing:.22em;color:#9b7d39;margin-bottom:10px;">WINNER</div>
        <div style="font-size:38px;font-weight:1000;margin-bottom:10px;">${player.name} Wins!</div>
        <div style="font-size:17px;color:#60707c;margin-bottom:24px;">
          Reached the Brain first and completed the anatomy journey.
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <button id="playAgainBtn" class="btn btn-main">Play Again</button>
          <button id="winnerLobbyBtn" class="btn btn-white">Lobby</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("playAgainBtn").onclick = function () {
      overlay.remove();

      players().forEach(function (p) {
        p.position = 0;
        p.score = 0;
        p.shields = 0;
        p.skip = 0;
      });

      window.state.currentPlayerIndex = 0;
      window.state.lastRoll = null;
      window.state.feedback = null;
      window.state.lastCard = { text: "New game started." };
      window.state.eventLog = [{ message: "New game started." }];
      render();
    };

    document.getElementById("winnerLobbyBtn").onclick = function () {
      overlay.remove();
      window.state.entered = false;
      render();
    };
  }

  async function startTrivia(player) {
    const q = random(TRIVIA);

    window.state.trivia = {
      q: q.q,
      choices: q.choices,
      answer: q.answer
    };

    window.state.timer = 20;
    render();

    clearInterval(window.__triviaTimer);

    window.__triviaTimer = setInterval(function () {
      window.state.timer -= 1;

      if (window.state.timer <= 0) {
        clearInterval(window.__triviaTimer);
        window.state.trivia = null;
        window.state.feedback = { ok: false, text: "Time ran out." };
        window.state.lastCard = { text: "Time ran out." };
        log(player.name + " ran out of time.");
        nextTurn();
      } else {
        render();
      }
    }, 1000);
  }

window.submitTrivia = async function (choice) {
  if (!window.state.trivia) return;

  clearInterval(window.__triviaTimer);

  const player = currentPlayerSafe();
  if (!player) return;

  const correct = choice === window.state.trivia.answer;

  window.state.triviaResult = {
    choice,
    correct
  };

  render();

  await wait(900);

  if (correct) {
    player.score = (player.score || 0) + 2;
    window.state.feedback = { ok: true, text: "Correct! +2 points." };
    window.state.lastCard = { text: player.name + " answered correctly." };
    log(player.name + " answered correctly.");
    sound("playCorrectSound");

    window.state.trivia = null;
    window.state.triviaResult = null;
    render();

    await moveForward(player, 1);

    if (player.position >= maxPos()) {
      showWinner(player);
      return;
    }
  } else {
    window.state.feedback = { ok: false, text: "Incorrect." };
    window.state.lastCard = { text: player.name + " answered incorrectly." };
    log(player.name + " answered incorrectly.");
    sound("playWrongSound");

    window.state.trivia = null;
    window.state.triviaResult = null;
    render();
  }

  await wait(250);
  nextTurn();
};

  async function resolveLanding(player) {
    if (player.position >= maxPos()) {
      window.state.feedback = { ok: true, text: player.name + " reached the Brain!" };
      window.state.lastCard = { text: player.name + " reached the Brain and wins!" };
      log(player.name + " wins the game!");
      sound("playWinSound");
      render();

      await wait(500);
      showWinner(player);
      return;
    }

    await startTrivia(player);
  }

  window.handleRoll = async function () {
    const player = currentPlayerSafe();
    if (!player || window.state.isRolling) return;

    window.state.isRolling = true;
    render();

    const roll = Math.floor(Math.random() * 6) + 1;

    sound("playDiceSound");

    if (typeof window.showDiceRoll === "function") {
      await window.showDiceRoll(roll);
    }

    window.state.lastRoll = roll;
    window.state.lastCard = { text: player.name + " rolled " + roll + "." };
    log(player.name + " rolled " + roll + ".");

    await moveForward(player, roll);

    window.state.isRolling = false;
    render();

    await wait(150);
    await resolveLanding(player);
  };
})();
