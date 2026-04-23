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

  window.getLastCardText = function () {
    if (state.lastCard && state.lastCard.text) return state.lastCard.text;
    return "Roll the dice to begin.";
  };

  window.getLiveFeedItems = function () {
    if (Array.isArray(state.eventLog) && state.eventLog.length) {
      return state.eventLog.slice(-8).reverse();
    }
    return [{ id: "fallback", message: window.getLastCardText() }];
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

  window.getShareText = function () {
    return `Join my Body Anatomy Board Game room with code: ${state.roomCode || ""}`;
  };

  window.copyRoomCode = async function () {
    const code = state.roomCode || "";
    try {
      if (navigator.clipboard && code) {
        await navigator.clipboard.writeText(code);
        window.showToast("Room code copied!");
      } else {
        window.showToast("Could not copy room code.");
      }
    } catch {
      window.showToast("Could not copy room code.");
    }
  };

  window.inviteToRoom = async function () {
    const shareText = window.getShareText();
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Body Anatomy Board Game",
          text: shareText
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        window.showToast("Invite copied!");
      } else {
        window.showToast("Invite unavailable.");
      }
    } catch {}
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
      localStorage.setItem(
        window.APP_CONFIG.STORAGE_KEYS.soundSettings,
        JSON.stringify(state.soundSettings)
      );
    } catch {}
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
          <button class="btn btn-white" id="copyCodeBtn" type="button">📋 Copy</button>
          <button class="btn btn-blue" id="inviteBtn" type="button">🔗 Invite</button>
          <button class="btn btn-white" id="soundPanelBtn" type="button">🎚 Sound</button>
          <button class="btn btn-white" id="backToLobbyBtn" type="button">Back</button>
        </div>
      </div>
    `;
  };

  window.renderLobbyPromoPlayers = function () {
    const players = Array.isArray(state.players) ? state.players : [];
    if (!players.length) {
      return `
        <div class="lobby-mini-players">
          <div class="lobby-mini-player empty">Waiting for players...</div>
        </div>
      `;
    }

    return `
      <div class="lobby-mini-players">
        ${players.map((player, index) => `
          <div class="lobby-mini-player">
            <span class="lobby-mini-avatar">${window.getPlayerToken ? window.getPlayerToken(index) : "🩺"}</span>
            <span>${window.escapeHtml(window.getPlayerName(player))}</span>
          </div>
        `).join("")}
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
              <div class="lobby-room-note">Share this code so others can join your room.</div>
              <div class="lobby-room-actions">
                <button id="copyCodeBtnLobby" class="btn btn-white" type="button">📋 Copy Code</button>
                <button id="inviteBtnLobby" class="btn btn-blue" type="button">🔗 Invite</button>
              </div>
            </div>

            ${window.renderLobbyPromoPlayers()}
          </div>

          <div class="lobby-right lobby-join-card">
            <div>
              <div class="lobby-tag">LOBBY</div>
              <div class="lobby-title">Waiting for participants</div>
              <div class="lobby-copy">
                Enter your name, share the room code, and start when everyone is ready.
              </div>

              <div class="entry-card">
                <div class="entry-label">YOUR NAME</div>
                <input
                  id="nameInput"
                  class="entry-input"
                  type="text"
                  maxlength="20"
                  placeholder="Enter your name"
                  value="${window.escapeHtml(state.lobbyName || "")}"
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
                  value="${window.escapeHtml(state.joinCode || state.roomCode || "")}"
                >
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
    const category = trivia.category || "Anatomy Review";

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

          <div class="trivia-q">${window.escapeHtml(trivia.q || "")}</div>

          <div class="trivia-grid">
            ${choices.map(choice => `
              <button
                class="btn trivia-choice"
                type="button"
                data-trivia-choice="${window.escapeHtml(choice)}"
              >
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

  window.renderToast = function () {
    if (!state.toast) return "";
    return `
      <div class="app-toast">
        ${window.escapeHtml(state.toast)}
      </div>
    `;
  };

  window.renderSoundPanel = function () {
    if (!state.soundPanelOpen) return "";

    return `
      <div class="sound-panel-backdrop" id="soundPanelBackdrop">
        <div class="sound-panel-card" role="dialog" aria-modal="true">
          <div class="sound-panel-top">
            <div>
              <div class="sound-panel-kicker">AUDIO</div>
              <div class="sound-panel-title">Sound Settings</div>
            </div>
            <button class="btn btn-white" id="closeSoundPanelBtn" type="button">Close</button>
          </div>

          <div class="sound-panel-grid">
            <label class="sound-row">
              <div class="sound-row-label">
                <span>Master Volume</span>
                <strong>${window.escapeHtml(state.soundSettings.master)}%</strong>
              </div>
              <input id="soundMaster" type="range" min="0" max="100" value="${window.escapeHtml(state.soundSettings.master)}">
            </label>

            <label class="sound-row">
              <div class="sound-row-label">
                <span>Dice Volume</span>
                <strong>${window.escapeHtml(state.soundSettings.dice)}%</strong>
              </div>
              <input id="soundDice" type="range" min="0" max="100" value="${window.escapeHtml(state.soundSettings.dice)}">
            </label>

            <label class="sound-row">
              <div class="sound-row-label">
                <span>Trivia Volume</span>
                <strong>${window.escapeHtml(state.soundSettings.trivia)}%</strong>
              </div>
              <input id="soundTrivia" type="range" min="0" max="100" value="${window.escapeHtml(state.soundSettings.trivia)}">
            </label>

            <label class="sound-row">
              <div class="sound-row-label">
                <span>Effects Volume</span>
                <strong>${window.escapeHtml(state.soundSettings.effects)}%</strong>
              </div>
              <input id="soundEffects" type="range" min="0" max="100" value="${window.escapeHtml(state.soundSettings.effects)}">
            </label>
          </div>

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
      boardHtml = `
        <div class="board-stage premium-board-bg" style="display:flex;align-items:center;justify-content:center;padding:40px;">
          <div class="hud-card" style="max-width:720px;width:100%;">
            <div class="hud-title">Board render failed</div>
            <div>${window.escapeHtml(error?.message || "Unknown board error")}</div>
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
        ${window.renderToast()}
        ${window.renderSoundPanel()}
      </div>
    `;
  };

  window.enterRoom = async function () {
    const name = (state.lobbyName || "").trim() || "BEV";

    state.players = [
      {
        id: 1,
        name,
        ownerId: "local-player",
        position: 0,
        score: 0,
        shields: 0,
      },
    ];

    state.currentPlayerIndex = 0;
    state.entered = true;
    state.connectionLabel = "Live sync active";
    state.lastCard = { text: `${name} joined the room.` };
    state.eventLog = [{ id: Date.now(), message: `${name} joined the room.` }];
    window.safeRender();
  };

  window.attachLobbyEvents = function () {
    const nameInput = document.getElementById("nameInput");
    const codeInput = document.getElementById("codeInput");
    const newCodeBtn = document.getElementById("newCodeBtn");
    const startRoomBtn = document.getElementById("startRoomBtn");
    const copyCodeBtnLobby = document.getElementById("copyCodeBtnLobby");
    const inviteBtnLobby = document.getElementById("inviteBtnLobby");
    const soundPanelBtnLobby = document.getElementById("soundPanelBtnLobby");

    if (nameInput) {
      nameInput.addEventListener("input", (e) => {
        state.lobbyName = e.target.value;
        try {
          localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.playerName, state.lobbyName);
        } catch {}
      });
    }

    if (codeInput) {
      codeInput.addEventListener("input", (e) => {
        state.joinCode = String(e.target.value || "").toUpperCase();
        if (e.target.value !== state.joinCode) e.target.value = state.joinCode;
      });
    }

    if (newCodeBtn) {
      newCodeBtn.addEventListener("click", () => {
        state.roomCode = window.makeRoomCode();
        state.joinCode = state.roomCode;
        window.safeRender();
      });
    }

    if (startRoomBtn) {
      startRoomBtn.addEventListener("click", async () => {
        const desiredCode = (state.joinCode || state.roomCode || "").trim().toUpperCase();
        if (desiredCode) state.roomCode = desiredCode;
        if (!state.lobbyName || !state.lobbyName.trim()) {
          state.lastCard = { text: "Please enter your name first." };
          return window.safeRender();
        }
        await window.enterRoom();
      });
    }

    if (copyCodeBtnLobby) {
      copyCodeBtnLobby.addEventListener("click", async () => {
        await window.copyRoomCode();
      });
    }

    if (inviteBtnLobby) {
      inviteBtnLobby.addEventListener("click", async () => {
        await window.inviteToRoom();
      });
    }

    if (soundPanelBtnLobby) {
      soundPanelBtnLobby.addEventListener("click", () => {
        state.soundPanelOpen = true;
        window.safeRender();
      });
    }

    window.attachSoundPanelEvents();
  };

  window.attachSoundPanelEvents = function () {
    const backdrop = document.getElementById("soundPanelBackdrop");
    const closeBtn = document.getElementById("closeSoundPanelBtn");
    const muteToggleBtn = document.getElementById("muteToggleBtn");
    const saveSoundBtn = document.getElementById("saveSoundBtn");

    const master = document.getElementById("soundMaster");
    const dice = document.getElementById("soundDice");
    const trivia = document.getElementById("soundTrivia");
    const effects = document.getElementById("soundEffects");

    if (backdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
          state.soundPanelOpen = false;
          window.safeRender();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        state.soundPanelOpen = false;
        window.safeRender();
      });
    }

    if (muteToggleBtn) {
      muteToggleBtn.addEventListener("click", () => {
        state.audioMuted = !state.audioMuted;
        window.applySoundSettings();
        window.saveSoundSettings();
        window.safeRender();
      });
    }

    if (master) {
      master.addEventListener("input", (e) => {
        state.soundSettings.master = Number(e.target.value || 0);
      });
    }

    if (dice) {
      dice.addEventListener("input", (e) => {
        state.soundSettings.dice = Number(e.target.value || 0);
      });
    }

    if (trivia) {
      trivia.addEventListener("input", (e) => {
        state.soundSettings.trivia = Number(e.target.value || 0);
      });
    }

    if (effects) {
      effects.addEventListener("input", (e) => {
        state.soundSettings.effects = Number(e.target.value || 0);
      });
    }

    if (saveSoundBtn) {
      saveSoundBtn.addEventListener("click", () => {
        window.applySoundSettings();
        window.saveSoundSettings();
        state.soundPanelOpen = false;
        window.showToast("Sound settings saved!");
      });
    }
  };

  window.attachGameEvents = function () {
    const rollBtn = document.getElementById("rollBtn");
    const shareBtn = document.getElementById("shareBtn");
    const backBtn = document.getElementById("backToLobbyBtn");
    const copyCodeBtn = document.getElementById("copyCodeBtn");
    const inviteBtn = document.getElementById("inviteBtn");
    const soundPanelBtn = document.getElementById("soundPanelBtn");

    if (rollBtn) {
      rollBtn.addEventListener("click", async () => {
        if (typeof window.handleRoll === "function") {
          await window.handleRoll();
        } else {
          state.lastCard = { text: "handleRoll is missing. Next file should be game.js." };
          window.safeRender();
        }
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener("click", async () => {
        await window.inviteToRoom();
      });
    }

    if (copyCodeBtn) {
      copyCodeBtn.addEventListener("click", async () => {
        await window.copyRoomCode();
      });
    }

    if (inviteBtn) {
      inviteBtn.addEventListener("click", async () => {
        await window.inviteToRoom();
      });
    }

    if (soundPanelBtn) {
      soundPanelBtn.addEventListener("click", () => {
        state.soundPanelOpen = true;
        window.safeRender();
      });
    }

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        state.entered = false;
        state.trivia = null;
        state.isRolling = false;
        state.soundPanelOpen = false;
        window.safeRender();
      });
    }

    document.querySelectorAll("[data-trivia-choice]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const choice = btn.getAttribute("data-trivia-choice");
        if (typeof window.submitTrivia === "function") {
          await window.submitTrivia(choice);
        }
      });
    });

    window.attachSoundPanelEvents();
  };

  window.attachUiEvents = function () {
    if (state.entered) {
      window.attachGameEvents();
    } else {
      window.attachLobbyEvents();
    }
  };

  window.renderApp = function () {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = state.entered
      ? window.renderGameScreen()
      : window.renderLobbyScreen();

    window.attachUiEvents();
  };

  window.safeRender = function () {
    try {
      window.renderApp();
    } catch (error) {
      const app = document.getElementById("app");
      if (!app) return;
      app.innerHTML = `
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
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        state.soundSettings = {
          ...state.soundSettings,
          ...parsed
        };
      }
    } catch {}

    if (!state.roomCode) state.roomCode = window.makeRoomCode();
    if (!state.joinCode) state.joinCode = state.roomCode;

    window.applySoundSettings();
    window.safeRender();
  });
})();
