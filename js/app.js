window.escapeHtml = function(value){
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

window.getConnectionText = function(){
  if (state.connectionLabel) return state.connectionLabel;
  if (state.entered) return 'Live sync active';
  return 'Ready';
};

window.getPlayerCountText = function(){
  const count = Array.isArray(state.players) ? state.players.length : 0;
  return `${count} Player${count === 1 ? '' : 's'}`;
};

window.getLastCardText = function(){
  if (state.lastCard && state.lastCard.text) return state.lastCard.text;
  return 'Roll the dice to begin.';
};

window.getLiveFeedItems = function(){
  if (Array.isArray(state.eventLog) && state.eventLog.length) {
    return state.eventLog.slice(-8).reverse();
  }
  if (state.lastCard && state.lastCard.text) {
    return [{ id: 'fallback', message: state.lastCard.text }];
  }
  return [{ id: 'empty', message: 'No study events yet.' }];
};

window.renderFeedback = function(){
  if (!state.feedback || !state.feedback.text) return '';
  return `
    <div class="feedback ${state.feedback.ok ? 'good' : 'bad'}">
      ${window.escapeHtml(state.feedback.text)}
    </div>
  `;
};

window.renderTopBar = function(){
  return `
    <div class="topbar">
      <div class="topbar-left">
        <div class="logo">🧠</div>
        <div>
          <div class="domain">${window.escapeHtml(window.APP_CONFIG?.SITE_DOMAIN || 'bodyanatomyboardgame.com')}</div>
          <div class="topbar-title">${window.escapeHtml(window.APP_CONFIG?.GAME_TITLE || 'Body Anatomy Board Game')}</div>
          <div class="topbar-meta">
            ${window.escapeHtml(window.APP_CONFIG?.SUBTITLE || '')}<br>
            ${window.escapeHtml(window.APP_CONFIG?.SCHOOL || '')}
          </div>
        </div>
      </div>

      <div class="chip-row">
        <div class="chip">Room: ${window.escapeHtml(state.roomCode || '----')}</div>
        <div class="chip">${window.getPlayerCountText()}</div>
        <div class="chip">${window.escapeHtml(window.getConnectionText())}</div>
        <button class="btn btn-white" id="audioToggleBtn" type="button">
          ${state.audioMuted ? '🔇 Audio' : '🔊 Audio'}
        </button>
        <button class="btn btn-white" id="backToLobbyBtn" type="button">Back</button>
      </div>
    </div>
  `;
};

window.renderLobbyScreen = function(){
  return `
    <div class="screen">
      <div class="lobby-wrap">
        <div class="lobby-left">
          <div class="brand">
            <div class="logo">🧠</div>
            <div>
              <div class="domain">${window.escapeHtml(window.APP_CONFIG?.SITE_DOMAIN || 'bodyanatomyboardgame.com')}</div>
              <div class="topbar-title">${window.escapeHtml(window.APP_CONFIG?.GAME_TITLE || 'Body Anatomy Board Game')}</div>
              <div class="topbar-meta">
                ${window.escapeHtml(window.APP_CONFIG?.SUBTITLE || '')}<br>
                ${window.escapeHtml(window.APP_CONFIG?.SCHOOL || '')}
              </div>
            </div>
          </div>

          <div class="code-box">
            <div style="text-align:center;font-size:18px;font-weight:900;">
              Join at ${window.escapeHtml(window.APP_CONFIG?.SITE_DOMAIN || 'bodyanatomyboardgame.com')}
            </div>
            <div style="text-align:center;margin-top:8px;color:#586a78;font-size:15px;">
              with your anatomy room code
            </div>

            <div class="code-big">
              <div class="small">ANATOMY ROOM CODE</div>
              <div class="code">${window.escapeHtml(state.roomCode || '----')}</div>
            </div>
          </div>
        </div>

        <div class="lobby-right">
          <div>
            <div class="lobby-tag">LOBBY</div>
            <div class="lobby-title">Waiting for participants</div>
            <div class="lobby-copy">
              Roll the dice, follow the spiral path, answer anatomy trivia,
              and race to the brain for the win.
            </div>

            <div class="entry-card">
              <div class="entry-label">YOUR NAME</div>
              <input
                id="nameInput"
                class="entry-input"
                type="text"
                maxlength="20"
                placeholder="Enter your name"
                value="${window.escapeHtml(state.lobbyName || '')}"
              >
            </div>

            <div class="entry-card">
              <div class="entry-label">ENTER CODE</div>
              <input
                id="codeInput"
                class="entry-input"
                type="text"
                maxlength="8"
                placeholder="Enter code"
                value="${window.escapeHtml(state.joinCode || '')}"
              >
            </div>

            <div class="entry-actions">
              <button id="newCodeBtn" class="btn btn-white" type="button">New Code</button>
              <button id="startRoomBtn" class="btn btn-main" type="button">Start Room</button>
            </div>
          </div>

          <div class="chip" style="display:inline-flex;width:max-content;">
            ${window.escapeHtml(window.getConnectionText())}
          </div>
        </div>
      </div>
    </div>
  `;
};

window.renderTurnCard = function(){
  const current = typeof window.currentPlayer === 'function' ? window.currentPlayer() : null;
  const mine = typeof window.myPlayer === 'function' ? window.myPlayer() : null;
  const yourTurn = !!current && !!mine && current.ownerId === mine.ownerId;

  return `
    <div class="hud-card">
      <div class="hud-title">Current Turn</div>
      <div class="turn-hero">
        <div style="font-size:13px;opacity:.92;">${yourTurn ? 'Your turn' : 'Now moving'}</div>
        <h3 style="margin:6px 0 8px;">${window.escapeHtml(current ? window.getPlayerName(current) : 'Player')}</h3>
        <p style="margin:0;">Last Roll: ${window.escapeHtml(state.lastRoll ?? '-')}</p>
      </div>
    </div>
  `;
};

window.renderActionsCard = function(){
  return `
    <div class="hud-card">
      <div class="hud-title">Game Actions</div>
      <div class="controls-grid">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <button id="rollBtn" class="btn btn-main" type="button" ${state.isRolling ? 'disabled' : ''}>
            🎲 ${state.isRolling ? 'Rolling...' : 'Roll'}
          </button>
          <button id="shareBtn" class="btn btn-blue" type="button">⤴ Share</button>
        </div>

        <div class="action-box">
          ${window.renderFeedback()}
          <div>${window.escapeHtml(window.getLastCardText())}</div>
        </div>
      </div>
    </div>
  `;
};

window.renderPlayersCard = function(){
  const players = Array.isArray(state.players) ? state.players : [];

  return `
    <div class="hud-card">
      <div class="hud-title">Players</div>
      <div class="players-strip">
        ${players.length ? players.map((player, index) => `
          <div class="player-card">
            <div class="player-top">
              <div class="avatar">${window.getPlayerToken ? window.getPlayerToken(index) : '🩺'}</div>
              <div>
                <div style="font-weight:1000;font-size:15px;">${window.escapeHtml(window.getPlayerName(player))}</div>
                <div style="font-size:12px;color:var(--muted);">Position ${window.escapeHtml(player.position ?? 0)}</div>
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;gap:12px;font-size:12px;color:var(--muted);">
              <span>Score: ${window.escapeHtml(player.score ?? 0)}</span>
              <span>Shields: ${window.escapeHtml(player.shields ?? 0)}</span>
            </div>
          </div>
        `).join('') : `
          <div class="player-card">No players yet.</div>
        `}
      </div>
    </div>
  `;
};

window.renderLiveFeedCard = function(){
  const items = window.getLiveFeedItems();

  return `
    <div class="hud-card" style="max-width:1440px;width:100%;margin:0 auto;">
      <div class="hud-title">Game Log</div>
      <div class="action-box" style="min-height:88px;max-height:180px;overflow:auto;">
        ${items.map(item => `
          <div style="
            padding:10px 12px;
            border-radius:14px;
            background:rgba(255,255,255,.04);
            border:1px solid rgba(255,255,255,.06);
            margin-bottom:10px;
            font-size:14px;
            color:#dfe8eb;
          ">
            ${window.escapeHtml(item.message || item.text || '')}
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

window.renderTriviaModal = function(){
  if (!state.trivia) return '';

  const trivia = state.trivia || {};
  const choices = Array.isArray(trivia.choices) ? trivia.choices : [];
  const category = trivia.category || 'Anatomy Review';

  return `
    <div class="trivia-modal" id="triviaModal">
      <div class="trivia-card">
        <div style="display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px;">
          <div>
            <div style="
              display:inline-flex;
              align-items:center;
              gap:8px;
              font-size:13px;
              font-weight:1000;
              color:#5f716f;
              background:rgba(118,181,171,.14);
              border:1px solid rgba(118,181,171,.24);
              padding:6px 10px;
              border-radius:999px;
              margin-bottom:10px;
            ">
              🧠 ${window.escapeHtml(category)}
            </div>
            <div style="font-size:13px;font-weight:800;color:#7b7368;">
              Answer before time runs out.
            </div>
          </div>
          <div class="chip" style="background:linear-gradient(135deg,#74b6c8,#70a7cf);color:#fff;">
            ${window.escapeHtml(state.timer ?? 20)}s
          </div>
        </div>

        <div class="trivia-q">${window.escapeHtml(trivia.q || '')}</div>

        <div class="trivia-grid">
          ${choices.map(choice => `
            <button
              class="btn trivia-choice"
              type="button"
              data-trivia-choice="${window.escapeHtml(choice)}"
            >
              ${window.escapeHtml(choice)}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
};

window.renderDiceOverlay = function(){
  return `
    <div id="diceOverlay" class="dice-overlay hidden">
      <div id="diceBox" class="dice-box">⚀</div>
      <div id="diceLabel" class="dice-label">Rolling...</div>
    </div>
  `;
};

window.renderGameScreen = function(){
  let boardHtml = '';

  try {
    boardHtml = typeof window.boardMarkup === 'function'
      ? window.boardMarkup()
      : `<div class="board-stage premium-board-bg"></div>`;
  } catch (error) {
    boardHtml = `
      <div class="board-stage premium-board-bg" style="display:flex;align-items:center;justify-content:center;padding:40px;">
        <div class="hud-card" style="max-width:720px;width:100%;">
          <div class="hud-title">Board render failed</div>
          <div>${window.escapeHtml(error?.message || 'Unknown board error')}</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="screen">
      <div class="game-layout">
        ${window.renderTopBar()}

        <div class="board-panel">
          ${boardHtml}
        </div>

        <div class="hud-wrap">
          ${window.renderTurnCard()}
          ${window.renderActionsCard()}
          ${window.renderPlayersCard()}
        </div>

        ${window.renderLiveFeedCard()}
      </div>

      ${window.renderTriviaModal()}
      ${window.renderDiceOverlay()}
    </div>
  `;
};

window.attachLobbyEvents = function(){
  const nameInput = document.getElementById('nameInput');
  const codeInput = document.getElementById('codeInput');
  const newCodeBtn = document.getElementById('newCodeBtn');
  const startRoomBtn = document.getElementById('startRoomBtn');

  if (nameInput) {
    nameInput.addEventListener('input', (e) => {
      state.lobbyName = e.target.value;
      try { localStorage.setItem(window.APP_CONFIG?.STORAGE_KEYS?.playerName || 'player-name', state.lobbyName); } catch {}
    });
  }

  if (codeInput) {
    codeInput.addEventListener('input', (e) => {
      state.joinCode = String(e.target.value || '').toUpperCase();
      if (e.target.value !== state.joinCode) e.target.value = state.joinCode;
    });
  }

  if (newCodeBtn) {
    newCodeBtn.addEventListener('click', () => {
      if (typeof window.makeRoomCode === 'function') {
        state.roomCode = window.makeRoomCode();
      } else {
        state.roomCode = Math.random().toString(36).slice(2, 7).toUpperCase();
      }
      state.joinCode = state.roomCode;
      window.safeRender();
    });
  }

  if (startRoomBtn) {
    startRoomBtn.addEventListener('click', async () => {
      const desiredCode = (state.joinCode || state.roomCode || '').trim().toUpperCase();
      if (desiredCode) state.roomCode = desiredCode;
      if (!state.lobbyName || !state.lobbyName.trim()) {
        state.lastCard = { text: 'Please enter your name first.' };
        return window.safeRender();
      }

      if (typeof window.enterRoom === 'function') {
        await window.enterRoom();
      }
    });
  }
};

window.attachGameEvents = function(){
  const rollBtn = document.getElementById('rollBtn');
  const shareBtn = document.getElementById('shareBtn');
  const backBtn = document.getElementById('backToLobbyBtn');
  const audioBtn = document.getElementById('audioToggleBtn');

  if (rollBtn) {
    rollBtn.addEventListener('click', async () => {
      if (typeof window.handleRoll === 'function') {
        await window.handleRoll();
      } else {
        state.lastCard = { text: 'window.handleRoll is not a function' };
        window.safeRender();
      }
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const shareText = `Join my anatomy board game room: ${state.roomCode || ''}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: 'Body Anatomy Board Game', text: shareText });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareText);
          state.lastCard = { text: 'Room link copied.' };
          window.safeRender();
        }
      } catch {}
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      state.entered = false;
      state.trivia = null;
      state.isRolling = false;
      window.safeRender();
    });
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      state.audioMuted = !state.audioMuted;
      try { localStorage.setItem('anatomy-audio-muted', state.audioMuted ? '1' : '0'); } catch {}
      if (typeof window.setAudioMuted === 'function') {
        window.setAudioMuted(state.audioMuted);
      }
      window.safeRender();
    });
  }

  document.querySelectorAll('[data-trivia-choice]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const choice = btn.getAttribute('data-trivia-choice');
      if (typeof window.submitTrivia === 'function') {
        await window.submitTrivia(choice);
      }
    });
  });
};

window.attachUiEvents = function(){
  if (state.entered) {
    window.attachGameEvents();
  } else {
    window.attachLobbyEvents();
  }
};

window.renderApp = function(){
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = state.entered
    ? window.renderGameScreen()
    : window.renderLobbyScreen();

  window.attachUiEvents();
};

window.safeRender = function(){
  try {
    window.renderApp();
  } catch (error) {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `
      <div class="screen">
        <div class="hud-card" style="max-width:900px;margin:40px auto;">
          <div class="hud-title">UI render failed</div>
          <div>${window.escapeHtml(error?.message || 'Unknown UI error')}</div>
        </div>
      </div>
    `;
  }
};
