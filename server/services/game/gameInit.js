const { startGame } = require("./gameStart");

async function initGames(games, ws, gameID) {
  if (!games[gameID]) {
    games[gameID] = {
      players: [],
      boards: {},
      globalTurn: 0,
      maxPlayers: parseInt(ws.playersNum) || 2,
      playerTargets: {},
      playerShotsLeft: {},
      lostPlayers: new Set(),
      logs: [],
      startedAt: null,
      currentTurnTime: null,
      shotTimer: ws.shotTimer || 10,
    };
    console.log(`Game ${gameID} created`);
  }

  const game = games[gameID];

  if (game.players.some((p) => p.username === ws.username)) {
    console.log(`Player ${ws.username} is already in the game ${gameID}`);
    return;
  }

  if (game.players.length >= game.maxPlayers) {
    ws.send(JSON.stringify({ type: "error", message: "Room is full" }));
    return;
  }

  game.players.push({ username: ws.username, ws });
  game.boards[ws.username] = ws.board;

  ws.send(
    JSON.stringify({
      type: "waitingForPlayers",
      payload: {
        playersCount: game.players.length,
        playersNeeded: game.maxPlayers,
      },
    })
  );

  if (game.players.length === game.maxPlayers) {
    startGame(games, gameID);
  }
}

module.exports = { initGames };
