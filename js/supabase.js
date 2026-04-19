const { SUPABASE_CONFIG } = window.APP_CONFIG;
window.sb = null;
window.pollTimer = null;

window.initSupabase = function(){
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    throw new Error('Supabase library failed to load.');
  }
  window.sb = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
  );
};

window.serializeState = function(){
  return {
    players: state.players,
    currentPlayerIndex: state.currentPlayerIndex,
    lastRoll: state.lastRoll,
    lastCard: state.lastCard,
    winner: state.winner,
    feedback: state.feedback
  };
};

window.applyRoomState = function(roomState){
  state.players = normalizePlayers(roomState.players || []);
  state.currentPlayerIndex = Math.min(
    roomState.currentPlayerIndex || 0,
    Math.max(0, state.players.length - 1)
  );
  state.lastRoll = roomState.lastRoll ?? null;
  state.lastCard = roomState.lastCard || { text: 'Roll the dice to begin.' };
  state.winner = roomState.winner ?? null;
  state.feedback = roomState.feedback ?? null;
  state.onlineCount = state.players.length || 0;
};

window.setStatus = function(message, isError = false){
  if (isError) {
    state.connectionLabel = `Supabase error: ${message}`;
    state.lastCard = { text: message };
  } else {
    state.connectionLabel = message;
  }
  window.safeRender();
};

window.runSafe = async function(fn, fallback = 'Something failed.'){
  try {
    return await fn();
  } catch (error) {
    console.error('Supabase/Game error:', error);
    window.setStatus(error?.message || fallback, true);
    state.lastCard = { text: error?.message || fallback };
    window.safeRender();
    return null;
  }
};

window.fetchRoom = async function(){
  const { data, error } = await sb
    .from('rooms')
    .select('*')
    .eq('room_code', state.roomCode)
    .maybeSingle();

  if (error) throw error;
  return data;
};

window.ensureRoomExists = async function(){
  const existing = await window.fetchRoom();
  if (existing) return existing;

  const starter = {
    players: [],
    currentPlayerIndex: 0,
    lastRoll: null,
    lastCard: { text: 'Roll the dice to begin.' },
    winner: null,
    feedback: null
  };

  const { error } = await sb.from('rooms').insert({
    room_code: state.roomCode,
    host_id: window.clientId,
    state_json: starter
  });

  if (error) throw error;
  return await window.fetchRoom();
};

window.upsertPlayerRecord = async function(){
  const playerName =
    state.lobbyName ||
    localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.playerName) ||
    'Player';

  const updateResult = await sb
    .from('players')
    .update({ player_name: playerName })
    .eq('room_code', state.roomCode)
    .eq('client_id', window.clientId)
    .select();

  if (updateResult.error) throw updateResult.error;

  if (updateResult.data && updateResult.data.length > 0) {
    return updateResult.data;
  }

  const insertResult = await sb
    .from('players')
    .insert({
      room_code: state.roomCode,
      client_id: window.clientId,
      player_name: playerName
    })
    .select();

  if (insertResult.error) throw insertResult.error;

  return insertResult.data;
};

window.fetchPlayers = async function(){
  const { data, error } = await sb
    .from('players')
    .select('*')
    .eq('room_code', state.roomCode)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

window.saveRoomState = async function(){
  const { error } = await sb
    .from('rooms')
    .update({
      host_id: (state.players[0]?.ownerId || window.clientId),
      state_json: window.serializeState(),
      updated_at: new Date().toISOString()
    })
    .eq('room_code', state.roomCode);

  if (error) throw error;
};

window.refreshFromServer = async function(){
  const room = await window.fetchRoom();
  const rows = await window.fetchPlayers();

  const namesByOwner = new Map(rows.map(r => [r.client_id, r.player_name]));

  let basePlayers = [];
  if (room?.state_json?.players?.length) {
    basePlayers = room.state_json.players.map(p => ({
      ...p,
      name: namesByOwner.get(p.ownerId) || p.name
    }));
  } else {
    basePlayers = rows.map(r => window.createBasePlayer(r.client_id, r.player_name));
  }

  state.players = normalizePlayers(basePlayers);
  state.onlineCount = rows.length;
  state.currentPlayerIndex = room?.state_json?.currentPlayerIndex || 0;
  state.lastRoll = room?.state_json?.lastRoll ?? null;
  state.lastCard = room?.state_json?.lastCard || { text: 'Roll the dice to begin.' };
  state.winner = room?.state_json?.winner ?? null;
  state.feedback = room?.state_json?.feedback ?? null;

  window.safeRender();
};

window.startPolling = function(){
  clearInterval(window.pollTimer);
  window.pollTimer = setInterval(() => {
    if (state.entered) {
      window.runSafe(() => window.refreshFromServer(), 'Could not refresh room.');
    }
  }, 2000);
};
