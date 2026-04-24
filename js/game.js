(function () {
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  const TRIVIA = [
    { q:"How many bones are in an adult body?", c:["206","150","250","180"], a:"206" },
    { q:"Which organ pumps blood?", c:["Brain","Heart","Liver","Lung"], a:"Heart" },
    { q:"Which organ stores urine?", c:["Bladder","Kidney","Colon","Liver"], a:"Bladder" },
    { q:"Largest organ of the body?", c:["Skin","Heart","Brain","Liver"], a:"Skin" }
  ];

  const CARD_SETS = {
    health: [
      { title:"HEALTH BOOST", icon:"🩺", text:"Gain +1 point.", good:true, score:1 },
      { title:"HAND WASHED", icon:"🧼", text:"Move forward 2 spaces.", good:true, move:2 },
      { title:"IMMUNITY", icon:"🛡️", text:"Gain 1 shield.", good:true, shield:1 }
    ],
    chance: [
      { title:"LUCKY BREAK", icon:"✨", text:"Move forward 3 spaces.", good:true, move:3 },
      { title:"BONUS", icon:"🎁", text:"Gain +2 points.", good:true, score:2 }
    ],
    risk: [
      { title:"SICK DAY", icon:"🤒", text:"Lose 1 point.", good:false, score:-1 },
      { title:"SLIPPED", icon:"⚠️", text:"Move back 2 spaces.", good:false, back:2 }
    ],
    quarantine: [
      { title:"QUARANTINE", icon:"🚫", text:"Miss next turn.", good:false, skip:1 }
    ]
  };

  function players(){
    if (!Array.isArray(state.players)) state.players = [];
    return state.players;
  }

  function currentPlayer(){
    const list = players();
    if (!list.length) return null;
    if (typeof state.currentPlayerIndex !== "number") state.currentPlayerIndex = 0;
    return list[state.currentPlayerIndex] || list[0];
  }

  function spaces(){
    return typeof window.getBoardSpaces === "function" ? window.getBoardSpaces() : [];
  }

  function maxPos(){
    return Math.max(0, spaces().length - 1);
  }

  function render(){
    if (typeof window.safeRender === "function") window.safeRender();
  }

  function log(msg){
    if (!Array.isArray(state.eventLog)) state.eventLog = [];
    state.eventLog.push({ id: Date.now() + Math.random(), message: msg });
  }

  function sound(fn){
    try{
      if (typeof window[fn] === "function") window[fn]();
    }catch{}
  }

  function random(arr){
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function tileType(pos){
    const s = spaces()[pos];
    return s ? s.type : "normal";
  }

  function showWinner(player){
    document.getElementById("winnerOverlay")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "winnerOverlay";

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
        ">WINNER</div>

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
          <button id="playAgainBtn" class="btn btn-main">Play Again</button>
          <button id="winnerLobbyBtn" class="btn btn-white">Lobby</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("playAgainBtn")?.addEventListener("click", () => {
      overlay.remove();

      players().forEach(p => {
        p.position = 0;
        p.score = 0;
        p.shields = 0;
        p.skip = 0;
      });

      state.currentPlayerIndex = 0;
      state.lastRoll = null;
      state.lastCard = { text:"New game started." };
      state.feedback = null;
      state.eventLog = [{ message:"New game started." }];
      render();
    });

    document.getElementById("winnerLobbyBtn")?.addEventListener("click", () => {
      overlay.remove();
      state.entered = false;
      render();
    });
  }

  async function move(player, amount){
    const board = spaces();

    for (let i = 0; i < amount; i++){
      player.position++;
      if (player.position > maxPos()) player.position = maxPos();

      if (board[player.position]){
        window.createTrailAt?.(board[player.position]);
        window.pulseLanding?.(player.position);
      }

      render();
      await wait(220);

      if (player.position >= maxPos()) break;
    }
  }

  async function moveBack(player, amount){
    const board = spaces();

    for (let i = 0; i < amount; i++){
      player.position--;
      if (player.position < 0) player.position = 0;

      if (board[player.position]){
        window.createTrailAt?.(board[player.position]);
        window.pulseLanding?.(player.position);
      }

      render();
      await wait(220);
    }
  }

  function nextTurn(){
    const list = players();
    if (!list.length) return;
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % list.length;
    render();
  }

  function showCard(card){
    return new Promise(resolve => {
      document.getElementById("premiumCardOverlay")?.remove();

      const wrap = document.createElement("div");
      wrap.id = "premiumCardOverlay";

      wrap.innerHTML = `
        <div class="game-card-popup ${card.good ? "good" : "bad"}">
          <div class="game-card-icon">${card.icon}</div>
          <div class="game-card-type">${card.title}</div>
          <div class="game-card-text">${card.text}</div>
          <button class="game-card-btn">Continue</button>
        </div>
      `;

      document.body.appendChild(wrap);

      const close = () => {
        wrap.remove();
        resolve();
      };

      wrap.querySelector(".game-card-btn").onclick = close;
      setTimeout(close, 2600);
    });
  }

  async function applyCard(player, card){
    state.feedback = { ok: card.good, text: card.text };
    state.lastCard = { text: card.text };
    log(`${player.name}: ${card.text}`);

    await showCard(card);

    if (card.score) player.score = Math.max(0, (player.score || 0) + card.score);
    if (card.shield) player.shields = (player.shields || 0) + card.shield;
    if (card.skip) player.skip = (player.skip || 0) + card.skip;
    if (card.move) await move(player, card.move);
    if (card.back) await moveBack(player, card.back);

    render();
  }

  async function trivia(player){
    const q = random(TRIVIA);

    state.trivia = {
      q: q.q,
      choices: q.c,
      answer: q.a
    };

    state.timer = 20;
    render();

    clearInterval(window.__timer);

    window.__timer = setInterval(() => {
      state.timer--;
      render();

      if (state.timer <= 0){
        clearInterval(window.__timer);
        state.trivia = null;
        state.feedback = { ok:false, text:"Time ran out." };
        nextTurn();
      }
    }, 1000);
  }

  window.submitTrivia = async function(choice){
    if (!state.trivia) return;

    clearInterval(window.__timer);

    const p = currentPlayer();
    const ok = choice === state.trivia.answer;

    if (ok){
      p.score = (p.score || 0) + 2;
      state.feedback = { ok:true, text:"Correct! +2 points." };
      sound("playCorrectSound");
      state.trivia = null;
      render();
      await move(p, 1);
    } else {
      state.feedback = { ok:false, text:"Incorrect." };
      sound("playWrongSound");
      state.trivia = null;
      render();
    }

    await wait(250);
    await landing(p);
  };

  async function landing(player){
    if (player.position >= maxPos()){
      state.feedback = { ok:true, text:`${player.name} reached the Brain!` };
      state.lastCard = { text:`${player.name} reached the Brain and wins!` };
      log(`${player.name} wins the game!`);
      sound("playWinSound");
      render();

      await wait(600);
      showWinner(player);
      return;
    }

    const type = tileType(player.position);

    if (CARD_SETS[type]){
      await applyCard(player, random(CARD_SETS[type]));

      if (player.position >= maxPos()){
        await landing(player);
        return;
      }

      await wait(200);
      nextTurn();
      return;
    }

    await trivia(player);
  }

  window.handleRoll = async function(){
    const p = currentPlayer();
    if (!p || state.isRolling) return;

    if ((p.skip || 0) > 0){
      p.skip--;
      state.feedback = { ok:false, text:"Missed turn." };
      render();
      nextTurn();
      return;
    }

    state.isRolling = true;
    render();

    const roll = Math.floor(Math.random() * 6) + 1;

    sound("playDiceSound");
    await window.showDiceRoll?.(roll);

    state.lastRoll = roll;
    state.lastCard = { text:`${p.name} rolled ${roll}.` };
    log(`${p.name} rolled ${roll}`);

    await move(p, roll);

    state.isRolling = false;
    render();

    await wait(150);
    await landing(p);
  };
})();
