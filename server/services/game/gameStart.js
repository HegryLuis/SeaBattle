const { setTurnTimeout } = require("./gameUtils");

function startGame(games, gameID) {
  const game = games[gameID];
  game.startedAt = new Date();

  const playersTurnIndexes = {};
  game.players.forEach((player, index) => {
    playersTurnIndexes[player.username] = index;
  });

  game.players.forEach((player) => {
    const opponents = game.players
      .filter((p) => p.username !== player.username)
      .map((p) => ({
        name: p.username,
        turnIndex: playersTurnIndexes[p.username],
      }));

    game.playerTargets[player.username] = {
      opponents: opponents.map((op) => op.name),
      currentTargetIndex: 0,
    };

    game.playerShotsLeft[player.username] = opponents.length;

    player.ws.send(
      JSON.stringify({
        type: "gameStarted",
        payload: {
          username: player.username,
          opponents,
          turnIndex: playersTurnIndexes[player.username],
          globalTurn: game.globalTurn,
          shotTimer: game.shotTimer,
        },
      })
    );
  });

  game.globalTurn = 0;

  setTurnTimeout(game, gameID, games);
}

module.exports = { startGame };
