window.createTrailAt = function(space){
  const shell = document.querySelector('.board-stage');
  if (!shell || !space) return;

  const dot = document.createElement('div');
  dot.className = 'trail-dot';
  dot.style.left = `${space.x}%`;
  dot.style.top = `${space.y}%`;
  dot.style.position = 'absolute';
  dot.style.width = '14px';
  dot.style.height = '14px';
  dot.style.borderRadius = '999px';
  dot.style.transform = 'translate(-50%, -50%)';
  dot.style.background = 'rgba(255,255,255,.85)';
  dot.style.boxShadow = '0 0 16px rgba(255,255,255,.75)';
  dot.style.zIndex = '8';

  shell.appendChild(dot);

  setTimeout(() => {
    dot.remove();
  }, 500);
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
    await new Promise(resolve => setTimeout(resolve, 85));
  }

  box.textContent = String(roll);
  label.textContent = 'Move!';
  await new Promise(resolve => setTimeout(resolve, 450));

  overlay.classList.add('hidden');
};

window.pulseLanding = function(spaceId){
  requestAnimationFrame(() => {
    const el = document.querySelector(`[data-space-id="${spaceId}"]`);
    if (!el) return;

    el.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1)' },
        { transform: 'translate(-50%, -50%) scale(1.12)' },
        { transform: 'translate(-50%, -50%) scale(1)' }
      ],
      { duration: 280, easing: 'ease-out' }
    );
  });
};

window.getBoardSpaces = function(){
  if (Array.isArray(window.SPACES) && window.SPACES.length) {
    return window.SPACES;
  }

  const labels = [
    ['Start','Feet'],
    ['Heel','Feet'],
    ['Toes','Feet'],
    ['Metatarsals','Feet'],
    ['Talus','Feet'],
    ['Calcaneus','Feet'],
    ['Achilles Tendon','Lower Leg'],
    ['Tibia','Lower Leg'],
    ['Fibula','Lower Leg'],
    ['Patella','Knee'],
    ['Quadriceps','Upper Leg'],
    ['Hamstrings','Upper Leg'],
    ['Femur','Upper Leg'],
    ['Hip Joint','Hip'],
    ['Pelvis','Pelvis'],
    ['Bladder','Pelvis'],
    ['Uterus','Pelvis'],
    ['Rectum','Digestive'],
    ['Appendix','Digestive'],
    ['Colon','Digestive'],
    ['Small Intestine','Digestive'],
    ['Gallbladder','Digestive'],
    ['Liver','Digestive'],
    ['Pancreas','Digestive'],
    ['Spleen','Immune'],
    ['Stomach','Digestive'],
    ['Esophagus','Upper Body'],
    ['Diaphragm','Thorax'],
    ['Aorta','Thorax'],
    ['Ribs','Thorax'],
    ['Sternum','Thorax'],
    ['Lungs','Thorax'],
    ['Bronchi','Thorax'],
    ['Trachea','Neck'],
    ['Heart','Thorax'],
    ['Clavicle','Shoulder'],
    ['Scapula','Shoulder'],
    ['Humerus','Arm'],
    ['Radius','Forearm'],
    ['Ulna','Forearm'],
    ['Thumb','Hand'],
    ['Eyes','Head'],
    ['Teeth','Head'],
    ['Brain','Finish']
  ];

  const cells = [];
  const size = 7;
  let top = 0;
  let bottom = size - 1;
  let left = 0;
  let right = size - 1;

  while (left <= right && top <= bottom) {
    for (let c = left; c <= right; c++) cells.push([top, c]);
    for (let r = top + 1; r <= bottom; r++) cells.push([r, right]);
    if (top < bottom) {
      for (let c = right - 1; c >= left; c--) cells.push([bottom, c]);
    }
    if (left < right) {
      for (let r = bottom - 1; r > top; r--) cells.push([r, left]);
    }
    top++;
    bottom--;
    left++;
    right--;
  }

  const startIndex = cells.findIndex(([r, c]) => r === size - 1 && c === 0);
  const ordered = cells.slice(startIndex).concat(cells.slice(0, startIndex));

  const minX = 8;
  const maxX = 92;
  const minY = 10;
  const maxY = 90;
  const stepX = (maxX - minX) / (size - 1);
  const stepY = (maxY - minY) / (size - 1);

  const typeForIndex = (i, last) => {
    if (i === 0) return 'start';
    if (i === last) return 'finish';
    if (i % 11 === 0) return 'quarantine';
    if (i % 9 === 0) return 'risk';
    if (i % 7 === 0) return 'health';
    if (i % 5 === 0) return 'chance';
    if (i % 4 === 0) return 'safe';
    return 'normal';
  };

  return ordered.slice(0, labels.length).map(([r, c], i) => ({
    id: i,
    name: labels[i][0],
    body: labels[i][1],
    x: minX + c * stepX,
    y: minY + r * stepY,
    type: typeForIndex(i, labels.length - 1)
  }));
};

