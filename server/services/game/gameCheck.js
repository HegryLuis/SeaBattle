function checkVictory(username, game) {
  const opponents = game.playerTargets[username].opponents;
  return opponents.every((enemyName) => {
    const board = game.boards[enemyName];
    return board.cells.every((row) =>
      row.every((cell) => cell.mark?.name !== "ship")
    );
  });
}

function checkDefeat(username, game) {
  const board = game.boards[username];
  return board.cells.every((row) =>
    row.every((cell) => cell.mark?.name !== "ship")
  );
}

module.exports = { checkDefeat, checkVictory };
