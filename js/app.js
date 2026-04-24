(function () {
  window.state = window.state || {
    entered: false,
    connectionLabel: "Ready",
    roomCode: "ROOM1",
    joinCode: "",
    lobbyName: "",
    players: [],
    currentPlayerIndex: 0,
    lastRoll: null,
    lastCard: { text: "Roll the dice to begin." },
    feedback: null,
    eventLog: [],
    trivia: null,
    timer: 20,
    isRolling: false,
    audioMuted: false,
    toast: "",
    soundPanelOpen: false,
    invitePopupOpen: false,
    inviteLink: "",
    soundSettings: {
      master: 80,
      dice: 85,
      trivia: 80,
      effects: 80
    }
  };

  window.APP_CONFIG = window.APP_CONFIG || {
    SITE_DOMAIN: "bodyanatomyboardgame.com",
    GAME_TITLE: "Body Anatomy Board Game",
    SUBTITLE: "Class MIB Group Project — Beverly, Stephanie, Lizeth",
    SCHOOL: "North-West College • West Covina, CA • Medical Insurance Biller",
    STORAGE_KEYS: {
      playerName: "anatomy-player-name",
      audioMuted: "anatomy-audio-muted",
      soundSettings: "anatomy-sound-settings"
    }
  };

  window.escapeHtml = function (value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  window.makeRoomCode = function () {
    return Math.random().toString(36).slice(2, 7).toUpperCase();
  };

  window.getConnectionText = function () {
    if (state.connectionLabel) return state.connectionLabel;
    return state.entered ? "Live sync active" : "Ready";
  };

  window.getPlayerCountText = function () {
    const count = Array.isArray(state.players) ? state.players.length : 0;
    return `${count} Player${count === 1 ? "" : "s"}`;
  };

  window.getPlayerName = window.getPlayerName || function (player) {
    return player?.name || "Player";
  };

  window.currentPlayer = window.currentPlayer || function () {
    if (!Array.isArray(state.players) || !state.players.length) return null;
    return state.players[state.currentPlayerIndex] || state.players[0] || null;
  };

  window.myPlayer = window.myPlayer || function () {
    if (!Array.isArray(state.players) || !state.players.length) return null;
    return state.players[0] || null;
  };

  window.showToast = function (message) {
    state.toast = message;
    window.safeRender();

    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
      state.toast = "";
      window.safeRender();
    }, 1700);
  };

  window.getRoomLink = function () {
    const room = encodeURIComponent(state.roomCode || "");
    return `${window.location.origin}${window.location.pathname}?room=${room}`;
  };

  window.copyInviteLink = async function () {
    const link = window.getRoomLink();
    state.inviteLink = link;

    try {
      await navigator.clipboard.writeText(link);
      state.invitePopupOpen = true;
      window.safeRender();
    } catch {
      window.prompt("Copy this invite link:", link);
    }
  };

  window.copyRoomCode = async function () {
    const code = state.roomCode || "";

    try {
      await navigator.clipboard.writeText(code);
      window.showToast("Room code copied!");
    } catch {
      window.prompt("Copy this room code:", code);
    }
  };

  window.applySoundSettings = function () {
    if (typeof window.setAudioMuted === "function") {
      window.setAudioMuted(state.audioMuted);
    }

    if (typeof window.setSoundLevels === "function") {
      window.setSoundLevels({
        master: state.soundSettings.master / 100,
        dice: state.soundSettings.dice / 100,
        trivia: state.soundSettings.trivia / 100,
        effects: state.soundSettings.effects / 100
      });
    }
  };

  window.saveSoundSettings = function () {
    try {
      localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.audioMuted, state.audioMuted ? "1" : "0");
      localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.soundSettings, JSON.stringify(state.soundSettings));
    } catch {}
  };

  window.renderToast = function () {
    if (!state.toast) return "";
    return `<div class="app-toast">${window.escapeHtml(state.toast)}</div>`;
  };

  window.renderInvitePopup = function () {
    if (!state.invitePopupOpen) return "";

    return `
      <div class="invite-popup-backdrop" id="invitePopupBackdrop">
        <div class="invite-popup-card">
          <div class="invite-popup-icon">🔗</div>
          <div class="invite-popup-title">Invite Link Copied!</div>
          <div class="invite-popup-text">
            Send this link to your classmates so they join the same room.
          </div>

          <div class="invite-popup-code">
            Room ${window.escapeHtml(state.roomCode || "----")}
          </div>

          <div class="invite-popup-link">
            ${window.escapeHtml(state.inviteLink || "")}
          </div>

          <button class="btn btn-main" id="closeInvitePopupBtn" type="button">
            Done
          </button>
        </div>
      </div>
    `;
  };

  window.renderFeedback = function () {
    if (!state.feedback || !state.feedback.text) return "";
    return `
      <div class="feedback ${state.feedback.ok ? "good" : "bad"}">
        ${window.escapeHtml(state.feedback.text)}
      </div>
    `;
  };

  window.renderTopBar = function () {
    return `
      <div class="topbar">
        <div class="topbar-left">
          <div class="logo">🧠</div>
          <div>
            <div class="topbar-title">${window.escapeHtml(window.APP_CONFIG.GAME_TITLE)}</div>
            <div class="topbar-meta">
              ${window.escapeHtml(window.APP_CONFIG.SUBTITLE)}<br>
              ${window.escapeHtml(window.APP_CONFIG.SCHOOL)}
            </div>
          </div>
        </div>

        <div class="chip-row">
          <div class="chip">Room: ${window.escapeHtml(state.roomCode || "----")}</div>
          <div class="chip">${window.getPlayerCountText()}</div>
          <div class="chip">${window.escapeHtml(window.getConnectionText())}</div>
          <button class="btn btn-white" id="copyCodeBtn" type="button">📋 Code</button>
          <button class="btn btn-blue" id="inviteBtn" type="button">🔗 Invite</button>
          <button class="btn btn-white" id="soundPanelBtn" type="button">🎚 Sound</button>
          <button class="btn btn-white" id="backToLobbyBtn" type="button">Back</button>
        </div>
      </div>
    `;
  };

  window.renderLobbyScreen = function () {
    return `
      <div class="screen">
        <div class="lobby-wrap premium-lobby-v2">
          <div class="lobby-left lobby-promo-card">
            <div class="lobby-promo-glow"></div>

            <div class="brand brand-lobby">
              <div class="logo">🧠</div>
              <div>
                <div class="lobby-kicker">Anatomy Game Room</div>
                <div class="topbar-title">${window.escapeHtml(window.APP_CONFIG.GAME_TITLE)}</div>
                <div class="topbar-meta">
                  ${window.escapeHtml(window.APP_CONFIG.SUBTITLE)}<br>
                  ${window.escapeHtml(window.APP_CONFIG.SCHOOL)}
                </div>
              </div>
            </div>

            <div class="lobby-hero-copy">
              <div class="lobby-hero-title">Ready to play, race, and answer anatomy trivia?</div>
              <div class="lobby-hero-text">
                Roll the dice, move through the spiral board, land on challenge spaces,
                and reach the brain before everyone else.
              </div>
            </div>

            <div class="lobby-feature-grid">
              <div class="lobby-feature-card">
                <div class="lobby-feature-icon">🎲</div>
                <div class="lobby-feature-title">Roll & Move</div>
                <div class="lobby-feature-text">Advance tile by tile across the spiral board.</div>
              </div>

              <div class="lobby-feature-card">
                <div class="lobby-feature-icon">🧠</div>
                <div class="lobby-feature-title">Trivia Rounds</div>
                <div class="lobby-feature-text">Answer questions before the timer runs out.</div>
              </div>

              <div class="lobby-feature-card">
                <div class="lobby-feature-icon">🛡️</div>
                <div class="lobby-feature-title">Helpful Bonuses</div>
                <div class="lobby-feature-text">Collect shields and good effects along the path.</div>
              </div>

              <div class="lobby-feature-card">
                <div class="lobby-feature-icon">🏆</div>
                <div class="lobby-feature-title">Race to Finish</div>
                <div class="lobby-feature-text">Be first to reach the brain and win.</div>
              </div>
            </div>

            <div class="lobby-room-spotlight">
              <div class="lobby-room-label">ROOM CODE</div>
              <div class="lobby-room-code">${window.escapeHtml(state.roomCode || "----")}</div>
              <div class="lobby-room-note">Share this invite link so others open the same room.</div>
              <div class="lobby-room-actions">
                <button id="copyCodeBtnLobby" class="btn btn-white" type="button">📋 Copy Code</button>
                <button id="inviteBtnLobby" class="btn btn-blue" type="button">🔗 Copy Invite Link</button>
              </div>
            </div>
          </div>

          <div class="lobby-right lobby-join-card">
            <div>
              <div class="lobby-tag">LOBBY</div>
              <div class="lobby-title">Waiting for participants</div>
              <div class="lobby-copy">
                Enter your name, share the invite link, and start when everyone is ready.
              </div>

              <div class="entry-card">
                <div class="entry-label">YOUR NAME</div>
                <input id="nameInput" class="entry-input" type="text" maxlength="20"
                  placeholder="Enter your name"
                  value="${window.escapeHtml(state.lobbyName || "")}">
              </div>

              <div class="entry-card">
                <div class="entry-label">ENTER CODE</div>
                <input id="codeInput" class="entry-input" type="text" maxlength="8"
                  placeholder="Enter code"
                  value="${window.escapeHtml(state.joinCode || state.roomCode || "")}">
              </div>

              <div class="entry-actions">
                <button id="newCodeBtn" class="btn btn-white" type="button">New Code</button>
                <button id="startRoomBtn" class="btn btn-main" type="button">Start Room</button>
              </div>
            </div>

            <div class="lobby-status-row">
              <div class="chip">${window.escapeHtml(window.getConnectionText())}</div>
              <button class="btn btn-white" id="soundPanelBtnLobby" type="button">🎚 Sound</button>
            </div>
          </div>
        </div>

        ${window.renderToast()}
        ${window.renderInvitePopup()}
        ${window.renderSoundPanel()}
      </div>
    `;
  };

  window.renderTurnCard = function () {
    const current = window.currentPlayer();
    const mine = window.myPlayer();
    const yourTurn = !!current && !!mine && current === mine;

    return `
      <div class="hud-card">
        <div class="hud-title">Current Turn</div>
        <div class="turn-hero">
          <div style="font-size:13px;opacity:.92;">${yourTurn ? "Your turn" : "Now moving"}</div>
          <h3 style="margin:6px 0 8px;">${window.escapeHtml(current ? window.getPlayerName(current) : "Player")}</h3>
          <p style="margin:0;">Last Roll: ${window.escapeHtml(state.lastRoll ?? "-")}</p>
        </div>
      </div>
    `;
  };

  window.renderActionsCard = function () {
    return `
      <div class="hud-card">
        <div class="hud-title">Game Actions</div>
        <div class="controls-grid">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <button id="rollBtn" class="btn btn-main" type="button" ${state.isRolling ? "disabled" : ""}>
              🎲 ${state.isRolling ? "Rolling..." : "Roll"}
            </button>
            <button id="shareBtn" class="btn btn-blue" type="button">🔗 Copy Link</button>
          </div>

          <div class="action-box">
            ${window.renderFeedback()}
            <div>${window.escapeHtml(state.lastCard?.text || "Roll the dice to begin.")}</div>
          </div>
        </div>
      </div>
    `;
  };

  window.renderPlayersCard = function () {
    const players = Array.isArray(state.players) ? state.players : [];

    return `
      <div class="hud-card">
        <div class="hud-title">Players</div>
        <div class="players-strip">
          ${players.length ? players.map((player, index) => `
            <div class="player-card">
              <div class="player-top">
                <div class="avatar">${window.getPlayerToken ? window.getPlayerToken(index) : "🩺"}</div>
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
          `).join("") : `<div class="player-card">No players yet.</div>`}
        </div>
      </div>
    `;
  };

  window.renderLiveFeedCard = function () {
    const items = Array.isArray(state.eventLog) && state.eventLog.length
      ? state.eventLog.slice(-8).reverse()
      : [{ message: state.lastCard?.text || "No game events yet." }];

    return `
      <div class="hud-card" style="max-width:1440px;width:100%;margin:0 auto;">
        <div class="hud-title">Game Log</div>
        <div class="action-box" style="min-height:88px;max-height:180px;overflow:auto;">
          ${items.map(item => `
            <div style="padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);margin-bottom:10px;font-size:14px;color:#dfe8eb;">
              ${window.escapeHtml(item.message || item.text || "")}
            </div>
          `).join("")}
        </div>
      </div>
    `;
  };

  window.renderTriviaModal = function () {
    if (!state.trivia) return "";

    const trivia = state.trivia || {};
    const choices = Array.isArray(trivia.choices) ? trivia.choices : [];

    return `
      <div class="trivia-modal" id="triviaModal">
        <div class="trivia-card">
          <div style="display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px;">
            <div>
              <div style="font-size:13px;font-weight:1000;color:#5f716f;background:rgba(118,181,171,.14);border:1px solid rgba(118,181,171,.24);padding:6px 10px;border-radius:999px;margin-bottom:10px;">
                🧠 ${window.escapeHtml(trivia.category || "Anatomy Review")}
              </div>
              <div style="font-size:13px;font-weight:800;color:#7b7368;">Answer before time runs out.</div>
            </div>
            <div class="chip" style="background:linear-gradient(135deg,#74b6c8,#70a7cf);color:#fff;">
              ${window.escapeHtml(state.timer ?? 20)}s
            </div>
          </div>

          <div class="trivia-q">${window.escapeHtml(trivia.q || "")}</div>

          <div class="trivia-grid">
            ${choices.map(choice => `
              <button class="btn trivia-choice" type="button" data-trivia-choice="${window.escapeHtml(choice)}">
                ${window.escapeHtml(choice)}
              </button>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  };

  window.renderDiceOverlay = function () {
    return `
      <div id="diceOverlay" class="dice-overlay hidden">
        <div id="diceBox" class="dice-box">⚀</div>
        <div id="diceLabel" class="dice-label">Rolling...</div>
      </div>
    `;
  };

  window.renderSoundPanel = function () {
    if (!state.soundPanelOpen) return "";

    return `
      <div class="sound-panel-backdrop" id="soundPanelBackdrop">
        <div class="sound-panel-card">
          <div class="sound-panel-top">
            <div>
              <div class="sound-panel-kicker">AUDIO</div>
              <div class="sound-panel-title">Sound Settings</div>
            </div>
            <button class="btn btn-white" id="closeSoundPanelBtn" type="button">Close</button>
          </div>

          ${["master","dice","trivia","effects"].map(key => `
            <label class="sound-row">
              <div class="sound-row-label">
                <span>${key.charAt(0).toUpperCase() + key.slice(1)} Volume</span>
                <strong>${window.escapeHtml(state.soundSettings[key])}%</strong>
              </div>
              <input id="sound-${key}" data-sound-key="${key}" type="range" min="0" max="100" value="${window.escapeHtml(state.soundSettings[key])}">
            </label>
          `).join("")}

          <div class="sound-panel-actions">
            <button class="btn ${state.audioMuted ? "btn-blue" : "btn-white"}" id="muteToggleBtn" type="button">
              ${state.audioMuted ? "Unmute Audio" : "Mute Audio"}
            </button>
            <button class="btn btn-main" id="saveSoundBtn" type="button">Save Settings</button>
          </div>
        </div>
      </div>
    `;
  };

  window.renderGameScreen = function () {
    let boardHtml = "";

    try {
      boardHtml = typeof window.boardMarkup === "function"
        ? window.boardMarkup()
        : `<div class="board-stage premium-board-bg"></div>`;
    } catch (error) {
      boardHtml = `<div class="board-stage premium-board-bg">Board render failed: ${window.escapeHtml(error.message)}</div>`;
    }

    return `
      <div class="screen">
        <div class="game-layout">
          ${window.renderTopBar()}
          <div class="board-panel">${boardHtml}</div>
          <div class="hud-wrap">
            ${window.renderTurnCard()}
            ${window.renderActionsCard()}
            ${window.renderPlayersCard()}
          </div>
          ${window.renderLiveFeedCard()}
        </div>

        ${window.renderTriviaModal()}
        ${window.renderDiceOverlay()}
        ${window.renderToast()}
        ${window.renderInvitePopup()}
        ${window.renderSoundPanel()}
      </div>
    `;
  };

  window.enterRoom = async function () {
    const name = (state.lobbyName || "").trim() || "BEV";

    state.players = [{
      id: 1,
      name,
      ownerId: "local-player",
      position: 0,
      score: 0,
      shields: 0
    }];

    state.currentPlayerIndex = 0;
    state.entered = true;
    state.connectionLabel = "Live sync active";
    state.lastCard = { text: `${name} joined the room.` };
    state.eventLog = [{ id: Date.now(), message: `${name} joined the room.` }];
    window.safeRender();
  };

  window.attachInvitePopupEvents = function () {
    document.getElementById("closeInvitePopupBtn")?.addEventListener("click", () => {
      state.invitePopupOpen = false;
      window.safeRender();
    });

    document.getElementById("invitePopupBackdrop")?.addEventListener("click", (e) => {
      if (e.target.id === "invitePopupBackdrop") {
        state.invitePopupOpen = false;
        window.safeRender();
      }
    });
  };

  window.attachSoundPanelEvents = function () {
    document.getElementById("soundPanelBackdrop")?.addEventListener("click", e => {
      if (e.target.id === "soundPanelBackdrop") {
        state.soundPanelOpen = false;
        window.safeRender();
      }
    });

    document.getElementById("closeSoundPanelBtn")?.addEventListener("click", () => {
      state.soundPanelOpen = false;
      window.safeRender();
    });

    document.getElementById("muteToggleBtn")?.addEventListener("click", () => {
      state.audioMuted = !state.audioMuted;
      window.applySoundSettings();
      window.saveSoundSettings();
      window.safeRender();
    });

    document.querySelectorAll("[data-sound-key]").forEach(input => {
      input.addEventListener("input", e => {
        const key = e.target.getAttribute("data-sound-key");
        state.soundSettings[key] = Number(e.target.value || 0);
      });
    });

    document.getElementById("saveSoundBtn")?.addEventListener("click", () => {
      window.applySoundSettings();
      window.saveSoundSettings();
      state.soundPanelOpen = false;
      window.showToast("Sound settings saved!");
    });
  };

  window.attachLobbyEvents = function () {
    document.getElementById("nameInput")?.addEventListener("input", e => {
      state.lobbyName = e.target.value;
      try { localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.playerName, state.lobbyName); } catch {}
    });

    document.getElementById("codeInput")?.addEventListener("input", e => {
      state.joinCode = String(e.target.value || "").toUpperCase();
      e.target.value = state.joinCode;
    });

    document.getElementById("newCodeBtn")?.addEventListener("click", () => {
      state.roomCode = window.makeRoomCode();
      state.joinCode = state.roomCode;
      window.safeRender();
    });

    document.getElementById("startRoomBtn")?.addEventListener("click", async () => {
      const code = (state.joinCode || state.roomCode || "").trim().toUpperCase();
      if (code) state.roomCode = code;
      await window.enterRoom();
    });

    document.getElementById("copyCodeBtnLobby")?.addEventListener("click", window.copyRoomCode);
    document.getElementById("inviteBtnLobby")?.addEventListener("click", window.copyInviteLink);

    document.getElementById("soundPanelBtnLobby")?.addEventListener("click", () => {
      state.soundPanelOpen = true;
      window.safeRender();
    });

    window.attachSoundPanelEvents();
    window.attachInvitePopupEvents();
  };

  window.attachGameEvents = function () {
    document.getElementById("rollBtn")?.addEventListener("click", async () => {
      if (typeof window.handleRoll === "function") await window.handleRoll();
    });

    document.getElementById("shareBtn")?.addEventListener("click", window.copyInviteLink);
    document.getElementById("inviteBtn")?.addEventListener("click", window.copyInviteLink);
    document.getElementById("copyCodeBtn")?.addEventListener("click", window.copyRoomCode);

    document.getElementById("soundPanelBtn")?.addEventListener("click", () => {
      state.soundPanelOpen = true;
      window.safeRender();
    });

    document.getElementById("backToLobbyBtn")?.addEventListener("click", () => {
      state.entered = false;
      state.trivia = null;
      state.isRolling = false;
      state.soundPanelOpen = false;
      state.invitePopupOpen = false;
      window.safeRender();
    });

    document.querySelectorAll("[data-trivia-choice]").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (typeof window.submitTrivia === "function") {
          await window.submitTrivia(btn.getAttribute("data-trivia-choice"));
        }
      });
    });

    window.attachSoundPanelEvents();
    window.attachInvitePopupEvents();
  };

  window.attachUiEvents = function () {
    state.entered ? window.attachGameEvents() : window.attachLobbyEvents();
  };

  window.renderApp = function () {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = state.entered ? window.renderGameScreen() : window.renderLobbyScreen();
    window.attachUiEvents();
  };

  window.safeRender = function () {
    try {
      window.renderApp();
    } catch (error) {
      document.getElementById("app").innerHTML = `
        <div class="screen">
          <div class="hud-card" style="max-width:900px;margin:40px auto;">
            <div class="hud-title">UI render failed</div>
            <div>${window.escapeHtml(error?.message || "Unknown UI error")}</div>
          </div>
        </div>
      `;
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    try {
      const savedName = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.playerName);
      if (savedName) state.lobbyName = savedName;
    } catch {}

    try {
      const muted = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.audioMuted);
      state.audioMuted = muted === "1";
    } catch {}

    try {
      const savedSettings = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.soundSettings);
      if (savedSettings) state.soundSettings = { ...state.soundSettings, ...JSON.parse(savedSettings) };
    } catch {}

    const params = new URLSearchParams(window.location.search);
    const roomFromLink = params.get("room");

    if (roomFromLink) {
      state.roomCode = roomFromLink.toUpperCase();
      state.joinCode = roomFromLink.toUpperCase();
    }

    if (!state.roomCode) state.roomCode = window.makeRoomCode();
    if (!state.joinCode) state.joinCode = state.roomCode;

    window.applySoundSettings();
    window.safeRender();
  });
})();
