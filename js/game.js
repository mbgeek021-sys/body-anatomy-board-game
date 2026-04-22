window.getPlayerName = function(player){
  if (!player) return 'Player';
  return player.name || `Player ${player.id || ''}`.trim();
};

window.getPlayerToken = function(index){
  const tokens = ['🩺','💉','💊','🩹','🌡️','🫀','🧠','❤️'];
  return tokens[((index ?? 0) % tokens.length + tokens.length) % tokens.length];
};

window.currentPlayer = function(){
  if (!Array.isArray(state.players) || !state.players.length) return null;
  const idx = Math.max(0, Math.min(state.currentPlayerIndex || 0, state.players.length - 1));
  return state.players[idx];
};

window.myPlayer = function(){
  if (!Array.isArray(state.players)) return null;
  return state.players.find(p => p.ownerId === window.clientId) || null;
};

window.ensurePlayersShape = function(players){
  const safePlayers = Array.isArray(players) ? players : [];

  if (typeof window.normalizeServerPlayers === 'function') {
    try { return window.normalizeServerPlayers(safePlayers); } catch {}
  }

  return safePlayers.map((p, i) => ({
    id: p.id || i + 1,
    name: p.name || `Player ${i + 1}`,
    ownerId: p.ownerId || `local-${i + 1}`,
    position: Number.isFinite(p.position) ? p.position : 0,
    shields: Number.isFinite(p.shields) ? p.shields : 0,
    score: Number.isFinite(p.score) ? p.score : 0,
    skipped: Number.isFinite(p.skipped) ? p.skipped : 0,
    quarantined: Number.isFinite(p.quarantined) ? p.quarantined : 0,
    organs: Array.isArray(p.organs) ? p.organs : []
  }));
};

window.delay = function(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
};

window.rollDie = function(){
  return Math.floor(Math.random() * 6) + 1;
};

window.advanceTurn = function(){
  if (!Array.isArray(state.players) || !state.players.length) return;
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
};

window.shouldTriggerTrivia = function(space){
  if (!space) return false;
  return ['chance','health','risk','safe'].includes(space.type);
};

window.pushSharedEvent = function(message, sound = null){
  if (typeof window.addRoomEvent === 'function') {
    window.addRoomEvent(message, sound, window.clientId);
  } else {
    state.lastCard = { text: message };
  }
};

window.applySpaceEffect = function(player, landedSpace){
  let text = `${window.getPlayerName(player)} landed on ${landedSpace.name}.`;

  switch (landedSpace.type) {
    case 'safe':
      player.shields = (player.shields || 0) + 1;
      player.score = (player.score || 0) + 1;
      text = `${window.getPlayerName(player)} reached a safe point and gained 1 shield.`;
      break;

    case 'health':
      player.score = (player.score || 0) + 2;
      text = `${window.getPlayerName(player)} found a health bonus and gained 2 points.`;
      break;

    case 'risk':
      player.score = Math.max(0, (player.score || 0) - 1);
      text = `${window.getPlayerName(player)} hit a risk tile and lost 1 point.`;
      break;

    case 'quarantine':
      player.skipped = 1;
      text = `${window.getPlayerName(player)} landed on quarantine and will miss the next turn.`;
      break;

    case 'chance':
      if (Math.random() < 0.5) {
        player.score = (player.score || 0) + 2;
        text = `${window.getPlayerName(player)} got lucky and gained 2 points.`;
      } else {
        player.score = Math.max(0, (player.score || 0) - 1);
        text = `${window.getPlayerName(player)} got unlucky and lost 1 point.`;
      }
      break;

    case 'energy':
      player.score = (player.score || 0) + 3;
      text = `${window.getPlayerName(player)} found an energy boost and gained 3 points.`;
      break;

    case 'finish':
      state.winner = window.getPlayerName(player);
      text = `${window.getPlayerName(player)} reached the brain and won!`;
      break;
  }

  state.lastCard = { text };
  return text;
};

window.skipMissedTurnsIfNeeded = async function(){
  if (!Array.isArray(state.players) || !state.players.length) return false;

  let guard = 0;
  let skippedAny = false;

  while (guard < state.players.length) {
    const player = window.currentPlayer();
    if (!player) break;
    if ((player.skipped || 0) <= 0) break;

    player.skipped = Math.max(0, (player.skipped || 0) - 1);
    const msg = `${window.getPlayerName(player)} missed this turn.`;
    state.lastCard = { text: msg };
    window.playMissTurnSound?.();
    window.pushSharedEvent(msg, 'skip');

    skippedAny = true;
    window.advanceTurn();
    guard++;
  }

  if (skippedAny) {
    state.players = window.ensurePlayersShape(state.players);
    await window.runSafe(async () => {
      if (typeof window.saveRoomState === 'function') {
        await window.saveRoomState();
      }
    }, 'Could not save skipped turns.');
    window.safeRender();
  }

  return skippedAny;
};

