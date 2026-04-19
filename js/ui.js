window.escapeHtml = function(value){
  return String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
};

window.saveNameQuietly = function(value){
  state.lobbyName = value.slice(0,18);
  localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.playerName,state.lobbyName);
};

window.commitNameChange = async function(value){
  window.saveNameQuietly(value);
};

window.makeNewCode = function(){
  const code = Math.random().toString(36).slice(2,7).toUpperCase();
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
        ${state.connectionLabel}
      </div>
    </div>
  </div>
</div>
`;
};

window.gameScreen = function(){
return `
<div class="screen">
  <div class="glass" style="max-width:1100px;margin:0 auto;padding:32px;border-radius:28px;">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
      <div>
        <div class="domain" style="color:#8be4d8">${window.APP_CONFIG.SITE_DOMAIN}</div>
        <div class="title" style="font-size:42px;">Joined Room</div>
        <div class="subtitle">Room: ${window.escapeHtml(state.roomCode)}</div>
      </div>
      <button class="btn btn-white click-btn" onclick="window.goBackHome()">Back</button>
    </div>

    <div style="margin-top:24px;padding:20px;border-radius:20px;background:rgba(255,255,255,.05);">
      <div style="font-size:24px;font-weight:900;">You made it into the game screen.</div>
      <div style="margin-top:10px;color:#c4d7df;">If you can see this, the Start Room button works and the real problem is in board/game rendering.</div>
      <div style="margin-top:18px;font-weight:800;">Status: ${window.escapeHtml(state.connectionLabel)}</div>
      <div style="margin-top:8px;font-weight:800;">Player: ${window.escapeHtml(state.lobbyName)}</div>
      <div style="margin-top:8px;font-weight:800;">Players loaded: ${Array.isArray(state.players) ? state.players.length : 0}</div>
    </div>
  </div>
</div>
`;
};

window.attachEvents = function(){
  const joinInput = document.getElementById('joinCodeInput');
  if(joinInput && !joinInput.dataset.bound){
    joinInput.dataset.bound='1';
    joinInput.addEventListener('input',e=>{
      state.joinCode = e.target.value.toUpperCase();
    });
  }

  const nameInput = document.getElementById('playerNameInput');
  if(nameInput && !nameInput.dataset.bound){
    nameInput.dataset.bound='1';
    nameInput.addEventListener('input',e=>{
      window.saveNameQuietly(e.target.value);
    });
  }
};

window.tickTrivia = function(){};

window.safeRender = function(){
  if(window.isRendering) return;
  window.isRendering = true;

  requestAnimationFrame(()=>{
    document.getElementById('app').innerHTML =
      state.entered ? window.gameScreen() : window.lobbyScreen();

    window.attachEvents();
    window.isRendering = false;
  });
};

window.showFatalError = function(message){
  document.getElementById('app').innerHTML = `
  <div class="screen">
    <div style="max-width:900px;margin:0 auto;padding:24px;border-radius:28px;background:rgba(12,25,40,.95);border:1px solid rgba(255,255,255,.1);">
      <h1>Something broke</h1>
      <p>${window.escapeHtml(message)}</p>
    </div>
  </div>`;
};
