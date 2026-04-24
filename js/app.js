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
    GAME_TITLE: "Body Anatomy Board Game",
    SUBTITLE: "Class MIB Group Project — Beverly, Stephanie, Lizeth",
    SCHOOL: "North-West College • West Covina, CA • Medical Insurance Biller"
  };

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  window.escapeHtml = esc;

  function makeRoomCode() {
    return Math.random().toString(36).slice(2, 7).toUpperCase();
  }

  function currentPlayer() {
    if (!Array.isArray(state.players) || !state.players.length) return null;
    return state.players[state.currentPlayerIndex] || state.players[0];
  }

  window.currentPlayer = currentPlayer;

  function myPlayer() {
    if (!Array.isArray(state.players) || !state.players.length) return null;
    return state.players[0];
  }

  window.myPlayer = myPlayer;

  function showToast(msg) {
    state.toast = msg;
    safeRender();

    clearTimeout(window.__toast);
    window.__toast = setTimeout(() => {
      state.toast = "";
      safeRender();
    }, 1600);
  }

  window.showToast = showToast;

  function roomLink() {
    return `${location.origin}${location.pathname}?room=${encodeURIComponent(state.roomCode)}`;
  }

  window.getRoomLink = roomLink;

  window.copyInviteLink = async function () {
    const link = roomLink();
    state.inviteLink = link;

    try {
      await navigator.clipboard.writeText(link);
      state.invitePopupOpen = true;
      safeRender();
    } catch {
      prompt("Copy this link:", link);
    }
  };

  window.copyRoomCode = async function () {
    try {
      await navigator.clipboard.writeText(state.roomCode);
      showToast("Room code copied!");
    } catch {
      prompt("Copy room code:", state.roomCode);
    }
  };

  function topbar() {
    return `
      <div class="topbar">
        <div class="topbar-left">
          <div class="logo">🧠</div>
          <div>
            <div class="topbar-title">${esc(APP_CONFIG.GAME_TITLE)}</div>
            <div class="topbar-meta">
              ${esc(APP_CONFIG.SUBTITLE)}<br>
              ${esc(APP_CONFIG.SCHOOL)}
            </div>
          </div>
        </div>

        <div class="chip-row">
          <div class="chip">Room: ${esc(state.roomCode)}</div>
          <button class="btn btn-white" id="copyCodeBtn">📋 Code</button>
          <button class="btn btn-blue" id="inviteBtn">🔗 Invite</button>
          <button class="btn btn-white" id="backBtn">Back</button>
        </div>
      </div>
    `;
  }

  function toast() {
    if (!state.toast) return "";
    return `<div class="app-toast">${esc(state.toast)}</div>`;
  }

  function invitePopup() {
    if (!state.invitePopupOpen) return "";

    return `
      <div class="invite-popup-backdrop" id="invitePopupBackdrop">
        <div class="invite-popup-card">
          <div class="invite-popup-icon">🔗</div>
          <div class="invite-popup-title">Invite Link Copied!</div>
          <div class="invite-popup-text">Share with classmates to join the same room.</div>
          <div class="invite-popup-code">Room ${esc(state.roomCode)}</div>
          <div class="invite-popup-link">${esc(state.inviteLink)}</div>
          <button class="btn btn-main" id="closeInviteBtn">Done</button>
        </div>
      </div>
    `;
  }

  function lobby() {
    return `
      <div class="screen">
        <div class="lobby-wrap premium-lobby-v2">

          <div class="lobby-left lobby-promo-card">
            <div class="lobby-kicker">ANATOMY GAME ROOM</div>
            <div class="topbar-title">${esc(APP_CONFIG.GAME_TITLE)}</div>

            <div class="lobby-hero-title">
              Roll, learn, race to the Brain.
            </div>

            <div class="lobby-room-spotlight">
              <div class="lobby-room-label">ROOM CODE</div>
              <div class="lobby-room-code">${esc(state.roomCode)}</div>

              <div class="lobby-room-actions">
                <button class="btn btn-white" id="copyCodeLobby">📋 Code</button>
                <button class="btn btn-blue" id="inviteLobby">🔗 Invite</button>
              </div>
            </div>
          </div>

          <div class="lobby-right lobby-join-card">
            <div class="lobby-title">Waiting for players</div>

            <div class="entry-card">
              <div class="entry-label">YOUR NAME</div>
              <input id="nameInput" class="entry-input"
                value="${esc(state.lobbyName)}"
                placeholder="Enter your name">
            </div>

            <div class="entry-card">
              <div class="entry-label">ROOM CODE</div>
              <input id="codeInput" class="entry-input"
                value="${esc(state.joinCode || state.roomCode)}">
            </div>

            <div class="entry-actions">
              <button class="btn btn-white" id="newCodeBtn">New Code</button>
              <button class="btn btn-main" id="startBtn">Start Room</button>
            </div>
          </div>

        </div>

        ${toast()}
        ${invitePopup()}
      </div>
    `;
  }

  function turnCard() {
    const p = currentPlayer();

    return `
      <div class="hud-card">
        <div class="hud-title">Current Turn</div>
        <div class="turn-hero">
          <h3>${esc(p ? p.name : "Player")}</h3>
          <p>Last Roll: ${esc(state.lastRoll ?? "-")}</p>
        </div>
      </div>
    `;
  }

  function actionsCard() {
    return `
      <div class="hud-card">
        <div class="hud-title">Game Actions</div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <button class="btn btn-main" id="rollBtn" ${state.isRolling ? "disabled" : ""}>
            🎲 ${state.isRolling ? "Rolling..." : "Roll"}
          </button>

          <button class="btn btn-blue" id="shareBtn">
            🔗 Invite
          </button>
        </div>

        <div class="action-box" style="margin-top:12px;">
          ${esc(state.lastCard?.text || "Roll to begin.")}
        </div>
      </div>
    `;
  }

  function playersCard() {
    const list = Array.isArray(state.players) ? state.players : [];

    return `
      <div class="hud-card">
        <div class="hud-title">Players</div>

        <div class="players-strip">
          ${list.map((p, i) => `
            <div class="player-card">
              <div class="player-top">
                <div class="avatar">${window.getPlayerToken ? window.getPlayerToken(i) : "🩺"}</div>
                <div>
                  <div style="font-weight:1000">${esc(p.name)}</div>
                  <div style="font-size:12px;color:var(--muted)">
                    Position ${esc(p.position || 0)}
                  </div>
                </div>
              </div>

              <div style="font-size:12px;color:var(--muted);margin-top:8px;">
                Score: ${esc(p.score || 0)}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function gameLogCard() {
    const list = Array.isArray(state.eventLog) && state.eventLog.length
      ? state.eventLog.slice(-8).reverse()
      : [{ message: "No game events yet." }];

    return `
      <div class="hud-card notebook-log-wrap">
        <div class="hud-title">Game Log</div>

        <div class="notebook-log">
          ${list.map((item, i) => `
            <div class="notebook-row">
              <div class="notebook-dot">${i + 1}</div>
              <div class="notebook-text">${esc(item.message || "")}</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function triviaModal() {
    if (!state.trivia) return "";

    return `
      <div class="trivia-modal">
        <div class="trivia-card">
          <div class="trivia-q">${esc(state.trivia.q)}</div>

          <div class="trivia-grid">
            ${state.trivia.choices.map(choice => `
              <button class="btn trivia-choice" data-choice="${esc(choice)}">
                ${esc(choice)}
              </button>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  function game() {
    return `
      <div class="screen">
        <div class="game-layout">

          ${topbar()}

          <div class="board-panel">
            ${window.boardMarkup ? window.boardMarkup() : ""}
          </div>

          <div class="hud-wrap">
            ${turnCard()}
            ${actionsCard()}
            ${playersCard()}
          </div>

          ${gameLogCard()}
        </div>

        ${triviaModal()}
        ${toast()}
        ${invitePopup()}
      </div>
    `;
  }

  function renderApp() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = state.entered ? game() : lobby();
    bind();
  }

  window.safeRender = renderApp;

  function bindInvite() {
    document.getElementById("closeInviteBtn")?.addEventListener("click", () => {
      state.invitePopupOpen = false;
      renderApp();
    });

    document.getElementById("invitePopupBackdrop")?.addEventListener("click", (e) => {
      if (e.target.id === "invitePopupBackdrop") {
        state.invitePopupOpen = false;
        renderApp();
      }
    });
  }

  function bindLobby() {
    document.getElementById("nameInput")?.addEventListener("input", e => {
      state.lobbyName = e.target.value;
    });

    document.getElementById("codeInput")?.addEventListener("input", e => {
      state.joinCode = e.target.value.toUpperCase();
    });

    document.getElementById("newCodeBtn")?.addEventListener("click", () => {
      state.roomCode = makeRoomCode();
      state.joinCode = state.roomCode;
      renderApp();
    });

    document.getElementById("startBtn")?.addEventListener("click", () => {
      state.roomCode = state.joinCode || state.roomCode;

      state.players = [{
        id: 1,
        name: state.lobbyName || "BEV",
        position: 0,
        score: 0,
        shields: 0
      }];

      state.entered = true;
      state.eventLog = [{ message: "Room started." }];
      renderApp();
    });

    document.getElementById("copyCodeLobby")?.onclick = window.copyRoomCode;
    document.getElementById("inviteLobby")?.onclick = window.copyInviteLink;

    bindInvite();
  }

  function bindGame() {
    document.getElementById("rollBtn")?.addEventListener("click", async () => {
      await window.handleRoll?.();
    });

    document.getElementById("shareBtn")?.onclick = window.copyInviteLink;
    document.getElementById("inviteBtn")?.onclick = window.copyInviteLink;
    document.getElementById("copyCodeBtn")?.onclick = window.copyRoomCode;

    document.getElementById("backBtn")?.addEventListener("click", () => {
      state.entered = false;
      renderApp();
    });

    document.querySelectorAll("[data-choice]").forEach(btn => {
      btn.addEventListener("click", async () => {
        await window.submitTrivia?.(btn.dataset.choice);
      });
    });

    bindInvite();
  }

  function bind() {
    state.entered ? bindGame() : bindLobby();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(location.search);
    const room = params.get("room");

    state.roomCode = room ? room.toUpperCase() : makeRoomCode();
    state.joinCode = state.roomCode;

    renderApp();
  });
})();
