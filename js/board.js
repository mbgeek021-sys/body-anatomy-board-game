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
  dot.style.background = 'rgba(255,255,255,.92)';
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
        { transform: 'translate(-50%, -50%) scale(1.1)' },
        { transform: 'translate(-50%, -50%) scale(1)' }
      ],
      { duration: 260, easing: 'ease-out' }
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

  const minX = 10;
  const maxX = 90;
  const minY = 12;
  const maxY = 88;
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
      return 'linear-gradient(145deg,#28d17c,#13a85f)';
    case 'finish':
      return 'linear-gradient(145deg,#d763ff,#8d5cff)';
    case 'safe':
      return 'linear-gradient(145deg,#39d5cf,#1aa59d)';
    case 'health':
      return 'linear-gradient(145deg,#59b5ff,#2f7cff)';
    case 'risk':
      return 'linear-gradient(145deg,#ff729c,#e54a74)';
    case 'quarantine':
      return 'linear-gradient(145deg,#ffbe55,#f28a1e)';
    case 'chance':
      return 'linear-gradient(145deg,#8f74ff,#6951ef)';
    default:
      return 'linear-gradient(145deg,#324966,#24364d)';
  }
};

window.boardMarkup = function(){
  const spaces = window.getBoardSpaces();
  const cp = typeof window.currentPlayer === 'function' ? window.currentPlayer() : null;
  const focusId = cp ? cp.position : null;
  const safePlayers = Array.isArray(state.players) ? state.players : [];
  const imageUrl = window.APP_CONFIG?.ANATOMY_IMAGE_URL || './body anatomy mib.png';

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
          width:102px;
          height:102px;
          padding:8px;
          border-radius:24px;
          background:${bg};
          border:2px solid rgba(255,255,255,.18);
          box-shadow:
            0 12px 24px rgba(0,0,0,.20),
            inset 0 1px 0 rgba(255,255,255,.12);
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

  return `
    <div
      class="board-stage"
      style="
        background:
          radial-gradient(circle at 50% 45%, rgba(255,255,255,.08), transparent 30%),
          linear-gradient(180deg,#a7c9c0 0%, #8fb3aa 100%);
      "
    >
      <div
        style="
          position:absolute;
          left:50%;
          top:50%;
          width:19%;
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
            filter:drop-shadow(0 18px 28px rgba(0,0,0,.22));
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
          color:#fff3a7;
          background:linear-gradient(145deg,#d5522e,#f48c2d);
          box-shadow:0 10px 24px rgba(0,0,0,.22);
        "
      >
        ANATOMY GO!
      </div>

      <div class="board-label finish" style="top:1.8%;left:50%;transform:translateX(-50%);">FINISH</div>
      <div class="board-label start" style="bottom:2.5%;left:10%;">START</div>

      ${spacesMarkup}
    </div>
  `;
};
