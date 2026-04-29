(function () {
  window.state = window.state || {
    entered: false,
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
    toast: "",
    invitePopupOpen: false,
    inviteLink: ""
  };

  window.escapeHtml = function (v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  function makeCode() {
    return Math.random().toString(36).slice(2, 7).toUpperCase();
  }

  function currentPlayer() {
    if (!Array.isArray(state.players) || !state.players.length) return null;
    return state.players[state.currentPlayerIndex] || state.players[0];
  }

  window.currentPlayer = currentPlayer;

  window.getRoomLink = function () {
    return window.location.origin + window.location.pathname + "?room=" + encodeURIComponent(state.roomCode || "");
  };

  window.copyInviteLink = function () {
    var link = window.getRoomLink();
    state.inviteLink = link;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(function () {
        state.invitePopupOpen = true;
        window.safeRender();
      });
    } else {
      prompt("Copy this invite link:", link);
    }
  };

  window.copyRoomCode = function () {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(state.roomCode || "");
      state.toast = "Room code copied!";
      window.safeRender();
      setTimeout(function () {
        state.toast = "";
        window.safeRender();
      }, 1500);
    }
  };

  function topbar() {
    return `
      <div class="topbar">
        <div class="topbar-left">
          <div class="logo">🧠</div>
          <div>
            <div class="topbar-title">Body Anatomy Board Game</div>
            <div class="topbar-meta">
              Class MIB Group Project — Beverly, Stephanie, Lizeth<br>
              North-West College • West Covina, CA • Medical Insurance Biller
            </div>
          </div>
        </div>

        <div class="chip-row">
          <div class="chip">Room: ${escapeHtml(state.roomCode)}</div>
          <button class="btn btn-white" id="copyCodeBtn">📋 Code</button>
          <button class="btn btn-blue" id="inviteBtn">🔗 Invite</button>
          <button class="btn btn-white" id="backBtn">Back</button>
        </div>
      </div>
    `;
  }

  function toast() {
    if (!state.toast) return "";
    return `<div class="app-toast">${escapeHtml(state.toast)}</div>`;
  }

  function invitePopup() {
    if (!state.invitePopupOpen) return "";

    return `
      <div class="invite-popup-backdrop" id="invitePopupBackdrop">
        <div class="invite-popup-card">
          <div class="invite-popup-icon">🔗</div>
          <div class="invite-popup-title">Invite Link Copied!</div>
          <div class="invite-popup-text">Share this link so others join the same room.</div>
          <div class="invite-popup-code">Room ${escapeHtml(state.roomCode)}</div>
          <div class="invite-popup-link">${escapeHtml(state.inviteLink)}</div>
          <button class="btn btn-main" id="closeInviteBtn">Done</button>
        </div>
      </div>
    `;
  }

  function lobbyScreen() {
    return `
      <div class="screen">
        <div class="lobby-wrap premium-lobby-v2">
          <div class="lobby-left lobby-promo-card">
            <div class="brand brand-lobby">
              <div class="logo">🧠</div>
              <div>
                <div class="lobby-kicker">Anatomy Game Room</div>
                <div class="topbar-title">Body Anatomy Board Game</div>
                <div class="topbar-meta">
                  Class MIB Group Project — Beverly, Stephanie, Lizeth<br>
                  North-West College • West Covina, CA • Medical Insurance Biller
                </div>
              </div>
            </div>

            <div class="lobby-hero-copy">
              <div class="lobby-hero-title">Roll, learn, race to the Brain.</div>
              <div class="lobby-hero-text">Share your room code and start when everyone is ready.</div>
            </div>

            <div class="lobby-room-spotlight">
              <div class="lobby-room-label">ROOM CODE</div>
              <div class="lobby-room-code">${escapeHtml(state.roomCode)}</div>
              <div class="lobby-room-actions">
                <button class="btn btn-white" id="copyCodeLobby">📋 Copy Code</button>
                <button class="btn btn-blue" id="inviteLobby">🔗 Copy Invite Link</button>
              </div>
            </div>
          </div>

          <div class="lobby-right lobby-join-card">
            <div>
              <div class="lobby-tag">LOBBY</div>
              <div class="lobby-title">Waiting for players</div>

              <div class="entry-card">
                <div class="entry-label">YOUR NAME</div>
                <input id="nameInput" class="entry-input" value="${escapeHtml(state.lobbyName || "")}" placeholder="Enter your name">
              </div>

              <div class="entry-card">
                <div class="entry-label">ROOM CODE</div>
                <input id="codeInput" class="entry-input" value="${escapeHtml(state.joinCode || state.roomCode)}">
              </div>

              <div class="entry-actions">
                <button class="btn btn-white" id="newCodeBtn">New Code</button>
                <button class="btn btn-main" id="startBtn">Start Room</button>
              </div>
            </div>
          </div>
        </div>

        ${toast()}
        ${invitePopup()}
      </div>
    `;
  }

  function gameScreen() {
    var board = "";

    try {
      board = typeof window.boardMarkup === "function" ? window.boardMarkup() : "";
    } catch (e) {
      board = `<div class="board-stage premium-board-bg">Board error: ${escapeHtml(e.message)}</div>`;
    }

    var p = currentPlayer();

    return `
      <div class="screen">
        <div class="game-layout">
          ${topbar()}

          <div class="board-panel">${board}</div>

          <div class="hud-wrap">
            <div class="hud-card">
              <div class="hud-title">Current Turn</div>
              <div class="turn-hero">
                <h3>${escapeHtml(p ? p.name : "Player")}</h3>
                <p>Last Roll: ${escapeHtml(state.lastRoll == null ? "-" : state.lastRoll)}</p>
              </div>
            </div>

            <div class="hud-card">
              <div class="hud-title">Game Actions</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <button class="btn btn-main" id="rollBtn">${state.isRolling ? "Rolling..." : "🎲 Roll"}</button>
                <button class="btn btn-blue" id="shareBtn">🔗 Invite</button>
              </div>
              <div class="action-box" style="margin-top:12px;">
                ${escapeHtml(state.lastCard && state.lastCard.text ? state.lastCard.text : "Roll to begin.")}
              </div>
            </div>

            <div class="hud-card">
              <div class="hud-title">Players</div>
              <div class="players-strip">
                ${state.players.map(function (pl, i) {
                  return `
                    <div class="player-card">
                      <div class="player-top">
                        <div class="avatar">${window.getPlayerToken ? window.getPlayerToken(i) : "🩺"}</div>
                        <div>
                          <div style="font-weight:1000">${escapeHtml(pl.name)}</div>
                          <div style="font-size:12px;color:var(--muted)">Position ${escapeHtml(pl.position || 0)}</div>
                        </div>
                      </div>
                      <div style="font-size:12px;color:var(--muted)">Score: ${escapeHtml(pl.score || 0)}</div>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
          </div>

           <div class="hud-card notebook-log-wrap">
            <div class="hud-title">Game Log</div>
            <div class="notebook-log">
              ${(state.eventLog.length ? state.eventLog.slice(-8).reverse() : [{message:"No game events yet."}]).map(function (item, index) {
                return `
                  <div class="notebook-row">
                    <div class="notebook-dot">${index + 1}</div>
                    <div class="notebook-text">${escapeHtml(item.message || "")}</div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        </div>

        ${triviaModal()}
        ${diceOverlay()}
        ${toast()}
        ${invitePopup()}
      </div>
    `;
  }

 function triviaModal() {
  if (!state.trivia) return "";

  return `
    <div class="trivia-modal">
      <div class="trivia-card">
        <div class="trivia-timer-badge">⏱ ${escapeHtml(state.timer || 20)}s</div>

        <div class="trivia-q">${escapeHtml(state.trivia.q)}</div>

        <div class="trivia-grid">
          ${state.trivia.choices.map(function (choice) {
            var resultClass = "";
            if (state.triviaResult) {
              if (choice === state.trivia.answer) resultClass = " correct-answer";
              else if (choice === state.triviaResult.choice) resultClass = " wrong-answer";
            }

            return `
              <button class="btn trivia-choice${resultClass}" data-choice="${escapeHtml(choice)}">
                ${escapeHtml(choice)}
              </button>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

  function diceOverlay() {
    return `
      <div id="diceOverlay" class="dice-overlay hidden">
        <div id="diceBox" class="dice-box">⚀</div>
        <div id="diceLabel" class="dice-label">Rolling...</div>
      </div>
    `;
  }

  window.safeRender = function () {
    try {
      var app = document.getElementById("app");
      if (!app) return;

      app.innerHTML = state.entered ? gameScreen() : lobbyScreen();
      bindEvents();
    } catch (e) {
      document.getElementById("app").innerHTML = `
        <div class="screen">
          <div class="hud-card" style="max-width:900px;margin:40px auto;">
            <div class="hud-title">App error</div>
            <div>${escapeHtml(e.message)}</div>
          </div>
        </div>
      `;
    }
  };

  function bindEvents() {
    document.getElementById("closeInviteBtn")?.addEventListener("click", function () {
      state.invitePopupOpen = false;
      safeRender();
    });

    document.getElementById("invitePopupBackdrop")?.addEventListener("click", function (e) {
      if (e.target.id === "invitePopupBackdrop") {
        state.invitePopupOpen = false;
        safeRender();
      }
    });

    if (!state.entered) {
      document.getElementById("nameInput")?.addEventListener("input", function (e) {
        state.lobbyName = e.target.value;
      });

      document.getElementById("codeInput")?.addEventListener("input", function (e) {
        state.joinCode = e.target.value.toUpperCase();
      });

      document.getElementById("newCodeBtn")?.addEventListener("click", function () {
        state.roomCode = makeCode();
        state.joinCode = state.roomCode;
        safeRender();
      });

      document.getElementById("startBtn")?.addEventListener("click", function () {
        state.roomCode = (state.joinCode || state.roomCode).toUpperCase();
        state.players = [{
          id: 1,
          name: state.lobbyName || "BEV",
          position: 0,
          score: 0,
          shields: 0
        }];
        state.currentPlayerIndex = 0;
        state.entered = true;
        state.eventLog = [{ message: "Room started." }];
        safeRender();
      });

      document.getElementById("copyCodeLobby")?.addEventListener("click", copyRoomCode);
      document.getElementById("inviteLobby")?.addEventListener("click", copyInviteLink);
    } else {
      document.getElementById("rollBtn")?.addEventListener("click", function () {
        if (typeof window.handleRoll === "function") window.handleRoll();
      });

      document.getElementById("shareBtn")?.addEventListener("click", copyInviteLink);
      document.getElementById("inviteBtn")?.addEventListener("click", copyInviteLink);
      document.getElementById("copyCodeBtn")?.addEventListener("click", copyRoomCode);

      document.getElementById("backBtn")?.addEventListener("click", function () {
        state.entered = false;
        safeRender();
      });

      document.querySelectorAll("[data-choice]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (typeof window.submitTrivia === "function") window.submitTrivia(btn.getAttribute("data-choice"));
        });
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var params = new URLSearchParams(window.location.search);
    var room = params.get("room");

    state.roomCode = room ? room.toUpperCase() : makeCode();
    state.joinCode = state.roomCode;

    safeRender();
  });
})();
