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
  dot.style.background = 'rgba(255,255,255,.9)';
  dot.style.boxShadow = '0 0 18px rgba(255,255,255,.85)';
  dot.style.zIndex = '9';
  shell.appendChild(dot);

  setTimeout(() => dot.remove(), 500);
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
  await new Promise(resolve => setTimeout(resolve, 420));
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
    ['Nasal Cavity','Head'],
    ['Temporal Bone','Head'],
    ['Frontal Bone','Head'],
    ['Cranium','Head'],
    ['Brain Stem','Head'],
    ['Brain','Finish']
  ];

  const gridSize = 7;
  const cells = [];

  let left = 0;
  let right = gridSize - 1;
  let top = 0;
  let bottom = gridSize - 1;

  // TRUE square spiral:
  // bottom row left->right
  // right col bottom-1->top
  // top row right-1->left
  // left col top+1->bottom-1
  while (left <= right && top <= bottom) {
    for (let c = left; c <= right; c++) cells.push([bottom, c]);
    for (let r = bottom - 1; r >= top; r--) cells.push([r, right]);
    if (top < bottom) {
      for (let c = right - 1; c >= left; c--) cells.push([top, c]);
    }
    if (left < right) {
      for (let r = top + 1; r <= bottom - 1; r++) cells.push([r, left]);
    }
    left++;
    right--;
    top++;
    bottom--;
  }

  const minX = 8;
  const maxX = 92;
  const minY = 10;
  const maxY = 90;
  const stepX = (maxX - minX) / (gridSize - 1);
  const stepY = (maxY - minY) / (gridSize - 1);

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

  return cells.slice(0, labels.length).map(([row, col], i) => ({
    id: i,
    name: labels[i][0],
    body: labels[i][1],
    x: minX + col * stepX,
    y: minY + row * stepY,
    type: typeForIndex(i, labels.length - 1)
  }));
};

window.getTileColors = function(type){
  switch (type) {
    case 'start':
      return 'linear-gradient(145deg,#2fdc88,#139b63)';
    case 'finish':
      return 'linear-gradient(145deg,#d65cff,#8c56ff)';
    case 'safe':
      return 'linear-gradient(145deg,#39d1c8,#1d9f95)';
    case 'health':
      return 'linear-gradient(145deg,#53a8ff,#2f74e4)';
    case 'risk':
      return 'linear-gradient(145deg,#ff6f97,#df4d72)';
    case 'quarantine':
      return 'linear-gradient(145deg,#ffb14b,#e07b17)';
    case 'chance':
      return 'linear-gradient(145deg,#7e6dff,#5c4ce2)';
    default:
      return 'linear-gradient(145deg,#2d3f5a,#203149)';
  }
};

window.boardMarkup = function(){
  const spaces = window.getBoardSpaces();
  const cp = typeof window.currentPlayer === 'function' ? window.currentPlayer() : null;
  const focusId = cp ? cp.position : null;
  const safePlayers = Array.isArray(state.players) ? state.players : [];

  const connectors = spaces.slice(0, -1).map((space, index) => {
    const next = spaces[index + 1];
    return `
      <line
        x1="${space.x}"
        y1="${space.y}"
        x2="${next.x}"
        y2="${next.y}"
        stroke="rgba(255,255,255,.22)"
        stroke-width="0.7"
        stroke-linecap="round"
      />
    `;
  }).join('');

  const spacesMarkup = spaces.map(space => {
    const onSpace = safePlayers.filter(player => player.position === space.id);
    const currentClass = focusId === space.id ? ' current-turn' : '';
    const bg = window.getTileColors(space.type);

    return `
      <div
        class="space ${space.type || 'normal'}${currentClass}"
        data-space-id="${space.id}"
        style="
          left:${space.x}%;
          top:${space.y}%;
          width:96px;
          height:96px;
          padding:8px;
          border-radius:24px;
          background:${bg};
          border:2px solid rgba(255,255,255,.18);
          box-shadow:
            0 14px 26px rgba(0,0,0,.22),
            inset 0 1px 0 rgba(255,255,255,.08);
        "
      >
        <div class="space-id">#${space.id}</div>
        <div class="space-name" style="font-size:11px;line-height:1.05;">
          ${window.escapeHtml(space.name)}
        </div>
        <div class="space-body" style="font-size:8px;opacity:.84;">
          ${window.escapeHtml(space.body)}
        </div>
        <div class="space-tokens">
          ${onSpace.map(player => {
            const token = typeof window.getPlayerToken === 'function'
              ? window.getPlayerToken((player.id || 1) - 1)
              : '🙂';

            const playerName = typeof window.getPlayerName === 'function'
              ? window.getPlayerName(player)
              : (player?.name || 'Player');

            return `
              <span class="token-with-name">
                <span class="token-pill">${token}</span>
                <span class="token-name">${window.escapeHtml(playerName)}</span>
              </span>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  const imageUrl = window.APP_CONFIG?.ANATOMY_IMAGE_URL || './body anatomy mib.png';

  return `
    <div
      class="board-stage"
      style="
        background:
          radial-gradient(circle at center, rgba(255,255,255,.08), transparent 32%),
          linear-gradient(180deg,#92bbb3 0%, #7ca29c 100%);
      "
    >
      <svg class="board-svg" viewBox="0 0 100 100" preserveAspectRatio="none" style="z-index:1;opacity:.9;">
        ${connectors}
      </svg>

      <div
        style="
          position:absolute;
          left:50%;
          top:50%;
          width:20%;
          height:68%;
          transform:translate(-50%,-50%);
          z-index:0;
          pointer-events:none;
          display:flex;
          align-items:center;
          justify-content:center;
        "
      >
        <img
          src="${imageUrl}"
          alt="anatomy board"
          onerror="this.style.display='none'"
          style="
            width:100%;
            height:100%;
            object-fit:contain;
            filter:drop-shadow(0 18px 30px rgba(0,0,0,.22));
          "
        />
      </div>

      <div
        style="
          position:absolute;
          left:50%;
          top:4.5%;
          transform:translateX(-50%);
          z-index:6;
          padding:10px 24px;
          border-radius:999px;
          font-size:22px;
          font-weight:1000;
          letter-spacing:.04em;
          color:#fff3a6;
          background:linear-gradient(145deg,#d04b2d,#f1872f);
          box-shadow:0 10px 24px rgba(0,0,0,.22);
        "
      >
        ANATOMY GO!
      </div>

      <div class="board-label finish" style="top:2.2%;left:50%;transform:translateX(-50%);">Finish</div>
      <div class="board-label start" style="bottom:3.2%;left:8%;">Start</div>

      ${spacesMarkup}
    </div>
  `;
};
