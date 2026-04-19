const { STORAGE_KEYS } = window.APP_CONFIG;

window.clientId =
  localStorage.getItem(STORAGE_KEYS.clientId) ||
  Math.random().toString(36).slice(2) + Date.now();

localStorage.setItem(STORAGE_KEYS.clientId, window.clientId);

window.state = {
  entered: false,
  roomCode: Math.random().toString(36).slice(2, 7).toUpperCase(),
  joinCode: '',
  lobbyName: localStorage.getItem(STORAGE_KEYS.playerName) || '',
  players: [],
  currentPlayerIndex: 0,
  lastRoll: null,
  lastCard: { text: 'Roll the dice to begin.' },
  winner: null,
  trivia: null,
  timer: 30,
  feedback: null,
  isRolling: false,
  onlineCount: 0,
  connectionLabel: 'Supabase ready'
};

window.TRIVIA_QUESTIONS = [
  { q: 'What organ pumps blood through the body?', choices: ['Lung','Heart','Liver','Kidney'], a: 'Heart', reward: 3 },
  { q: 'Which body part controls the nervous system?', choices: ['Heart','Brain','Colon','Pancreas'], a: 'Brain', reward: 3 },
  { q: 'What connects muscles to bones?', choices: ['Veins','Ligaments','Tendons','Nerves'], a: 'Tendons', reward: 2 }
];

window.ORGAN_POOL = ['Brain','Heart','Liver','Lungs','Stomach','Pancreas','Kidneys','Spleen'];

window.PATH_POINTS = [[8,92],[18,92],[28,92],[38,92],[48,92],[58,92],[68,92],[78,92],[88,92],[88,82],[78,82],[68,82],[58,82],[48,82],[38,82],[28,82],[18,82],[8,82],[8,72],[18,72],[28,72],[38,72],[48,72],[58,72],[68,72],[78,72],[88,72],[88,62],[78,62],[68,62],[58,62],[48,62],[38,62],[28,62],[18,62],[8,62],[8,52],[18,52],[28,52],[38,52],[48,52],[58,52],[68,52],[78,52],[88,52],[88,42],[78,42],[68,42],[58,42],[48,42],[38,42],[28,42],[18,42],[8,42],[8,32],[18,32],[28,32],[38,32],[48,32],[58,32],[68,32],[78,32],[88,32],[88,22],[78,22],[68,22],[58,22],[48,22],[38,22],[28,22],[18,22],[8,22]];

window.ANATOMY_TERMS = [
  ['Heel','Feet'],['Toes','Feet'],['Metatarsals','Feet'],['Talus','Feet'],['Calcaneus','Feet'],
  ['Achilles Tendon','Lower Leg'],['Tibia','Lower Leg'],['Fibula','Lower Leg'],['Patella','Knee'],['Knee Joint','Knee'],
  ['Quadriceps','Upper Leg'],['Hamstrings','Upper Leg'],['Femur','Upper Leg'],['Hip Joint','Hip'],['Pelvis','Pelvis'],
  ['Bladder','Pelvis'],['Uterus','Pelvis'],['Rectum','Digestive'],['Appendix','Digestive'],['Colon','Digestive'],
  ['Small Intestine','Digestive'],['Gallbladder','Digestive'],['Liver','Digestive'],['Pancreas','Digestive'],['Spleen','Immune'],
  ['Stomach','Digestive'],['Esophagus','Upper Body'],['Diaphragm','Thorax'],['Aorta','Thorax'],['Ribs','Thorax'],
  ['Sternum','Thorax'],['Lungs','Thorax'],['Bronchi','Thorax'],['Trachea','Neck'],['Heart','Thorax']
];

window.specialSpaceType = function(id){
  const map = {0:'start',5:'safe',9:'health',13:'quarantine',17:'chance',21:'risk',25:'safe',29:'health',33:'quarantine',37:'chance',41:'energy',45:'risk',49:'safe',53:'quarantine',57:'health',61:'chance',65:'risk',69:'safe'};
  return map[id] || 'normal';
};

window.createBasePlayer = function(ownerId, name){
  return { id: 0, name: name || 'Player', position: 0, shields: 0, quarantined: 0, skipped: 0, extraTurn: false, score: 0, organs: [], ownerId };
};

window.normalizePlayers = function(players){
  return players.map((p, i) => ({ ...window.createBasePlayer(p.ownerId, p.name), ...p, id: i + 1, organs: Array.isArray(p.organs) ? p.organs : [] }));
};

window.currentPlayer = function(){
  return state.players[state.currentPlayerIndex] || state.players[0] || null;
};

window.myPlayer = function(){
  return state.players.find(p => p.ownerId === window.clientId) || null;
};

window.SPACES = (() => {
  const spaces = [];
  spaces.push({ id: 0, name: 'Start', body: 'Feet', type: 'start', x: PATH_POINTS[0][0], y: PATH_POINTS[0][1] });
  for (let i = 1; i < PATH_POINTS.length - 1; i++) {
    const point = PATH_POINTS[i];
    const term = ANATOMY_TERMS[(i - 1) % ANATOMY_TERMS.length];
    spaces.push({ id: i, name: term[0], body: term[1], type: specialSpaceType(i), x: point[0], y: point[1] });
  }
  spaces.push({ id: PATH_POINTS.length - 1, name: 'Brain', body: 'Finish', type: 'finish', x: PATH_POINTS[PATH_POINTS.length - 1][0], y: PATH_POINTS[PATH_POINTS.length - 1][1] });
  return spaces;
})();
