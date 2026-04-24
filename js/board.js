(function () {
  const TILE_COUNT = 50;

  const TILE_TYPES = [
    "start",
    "health",
    "normal",
    "chance",
    "risk",
    "normal",
    "health",
    "normal",
    "chance",
    "risk"
  ];

  const TOKEN_SET = [
    { key: "nurse", icon: "✚", cls: "token-nurse" },
    { key: "doctor", icon: "⚕", cls: "token-doctor" },
    { key: "pill", icon: "◉", cls: "token-pill" },
    { key: "bone", icon: "⟟", cls: "token-bone" },
    { key: "brain", icon: "◐", cls: "token-brain" },
    { key: "heart", icon: "♥", cls: "token-heart" }
  ];

  function buildSpiral(count) {
    const pts = [];
    let left = 0;
    let right = 6;
    let top = 0;
    let bottom = 6;

    while (pts.length < count && left <= right && top <= bottom) {
      for (let x = left; x <= right && pts.length < count; x++) pts.push([x, top]);
      top++;

      for (let y = top; y <= bottom && pts.length < count; y++) pts.push([right, y]);
      right--;

      for (let x = right; x >= left && pts.length < count; x--) pts.push([x, bottom]);
      bottom--;

      for (let y = bottom; y >= top && pts.length < count; y--) pts.push([left, y]);
      left++;
    }

    return pts;
  }

  const spiral = buildSpiral(TILE_COUNT);

  window.getBoardSpaces = function () {
    return spiral.map((p, i) => ({
      index: i,
      x: p[0],
      y: p[1],
      type: i === TILE_COUNT - 1
        ? "finish"
        : TILE_TYPES[i % TILE_TYPES.length]
    }));
  };

  window.getPlayerToken = function (index) {
    const token = TOKEN_SET[index % TOKEN_SET.length];
    return token.icon;
  };

  function getPlayerTokenClass(index) {
    const token = TOKEN_SET[index % TOKEN_SET.length];
    return token.cls;
  }

  function tileLabel(tile) {
    if (tile.type === "start") return "START";
    if (tile.type === "finish") return "BRAIN";
    if (tile.type === "health") return "HEALTH";
    if (tile.type === "chance") return "CHANCE";
    if (tile.type === "risk") return "RISK";
    return tile.index + 1;
  }

  function tileClass(tile) {
    return `tile ${tile.type}`;
  }

  function renderPlayers(tileIndex) {
    if (!window.state || !Array.isArray(window.state.players)) return "";

    const here = window.state.players.filter(p => (p.position || 0) === tileIndex);

    return here.map((player, i) => {
      const playerIndex = window.state.players.indexOf(player);

      return `
        <div class="premium-token ${getPlayerTokenClass(playerIndex)} token-stack-${i}">
          <div class="premium-token-core">
            ${window.getPlayerToken(playerIndex)}
          </div>
        </div>
      `;
    }).join("");
  }

  window.boardMarkup = function () {
    const spaces = window.getBoardSpaces();

    return `
      <div class="board-stage premium-board-bg">
        <div class="board-grid premium-board-grid">
          ${spaces.map(tile => `
            <div
              class="${tileClass(tile)}"
              data-pos="${tile.index}"
              style="grid-column:${tile.x + 1};grid-row:${tile.y + 1};"
            >
              <div class="tile-inner">
                <div class="tile-label">${tileLabel(tile)}</div>
                ${renderPlayers(tile.index)}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  };

  window.createTrailAt = function () {};
  window.pulseLanding = function () {};
})();
