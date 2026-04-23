(function () {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const TRIVIA = [
    {
      category: "Bones",
      q: "How many bones are in the adult human body?",
      choices: ["206", "180", "250", "300"],
      a: "206"
    },
    {
      category: "Heart",
      q: "How many chambers does the heart have?",
      choices: ["2", "3", "4", "5"],
      a: "4"
    },
    {
      category: "Brain",
      q: "Which organ controls the nervous system?",
      choices: ["Liver", "Brain", "Lung", "Kidney"],
      a: "Brain"
    },
    {
      category: "Muscles",
      q: "Which muscle helps breathing?",
      choices: ["Diaphragm", "Biceps", "Quadriceps", "Deltoid"],
      a: "Diaphragm"
    },
    {
      category: "Blood",
      q: "Red blood cells carry what?",
      choices: ["Oxygen", "Sugar", "Water", "Fat"],
      a: "Oxygen"
    }
  ];

  function getPlayers() {
    if (!Array.isArray(window.state.players)) window.state.players = [];
    return window.state.players;
  }

  function getCurrentPlayer() {
    const list = getPlayers();
    if (!list.length) return null;

    if (typeof window.state.currentPlayerIndex !== "number") {
      window.state.currentPlayerIndex = 0;
    }

    if (window.state.currentPlayerIndex < 0 || window.state.currentPlayerIndex >= list.length) {
      window.state.currentPlayerIndex = 0;
    }

    return list[window.state.currentPlayerIndex] || null;
  }

  function getBoardSpacesSafe() {
    if (typeof window.getBoardSpaces === "function") {
      const spaces = window.getBoardSpaces();
      return Array.isArray(spaces) ? spaces : [];
    }
    return [];
  }

  function getMaxPosition() {
    return Math.max(0, getBoardSpacesSafe().length - 1);
  }

  function rerender() {
    if (typeof window.safeRender === "function") {
      window.safeRender();
    }
  }

  function addLog(message) {
    if (!Array.isArray(window.state.eventLog)) window.state.eventLog = [];
    window.state.eventLog.push({
      id: Date.now() + Math.random(),
      message
    });
  }

  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getTileType(position) {
    const spaces = getBoardSpacesSafe();
    const tile = spaces[position];
    return tile ? tile.type : "normal";
  }

  async function movePlayer(player, steps) {
    const spaces = getBoardSpacesSafe();
    const max = getMaxPosition();

    for (let i = 0; i < steps; i++) {
      player.position += 1;
      if (player.position > max) player.position = max;

      const currentSpace = spaces[player.position];

      if (currentSpace && typeof window.createTrailAt === "function") {
        window.createTrailAt(currentSpace);
      }

      if (typeof window.pulseLanding === "function") {
        window.pulseLanding(player.position);
      }

      rerender();
      await wait(220);
    }
  }

  async function moveBackPlayer(player, steps) {
    const spaces = getBoardSpacesSafe();

    for (let i = 0; i < steps; i++) {
      player.position -= 1;
      if (player.position < 0) player.position = 0;

      const currentSpace = spaces[player.position];

      if (currentSpace && typeof window.createTrailAt === "function") {
        window.createTrailAt(currentSpace);
      }

      if (typeof window.pulseLanding === "function") {
        window.pulseLanding(player.position);
      }

      rerender();
      await wait(220);
    }
  }

  async function nextTurn() {
    const list = getPlayers();
    if (!list.length) return;
    window.state.currentPlayerIndex = (window.state.currentPlayerIndex + 1) % list.length;
    rerender();
  }

  async function triggerTrivia(player) {
    const q = randomItem(TRIVIA);

    window.state.trivia = {
      category: q.category,
      q: q.q,
      choices: q.choices,
      answer: q.a,
      playerId: player.id
    };

    window.state.timer = 20;
    rerender();

    clearInterval(window.__triviaTimer);

    window.__triviaTimer = setInterval(async function () {
      window.state.timer -= 1;

      if (window.state.timer <= 0) {
        clearInterval(window.__triviaTimer);
        window.state.trivia = null;
        window.state.feedback = {
          ok: false,
          text: `${player.name} ran out of time.`
        };
        window.state.lastCard = { text: `${player.name} ran out of time.` };
        addLog(`${player.name} ran out of time.`);
        rerender();
        await wait(250);
        await nextTurn();
      } else {
        rerender();
      }
    }, 1000);
  }

  window.submitTrivia = async function (choice) {
    if (!window.state.trivia) return;

    clearInterval(window.__triviaTimer);

    const player = getCurrentPlayer();
    if (!player) {
      window.state.trivia = null;
      rerender();
      return;
    }

    const correct = choice === window.state.trivia.answer;

    if (correct) {
      player.score = (player.score || 0) + 2;
      window.state.feedback = {
        ok: true,
        text: `${player.name} answered correctly! +2 points.`
      };
      window.state.lastCard = { text: `${player.name} answered correctly.` };
      addLog(`${player.name} answered correctly.`);
      window.state.trivia = null;
      rerender();
      await wait(250);
      await movePlayer(player, 1);
    } else {
      window.state.feedback = {
        ok: false,
        text: `${player.name} answered incorrectly.`
      };
      window.state.lastCard = { text: `${player.name} answered incorrectly.` };
      addLog(`${player.name} answered incorrectly.`);
      window.state.trivia = null;
      rerender();
    }

    await wait(250);
    await nextTurn();
  };

  async function resolveLanding(player) {
    if (player.position >= getMaxPosition()) {
      window.state.feedback = {
        ok: true,
        text: `${player.name} reached the Brain and wins!`
      };
      window.state.lastCard = { text: `${player.name} reached the Brain and wins!` };
      addLog(`${player.name} wins the game!`);
      rerender();
      return;
    }

    const type = getTileType(player.position);

    if (type === "health") {
      player.score = (player.score || 0) + 1;
      window.state.feedback = {
        ok: true,
        text: `${player.name} landed on a helpful tile. +1 point.`
      };
      window.state.lastCard = { text: `${player.name} gained 1 point.` };
      addLog(`${player.name} gained 1 point.`);
      rerender();
      await wait(250);
      await nextTurn();
      return;
    }

    if (type === "risk") {
      player.score = Math.max(0, (player.score || 0) - 1);
      window.state.feedback = {
        ok: false,
        text: `${player.name} landed on a risk tile. -1 point.`
      };
      window.state.lastCard = { text: `${player.name} lost 1 point.` };
      addLog(`${player.name} lost 1 point.`);
      rerender();
      await wait(250);
      await nextTurn();
      return;
    }

    if (type === "chance") {
      window.state.feedback = {
        ok: true,
        text: `${player.name} got lucky. Move forward 2.`
      };
      window.state.lastCard = { text: `${player.name} moves forward 2.` };
      addLog(`${player.name} moves forward 2.`);
      rerender();
      await wait(250);
      await movePlayer(player, 2);
      await wait(200);
      await nextTurn();
      return;
    }

    if (type === "quarantine") {
      player.skip = (player.skip || 0) + 1;
      window.state.feedback = {
        ok: false,
        text: `${player.name} hit quarantine. Miss next turn.`
      };
      window.state.lastCard = { text: `${player.name} will miss next turn.` };
      addLog(`${player.name} will miss next turn.`);
      rerender();
      await wait(250);
      await nextTurn();
      return;
    }

    await triggerTrivia(player);
  }

  window.handleRoll = async function () {
    const player = getCurrentPlayer();
    if (!player || window.state.isRolling) return;

    if ((player.skip || 0) > 0) {
      player.skip -= 1;
      window.state.feedback = {
        ok: false,
        text: `${player.name} missed a turn.`
      };
      window.state.lastCard = { text: `${player.name} missed a turn.` };
      addLog(`${player.name} missed a turn.`);
      rerender();
      await wait(300);
      await nextTurn();
      return;
    }

    window.state.isRolling = true;
    rerender();

    const roll = Math.floor(Math.random() * 6) + 1;

    if (typeof window.showDiceRoll === "function") {
      await window.showDiceRoll(roll);
    }

    window.state.lastRoll = roll;
    window.state.lastCard = { text: `${player.name} rolled ${roll}.` };
    addLog(`${player.name} rolled ${roll}.`);

    await movePlayer(player, roll);

    window.state.isRolling = false;
    rerender();

    await wait(150);
    await resolveLanding(player);
  };

  window.setSoundLevels = function () {
    /* safe no-op */
  };
})();
