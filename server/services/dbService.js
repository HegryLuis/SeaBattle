const GameModel = require("../models/Game");
const User = require("../models/User");
const { rebuildGameFromSaved } = require("./game/rebuildGameFromSaved");
const GameInProgress = require("../models/GameInProgress");

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

async function loadGameProgress(gameID) {
  return await GameInProgress.findOne({ gameID }).lean();
}

async function loadInProgressGame(gameID) {
  return await GameInProgress.findOne({ gameID }).lean();
}

async function loadFinishedGame(gameID) {
  return await GameModel.findOne({ gameID })
    .populate("players", "username")
    .lean();
}

async function handleLoadGame(ws, payload, games) {
  const { gameID, username } = payload;
  console.log(`handleLoadGame вызван для ${username} в игре ${gameID}`);

  try {
    // Попытка загрузить игру из активных (в процессе)
    let savedGame = await loadInProgressGame(gameID);

    // Если не нашли в прогрессе — пытаемся загрузить завершённую
    if (!savedGame) {
      savedGame = await loadFinishedGame(gameID);
      if (!savedGame) {
        ws.send(
          JSON.stringify({
            type: "error",
            payload: { message: "Game not found" },
          })
        );
        return;
      }
      // Игра завершена — можно отправить сообщение или особый тип для клиента
      ws.send(
        JSON.stringify({
          type: "gameFinished",
          payload: savedGame,
        })
      );
      return; // выходим — восстановление игры из активных не требуется
    }

    // Если игра в процессе и её нет в games — восстанавливаем
    if (!games[gameID]) {
      rebuildGameFromSaved(games, savedGame);
    }

    // Присоединяем WebSocket к игроку
    const game = games[gameID];
    const player = game.players.find((p) => p.username === username);
    if (player) {
      player.ws = ws;
      player.connected = true; // 👈 игрок снова онлайн
      ws.username = player.username; // 👈 восстанавливаем имя на клиенте
      ws.playersNum = game.players.length;
      console.log(`Игрок ${username} переподключился к игре ${gameID}`);
    }

    const playerIndex = game.players.findIndex((p) => p.username === username);

    ws.send(
      JSON.stringify({
        type: "loadGame",
        payload: {
          gameID,
          globalTurn: game.globalTurn,
          turnIndex: playerIndex,
          players: game.players.map((p) => ({
            username: p.username,
            lost: game.lostPlayers.has(p.username),
          })),
          boards: Object.entries(game.boards).map(([username, board]) => {
            // username,
            // cells: board.cells,
            const cells = JSON.parse(JSON.stringify(board.cells));

            if (username !== payload.username) {
              for (let row of cells) {
                for (let cell of row) {
                  if (cell.mark?.name === "ship") {
                    cell.mark = null;
                  }
                }
              }
            }

            return {
              username,
              cells,
            };
          }),
          logs: game.logs,
          shotTime: game.shotTime,
          startedAt: game.startedAt,
        },
      })
    );
  } catch (error) {
    console.error("Ошибка при загрузке игры:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        payload: { message: "Server error loading game" },
      })
    );
  }
}

module.exports = {
  saveGame,
  handleLoadGame,
  loadInProgressGame,
  loadFinishedGame,
};
