window.escapeHtml = function(value){
  return String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
};

window.saveNameQuietly = function(value){
  state.lobbyName = String(value || '').slice(0, 18);
  localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.playerName, state.lobbyName);
};

window.commitNameChange = async function(value){
  window.saveNameQuietly(value);
};

window.makeNewCode = function(){
  const code = Math.random().toString(36).slice(2, 7).toUpperCase();
  state.roomCode = code;
  state.joinCode = code;
  window.safeRender();
};

window.goBackHome = function(){
  state.entered = false;
  clearInterval(window.pollTimer);
  window.safeRender();
};

window.handleStartRoomClick = async function(){
  try{
    state.connectionLabel = 'Start clicked...';
    window.safeRender();

    if(typeof window.enterRoom !== 'function'){
      throw new Error('enterRoom function missing');
    }

    await window.enterRoom();
  }catch(err){
    console.error(err);
    state.connectionLabel = 'Start failed: ' + (err?.message || 'Unknown error');
    window.safeRender();
  }
};

window.getSafeCurrentPlayer = function(){
  if (typeof window.currentPlayer === 'function') {
    try { return window.currentPlayer(); } catch {}
  }
  return state.players?.[state.currentPlayerIndex] || state.players?.[0] || null;
};

window.getSafeMyPlayer = function(){
  if (typeof window.myPlayer === 'function') {
    try { return window.myPlayer(); } catch {}
  }
  return state.players?.find?.(p => p.ownerId === window.clientId) || null;
};

window.getSafePlayerName = function(player){
  if (!player) return 'Player';
  if (typeof window.getPlayerName === 'function') {
    try { return window.getPlayerName(player); } catch {}
  }
  return player.name || 'Player';
};

window.getSafePlayerToken = function(index){
  if (typeof window.getPlayerToken === 'function') {
    try { return window.getPlayerToken(index); } catch {}
  }
  const tokens = ['🩺','💉','💊','🩹','🌡️','🫀'];
  return tokens[index % tokens.length];
};

window.lobbyScreen = function(){
  return `
  <div class="screen">
    <div class="lobby-wrap">
      <div class="lobby-left">
        <div class="brand">
          <div class="logo">🫀</div>
          <div>
            <div class="domain">${window.APP_CONFIG.SITE_DOMAIN}</div>
            <div class="title">${window.APP_CONFIG.GAME_TITLE}</div>
            <div class="subtitle">${window.APP_CONFIG.SUBTITLE}</div>
            <div class="subtitle">${window.APP_CONFIG.SCHOOL}</div>
          </div>
        </div>

        <div class="code-box">
          <div style="text-align:center;font-size:28px;font-weight:900">
            Join at ${window.APP_CONFIG.SITE_DOMAIN}
          </div>
          <div style="text-align:center;font-size:18px;color:#63747e;margin-top:8px">
            with your anatomy room code
          </div>
          <div class="code-big">
            <div class="small">ANATOMY ROOM CODE</div>
            <div class="code">${state.roomCode}</div>
          </div>
        </div>
      </div>

      <div class="lobby-right glass">
        <div>
          <div class="lobby-tag">LOBBY</div>
          <div class="lobby-title">Waiting for participants</div>
          <div class="lobby-copy">
            Roll the dice, land on anatomy squares, collect good or bad cards,
            answer trivia, and race to the brain for a quick recovery win.
          </div>
        </div>

        <div class="entry-card">
          <div class="entry-label">YOUR NAME</div>
          <input
            class="entry-input"
            id="playerNameInput"
            placeholder="ENTER YOUR NAME"
            value="${window.escapeHtml(state.lobbyName)}"
          />
        </div>

        <div class="entry-card">
          <div class="entry-label">ENTER CODE</div>
          <input
            class="entry-input"
            id="joinCodeInput"
            placeholder="ENTER CODE"
            value="${window.escapeHtml(state.joinCode)}"
          />
        </div>

        <div class="entry-actions">
          <button class="btn btn-white click-btn" onclick="window.makeNewCode()">New Code</button>
          <button class="btn btn-main click-btn" onclick="window.handleStartRoomClick()">Start Room</button>
        </div>

        <div class="mini-box" style="margin-top:14px">
          ${window.escapeHtml(state.connectionLabel)}
        </div>
      </div>
    </div>
  </div>
  `;
};

window.renderTriviaModal = function(){
  if (!state.trivia) return '';

  const q = state.trivia;
  const choices = Array.isArray(q.choices) ? q.choices : [];

  return `
    <div class="trivia-modal">
      <div class="trivia-card">
        <div class="trivia-top">
          <div class="hud-title" style="margin:0">🧠 Trivia Challenge</div>
          <div class="pill-time">${state.timer ?? 20}s</div>
        </div>

        <div class="trivia-q">
          ${window.escapeHtml(q.q || '')}
        </div>

        <div class="trivia-grid">
          ${choices.map(choice => `
            <button
              class="btn trivia-choice click-btn"
              style="background:linear-gradient(135deg,#4f7cff,#7858ff);"
              onclick="window.submitTrivia(${JSON.stringify(choice).replace(/"/g, '&quot;')})"
            >
              ${window.escapeHtml(choice)}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
};

