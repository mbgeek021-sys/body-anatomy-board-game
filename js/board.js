window.getPlayerToken = window.getPlayerToken || function(index){
  const fallback = ['🩺','💉','💊','🩹','🌡️','🫀','🧠','❤️'];
  return fallback[((index ?? 0) % fallback.length + fallback.length) % fallback.length];
};

window.createTrailAt = function(space){
  const shell = document.querySelector('.board-stage');
  if (!shell || !space) return;

  const dot = document.createElement('div');
  dot.className = 'trail-dot';
  dot.style.left = `${space.x}%`;
  dot.style.top = `${space.y}%`;
  shell.appendChild(dot);

  setTimeout(() => dot.remove(), 320);
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
  await new Promise(r => setTimeout(r, 450));

  overlay.classList.add('hidden');
};

window.pulseLanding = function(id){
  const tile = document.querySelector(`[data-space-id="${id}"]`);
  if (!tile) return;
  tile.classList.remove('soft-pulse');
  void tile.offsetWidth;
  tile.classList.add('soft-pulse');
  setTimeout(() => tile.classList.remove('soft-pulse'), 420);
};

window.getTileAccent = function(type){
  switch(type){
    case 'start': return '#63b88e';
    case 'finish': return '#9e8bd8';
    case 'safe': return '#74b7b0';
    case 'health': return '#86a7d8';
    case 'risk': return '#cb93a0';
    case 'chance': return '#a595d8';
    case 'quarantine': return '#d0aa73';
    default: return '#314b66';
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

  const tilesHtml = spaces.map(space => {
    const onTile = players.filter(p => p.position === space.id);
    const isActive = currentPos === space.id;
    const isFinish = space.type === 'finish';

    return `
      <div
        class="premium-tile premium-tile-paper ${isActive ? 'active-space' : ''} ${isFinish ? 'finish-space' : ''}"
        data-space-id="${space.id}"
        style="left:${space.x}%; top:${space.y}%;"
      >
        <div class="paper-tile-accent" style="background:${window.getTileAccent(space.type)};"></div>

        ${isFinish ? `<div class="finish-badge">FINISH</div>` : ''}

        <div class="paper-tile-id">#${space.id}</div>

        <div class="paper-tile-icon-wrap">
          <div class="paper-tile-icon">${window.getTileEmoji(space.name)}</div>
        </div>

        <div class="paper-tile-name">${window.escapeHtml(space.name)}</div>

        <div class="paper-token-row">
          ${onTile.map((p, i) => `
            <div class="paper-token">${window.getPlayerToken(i)}</div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="board-stage premium-board-bg">
      <div class="board-paper-overlay"></div>
      ${tilesHtml}
    </div>
  `;
};
