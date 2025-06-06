function addLog(games, payload) {
  const game = games[payload.gameID];
  if (!game) return;

  game.logs.push(payload.log);
}

function markPlayerReady(games, payload) {
  const game = games[payload.gameID];
  if (!game) return;

  const player = game.players.find((p) => p.username === payload.username);
  if (!player) return;

  player.isReady = true;

  if (game.players.every((p) => p.isReady)) {
    startGame(games, payload.gameID);
  }
}

function setTurnTimeout(game, gameID, games) {
  clearTimeout(game.currentTurnTimer);

  const duration = game.shotTimer * 1000;
  console.log(`\n\nsetTurnTimeout(game.duration) = ${duration}\n\n`);

  game.currentTurnTimer = setTimeout(() => {
    const currentPlayer = game.players[game.globalTurn];

    if (!currentPlayer || game.lostPlayers.has(currentPlayer.username)) return;

    game.players.forEach((player) => {
      player.ws.send(
        JSON.stringify({
          type: "turnTimeout",
          payload: { username: currentPlayer.username },
        })
      );
    });

    game.playerTargets[currentPlayer.username].currentTargetIndex =
      game.playerTargets[currentPlayer.username].opponents.length;

    do {
      game.globalTurn = (game.globalTurn + 1) % game.players.length;
    } while (game.lostPlayers.has(game.players[game.globalTurn].username));

    const nextPlayer = game.players[game.globalTurn].username;
    game.playerTargets[nextPlayer].currentTargetIndex = 0;
    const targetData = game.playerTargets[nextPlayer];
    let found = false;

    for (let i = 0; i < targetData.opponents.length; i++) {
      if (!game.lostPlayers.has(targetData.opponents[i])) {
        targetData.currentTargetIndex = i;
        found = true;
        break;
      }
    }

    game.players.forEach((player) => {
      player.ws.send(
        JSON.stringify({
          type: "changeTurn",
          payload: { globalTurn: game.globalTurn },
        })
      );
    });

    setTurnTimeout(game, gameID, games);
  }, duration);
}

module.exports = { markPlayerReady, addLog, setTurnTimeout };
