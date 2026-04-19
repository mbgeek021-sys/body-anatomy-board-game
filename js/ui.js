window.escapeHtml = function(value){
  return String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
};

window.saveNameQuietly = function(value){
  state.lobbyName = value.slice(0, 18);
  localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.playerName, state.lobbyName);
};

window.commitNameChange = async function(value){
  window.saveNameQuietly(value);
  if (state.entered) {
    await window.runSafe(async () => {
      await window.upsertPlayerRecord();
      await window.syncPlayersIntoRoomState();
    }, 'Could not save player name.');
  }
};

window.startTrivia = function(){
  state.trivia = TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)];
  state.timer = 30;
  state.feedback = null;
  window.safeRender();
};

window.lobbyScreen = function(){
  return `<div class="screen"><div class="lobby-wrap"><div class="lobby-left"><div class="brand"><div class="logo">🫀</div><div><div class="domain">${window.APP_CONFIG.SITE_DOMAIN}</div><div class="title">${window.APP_CONFIG.GAME_TITLE}</div><div class="subtitle">${window.APP_CONFIG.SUBTITLE}</div><div class="subtitle">${window.APP_CONFIG.SCHOOL}</div></div></div><div class="code-box"><div style="text-align:center;font-size:28px;font-weight:900">Join at ${window.APP_CONFIG.SITE_DOMAIN}</div><div style="text-align:center;font-size:18px;color:#63747e;margin-top:8px">with your anatomy room code</div><div class="code-big"><div class="small">Anatomy Room Code</div><div class="code">${state.roomCode}</div></div></div></div><div class="lobby-right glass"><div><div class="lobby-tag">Lobby</div><div class="lobby-title">Waiting for participants</div><div class="lobby-copy">Roll the dice, land on anatomy squares, collect good or bad cards, answer trivia, and race to the brain for a quick recovery win.</div></div><div class="entry-card"><div class="entry-label">Your Name</div><input class="entry-input" id="playerNameInput" placeholder="ENTER YOUR NAME" value="${window.escapeHtml(state.lobbyName)}" /></div><div class="entry-card"><div class="entry-label">Enter Code</div><input class="entry-input" id="joinCodeInput" placeholder="ENTER CODE" value="${window.escapeHtml(state.joinCode)}" /></div><div class="entry-actions"><button class="btn btn-white" data-action="new-code">New Code</button><button class="btn btn-main" data-action="start-room">Start Room</button></div><div class="mini-box" style="margin-top:14px">${state.connectionLabel}</div></div></div></div>`;
};

window.gameScreen = function(){
  const cp = window.currentPlayer();
  const mine = window.myPlayer();
  const myTurn = cp && mine && cp.ownerId === mine.ownerId;

  return `<div class="screen"><div class="game-layout"><div class="topbar glass"><div class="topbar-left"><div class="logo" style="width:58px;height:58px;border-radius:18px">🫀</div><div style="min-width:0"><div class="domain" style="color:#8be4d8">${window.APP_CONFIG.SITE_DOMAIN}</div><div class="topbar-meta">${window.APP_CONFIG.SUBTITLE}</div><div class="topbar-meta">${window.APP_CONFIG.SCHOOL}</div><div class="topbar-title">${window.APP_CONFIG.GAME_TITLE}</div></div></div><div class="chip-row"><div class="chip">Room: ${state.roomCode}</div><div class="chip alt">${state.onlineCount} Players</div><div class="chip">${state.connectionLabel}</div><button class="btn btn-small" style="background:rgba(255,255,255,.08);color:#fff" data-action="back-home">Back</button></div></div><div class="board-panel">${window.boardMarkup()}</div><div class="hud-wrap"><div class="hud-card"><div class="hud-title">Current Turn</div><div class="turn-hero"><div style="font-size:13px;opacity:.84">${myTurn?'Your turn':'Wait for your turn'}</div><h3>${state.winner ? window.escapeHtml(state.winner) + ' wins!' : window.escapeHtml(window.getPlayerName(cp))}</h3><p>Last Roll: ${state.lastRoll ?? '-'}</p></div><div class="mini-box">Room link: ${location.origin}?room=${state.roomCode}</div></div><div class="hud-card"><div class="hud-title">Game Actions</div><div class="controls-grid"><button class="btn btn-teal" data-action="roll" ${state.winner||state.trivia||state.isRolling||!myTurn?'disabled':''}>${state.isRolling?'🎲 Rolling...':'🎲 Roll'}</button><button class="btn btn-rose" data-action="reset" ${!state.players[0]||state.players[0].ownerId!==window.clientId?'disabled':''}>↻ Reset</button><button class="btn btn-blue" data-action="share">⤴ Share</button><button class="btn btn-green" data-action="new-code-in-game" ${state.players[0]&&state.players[0].ownerId!==window.clientId?'disabled':''}>New Code</button></div><div style="margin-top:14px">${state.feedback?`<div class="feedback ${state.feedback.ok?'good':'bad'}">${window.escapeHtml(state.feedback.text)}</div>`:''}<div class="action-box">${window.escapeHtml(state.lastCard?.text||'Roll the dice to begin.')}</div></div></div><div class="hud-card"><div class="hud-title">Players</div><div class="players-strip">${state.players.map(player=>`<div class="player-card"><div class="player-top"><div class="avatar">${window.getPlayerToken(player.id-1)}</div><div style="flex:1;font-weight:800">${window.escapeHtml(window.getPlayerName(player))}</div></div><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><div style="font-size:12px;color:#c9d6d8">${window.escapeHtml(SPACES[player.position].name)}</div><div class="stats"><span class="badge teal">${player.shields} shield</span><span class="badge gray">${player.score} pts</span><span class="badge green">${player.organs.length} organs</span></div></div></div>`).join('')}</div></div><div class="hud-card"><div class="hud-title">Leaderboard</div><div class="leaderboard-list">${state.players.map((player,index)=>`<div class="leader-card"><div class="leader-row"><div class="leader-left"><div class="leader-rank">#${index+1}</div><div>${window.getPlayerToken(player.id-1)}</div><div class="leader-name">${window.escapeHtml(window.getPlayerName(player))}</div></div><div style="text-align:right;font-size:12px;color:#bdcfd0"><div>${player.score} pts</div><div>${player.organs.length} organs</div></div></div></div>`).join('')}</div></div></div><div class="trivia-modal ${state.trivia?'':'hidden'}">${state.trivia?`<div class="trivia-card"><div class="trivia-top"><div style="font-size:24px;font-weight:1000">✨ Trivia</div><div class="pill-time">${state.timer}s</div></div><div class="trivia-q">${window.escapeHtml(state.trivia.q)}</div><div class="trivia-grid">${state.trivia.choices.map((choice,index)=>{const classes=['btn-rose','btn-blue','btn-white','btn-green'];return`<button class="btn trivia-choice ${classes[index]||'btn-teal'}" data-trivia-choice="${window.escapeHtml(choice)}" ${!myTurn?'disabled':''}>${window.escapeHtml(choice)}</button>`}).join('')}</div></div>`:''}</div></div>`;
};

