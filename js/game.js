window.chooseRandomCard = function(cards){
  return cards[Math.floor(Math.random() * cards.length)];
};

window.getCardDeckByType = function(type){
  if (type === 'health') return HEALTH_CARDS;
  if (type === 'risk') return RISK_CARDS;
  if (type === 'chance') return CHANCE_CARDS;
  if (type === 'energy') return ENERGY_CARDS;
  if (type === 'surgery') return SURGERY_CARDS;
  return null;
};

window.applyCardForType = function(type, player){
  const deck = window.getCardDeckByType(type);
  if (!deck) return { player, card: null, attackBack: 0, nextMiss: false, organAward: null };
  const picked = window.chooseRandomCard(deck);
  let updatedPlayer = picked.effect(player);
  let organAward = null;
  if (picked.collectOrgan) {
    const available = ORGAN_POOL.filter(organ => !updatedPlayer.organs.includes(organ));
    organAward = available.length ? available[Math.floor(Math.random() * available.length)] : ORGAN_POOL[0];
    updatedPlayer = { ...updatedPlayer, organs: [...updatedPlayer.organs, organAward] };
  }
  return { player: updatedPlayer, card: picked, attackBack: picked.attackBack || 0, nextMiss: !!picked.nextMiss, organAward };
};

window.handleRoll = async function(){
  if (state.winner || state.trivia || state.isRolling) return;
  const turnPlayer = window.currentPlayer();
  if (!turnPlayer || turnPlayer.ownerId !== window.clientId) {
    state.lastCard = { text: 'Wait for your turn.' };
    window.safeRender();
    return;
  }

  await window.unlockAudio();
  await window.playDiceSound();
  state.isRolling = true;
  const roll = Math.floor(Math.random() * 6) + 1;
  state.lastRoll = roll;
  await window.showDiceRoll(roll);

  const updated = [...state.players];
  let player = { ...updated[state.currentPlayerIndex] };

  for (let step = 0; step < roll; step++) {
    player.position = Math.min(SPACES.length - 1, player.position + 1);
    updated[state.currentPlayerIndex] = player;
    state.players = window.normalizePlayers(updated);
    window.createTrailAt(SPACES[player.position]);
    window.safeRender();
    await new Promise(r => setTimeout(r, 170));
  }

  const landed = SPACES[player.position];
  let logText = `${window.getPlayerName(player)} landed on ${landed.name}.`;

  if (landed.type === 'safe') {
    player.shields += 1;
    player.score += 1;
    logText = `${window.getPlayerName(player)} reached a safe point and gained 1 shield.`;
  }

  updated[state.currentPlayerIndex] = player;
  state.players = window.normalizePlayers(updated);
  state.lastCard = { text: logText };
  state.isRolling = false;
  window.pulseLanding(player.position);

  if (player.position < SPACES.length - 1) {
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % updated.length;
  } else {
    state.winner = player.name;
  }

  window.safeRender();
  await window.saveRoomState();
};

window.submitTrivia = async function(answer){
  if (!state.trivia) return;
  const turnPlayer = window.currentPlayer();
  if (!turnPlayer || turnPlayer.ownerId !== window.clientId) return;

  const correct = answer === state.trivia.a;
  const reward = state.trivia.reward || 2;
  const updated = [...state.players];
  const player = { ...updated[state.currentPlayerIndex] };

  if (correct) {
    player.position = Math.min(SPACES.length - 1, player.position + reward);
    player.score += reward;
  }

  updated[state.currentPlayerIndex] = player;
  state.players = window.normalizePlayers(updated);
  state.feedback = { ok: correct, text: correct ? `Correct! Move forward ${reward} spaces.` : 'Wrong answer. Stay in the same spot.' };
  state.trivia = null;
  state.timer = 30;
  window.safeRender();
  await window.saveRoomState();
};

window.resetGame = async function(){
  const host = state.players[0];
  if (!host || host.ownerId !== window.clientId) return;
  state.players = window.normalizePlayers(state.players.map(player => ({ ...player, position: 0, shields: 0, quarantined: 0, skipped: 0, extraTurn: false, score: 0, organs: [] })));
  state.currentPlayerIndex = 0;
  state.lastRoll = null;
  state.lastCard = { text: 'Roll the dice to begin.' };
  state.winner = null;
  state.trivia = null;
  state.feedback = null;
  window.safeRender();
  await window.saveRoomState();
};
