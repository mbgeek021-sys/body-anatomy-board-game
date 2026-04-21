window.createTrailAt = function(space){
  const shell = document.querySelector('.board-stage');
  if (!shell || !space) return;

  const dot = document.createElement('div');
  dot.style.left = `${space.x}%`;
  dot.style.top = `${space.y}%`;
  dot.style.position = 'absolute';
  dot.style.width = '18px';
  dot.style.height = '18px';
  dot.style.borderRadius = '999px';
  dot.style.transform = 'translate(-50%,-50%)';
  dot.style.background = 'rgba(255,255,255,.95)';
  dot.style.boxShadow = '0 0 20px rgba(255,255,255,.9)';
  dot.style.zIndex = '30';
  shell.appendChild(dot);

  dot.animate(
    [
      { opacity:1, transform:'translate(-50%,-50%) scale(1)' },
      { opacity:0, transform:'translate(-50%,-50%) scale(2)' }
    ],
    { duration:450, easing:'ease-out' }
  );

  setTimeout(()=>dot.remove(),460);
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
    box.textContent = faces[i % 6];
    await new Promise(r=>setTimeout(r,80));
  }

  box.textContent = roll;
  label.textContent = 'Move!';
  await new Promise(r=>setTimeout(r,450));

  overlay.classList.add('hidden');
};

window.pulseLanding = function(spaceId){
  requestAnimationFrame(() => {
    const el = document.querySelector(`[data-space-id="${spaceId}"]`);
    if (!el) return;

    el.animate(
      [
        { transform:'translate(-50%,-50%) scale(1)' },
        { transform:'translate(-50%,-50%) scale(1.12)' },
        { transform:'translate(-50%,-50%) scale(1)' }
      ],
      { duration:320, easing:'ease-out' }
    );
  });
};

window.getTileColors = function(type){
  switch(type){
    case 'start': return 'linear-gradient(145deg,#31d67a,#1fa85e)';
    case 'finish': return 'linear-gradient(145deg,#cf63ff,#8d53ff)';
    case 'safe': return 'linear-gradient(145deg,#2ed7d0,#1ca89c)';
    case 'health': return 'linear-gradient(145deg,#4ca8ff,#2b74ff)';
    case 'risk': return 'linear-gradient(145deg,#ff739f,#e94b75)';
    case 'quarantine': return 'linear-gradient(145deg,#ffca57,#f09427)';
    case 'chance': return 'linear-gradient(145deg,#8f7bff,#5f58ef)';
    default: return 'linear-gradient(145deg,#35506d,#24364a)';
  }
};

window.getTileIcon = function(name){
  const map = {
    Brain:'🧠', Heart:'🫀', Lungs:'🫁', Liver:'🟤',
    Stomach:'🍽️', Kidney:'💧', Eyes:'👁️',
    Femur:'🦴', Pelvis:'🦴', Teeth:'🦷'
  };
  return map[name] || '🔬';
};

window.getBoardSpaces = function(){
  const labels = [
    'Start','Heel','Toes','Talus','Calcaneus','Tibia','Fibula','Patella',
    'Quadriceps','Hamstrings','Femur','Pelvis','Bladder','Colon','Liver',
    'Pancreas','Stomach','Diaphragm','Heart','Lungs','Bronchi','Trachea',
    'Clavicle','Scapula','Humerus','Radius','Ulna','Thumb','Eyes','Teeth',
    'Frontal','Cranium','Brain Stem','Brain'
  ];

  const size = 6;
  const cells = [];
  let left=0,right=size-1,top=0,bottom=size-1;

  while(left<=right && top<=bottom){
    for(let c=left;c<=right;c++) cells.push([bottom,c]);
    for(let r=bottom-1;r>=top;r--) cells.push([r,right]);
    if(top<bottom) for(let c=right-1;c>=left;c--) cells.push([top,c]);
    if(left<right) for(let r=top+1;r<=bottom-1;r++) cells.push([r,left]);
    left++; right--; top++; bottom--;
  }

  const minX=16,maxX=84,minY=12,maxY=88;
  const stepX=(maxX-minX)/(size-1);
  const stepY=(maxY-minY)/(size-1);

  return cells.slice(0, labels.length).map(([r,c],i)=>({
    id:i,
    name:labels[i],
    x:minX + c*stepX,
    y:minY + r*stepY,
    type:
      i===0 ? 'start' :
      i===labels.length-1 ? 'finish' :
      i%9===0 ? 'quarantine' :
      i%7===0 ? 'risk' :
      i%5===0 ? 'chance' :
      i%4===0 ? 'safe' :
      i%3===0 ? 'health' :
      'normal'
  }));
};

