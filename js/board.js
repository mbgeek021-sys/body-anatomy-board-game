window.createTrailAt = function(space){
  const shell = document.querySelector('.board-stage');
  if (!shell || !space) return;

  const dot = document.createElement('div');
  dot.style.position = 'absolute';
  dot.style.left = `${space.x}%`;
  dot.style.top = `${space.y}%`;
  dot.style.width = '18px';
  dot.style.height = '18px';
  dot.style.borderRadius = '999px';
  dot.style.transform = 'translate(-50%,-50%)';
  dot.style.background = '#ffffff';
  dot.style.boxShadow = '0 0 20px rgba(255,255,255,.9)';
  dot.style.zIndex = '40';
  shell.appendChild(dot);

  dot.animate(
    [
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' },
      { opacity: 0, transform: 'translate(-50%,-50%) scale(2)' }
    ],
    { duration: 420, easing: 'ease-out' }
  );

  setTimeout(() => dot.remove(), 430);
};

window.showDiceRoll = async function(roll){
  const overlay = document.getElementById('diceOverlay');
  const box = document.getElementById('diceBox');
  const label = document.getElementById('diceLabel');

  if (!overlay || !box || !label) return;

  overlay.classList.remove('hidden');
  label.textContent = 'Rolling...';

  const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];

  for(let i = 0; i < 10; i++){
    box.textContent = faces[Math.floor(Math.random() * 6)];
    await new Promise(r => setTimeout(r, 70));
  }

  box.textContent = roll;
  label.textContent = `Rolled ${roll}`;
  await new Promise(r => setTimeout(r, 500));

  overlay.classList.add('hidden');
};

window.pulseLanding = function(id){
  const tile = document.querySelector(`[data-space-id="${id}"]`);
  if (!tile) return;

  tile.animate(
    [
      { transform: 'translate(-50%,-50%) scale(1)' },
      { transform: 'translate(-50%,-50%) scale(1.12)' },
      { transform: 'translate(-50%,-50%) scale(1)' }
    ],
    { duration: 260, easing: 'ease-out' }
  );
};

window.getTileColor = function(type){
  switch(type){
    case 'start': return 'linear-gradient(135deg,#2fd67b,#18b764)';
    case 'finish': return 'linear-gradient(135deg,#9b5cff,#6d3cff)';
    case 'safe': return 'linear-gradient(135deg,#20c7d3,#1098b8)';
    case 'health': return 'linear-gradient(135deg,#3d8bff,#2367e8)';
    case 'risk': return 'linear-gradient(135deg,#ff5f87,#e53d68)';
    case 'chance': return 'linear-gradient(135deg,#865dff,#6947ec)';
    case 'quarantine': return 'linear-gradient(135deg,#ffb938,#f28a16)';
    default: return 'linear-gradient(135deg,#304866,#213348)';
  }
};

window.getTileEmoji = function(name){
  const map = {
    Start:'⭐',
    Heel:'🦶',
    Toes:'🦶',
    Talus:'🦴',
    Calcaneus:'🦶',
    Achilles:'🦶',
    Tibia:'🦴',
    Fibula:'🦴',
    Patella:'🦴',
    Quadriceps:'🦵',
    Hamstrings:'🦵',
    Femur:'🦴',
    'Hip Joint':'🦴',
    Pelvis:'🦴',
    Bladder:'💧',
    Uterus:'♀️',
    Colon:'🧫',
    Appendix:'🧫',
    Rectum:'🧫',
    'Small Intestine':'🧫',
    Gallbladder:'🟢',
    Liver:'🟤',
    Pancreas:'🧬',
    Spleen:'🩸',
    Stomach:'🍽️',
    Esophagus:'🥼',
    Diaphragm:'🫁',
    Aorta:'🫀',
    Ribs:'🦴',
    Sternum:'🦴',
    Lungs:'🫁',
    Bronchi:'🫁',
    Trachea:'🫁',
    Heart:'🫀',
    Clavicle:'🦴',
    Scapula:'🦴',
    Humerus:'🦴',
    Radius:'🦴',
    Ulna:'🦴',
    Thumb:'✋',
    Eyes:'👁️',
    Teeth:'🦷',
    'Nasal Cavity':'👃',
    'Temporal Bone':'💀',
    'Frontal Bone':'💀',
    Cranium:'💀',
    'Brain Stem':'🧠',
    Brain:'🧠'
  };
  return map[name] || '🔬';
};

