window.createTrailAt = function(space){
  const shell = document.querySelector('.board-stage');
  if (!shell || !space) return;

  const dot = document.createElement('div');
  dot.className = 'trail-dot';
  dot.style.left = `${space.x}%`;
  dot.style.top = `${space.y}%`;
  shell.appendChild(dot);

  setTimeout(() => {
    dot.remove();
  }, 620);
};

window.showDiceRoll = async function(roll){
  const overlay = document.getElementById('diceOverlay');
  const box = document.getElementById('diceBox');
  const label = document.getElementById('diceLabel');

  if (!overlay || !box || !label) return;

  overlay.classList.remove('hidden');
  label.textContent = 'Rolling...';

  const faces = ['🎲','⚀','⚁','⚂','⚃','⚄','⚅'];

  for (let i = 0; i < 8; i++) {
    box.textContent = faces[(i % 6) + 1];
    await new Promise(resolve => setTimeout(resolve, 90));
  }

  box.textContent = String(roll);
  label.textContent = 'Move!';

  await new Promise(resolve => setTimeout(resolve, 550));
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

window.getBoardSpaces = function(){
  if (Array.isArray(window.SPACES) && window.SPACES.length) {
    return window.SPACES;
  }

  return [
    { id: 0, name: 'Start', body: 'Feet', x: 8, y: 88, type: 'start' },
    { id: 1, name: 'Heel', body: 'Feet', x: 20, y: 88, type: 'normal' },
    { id: 2, name: 'Toes', body: 'Feet', x: 32, y: 88, type: 'normal' },
    { id: 3, name: 'Talus', body: 'Feet', x: 44, y: 88, type: 'safe' },
    { id: 4, name: 'Tibia', body: 'Lower Leg', x: 56, y: 88, type: 'normal' },
    { id: 5, name: 'Fibula', body: 'Lower Leg', x: 68, y: 88, type: 'health' },
    { id: 6, name: 'Patella', body: 'Knee', x: 80, y: 88, type: 'normal' },

    { id: 7, name: 'Femur', body: 'Upper Leg', x: 80, y: 74, type: 'normal' },
    { id: 8, name: 'Pelvis', body: 'Pelvis', x: 68, y: 74, type: 'risk' },
    { id: 9, name: 'Bladder', body: 'Pelvis', x: 56, y: 74, type: 'normal' },
    { id: 10, name: 'Colon', body: 'Digestive', x: 44, y: 74, type: 'chance' },
    { id: 11, name: 'Liver', body: 'Digestive', x: 32, y: 74, type: 'normal' },
    { id: 12, name: 'Stomach', body: 'Digestive', x: 20, y: 74, type: 'safe' },
    { id: 13, name: 'Pancreas', body: 'Digestive', x: 8, y: 74, type: 'quarantine' },

    { id: 14, name: 'Heart', body: 'Thorax', x: 8, y: 60, type: 'normal' },
    { id: 15, name: 'Lungs', body: 'Thorax', x: 20, y: 60, type: 'health' },
    { id: 16, name: 'Ribs', body: 'Thorax', x: 32, y: 60, type: 'normal' },
    { id: 17, name: 'Sternum', body: 'Thorax', x: 44, y: 60, type: 'energy' },
    { id: 18, name: 'Trachea', body: 'Neck', x: 56, y: 60, type: 'normal' },
    { id: 19, name: 'Clavicle', body: 'Shoulder', x: 68, y: 60, type: 'risk' },
    { id: 20, name: 'Scapula', body: 'Shoulder', x: 80, y: 60, type: 'normal' },

    { id: 21, name: 'Humerus', body: 'Arm', x: 80, y: 46, type: 'normal' },
    { id: 22, name: 'Radius', body: 'Forearm', x: 68, y: 46, type: 'chance' },
    { id: 23, name: 'Ulna', body: 'Forearm', x: 56, y: 46, type: 'normal' },
    { id: 24, name: 'Thumb', body: 'Hand', x: 44, y: 46, type: 'safe' },
    { id: 25, name: 'Eyes', body: 'Head', x: 32, y: 46, type: 'normal' },
    { id: 26, name: 'Teeth', body: 'Head', x: 20, y: 46, type: 'health' },
    { id: 27, name: 'Brain', body: 'Finish', x: 8, y: 20, type: 'finish' }
  ];
};

window.boardMarkup = function(){
  const spaces = window.getBoardSpaces();

  const connectors = spaces.slice(0, -1).map((space, index) => {
    const next = spaces[index + 1];
    return `<line x1="${space.x}" y1="${space.y}" x2="${next.x}" y2="${next.y}" stroke="rgba(255,255,255,.28)" stroke-width="0.85" stroke-linecap="round" />`;
  }).join('');

  const cp = typeof window.currentPlayer === 'function' ? window.currentPlayer() : null;
  const focusId = cp ? cp.position : null;

  const safePlayers = Array.isArray(state.players) ? state.players : [];

  const spacesMarkup = spaces.map(space => {
    const onSpace = safePlayers.filter(player => player.position === space.id);
    const currentClass = focusId === space.id ? ' current-turn' : '';

    return `<div class="space ${space.type || 'normal'}${currentClass}" data-space-id="${space.id}" style="left:${space.x}%;top:${space.y}%">
      <div class="space-id">#${space.id}</div>
      <div class="space-name">${window.escapeHtml(space.name)}</div>
      <div class="space-body">${window.escapeHtml(space.body)}</div>
      <div class="space-tokens">
        ${onSpace.map(player => {
          const token = typeof window.getPlayerToken === 'function' ? window.getPlayerToken(player.id - 1) : '🙂';
          const playerName = typeof window.getPlayerName === 'function' ? window.getPlayerName(player) : (player.name || 'Player');
          return `<span class="token-with-name"><span class="token-pill">${token}</span><span class="token-name">${window.escapeHtml(playerName)}</span></span>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');

  const imageUrl = window.APP_CONFIG?.ANATOMY_IMAGE_URL || './body anatomy mib.png';

  return `<div class="board-stage">
    <img class="board-image" src="${imageUrl}" alt="anatomy board" onerror="this.style.display='none'" />
    <svg class="board-svg" viewBox="0 0 100 100" preserveAspectRatio="none">${connectors}</svg>
    <div class="board-label finish">Finish</div>
    <div class="board-label start">Start</div>
    ${spacesMarkup}
  </div>`;
};
