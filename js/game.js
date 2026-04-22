window.createTrailAt = function(space){
  const shell = document.querySelector('.board-stage');
  if (!shell || !space) return;

  const dot = document.createElement('div');
  dot.style.position = 'absolute';
  dot.style.left = `${space.x}%`;
  dot.style.top = `${space.y}%`;
  dot.style.width = '16px';
  dot.style.height = '16px';
  dot.style.borderRadius = '999px';
  dot.style.transform = 'translate(-50%,-50%)';
  dot.style.background = '#fff';
  dot.style.boxShadow = '0 0 18px rgba(255,255,255,.95)';
  dot.style.zIndex = '50';
  shell.appendChild(dot);

  dot.animate(
    [
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' },
      { opacity: 0, transform: 'translate(-50%,-50%) scale(2.1)' }
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
      { transform: 'translate(-50%,-50%) scale(1.1)' },
      { transform: 'translate(-50%,-50%) scale(1)' }
    ],
    { duration: 260, easing: 'ease-out' }
  );
};

window.getTileColor = function(type){
  switch(type){
    case 'start': return 'linear-gradient(135deg,#31d97f,#19b768)';
    case 'finish': return 'linear-gradient(135deg,#a766ff,#713dff)';
    case 'safe': return 'linear-gradient(135deg,#20d5ce,#0fa2a8)';
    case 'health': return 'linear-gradient(135deg,#49a8ff,#2f73ff)';
    case 'risk': return 'linear-gradient(135deg,#ff6995,#ea476f)';
    case 'chance': return 'linear-gradient(135deg,#8d6cff,#624def)';
    case 'quarantine': return 'linear-gradient(135deg,#ffc14b,#f08f1f)';
    default: return 'linear-gradient(135deg,#344c69,#243549)';
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
    Pancreas:'🧪',
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

  const spiralCells = [
    [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
    [0,5],[0,4],[0,3],[0,2],[0,1],[0,0],
    [1,0],[2,0],[3,0],[4,0],[5,0],
    [5,1],[5,2],[5,3],[5,4],[5,5],
    [4,5],[3,5],[2,5],[1,5],
    [1,4],[1,3],[1,2],[1,1],
    [2,1],[3,1],[4,1],
    [4,2],[4,3],[4,4],
    [3,4],[2,4],[2,3],[2,2],[3,2]
  ];

  const minX = 18;
  const maxX = 82;
  const minY = 12;
  const maxY = 88;
  const stepX = (maxX - minX) / 6;
  const stepY = (maxY - minY) / 6;

  return spiralCells.slice(0, names.length).map(([row, col], i) => ({
    id: i,
    name: names[i],
    x: minX + col * stepX,
    y: minY + row * stepY,
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
    const isFinish = space.type === 'finish';

    return `
      <div
        data-space-id="${space.id}"
        style="
          position:absolute;
          left:${space.x}%;
          top:${space.y}%;
          transform:translate(-50%,-50%);
          width:${isFinish ? '90px' : '82px'};
          height:${isFinish ? '90px' : '82px'};
          border-radius:22px;
          background:${window.getTileColor(space.type)};
          border:${isActive ? '3px solid #fff6ad' : '2px solid rgba(255,255,255,.16)'};
          box-shadow:${isActive
            ? '0 0 22px rgba(255,246,173,.95), 0 12px 24px rgba(0,0,0,.24)'
            : isFinish
              ? '0 0 20px rgba(167,102,255,.6), 0 12px 24px rgba(0,0,0,.22)'
              : '0 10px 18px rgba(0,0,0,.20)'};
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

        ${isFinish ? `
          <div style="
            position:absolute;
            top:6px;
            right:6px;
            font-size:8px;
            font-weight:1000;
            letter-spacing:.08em;
            background:rgba(255,255,255,.18);
            padding:3px 6px;
            border-radius:999px;
          ">FINISH</div>
        ` : ''}

        <div style="font-size:9px;font-weight:1000;opacity:.8;">#${space.id}</div>
        <div style="font-size:${isFinish ? '20px' : '18px'};line-height:1;">${window.getTileEmoji(space.name)}</div>
        <div style="
          font-size:${isFinish ? '11px' : '10px'};
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
              background:#081522;
              color:white;
              font-size:13px;
              font-weight:1000;
              display:flex;
              align-items:center;
              justify-content:center;
              box-shadow:0 4px 10px rgba(0,0,0,.26);
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
          linear-gradient(180deg,#abd0c7 0%, #92b8af 100%);
      "
    >
      <div style="
        position:absolute;
        left:50%;
        top:50%;
        width:18%;
        height:54%;
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
            filter:drop-shadow(0 16px 28px rgba(0,0,0,.22));
            opacity:.95;
          "
        />
      </div>

      ${tilesHtml}
    </div>
  `;
};
