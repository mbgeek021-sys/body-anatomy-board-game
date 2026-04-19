window.enterRoom = async function(){
  return await window.runSafe(async () => {
    state.roomCode = (state.joinCode.trim() || state.roomCode).toUpperCase();

    if (!state.lobbyName.trim()) {
      throw new Error('Enter your name first.');
    }

    state.connectionLabel = 'Connecting Supabase...';
    window.safeRender();

    await window.ensureRoomExists();
    state.connectionLabel = 'Room ready...';
    window.safeRender();

    await window.upsertPlayerRecord();
    state.connectionLabel = 'Player added...';
    window.safeRender();

    await window.syncPlayersIntoRoomState();
    state.connectionLabel = 'Syncing room...';
    window.safeRender();

    await window.refreshFromServer();

    state.entered = true;
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
