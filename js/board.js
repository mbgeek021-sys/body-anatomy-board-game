(function () {
  const TOKENS = ["🩺", "💉", "💊", "🩹", "🌡️", "🫀", "🧠", "❤️"];

  window.getPlayerToken = function (index = 0) {
    return TOKENS[index % TOKENS.length];
  };

  function esc(str = "") {
    if (window.escapeHtml) return window.escapeHtml(str);
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function currentPos() {
    if (typeof window.currentPlayer === "function") {
      const p = window.currentPlayer();
      if (p) return p.position || 0;
    }
    return 0;
  }

  function tileType(i, last) {
    if (i === 0) return "start";
    if (i === last) return "finish";
    if (i % 11 === 0) return "quarantine";
    if (i % 8 === 0) return "risk";
    if (i % 6 === 0) return "chance";
    if (i % 5 === 0) return "safe";
    if (i % 4 === 0) return "health";
    return "normal";
  }

  function accent(type) {
    switch (type) {
      case "start":
        return "#63b88e";
      case "finish":
        return "#9e8bd8";
      case "safe":
        return "#74b7b0";
      case "health":
        return "#86a7d8";
      case "risk":
        return "#cb93a0";
      case "chance":
        return "#a595d8";
      case "quarantine":
        return "#d0aa73";
      default:
        return "#314b66";
    }
  }

  function emoji(name) {
    const map = {
      Start: "⭐",
      Heel: "🦶",
      Toes: "🦶",
      Talus: "🦴",
      Calcaneus: "🦶",
      Achilles: "🦶",
      Tibia: "🦴",
      Fibula: "🦴",
      Patella: "🦴",
      Quadriceps: "🦵",
      Hamstrings: "🦵",
      Femur: "🦴",
      "Hip Joint": "🦴",
      Pelvis: "🦴",
      Bladder: "💧",
      Uterus: "♀️",
      Colon: "🧫",
      Appendix: "🧫",
      Rectum: "🧫",
      "Small Intestine": "🧫",
      Gallbladder: "🟢",
      Liver: "🟤",
      Pancreas: "🧪",
      Spleen: "🩸",
      Stomach: "🍽️",
      Esophagus: "🥼",
      Diaphragm: "🫁",
      Aorta: "🫀",
      Ribs: "🦴",
      Sternum: "🦴",
      Lungs: "🫁",
      Bronchi: "🫁",
      Trachea: "🫁",
      Heart: "🫀",
      Clavicle: "🦴",
      Scapula: "🦴",
      Humerus: "🦴",
      Radius: "🦴",
      Ulna: "🦴",
      Thumb: "✋",
      Eyes: "👁️",
      Teeth: "🦷",
      "Nasal Cavity": "👃",
      "Temporal Bone": "💀",
      "Frontal Bone": "💀",
      Cranium: "💀",
      "Brain Stem": "🧠",
      Brain: "🧠",
    };
    return map[name] || "🔬";
  }

  window.getBoardSpaces = function () {
    const names = [
      "Start",
      "Heel",
      "Toes",
      "Talus",
      "Calcaneus",
      "Achilles",
      "Tibia",
      "Fibula",
      "Patella",
      "Quadriceps",
      "Hamstrings",
      "Femur",
      "Hip Joint",
      "Pelvis",
      "Bladder",
      "Uterus",
      "Colon",
      "Appendix",
      "Rectum",
      "Small Intestine",
      "Gallbladder",
      "Liver",
      "Pancreas",
      "Spleen",
      "Stomach",
      "Esophagus",
      "Diaphragm",
      "Aorta",
      "Ribs",
      "Sternum",
      "Lungs",
      "Bronchi",
      "Trachea",
      "Heart",
      "Clavicle",
      "Scapula",
      "Humerus",
      "Radius",
      "Ulna",
      "Thumb",
      "Eyes",
      "Teeth",
      "Nasal Cavity",
      "Temporal Bone",
      "Frontal Bone",
      "Cranium",
      "Brain Stem",
      "Brain",
    ];

    const spiral = [
      [6, 0],[6, 1],[6, 2],[6, 3],[6, 4],[6, 5],[6, 6],
      [5, 6],[4, 6],[3, 6],[2, 6],[1, 6],[0, 6],
      [0, 5],[0, 4],[0, 3],[0, 2],[0, 1],[0, 0],
      [1, 0],[2, 0],[3, 0],[4, 0],[5, 0],
      [5, 1],[5, 2],[5, 3],[5, 4],[5, 5],
      [4, 5],[3, 5],[2, 5],[1, 5],
      [1, 4],[1, 3],[1, 2],[1, 1],
      [2, 1],[3, 1],[4, 1],
      [4, 2],[4, 3],[4, 4],
      [3, 4],[2, 4],[2, 3],[2, 2],[3, 2],
    ];

    const minX = 18;
    const maxX = 82;
    const minY = 12;
    const maxY = 88;

    const stepX = (maxX - minX) / 6;
    const stepY = (maxY - minY) / 6;

    return spiral.slice(0, names.length).map(([r, c], i) => ({
      id: i,
      name: names[i],
      x: minX + c * stepX,
      y: minY + r * stepY,
      type: tileType(i, names.length - 1),
    }));
  };

  function connector(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy) - 8;
    const ang = Math.atan2(dy, dx) * (180 / Math.PI);

    return `
      <div
        class="route-connector"
        style="
          left:${(a.x + b.x) / 2}%;
          top:${(a.y + b.y) / 2}%;
          width:${len}%;
          transform:translate(-50%,-50%) rotate(${ang}deg);
        "
      >
        <div class="route-connector-core"></div>
      </div>
    `;
  }

  window.createTrailAt = function (space) {
    const shell = document.querySelector(".board-stage");
    if (!shell || !space) return;

    const dot = document.createElement("div");
    dot.className = "trail-dot";
    dot.style.left = `${space.x}%`;
    dot.style.top = `${space.y}%`;

    shell.appendChild(dot);
    setTimeout(() => dot.remove(), 300);
  };

  window.showDiceRoll = async function (roll) {
    const overlay = document.getElementById("diceOverlay");
    const box = document.getElementById("diceBox");
    const label = document.getElementById("diceLabel");

    if (!overlay || !box || !label) return;

    overlay.classList.remove("hidden");
    label.textContent = "Rolling...";

    const faces = ["⚀","⚁","⚂","⚃","⚄","⚅"];

    for (let i = 0; i < 10; i++) {
      box.textContent = faces[Math.floor(Math.random() * 6)];
      await new Promise(r => setTimeout(r, 70));
    }

    box.textContent = roll;
    label.textContent = `Rolled ${roll}`;

    await new Promise(r => setTimeout(r, 450));
    overlay.classList.add("hidden");
  };

  window.pulseLanding = function (id) {
    const tile = document.querySelector(`[data-space-id="${id}"]`);
    if (!tile) return;

    tile.classList.remove("soft-pulse");
    void tile.offsetWidth;
    tile.classList.add("soft-pulse");

    setTimeout(() => tile.classList.remove("soft-pulse"), 400);
  };

  window.boardMarkup = function () {
    const spaces = window.getBoardSpaces();
    const players = Array.isArray(state.players) ? state.players : [];
    const active = currentPos();

    const routes = spaces
      .slice(0, -1)
      .map((s, i) => connector(s, spaces[i + 1]))
      .join("");

    const tiles = spaces.map(space => {
      const onTile = players.filter(p => p.position === space.id);

      return `
        <div
          class="premium-tile-paper ${active === space.id ? "active-space" : ""} ${space.type === "finish" ? "finish-space" : ""}"
          data-space-id="${space.id}"
          style="left:${space.x}%;top:${space.y}%"
        >
          <div class="paper-tile-accent" style="background:${accent(space.type)}"></div>

          ${space.type === "finish" ? `<div class="finish-badge">FINISH</div>` : ""}

          <div class="paper-tile-id">#${space.id}</div>

          <div class="paper-tile-icon-wrap">
            <div class="paper-tile-icon">${emoji(space.name)}</div>
          </div>

          <div class="paper-tile-name">${esc(space.name)}</div>

          <div class="paper-token-row">
            ${onTile.map((p, i) => `
              <div class="paper-token">${window.getPlayerToken(i)}</div>
            `).join("")}
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="board-stage premium-board-bg">
        <div class="board-paper-overlay"></div>

        <div class="route-layer">
          ${routes}
        </div>

        <div class="tile-layer">
          ${tiles}
        </div>
      </div>
    `;
  };
})();
