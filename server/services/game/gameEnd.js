const GameModel = require("./../../models/Game");
const User = require("./../../models/User");

async function endGame(games, gameID, winner) {
  const game = games[gameID];

  if (game.currentTurnTimer) {
    clearTimeout(game.currentTurnTimer);
  }

  if (!game) return;

  const gameData = new GameModel({
    gameID,
    players: game.players.map((p) => p.username),
    boards: game.players.map((p) => ({
      username: p.username,
      board: game.boards[p.username],
    })),
    winner,
    startedAt: game.startedAt,
    endedAt: new Date(),
    logs: game.logs,
  });

  for (const player of game.players) {
    await User.updateOne(
      { username: player.username },
      { $inc: { gamesPlayed: 1, wins: player.username === winner ? 1 : 0 } },
      { upsert: true }
    );
  }

  await gameData.save();

  game.players.forEach((player) => {
    player.ws.send(
      JSON.stringify({
        type: "victory",
        payload: { winner },
      })
    );
  });

  delete games[gameID];
}

module.exports = { endGame };
