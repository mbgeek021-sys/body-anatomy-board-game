const { SUPABASE_CONFIG } = window.APP_CONFIG;

window.sb = null;
window.pollTimer = null;
window.lastServerSnapshot = '';
window.lastEventIdSeen = null;

window.initSupabase = function () {
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    throw new Error('Supabase library failed to load.');
  }

  window.sb = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
  );
};

window.defaultRoomState = function () {
  return {
    players: [],
    currentPlayerIndex: 0,
    lastRoll: null,
    lastCard: { text: 'Roll the dice to begin.' },
    winner: null,
    feedback: null,
    trivia: null,
    timer: 30,
    isRolling: false,
    eventLog: [],
    activeEvent: null
  };
};

window.serializeState = function () {
  return {
    players: state.players || [],
    currentPlayerIndex: state.currentPlayerIndex || 0,
    lastRoll: state.lastRoll ?? null,
    lastCard: state.lastCard || { text: 'Roll the dice to begin.' },
    winner: state.winner ?? null,
    feedback: state.feedback ?? null,
    trivia: state.trivia ?? null,
    timer: state.timer ?? 30,
    isRolling: !!state.isRolling,
    eventLog: Array.isArray(state.eventLog) ? state.eventLog.slice(-25) : [],
    activeEvent: state.activeEvent || null
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

  const starter = window.defaultRoomState();

  const { error } = await sb.from('rooms').insert({
    room_code: state.roomCode,
    host_id: window.clientId,
    state_json: starter
  });

  if (error) throw error;
  return await window.fetchRoom();
};

window.normalizeServerPlayers = function (players) {
  const list = Array.isArray(players) ? players : [];

  if (typeof window.ensurePlayersShape === 'function') {
    try {
      return window.ensurePlayersShape(list);
    } catch {}
  }

  return list.map((p, i) => ({
    id: p.id || i + 1,
    name: p.name || `Player ${i + 1}`,
    ownerId: p.ownerId || `player-${i + 1}`,
    position: Number.isFinite(p.position) ? p.position : 0,
    shields: Number.isFinite(p.shields) ? p.shields : 0,
    score: Number.isFinite(p.score) ? p.score : 0,
    skipped: Number.isFinite(p.skipped) ? p.skipped : 0,
    quarantined: Number.isFinite(p.quarantined) ? p.quarantined : 0,
    organs: Array.isArray(p.organs) ? p.organs : []
  }));
};

window.addRoomEvent = function (message, sound = null) {
  const event = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    message,
    sound
  };

  state.activeEvent = event;
  state.eventLog = [...(state.eventLog || []), event].slice(-25);
  state.lastCard = { text: message };
};

window.playNetworkEventSound = function (event) {
  if (!event || !event.sound) return;
  if (window.lastEventIdSeen === event.id) return;

  window.lastEventIdSeen = event.id;

  switch (event.sound) {
    case 'dice':
      window.playDiceSound?.();
      break;
    case 'correct':
      window.playCorrectSound?.();
      break;
    case 'wrong':
      window.playWrongSound?.();
      break;
    case 'skip':
      window.playMissTurnSound?.();
      break;
    case 'start':
      window.playGameStartSound?.();
      break;
    case 'move':
      window.playMoveSound?.();
      break;
  }
};

window.joinRoomStateOnly = async function () {
  const room = await window.fetchRoom();
  const roomState = room?.state_json || window.defaultRoomState();

  let players = window.normalizeServerPlayers(roomState.players);
  const existingIndex = players.findIndex((p) => p.ownerId === window.clientId);

  if (existingIndex >= 0) {
    players[existingIndex] = {
      ...players[existingIndex],
      name: state.lobbyName
    };
  } else {
    const newPlayer =
      typeof window.createBasePlayer === 'function'
        ? window.createBasePlayer(window.clientId, state.lobbyName)
        : {
            id: players.length + 1,
            name: state.lobbyName,
            ownerId: window.clientId,
            position: 0,
            shields: 0,
            score: 0,
            skipped: 0,
            quarantined: 0,
            organs: []
          };

    players.push(newPlayer);
  }

  players = window.normalizeServerPlayers(players);

  const nextState = {
    ...window.defaultRoomState(),
    ...roomState,
    players,
    activeEvent: {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      at: Date.now(),
      message: `${state.lobbyName} joined the room.`,
      sound: 'start'
    },
    eventLog: [
      ...(Array.isArray(roomState.eventLog) ? roomState.eventLog : []),
      {
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        at: Date.now(),
        message: `${state.lobbyName} joined the room.`,
        sound: 'start'
      }
    ].slice(-25)
  };

  const { error } = await sb
    .from('rooms')
    .update({
      state_json: nextState,
      updated_at: new Date().toISOString()
    })
    .eq('room_code', state.roomCode);

  if (error) throw error;

  window.applyRoomState(nextState);
};

window.applyRoomState = function (roomState) {
  const safe = { ...window.defaultRoomState(), ...(roomState || {}) };

  state.players = window.normalizeServerPlayers(safe.players);
  state.currentPlayerIndex = Math.max(
    0,
    Math.min(safe.currentPlayerIndex || 0, Math.max(0, state.players.length - 1))
  );
  state.lastRoll = safe.lastRoll ?? null;
  state.lastCard = safe.lastCard || { text: 'Roll the dice to begin.' };
  state.winner = safe.winner ?? null;
  state.feedback = safe.feedback ?? null;
  state.trivia = safe.trivia ?? null;
  state.timer = safe.timer ?? 30;
  state.isRolling = !!safe.isRolling;
  state.eventLog = Array.isArray(safe.eventLog) ? safe.eventLog : [];
  state.activeEvent = safe.activeEvent || null;
  state.onlineCount = state.players.length;
};

window.saveRoomState = async function () {
  const payload = window.serializeState();

  const { error } = await sb
    .from('rooms')
    .update({
      state_json: payload,
      updated_at: new Date().toISOString()
    })
    .eq('room_code', state.roomCode);

  if (error) throw error;
};

window.refreshFromServer = async function () {
  const room = await window.fetchRoom();
  const roomState = room?.state_json || window.defaultRoomState();

  const snapshot = JSON.stringify(roomState);
  if (snapshot === window.lastServerSnapshot) return;

  window.lastServerSnapshot = snapshot;

  const previousRolling = !!state.isRolling;
  const previousPosition = JSON.stringify((state.players || []).map(p => p.position));
  const nextPosition = JSON.stringify(((roomState.players || [])).map(p => p.position));

  window.applyRoomState(roomState);

  if (!previousRolling && previousPosition !== nextPosition && !state.trivia) {
    window.playMoveSound?.();
  }

  if (state.activeEvent) {
    window.playNetworkEventSound(state.activeEvent);
  }

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
  }, 900);
};
