window.withTimeout = function(promise, ms = 8000){
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase request timed out.')), ms)
    )
  ]);
};

window.enterRoom = async function(){
  return await window.runSafe(async () => {
    state.roomCode = (state.joinCode.trim() || state.roomCode).toUpperCase();

    if (!state.lobbyName.trim()) {
      throw new Error('Enter your name first.');
    }

    state.connectionLabel = 'Connecting Supabase...';
    window.safeRender();

    await window.withTimeout(window.ensureRoomExists());
    state.connectionLabel = 'Room ready...';
    window.safeRender();

    await window.withTimeout(window.upsertPlayerRecord());
    state.connectionLabel = 'Player added...';
    window.safeRender();

    await window.withTimeout(window.syncPlayersIntoRoomState());
    state.connectionLabel = 'Sync complete...';
    window.safeRender();

    state.entered = true;
    window.safeRender();

    await window.withTimeout(window.refreshFromServer());
    window.startPolling();

    state.connectionLabel = 'Supabase polling live';
    window.safeRender();
  }, 'Could not join room.');
};

window.copyShareLink = async function(){
  const url = `${location.origin}?room=${state.roomCode}`;
  try {
    await navigator.clipboard.writeText(url);
    state.lastCard = { text: 'Room link copied.' };
  } catch {
    state.lastCard = { text: 'Could not copy automatically.' };
  }
  window.safeRender();
};

try {
  window.initSupabase();

  const roomFromUrl = new URLSearchParams(location.search).get('room');
  if (roomFromUrl) {
    state.joinCode = roomFromUrl.toUpperCase();
    state.roomCode = state.joinCode;
  }

  setInterval(window.tickTrivia, 1000);
  window.safeRender();
} catch (error) {
  console.error(error);
  window.showFatalError(error?.message || 'Unknown startup error.');
}