window.getTileColors = function(type){
  switch (type) {
    case 'start':
      return 'linear-gradient(145deg,#2fdc88,#18a564)';
    case 'finish':
      return 'linear-gradient(145deg,#d95dff,#8d5cff)';
    case 'safe':
      return 'linear-gradient(145deg,#32d3c8,#1f9f8e)';
    case 'health':
      return 'linear-gradient(145deg,#49a9ff,#2674da)';
    case 'risk':
      return 'linear-gradient(145deg,#ff708e,#d84b72)';
    case 'quarantine':
      return 'linear-gradient(145deg,#ffb347,#e17d17)';
    case 'chance':
      return 'linear-gradient(145deg,#8e6bff,#5d49e4)';
    default:
      return 'linear-gradient(145deg,#334a63,#243549)';
  }
};

window.boardMarkup = function(){
  const spaces = window.getBoardSpaces();
  const cp = typeof window.currentPlayer === 'function' ? window.currentPlayer() : null;
  const focusId = cp ? cp.position : null;
  const safePlayers = Array.isArray(state.players) ? state.players : [];

  const connectors = spaces.slice(0, -1).map((space, index) => {
    const next = spaces[index + 1];
    return `<line x1="${space.x}" y1="${space.y}" x2="${next.x}" y2="${next.y}" stroke="rgba(255,255,255,.18)" stroke-width="0.55" stroke-linecap="round" />`;
  }).join('');

  const spacesMarkup = spaces.map(space => {
    const onSpace = safePlayers.filter(player => player.position === space.id);
    const currentClass = focusId === space.id ? ' current-turn' : '';
    const bg = window.getTileColors(space.type);

    return `<div
      class="space ${space.type || 'normal'}${currentClass}"
      data-space-id="${space.id}"
      style="
        left:${space.x}%;
        top:${space.y}%;
        width:92px;
        height:92px;
        padding:8px;
        border-radius:22px;
        background:${bg};
        border:2px solid rgba(255,255,255,.18);
        box-shadow:0 14px 26px rgba(0,0,0,.25);
      ">
      <div class="space-id">#${space.id}</div>
      <div class="space-name" style="font-size:11px;line-height:1.05;">${window.escapeHtml(space.name)}</div>
      <div class="space-body" style="font-size:8px;opacity:.82;">${window.escapeHtml(space.body)}</div>
      <div class="space-tokens">
        ${onSpace.map(player => {
          const token = typeof window.getPlayerToken === 'function'
            ? window.getPlayerToken((player.id || 1) - 1)
            : '🙂';

          const playerName = typeof window.getPlayerName === 'function'
            ? window.getPlayerName(player)
            : (player?.name || 'Player');

          return `<span class="token-with-name">
            <span class="token-pill">${token}</span>
            <span class="token-name">${window.escapeHtml(playerName)}</span>
          </span>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');

  const imageUrl = window.APP_CONFIG?.ANATOMY_IMAGE_URL || './body anatomy mib.png';

  return `<div class="board-stage" style="background:linear-gradient(180deg,#8db7b0 0%, #789e98 100%);">
    <svg class="board-svg" viewBox="0 0 100 100" preserveAspectRatio="none" style="z-index:1;opacity:.7;">${connectors}</svg>

    <div style="
      position:absolute;
      left:50%;
      top:50%;
      width:23%;
      height:72%;
      transform:translate(-50%,-50%);
      z-index:0;
      pointer-events:none;
      display:flex;
      align-items:center;
      justify-content:center;
    ">
      <img
        src="${imageUrl}"
        alt="anatomy board"
        onerror="this.style.display='none'"
        style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 18px 32px rgba(0,0,0,.25));"
      />
    </div>

    <div style="
      position:absolute;
      left:50%;
      top:6%;
      transform:translateX(-50%);
      z-index:6;
      padding:8px 20px;
      border-radius:999px;
      font-size:22px;
      font-weight:1000;
      letter-spacing:.04em;
      color:#ffe27a;
      background:linear-gradient(145deg,#c53f2f,#f07b2d);
      box-shadow:0 10px 24px rgba(0,0,0,.2);
    ">ANATOMY GO!</div>

    <div class="board-label finish" style="top:2.5%;left:50%;transform:translateX(-50%);">Finish</div>
    <div class="board-label start" style="bottom:2.5%;left:8%;">Start</div>

    ${spacesMarkup}
  </div>`;
};