window.attachEvents = function(){
  const joinInput = document.getElementById('joinCodeInput');
  if (joinInput) joinInput.addEventListener('input', e => { state.joinCode = e.target.value.toUpperCase(); });

  const nameInput = document.getElementById('playerNameInput');
  if (nameInput) nameInput.addEventListener('input', e => {
    window.saveNameQuietly(e.target.value);
    clearTimeout(window.nameSaveTimer);
    window.nameSaveTimer = setTimeout(() => window.commitNameChange(e.target.value), 400);
  });

  document.querySelectorAll('[data-trivia-choice]').forEach(el =>
    el.addEventListener('click', () => window.submitTrivia(el.getAttribute('data-trivia-choice')))
  );

  document.querySelectorAll('[data-action]').forEach(el =>
    el.addEventListener('click', () => {
      const action = el.getAttribute('data-action');
      if (action === 'new-code') {
        const code = Math.random().toString(36).slice(2, 7).toUpperCase();
        state.joinCode = code;
        state.roomCode = code;
        window.safeRender();
      }
      if (action === 'start-room') window.enterRoom();
      if (action === 'back-home') {
        state.entered = false;
        clearInterval(window.pollTimer);
        window.safeRender();
      }
      if (action === 'roll') window.runSafe(() => window.handleRoll(), 'Roll failed.');
      if (action === 'reset') window.runSafe(() => window.resetGame(), 'Reset failed.');
      if (action === 'share') window.runSafe(() => window.copyShareLink(), 'Share failed.');
    })
  );
};

window.tickTrivia = function(){
  if (!state.trivia) return;
  state.timer -= 1;
  if (state.timer <= 0) {
    state.lastCard = { text: 'Time is up. No trivia bonus.' };
    state.trivia = null;
    state.timer = 30;
  }
  window.safeRender();
};

window.safeRender = function(){
  if (window.isRendering) return;
  window.isRendering = true;
  requestAnimationFrame(() => {
    document.getElementById('app').innerHTML = state.entered ? window.gameScreen() : window.lobbyScreen();
    window.attachEvents();
    window.isRendering = false;
  });
};

window.showFatalError = function(message){
  document.getElementById('app').innerHTML = `<div class="screen"><div style="max-width:900px;margin:0 auto;padding:24px;border-radius:28px;background:linear-gradient(180deg,rgba(13,30,44,.96),rgba(9,22,34,.94));border:1px solid rgba(255,255,255,.12);box-shadow:0 24px 64px rgba(0,0,0,.32)"><div style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;font-weight:900;color:#7ce6da">Body Anatomy Board Game</div><h1 style="margin:10px 0 8px;font-size:38px;line-height:1">Something broke</h1><p style="color:#c4d7df;font-size:16px;line-height:1.5">${window.escapeHtml(message)}</p></div></div>`;
};
