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

module.exports = { markPlayerReady, addLog };
