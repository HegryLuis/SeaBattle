function rebuildGameFromSaved(games, savedGame) {
  const { gameID, players, boards, logs, globalTurn } = savedGame;

  // Структура игры
  const game = {
    players: players.map((p, index) => ({
      username: p.username,
      ws: null,
      turnIndex: index,
    })),
    boards: {},
    playerTargets: {},
    playerShotsLeft: {},
    globalTurn: globalTurn ?? 0,
    maxPlayers: players.length,
    lostPlayers: new Set(players.filter((p) => p.lost).map((p) => p.username)),
    logs,
    startedAt: savedGame.createdAt,
    currentTurnTime: null,
    shotTimer: 10,
  };

  // Доски
  for (const board of boards) {
    game.boards[board.username] = {
      cells: board.cells,
    };
  }

  // Пул активных игр
  games[gameID] = game;

  console.log(`Игра ${gameID} восстановлена из сохранения.`);
}

module.exports = { rebuildGameFromSaved };