window.handleRoll = async function(){
  if (state.isRolling) return;
  if (state.winner) return;
  if (state.trivia) return;

  const spaces = typeof window.getBoardSpaces === 'function' ? window.getBoardSpaces() : [];
  if (!spaces.length) {
    state.lastCard = { text: 'Board spaces are missing.' };
    window.safeRender();
    return;
  }

  state.players = window.ensurePlayersShape(state.players);

  if (!state.players.length) {
    state.lastCard = { text: 'No players loaded.' };
    window.safeRender();
    return;
  }

  await window.skipMissedTurnsIfNeeded();

  const current = window.currentPlayer();
  const mine = window.myPlayer();

  if (!current || !mine) {
    state.lastCard = { text: 'Player state is missing.' };
    window.safeRender();
    return;
  }

  if (current.ownerId !== mine.ownerId) {
    state.lastCard = { text: `Waiting for ${window.getPlayerName(current)}...` };
    window.safeRender();
    return;
  }

  state.isRolling = true;
  state.feedback = null;
  state.trivia = null;
  window.safeRender();

  try {
    const roll = window.rollDie();
    state.lastRoll = roll;
    window.playDiceSound?.();
    window.pushSharedEvent(`${window.getPlayerName(current)} rolled ${roll}.`, 'dice');

    if (typeof window.showDiceRoll === 'function') {
      await window.showDiceRoll(roll);
    }

    const currentIndex = Math.max(0, Math.min(state.currentPlayerIndex || 0, state.players.length - 1));
    const player = state.players[currentIndex];

    for (let step = 0; step < roll; step++) {
      player.position = Math.min(spaces.length - 1, (player.position || 0) + 1);
      state.players = window.ensurePlayersShape(state.players);

      if (typeof window.createTrailAt === 'function') {
        window.createTrailAt(spaces[player.position]);
      }
      if (typeof window.pulseLanding === 'function') {
        window.pulseLanding(player.position);
      }

      window.playMoveSound?.();
      window.safeRender();
      await window.delay(180);
    }

    const landedSpace = spaces[player.position];
    const effectText = window.applySpaceEffect(player, landedSpace);
    window.pushSharedEvent(effectText, landedSpace.type === 'quarantine' ? 'skip' : 'move');

    if (!state.winner && window.shouldTriggerTrivia(landedSpace) && Array.isArray(window.TRIVIA_QUESTIONS) && window.TRIVIA_QUESTIONS.length) {
      state.trivia = window.TRIVIA_QUESTIONS[Math.floor(Math.random() * window.TRIVIA_QUESTIONS.length)];
      state.timer = 20;
      state.lastCard = { text: `${window.getPlayerName(player)} triggered trivia.` };
      window.pushSharedEvent(`${window.getPlayerName(player)} triggered trivia.`, 'move');
    } else if (!state.winner) {
      window.advanceTurn();
      await window.skipMissedTurnsIfNeeded();
    }

    state.players = window.ensurePlayersShape(state.players);

    await window.runSafe(async () => {
      if (typeof window.saveRoomState === 'function') {
        await window.saveRoomState();
      }
    }, 'Could not save roll.');

  } catch (error) {
    console.error('handleRoll failed:', error);
    state.lastCard = { text: error?.message || 'Roll failed.' };
  } finally {
    state.isRolling = false;

    await window.runSafe(async () => {
      if (typeof window.saveRoomState === 'function') {
        await window.saveRoomState();
      }
    }, 'Could not save roll final state.');

    window.safeRender();
  }
};

window.submitTrivia = async function(choice){
  if (!state.trivia) return;

  state.players = window.ensurePlayersShape(state.players);

  const current = window.currentPlayer();
  const mine = window.myPlayer();

  if (!current || !mine) return;
  if (current.ownerId !== mine.ownerId) {
    state.lastCard = { text: `Waiting for ${window.getPlayerName(current)} to answer...` };
    window.safeRender();
    return;
  }

  const correct = choice === state.trivia.answer;

  if (correct) {
    current.score = (current.score || 0) + 2;
    state.feedback = { ok: true, text: 'Correct! +2 points.' };
    state.lastCard = { text: `${window.getPlayerName(current)} answered correctly and gained 2 points.` };
    window.playCorrectSound?.();
    window.pushSharedEvent(`${window.getPlayerName(current)} answered correctly.`, 'correct');
  } else {
    current.position = Math.max(0, (current.position || 0) - 2);
    current.score = Math.max(0, (current.score || 0) - 1);
    state.feedback = { ok: false, text: 'Wrong! -1 point and move back 2.' };
    state.lastCard = { text: `${window.getPlayerName(current)} missed the question and moved back 2 spaces.` };
    window.playWrongSound?.();
    window.pushSharedEvent(`${window.getPlayerName(current)} answered incorrectly.`, 'wrong');
  }

  state.players = window.ensurePlayersShape(state.players);
  state.trivia = null;
  state.timer = 30;

  if (!state.winner) {
    window.advanceTurn();
    await window.skipMissedTurnsIfNeeded();
  }

  await window.runSafe(async () => {
    if (typeof window.saveRoomState === 'function') {
      await window.saveRoomState();
    }
  }, 'Could not save trivia result.');

  window.safeRender();
};

window.resetGame = async function(){
  const players = window.ensurePlayersShape(state.players).map((p, i) => ({
    ...p,
    id: i + 1,
    position: 0,
    shields: 0,
    score: 0,
    skipped: 0,
    quarantined: 0,
    organs: []
  }));

  state.players = players;
  state.currentPlayerIndex = 0;
  state.lastRoll = null;
  state.lastCard = { text: 'Game reset.' };
  state.winner = null;
  state.feedback = null;
  state.isRolling = false;
  state.trivia = null;
  state.timer = 30;
  state.eventLog = [];
  state.activeEvent = null;

  await window.runSafe(async () => {
    if (typeof window.saveRoomState === 'function') {
      await window.saveRoomState();
    }
  }, 'Could not save reset.');

  window.safeRender();
};
