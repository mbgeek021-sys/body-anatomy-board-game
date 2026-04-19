window.enterRoom = async function(){
  await window.runSafe(async () => {
    state.roomCode = (state.joinCode.trim() || state.roomCode).toUpperCase();
    if (!state.lobbyName.trim()) throw new Error('Enter your name first.');
    state.entered = true;
    state.connectionLabel = 'Connecting Supabase...';
    window.safeRender();
    await window.ensureRoomExists();
    await window.upsertPlayerRecord();
    await window.syncPlayersIntoRoomState();
    await window.refreshFromServer();
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
