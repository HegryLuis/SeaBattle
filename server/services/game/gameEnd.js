const GameModel = require("./../../models/Game");
const User = require("./../../models/User");
const { saveGame } = require("./../dbService");
const { deleteGameProgress } = require("./gameInProgress");

async function endGame(games, gameID, winner) {
  const game = games[gameID];

  if (game.currentTurnTimer) {
    clearTimeout(game.currentTurnTimer);
  }

  await saveGame(gameID, game, winner);

  game.players.forEach((player) => {
    player.ws.send(
      JSON.stringify({
        type: "victory",
        payload: { winner },
      })
    );
  });

  await deleteGameProgress(gameID);
  delete games[gameID];
}

module.exports = { endGame };
