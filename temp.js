function processShot(games, { username, x, y, gameID }) {
  const game = games[gameID];
  if (!game) return;

  if (game.lostPlayers.has(username)) {
    console.log(`⚠️ Player ${username} tried to shoot but already lost.`);
    return;
  }

  if (game.players[game.globalTurn].username !== username) return;

  const playerTargetData = game.playerTargets[username];
  let target = playerTargetData.opponents[playerTargetData.currentTargetIndex];

  // Skip lost opponents
  while (game.lostPlayers.has(target)) {
    playerTargetData.currentTargetIndex++;

    if (
      playerTargetData.currentTargetIndex >= playerTargetData.opponents.length
    ) {
      playerTargetData.currentTargetIndex = 0;

      do {
        game.globalTurn = (game.globalTurn + 1) % game.players.length;
      } while (game.lostPlayers.has(game.players[game.globalTurn].username));

      game.players.forEach((player) => {
        player.ws.send(
          JSON.stringify({
            type: "changeTurn",
            payload: { globalTurn: game.globalTurn },
          })
        );
      });

      return;
    }

    target = playerTargetData.opponents[playerTargetData.currentTargetIndex];
  }

  const enemyBoard = game.boards[target];
  if (!enemyBoard) return;

  const cell = enemyBoard.cells[y][x];
  if (!cell) {
    console.log(`Cell[${y}][${x}] not found`);
    return;
  }

  if (cell?.mark?.name === "miss" || cell?.mark?.name === "hit") {
    console.log("Cell already shot");
    return;
  }

  const isHit = cell?.mark?.name === "ship";
  if (!cell.mark) {
    cell.mark = { name: "empty" };
  }
  cell.mark.name = isHit ? "hit" : "miss";

  game.players.forEach((player) => {
    player.ws.send(
      JSON.stringify({
        type: isHit ? "hit" : "miss",
        payload: { shooter: username, target, x, y },
      })
    );
  });

  if (checkDefeat(target, game)) {
    console.log(`🔴 Player ${target} has lost`);

    const losingPlayer = game.players.find((p) => p.username === target);
    if (losingPlayer) {
      losingPlayer.ws.send(JSON.stringify({ type: "youLost" }));
    }

    game.lostPlayers.add(target);

    game.players.forEach((player) => {
      player.ws.send(
        JSON.stringify({
          type: "playerLost",
          payload: { username: target },
        })
      );
    });

    const alivePlayers = game.players.filter(
      (p) => !game.lostPlayers.has(p.username)
    );
    if (alivePlayers.length === 1) {
      const winner = alivePlayers[0].username;
      console.log(`🏆 Auto Victory - ${winner}`);
      endGame(games, gameID, winner);
      return;
    }
  }

  if (checkVictory(username, game)) {
    console.log(`🏆 Player ${username} has won`);
    endGame(games, gameID, username);
    return;
  }

  if (checkDefeat(username, game)) {
    console.log(`🔴 Player ${username} has lost (after shot)`);

    const losingPlayer = game.players.find((p) => p.username === username);
    if (losingPlayer) {
      losingPlayer.ws.send(JSON.stringify({ type: "youLost" }));
    }

    game.lostPlayers.add(username);

    game.players.forEach((player) => {
      player.ws.send(
        JSON.stringify({
          type: "playerLost",
          payload: { username },
        })
      );
    });

    const alivePlayers = game.players.filter(
      (p) => !game.lostPlayers.has(p.username)
    );
    if (alivePlayers.length === 1) {
      const winner = alivePlayers[0].username;
      console.log(`🏆 Auto Victory - ${winner}`);
      endGame(games, gameID, winner);
      return;
    }

    return;
  }

  playerTargetData.currentTargetIndex++;

  if (
    playerTargetData.currentTargetIndex >= playerTargetData.opponents.length
  ) {
    playerTargetData.currentTargetIndex = 0;

    do {
      game.globalTurn = (game.globalTurn + 1) % game.players.length;
    } while (game.lostPlayers.has(game.players[game.globalTurn].username));

    game.players.forEach((player) => {
      player.ws.send(
        JSON.stringify({
          type: "changeTurn",
          payload: { globalTurn: game.globalTurn },
        })
      );
    });
  }
}
