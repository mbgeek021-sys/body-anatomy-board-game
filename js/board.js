window.createTrailAt = function(space){
  const shell = document.querySelector('.board-stage');
  if (!shell) return;
  const dot = document.createElement('div');
  dot.className = 'trail-dot';
  dot.style.left = `${space.x}%`;
  dot.style.top = `${space.y}%`;
  shell.appendChild(dot);
  setTimeout(() => dot.remove(), 620);
};

window.showDiceRoll = async function(roll){
  const overlay = document.getElementById('diceOverlay');
  const box = document.getElementById('diceBox');
  const label = document.getElementById('diceLabel');
  overlay.classList.remove('hidden');
  label.textContent = 'Rolling...';
  const faces = ['🎲','⚀','⚁','⚂','⚃','⚄','⚅'];
  for (let i = 0; i < 8; i++) {
    box.textContent = faces[(i % 6) + 1];
    await new Promise(r => setTimeout(r, 90));
  }
  box.textContent = String(roll);
  label.textContent = 'Move!';
  await new Promise(r => setTimeout(r, 550));
  overlay.classList.add('hidden');
};

window.pulseLanding = function(spaceId){
  requestAnimationFrame(() => {
    const el = document.querySelector(`[data-space-id="${spaceId}"]`);
    if (!el) return;
    el.classList.remove('land');
    void el.offsetWidth;
    el.classList.add('land');
  });
};

window.boardMarkup = function(){
  const connectors = SPACES.slice(0, -1).map((space, index) =>
    `<line x1="${space.x}" y1="${space.y}" x2="${SPACES[index + 1].x}" y2="${SPACES[index + 1].y}" stroke="rgba(255,255,255,.28)" stroke-width="0.85" stroke-linecap="round" />`
  ).join('');

  const cp = window.currentPlayer();
  const focusId = cp ? cp.position : null;

  const spacesMarkup = SPACES.map(space => {
    const onSpace = state.players.filter(player => player.position === space.id);
    const currentClass = focusId === space.id ? ' current-turn' : '';
    return `<div class="space ${space.type || 'normal'}${currentClass}" data-space-id="${space.id}" style="left:${space.x}%;top:${space.y}%">
      <div class="space-id">#${space.id}</div>
      <div class="space-name">${window.escapeHtml(space.name)}</div>
      <div class="space-body">${window.escapeHtml(space.body)}</div>
      <div class="space-tokens">${onSpace.map(player => `<span class="token-with-name"><span class="token-pill">${window.getPlayerToken(player.id - 1)}</span><span class="token-name">${window.escapeHtml(window.getPlayerName(player))}</span></span>`).join('')}</div>
    </div>`;
  }).join('');

  return `<div class="board-stage">
    <img class="board-image" src="${window.APP_CONFIG.ANATOMY_IMAGE_URL}" alt="anatomy board" />
    <svg class="board-svg" viewBox="0 0 100 100" preserveAspectRatio="none">${connectors}</svg>
    <div class="board-label finish">Finish</div>
    <div class="board-label start">Start</div>
    ${spacesMarkup}
  </div>`;
};
