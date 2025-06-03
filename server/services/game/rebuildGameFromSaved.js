function rebuildGameFromSaved(games, savedGame) {
  const { gameID, players, boards, logs, globalTurn } = savedGame;

  console.log("Rebuilding: globalTurn =", globalTurn); // 🔍 лог

  // Собираем структуру игры
  const game = {
    players: players.map((p, index) => ({
      username: p.username,
      ws: null, // ws нужно будет проставить при подключении
      turnIndex: index,
    })),
    boards: {},
    playerTargets: {}, // возможно нужно заполнить отдельно
    playerShotsLeft: {}, // если используешь
    globalTurn: globalTurn ?? 0,
    maxPlayers: players.length,
    lostPlayers: new Set(players.filter((p) => p.lost).map((p) => p.username)),
    logs,
    startedAt: savedGame.createdAt,
    currentTurnTime: null,
    shotTimer: 10, // или другое значение
  };

  // Заполняем доски
  for (const board of boards) {
    game.boards[board.username] = {
      cells: board.cells,
    };
  }

  // Добавляем в пул активных игр
  games[gameID] = game;

  console.log(`Игра ${gameID} восстановлена из сохранения.`);
}

module.exports = { rebuildGameFromSaved };
