window.enterRoom = async function () {
  return await window.runSafe(async () => {
    state.roomCode = (state.joinCode.trim() || state.roomCode).toUpperCase();

    if (!state.lobbyName.trim()) {
      throw new Error('Enter your name first.');
    }

    state.connectionLabel = 'Connecting...';
    window.safeRender();

    await window.ensureRoomExists();
    await window.joinRoomStateOnly();

    state.entered = true;
    await window.startGameAudio?.();
    window.playGameStartSound?.();

    state.connectionLabel = 'Live sync active';
    window.safeRender();

    window.startPolling();
  }, 'Could not join room.');
};

window.copyShareLink = async function () {
  const url = `${location.origin}?room=${state.roomCode}`;
  try {
    await navigator.clipboard.writeText(url);
    state.lastCard = { text: 'Room link copied.' };
    window.playClick?.();
  } catch {
    state.lastCard = { text: 'Copy failed.' };
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
}
