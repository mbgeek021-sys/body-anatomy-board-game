window.enterRoom = async function () {
  state.roomCode = (state.joinCode.trim() || state.roomCode).toUpperCase();

  if (!state.lobbyName.trim()) {
    state.connectionLabel = 'Enter your name first.';
    window.safeRender();
    return;
  }

  state.connectionLabel = 'Entering game...';

  state.entered = true;

  state.players = [
    window.createBasePlayer(window.clientId, state.lobbyName)
  ];

  state.onlineCount = 1;
  state.currentPlayerIndex = 0;
  state.lastCard = { text: 'Roll the dice to begin.' };

  window.safeRender();

  window.runSafe(async () => {
    await window.ensureRoomExists();
    await window.joinRoomStateOnly();
    await window.refreshFromServer();
    window.startPolling();
    state.connectionLabel = 'Live sync active';
    window.safeRender();
  }, 'Background sync failed.');
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