window.boardMarkup = function(){
  const spaces = window.getBoardSpaces();
  const players = Array.isArray(state.players) ? state.players : [];
  const cp = typeof window.currentPlayer === 'function' ? window.currentPlayer() : null;
  const currentId = cp ? cp.position : null;
  const img = window.APP_CONFIG?.ANATOMY_IMAGE_URL || './body anatomy mib.png';

  const spacesHtml = spaces.map(space => {
    const onTile = players.filter(p => p.position === space.id);
    const current = currentId === space.id;

    return `
      <div
        data-space-id="${space.id}"
        class="space"
        style="
          position:absolute;
          left:${space.x}%;
          top:${space.y}%;
          width:90px;
          height:90px;
          transform:translate(-50%,-50%);
          border-radius:24px;
          background:${window.getTileColors(space.type)};
          border:${current ? '3px solid #fff7a6' : '2px solid rgba(255,255,255,.14)'};
          box-shadow:
            ${current
              ? '0 0 28px rgba(255,241,120,.9), 0 14px 28px rgba(0,0,0,.25)'
              : '0 10px 20px rgba(0,0,0,.22)'};
          padding:7px;
          z-index:${current ? 12 : 8};
        "
      >
        <div style="
          position:absolute;
          top:0;
          left:8%;
          width:84%;
          height:18px;
          border-radius:0 0 14px 14px;
          background:linear-gradient(180deg,rgba(255,255,255,.20),rgba(255,255,255,0));
        "></div>

        <div style="font-size:12px;font-weight:900;opacity:.7;">#${space.id}</div>
        <div style="font-size:18px;">${window.getTileIcon(space.name)}</div>
        <div style="font-size:10px;font-weight:900;line-height:1.05;">
          ${window.escapeHtml(space.name)}
        </div>

        <div style="
          margin-top:4px;
          display:flex;
          flex-wrap:wrap;
          gap:4px;
        ">
          ${onTile.map((p,i)=>`
            <div style="
              min-width:24px;
              height:24px;
              padding:0 6px;
              border-radius:999px;
              background:#ffffff;
              color:#13283a;
              font-size:14px;
              font-weight:900;
              display:flex;
              align-items:center;
              justify-content:center;
              box-shadow:0 4px 8px rgba(0,0,0,.2);
            ">
              ${window.getPlayerToken(i)}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="board-stage"
      style="
        position:relative;
        width:100%;
        height:100%;
        border-radius:34px;
        overflow:hidden;
        background:
          radial-gradient(circle at 50% 45%, rgba(255,255,255,.08), transparent 30%),
          linear-gradient(180deg,#9fc5ba 0%, #85aa9f 100%);
      "
    >

      <div style="
        position:absolute;
        left:50%;
        top:50%;
        width:24%;
        height:64%;
        transform:translate(-50%,-50%);
        z-index:1;
        display:flex;
        align-items:center;
        justify-content:center;
        opacity:.92;
      ">
        <img
          src="${img}"
          style="
            width:100%;
            height:100%;
            object-fit:contain;
            filter:drop-shadow(0 18px 30px rgba(0,0,0,.22));
          "
        />
      </div>

      ${spacesHtml}

    </div>
  `;
};
