const { endGame } = require("./gameEnd");

function handleDisconnect(games, wsClient) {
  for (const gameID in games) {
    const game = games[gameID];
    const playerIndex = game.players.findIndex((p) => p.ws === wsClient);
    if (playerIndex !== -1) {
      const username = game.players[playerIndex].username;
      game.players.splice(playerIndex, 1);
      delete game.boards[username];
      game.lostPlayers.add(username);
      game.players.forEach((player) => {
        player.ws.send(
          JSON.stringify({
            type: "playerDisconnected",
            payload: { username },
          })
        );
      });

      if (game.players.length === 1) {
        const winner = game.players[0].username;
        endGame(games, gameID, winner);
      }
      break;
    }
  }
}

module.exports = { handleDisconnect };