window.gameScreen = function(){
  const cp = window.getSafeCurrentPlayer();
  const mine = window.getSafeMyPlayer();
  const myTurn = !!(cp && mine && cp.ownerId === mine.ownerId);

  let boardHtml = '';
  try{
    boardHtml = typeof window.boardMarkup === 'function'
      ? window.boardMarkup()
      : `<div style="padding:24px;color:white;">Board not loaded.</div>`;
  }catch(err){
    console.error('board render failed', err);
    boardHtml = `
      <div style="padding:24px;color:white;">
        <h2>Board render failed</h2>
        <p>${window.escapeHtml(err?.message || 'Unknown board error')}</p>
      </div>
    `;
  }

  return `
  <div class="screen">
    <div class="game-layout">

      <div class="topbar glass">
        <div class="topbar-left">
          <div class="logo" style="width:58px;height:58px;border-radius:18px">🫀</div>
          <div>
            <div class="domain" style="color:#8be4d8">${window.APP_CONFIG.SITE_DOMAIN}</div>
            <div class="topbar-meta">${window.APP_CONFIG.SUBTITLE}</div>
            <div class="topbar-meta">${window.APP_CONFIG.SCHOOL}</div>
            <div class="topbar-title">${window.APP_CONFIG.GAME_TITLE}</div>
          </div>
        </div>

        <div class="chip-row">
          <div class="chip">Room: ${window.escapeHtml(state.roomCode)}</div>
          <div class="chip alt">${state.onlineCount || 0} Players</div>
          <div class="chip">${window.escapeHtml(state.connectionLabel)}</div>
          <button class="btn btn-small click-btn" style="background:rgba(255,255,255,.08);color:#fff" onclick="window.goBackHome()">Back</button>
        </div>
      </div>

      <div class="board-panel">
        ${boardHtml}
      </div>

      <div class="hud-wrap">
        <div class="hud-card">
          <div class="hud-title">Current Turn</div>
          <div class="turn-hero">
            <div style="font-size:13px;opacity:.8">
              ${myTurn ? 'Your turn' : 'Wait for your turn'}
            </div>
            <h3>
              ${state.winner
                ? window.escapeHtml(state.winner) + ' wins!'
                : window.escapeHtml(window.getSafePlayerName(cp))}
            </h3>
            <p>Last Roll: ${state.lastRoll ?? '-'}</p>
          </div>
        </div>

        <div class="hud-card">
          <div class="hud-title">Game Actions</div>

          <div class="controls-grid" style="grid-template-columns:1fr 1fr;">
            <button class="btn btn-teal click-btn"
              onclick="window.runSafe(()=>window.handleRoll(),'Roll failed.')"
              ${state.winner || state.trivia || state.isRolling || !myTurn ? 'disabled' : ''}>
              ${state.isRolling ? '🎲 Rolling...' : '🎲 Roll'}
            </button>

            <button class="btn btn-blue click-btn"
              onclick="window.runSafe(()=>window.copyShareLink(),'Share failed.')">
              ⤴ Share
            </button>
          </div>

          <div style="margin-top:14px">
            ${state.feedback
              ? `<div class="feedback ${state.feedback.ok ? 'good' : 'bad'}">${window.escapeHtml(state.feedback.text)}</div>`
              : ''}

            <div class="action-box">
              ${window.escapeHtml(state.lastCard?.text || 'Roll the dice to begin.')}
            </div>
          </div>
        </div>

        <div class="hud-card">
          <div class="hud-title">Players</div>
          <div class="players-strip">
            ${(state.players || []).map((player, index) => `
              <div class="player-card">
                <div class="player-top">
                  <div class="avatar">${window.getSafePlayerToken(index)}</div>
                  <div style="font-weight:800;flex:1">
                    ${window.escapeHtml(window.getSafePlayerName(player))}
                  </div>
                </div>

                <div style="font-size:12px;color:#c9d6d8">
                  Position: ${player.position ?? 0}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    ${window.renderTriviaModal()}
  </div>
  `;
};

window.attachEvents = function(){
  const joinInput = document.getElementById('joinCodeInput');
  if (joinInput && !joinInput.dataset.bound) {
    joinInput.dataset.bound = '1';
    joinInput.addEventListener('input', e => {
      state.joinCode = e.target.value.toUpperCase();
    });
  }

  const nameInput = document.getElementById('playerNameInput');
  if (nameInput && !nameInput.dataset.bound) {
    nameInput.dataset.bound = '1';
    nameInput.addEventListener('input', e => {
      window.saveNameQuietly(e.target.value);
    });
  }
};

window.tickTrivia = function(){
  if (!state.trivia) return;

  state.timer--;

  if (state.timer <= 0) {
    const players = Array.isArray(state.players) ? state.players : [];
    const current = players[Math.max(0, Math.min(state.currentPlayerIndex || 0, players.length - 1))];

    if (current) {
      current.position = Math.max(0, (current.position || 0) - 2);
      current.score = Math.max(0, (current.score || 0) - 1);
      state.feedback = { ok:false, text:'Time is up! -1 point and move back 2.' };
      state.lastCard = { text:`${window.getSafePlayerName(current)} ran out of time and moved back 2 spaces.` };
    }

    state.trivia = null;
    state.timer = 30;

    if (!state.winner && typeof window.advanceTurn === 'function') {
      window.advanceTurn();
    }

    if (typeof window.saveRoomState === 'function') {
      window.runSafe(() => window.saveRoomState(), 'Could not save trivia timeout.');
    }
  }

  window.safeRender();
};

window.safeRender = function(){
  if (window.isRendering) return;
  window.isRendering = true;

  requestAnimationFrame(() => {
    document.getElementById('app').innerHTML =
      state.entered ? window.gameScreen() : window.lobbyScreen();

    window.attachEvents();
    window.isRendering = false;
  });
};

window.showFatalError = function(message){
  document.getElementById('app').innerHTML = `
    <div class="screen">
      <div style="
        max-width:900px;
        margin:0 auto;
        padding:24px;
        border-radius:28px;
        background:rgba(12,25,40,.95);
        border:1px solid rgba(255,255,255,.1);
      ">
        <h1>Something broke</h1>
        <p>${window.escapeHtml(message)}</p>
      </div>
    </div>
  `;
};
