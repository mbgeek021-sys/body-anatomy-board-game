const { SUPABASE_CONFIG } = window.APP_CONFIG;
window.sb = null;
window.pollTimer = null;

window.initSupabase = function () {
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    throw new Error('Supabase library failed to load.');
  }

  window.sb = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
  );
};

window.serializeState = function () {
  return {
    players: state.players,
    currentPlayerIndex: state.currentPlayerIndex,
    lastRoll: state.lastRoll,
    lastCard: state.lastCard,
    winner: state.winner,
    feedback: state.feedback
  };
};

window.setStatus = function (message, isError = false) {
  if (isError) {
    state.connectionLabel = `Supabase error: ${message}`;
    state.lastCard = { text: message };
  } else {
    state.connectionLabel = message;
  }
  window.safeRender();
};

window.runSafe = async function (fn, fallback = 'Something failed.') {
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

window.fetchRoom = async function () {
  const { data, error } = await sb
    .from('rooms')
    .select('*')
    .eq('room_code', state.roomCode)
    .maybeSingle();

  if (error) throw error;
  return data;
};

window.ensureRoomExists = async function () {
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

window.joinRoomStateOnly = async function () {
  const room = await window.fetchRoom();
  const roomState = room?.state_json || {
    players: [],
    currentPlayerIndex: 0,
    lastRoll: null,
    lastCard: { text: 'Roll the dice to begin.' },
    winner: null,
    feedback: null
  };

  let players = Array.isArray(roomState.players) ? [...roomState.players] : [];
  const existingIndex = players.findIndex((p) => p.ownerId === window.clientId);

  if (existingIndex >= 0) {
    players[existingIndex] = {
      ...players[existingIndex],
      name: state.lobbyName
    };
  } else {
    players.push(window.createBasePlayer(window.clientId, state.lobbyName));
  }

  const nextState = {
    ...roomState,
    players
  };

  const { error } = await sb
    .from('rooms')
    .update({
      state_json: nextState,
      updated_at: new Date().toISOString()
    })
    .eq('room_code', state.roomCode);

  if (error) throw error;

  state.players = normalizePlayers(nextState.players);
  state.currentPlayerIndex = nextState.currentPlayerIndex || 0;
  state.lastRoll = nextState.lastRoll ?? null;
  state.lastCard = nextState.lastCard || { text: 'Roll the dice to begin.' };
  state.winner = nextState.winner ?? null;
  state.feedback = nextState.feedback ?? null;
  state.onlineCount = state.players.length;
};

window.saveRoomState = async function () {
  const { error } = await sb
    .from('rooms')
    .update({
      state_json: window.serializeState(),
      updated_at: new Date().toISOString()
    })
    .eq('room_code', state.roomCode);

  if (error) throw error;
};

window.refreshFromServer = async function () {
  const room = await window.fetchRoom();
  const roomState = room?.state_json || {};

  state.players = normalizePlayers(roomState.players || []);
  state.currentPlayerIndex = roomState.currentPlayerIndex || 0;
  state.lastRoll = roomState.lastRoll ?? null;
  state.lastCard = roomState.lastCard || { text: 'Roll the dice to begin.' };
  state.winner = roomState.winner ?? null;
  state.feedback = roomState.feedback ?? null;
  state.onlineCount = state.players.length;

  window.safeRender();
};

window.startPolling = function () {
  clearInterval(window.pollTimer);
  window.pollTimer = setInterval(() => {
    if (state.entered) {
      window.runSafe(
        () => window.refreshFromServer(),
        'Could not refresh room.'
      );
    }
  }, 1500);
};
