window.withTimeout = function (promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timed out')), ms)
    )
  ]);
};

window.enterRoom = async function () {
  return await window.runSafe(async () => {
    state.roomCode = (state.joinCode.trim() || state.roomCode).toUpperCase();

    if (!state.lobbyName.trim()) {
      throw new Error('Enter your name first.');
    }

    state.connectionLabel = 'Connecting...';
    window.safeRender();

    await window.withTimeout(window.ensureRoomExists());

    state.connectionLabel = 'Room ready...';
    window.safeRender();

    await window.withTimeout(window.upsertPlayerRecord());

    state.connectionLabel = 'Entering room...';
    window.safeRender();

    state.entered = true;
    state.players = [window.createBasePlayer(window.clientId, state.lobbyName)];
    state.onlineCount = 1;
    window.safeRender();

    window.startPolling();

    state.connectionLabel = 'Live sync active';
    window.safeRender();
  }, 'Could not join room.');
};

window.copyShareLink = async function () {
  const url = `${location.origin}?room=${state.roomCode}`;
  try {
    await navigator.clipboard.writeText(url);
    state.lastCard = { text: 'Room link copied.' };
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
