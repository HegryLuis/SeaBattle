const GameModel = require("../models/Game");
const User = require("../models/User");

async function saveGame(gameID, game, winner) {
  const gameData = new GameModel({
    gameID,
    players: game.players.map((p) => p.username),
    boards: game.players.map((p) => ({
      username: p.username,
      cells: game.boards[p.username].cells,
    })),
    winner,
    startedAt: game.startedAt || new Date(Date.now() - 1000 * 60 * 5),
    endedAt: new Date(),
    logs: game.logs || [],
  });

  for (const player of game.players) {
    const isWinner = player.username.toLowerCase() === winner.toLowerCase();

    await User.findOneAndUpdate(
      { username: player.username },
      {
        $inc: {
          totalGames: isWinner ? 1 : 1,
          wins: isWinner ? 1 : 0,
        },
      },
      { new: true }
    );
  }

  await gameData.save();
  console.log(`Game ${gameID} saved to DB`);
}

module.exports = { saveGame };