window.getBoardSpaces = function(){
  const names = [
    'Start','Heel','Toes','Talus','Calcaneus','Achilles',
    'Tibia','Fibula','Patella','Quadriceps','Hamstrings',
    'Femur','Hip Joint','Pelvis','Bladder','Uterus',
    'Colon','Appendix','Rectum','Small Intestine',
    'Gallbladder','Liver','Pancreas','Spleen','Stomach',
    'Esophagus','Diaphragm','Aorta','Ribs','Sternum',
    'Lungs','Bronchi','Trachea','Heart','Clavicle',
    'Scapula','Humerus','Radius','Ulna','Thumb',
    'Eyes','Teeth','Nasal Cavity','Temporal Bone',
    'Frontal Bone','Cranium','Brain Stem','Brain'
  ];

  const size = 7;
  const coords = [];
  let left = 0;
  let right = size - 1;
  let top = 0;
  let bottom = size - 1;

  while (left <= right && top <= bottom) {
    for (let c = left; c <= right; c++) coords.push([bottom, c]);
    for (let r = bottom - 1; r >= top; r--) coords.push([r, right]);
    if (top < bottom) {
      for (let c = right - 1; c >= left; c--) coords.push([top, c]);
    }
    if (left < right) {
      for (let r = top + 1; r <= bottom - 1; r++) coords.push([r, left]);
    }
    left++;
    right--;
    top++;
    bottom--;
  }

  const minX = 16;
  const maxX = 84;
  const minY = 12;
  const maxY = 88;
  const stepX = (maxX - minX) / (size - 1);
  const stepY = (maxY - minY) / (size - 1);

  return coords.slice(0, names.length).map(([r, c], i) => ({
    id: i,
    name: names[i],
    x: minX + c * stepX,
    y: minY + r * stepY,
    type:
      i === 0 ? 'start' :
      i === names.length - 1 ? 'finish' :
      i % 11 === 0 ? 'quarantine' :
      i % 8 === 0 ? 'risk' :
      i % 6 === 0 ? 'chance' :
      i % 5 === 0 ? 'safe' :
      i % 4 === 0 ? 'health' :
      'normal'
  }));
};

window.boardMarkup = function(){
  const spaces = window.getBoardSpaces();
  const players = Array.isArray(state.players) ? state.players : [];
  const cp = typeof window.currentPlayer === 'function' ? window.currentPlayer() : null;
  const currentPos = cp ? cp.position : null;
  const img = window.APP_CONFIG?.ANATOMY_IMAGE_URL || './body anatomy mib.png';

  const tilesHtml = spaces.map(space => {
    const onTile = players.filter(p => p.position === space.id);
    const isActive = currentPos === space.id;

    return `
      <div
        data-space-id="${space.id}"
        style="
          position:absolute;
          left:${space.x}%;
          top:${space.y}%;
          transform:translate(-50%,-50%);
          width:84px;
          height:84px;
          border-radius:20px;
          background:${window.getTileColor(space.type)};
          border:${isActive ? '3px solid #fff5a8' : '2px solid rgba(255,255,255,.18)'};
          box-shadow:${isActive
            ? '0 0 26px rgba(255,245,168,.9), 0 12px 24px rgba(0,0,0,.24)'
            : '0 10px 18px rgba(0,0,0,.22)'};
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          padding:6px;
          color:white;
          text-align:center;
          z-index:${isActive ? 20 : 10};
          overflow:hidden;
        "
      >
        <div style="
          position:absolute;
          top:0;
          left:10%;
          width:80%;
          height:16px;
          border-radius:0 0 12px 12px;
          background:linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,0));
        "></div>

        <div style="font-size:9px;font-weight:1000;opacity:.8;">#${space.id}</div>
        <div style="font-size:18px;line-height:1;">${window.getTileEmoji(space.name)}</div>
        <div style="
          font-size:10px;
          font-weight:1000;
          line-height:1.05;
          max-width:100%;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        ">
          ${window.escapeHtml(space.name)}
        </div>

        <div style="
          display:flex;
          gap:4px;
          flex-wrap:wrap;
          justify-content:center;
          margin-top:4px;
          min-height:18px;
        ">
          ${onTile.map((p, i) => `
            <div style="
              min-width:24px;
              height:24px;
              padding:0 6px;
              border-radius:999px;
              background:#0d1b2a;
              color:white;
              font-size:13px;
              font-weight:1000;
              display:flex;
              align-items:center;
              justify-content:center;
              box-shadow:0 4px 10px rgba(0,0,0,.28);
            ">
              ${window.getPlayerToken(i)}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div
      class="board-stage"
      style="
        position:relative;
        width:100%;
        min-height:760px;
        border-radius:34px;
        overflow:hidden;
        background:
          radial-gradient(circle at center, rgba(255,255,255,.08), transparent 28%),
          linear-gradient(180deg,#a7cbc1 0%, #8eaea6 100%);
      "
    >
      <div style="
        position:absolute;
        left:50%;
        top:50%;
        width:22%;
        height:64%;
        transform:translate(-50%,-50%);
        z-index:1;
        display:flex;
        align-items:center;
        justify-content:center;
        pointer-events:none;
      ">
        <img
          src="${img}"
          alt="anatomy"
          onerror="this.style.display='none'"
          style="
            width:100%;
            height:100%;
            object-fit:contain;
            filter:drop-shadow(0 18px 30px rgba(0,0,0,.24));
          "
        />
      </div>

      ${tilesHtml}
    </div>
  `;
};
