window.createTrailAt = function(space){
  const shell = document.querySelector('.board-stage');
  if (!shell || !space) return;

  const dot = document.createElement('div');
  dot.className = 'trail-dot';
  dot.style.left = `${space.x}%`;
  dot.style.top = `${space.y}%`;
  shell.appendChild(dot);

  setTimeout(() => dot.remove(), 450);
};

window.showDiceRoll = async function(roll){
  const overlay = document.getElementById('diceOverlay');
  const box = document.getElementById('diceBox');
  const label = document.getElementById('diceLabel');

  if (!overlay || !box || !label) return;

  overlay.classList.remove('hidden');
  label.textContent = 'Rolling...';

  const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];

  for(let i=0;i<10;i++){
    box.textContent = faces[Math.floor(Math.random()*6)];
    await new Promise(r=>setTimeout(r,70));
  }

  box.textContent = roll;
  label.textContent = `Rolled ${roll}`;
  await new Promise(r=>setTimeout(r,550));

  overlay.classList.add('hidden');
};

window.pulseLanding = function(id){
  const tile = document.querySelector(`[data-space-id="${id}"]`);
  if (!tile) return;

  tile.animate(
    [
      { transform:'translate(-50%,-50%) scale(1)' },
      { transform:'translate(-50%,-50%) scale(1.12)' },
      { transform:'translate(-50%,-50%) scale(1)' }
    ],
    { duration:320, easing:'ease-out' }
  );
};

window.getTileColor = function(type){
  switch(type){
    case 'start': return 'linear-gradient(135deg,#29d978,#18b565)';
    case 'finish': return 'linear-gradient(135deg,#b84cff,#7a45ff)';
    case 'safe': return 'linear-gradient(135deg,#2ed7d0,#18b9b1)';
    case 'health': return 'linear-gradient(135deg,#4aa8ff,#2e77ff)';
    case 'risk': return 'linear-gradient(135deg,#ff6e95,#ec4771)';
    case 'chance': return 'linear-gradient(135deg,#7f65ff,#5b4cff)';
    case 'quarantine': return 'linear-gradient(135deg,#ffbf48,#f09b1c)';
    default: return 'linear-gradient(135deg,#2f4867,#24384f)';
  }
};

window.getTileEmoji = function(name){
  const map = {
    Brain:'🧠',
    Heart:'🫀',
    Lungs:'🫁',
    Liver:'🟤',
    Colon:'🧬',
    Stomach:'🍽️',
    Pancreas:'🧪',
    Femur:'🦴',
    Tibia:'🦴',
    Fibula:'🦴',
    Pelvis:'🦴',
    Toes:'🦶',
    Heel:'🦶',
    Eyes:'👁️',
    Teeth:'🦷'
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
    'Frontal Bone','Brain Stem','Cranium','Brain'
  ];

  const size = 7;
  const coords = [];

  let left = 0;
  let right = size - 1;
  let top = 0;
  let bottom = size - 1;

  while(left <= right && top <= bottom){

    for(let c = left; c <= right; c++) coords.push([bottom,c]);
    for(let r = bottom-1; r >= top; r--) coords.push([r,right]);

    if(top < bottom){
      for(let c = right-1; c >= left; c--) coords.push([top,c]);
    }

    if(left < right){
      for(let r = top+1; r <= bottom-1; r++) coords.push([r,left]);
    }

    left++;
    right--;
    top++;
    bottom--;
  }

  const minX = 14;
  const maxX = 86;
  const minY = 12;
  const maxY = 88;

  const stepX = (maxX-minX)/(size-1);
  const stepY = (maxY-minY)/(size-1);

  return coords.slice(0,names.length).map(([r,c],i)=>({
    id:i,
    name:names[i],
    x:minX + c*stepX,
    y:minY + r*stepY,
    type:
      i===0 ? 'start' :
      i===names.length-1 ? 'finish' :
      i%11===0 ? 'quarantine' :
      i%8===0 ? 'risk' :
      i%6===0 ? 'chance' :
      i%5===0 ? 'safe' :
      i%4===0 ? 'health' :
      'normal'
  }));
};

window.boardMarkup = function(){

  const spaces = window.getBoardSpaces();
  const players = Array.isArray(state.players) ? state.players : [];
  const cp = typeof window.currentPlayer === 'function' ? window.currentPlayer() : null;

  const img = window.APP_CONFIG?.ANATOMY_IMAGE_URL || './body anatomy mib.png';

  const tiles = spaces.map(space=>{

    const onTile = players.filter(p=>p.position===space.id);
    const active = cp && cp.position===space.id;

    return `
      <div
        class="space-tile ${active ? 'active-space' : ''}"
        data-space-id="${space.id}"
        style="
          left:${space.x}%;
          top:${space.y}%;
          background:${window.getTileColor(space.type)};
        "
      >
        <div class="tile-id">#${space.id}</div>
        <div class="tile-emoji">${window.getTileEmoji(space.name)}</div>
        <div class="tile-name">${space.name}</div>

        <div class="tile-players">
          ${onTile.map((p,i)=>`
            <div class="mini-token">
              ${window.getPlayerToken(i)}
            </div>
          `).join('')}
        </div>
      </div>
    `;

  }).join('');

  return `
    <div class="board-stage spiral-board">

      <div class="center-anatomy">
        <img src="${img}" />
      </div>

      ${tiles}

    </div>
  `;
};
