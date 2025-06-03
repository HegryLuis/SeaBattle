const { endGame } = require("./gameEnd");

function handleDisconnect(games, wsClient) {
  for (const gameID in games) {
    const game = games[gameID];
    const player = game.players.find((p) => p.ws === wsClient);

    if (player) {
      console.log(`Игрок ${player.username} отключился. Ждём 10 секунд...`);
      player.connected = false; // <--- Новый флаг
      const username = player.username;

      // Таймер на 10 секунд: ждём переподключения
      setTimeout(() => {
        const stillDisconnected = !player.connected;

        if (stillDisconnected) {
          console.log(`Игрок ${username} не вернулся — считаем выбывшим`);

          game.players = game.players.filter((p) => p.username !== username);
          delete game.boards[username];
          game.lostPlayers.add(username);

          game.players.forEach((p) => {
            if (p.ws && p.ws.readyState === 1) {
              p.ws.send(
                JSON.stringify({
                  type: "playerDisconnected",
                  payload: { username },
                })
              );
            }
          });

          // Проверим, остался ли один — победа
          if (game.players.length === 1) {
            const winner = game.players[0].username;
            endGame(games, gameID, winner);
          }
        } else {
          console.log(`Игрок ${username} переподключился — продолжаем игру`);
        }
      }, 10000); // 10 секунд ожидания

      break;
    }
  }
}

module.exports = { handleDisconnect };
