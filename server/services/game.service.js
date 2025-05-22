const GameModel = require("./../models/Game");
const User = require("./../models/User");

async function initGames(games, ws, gameID) {
  if (!games[gameID]) {
    games[gameID] = {
      players: [],
      boards: {},
      globalTurn: 0,
      maxPlayers: parseInt(ws.playersNum) || 2,
      playerTargets: {},
      playerShotsLeft: {},
      lostPlayers: new Set(),
      logs: [],
      startedAt: null,
    };
    console.log(`Game ${gameID} created`);
  }

  const game = games[gameID];

  if (game.players.some((p) => p.username === ws.username)) {
    console.log(`Player ${ws.username} is already in the game ${gameID}`);
    return;
  }

  if (game.players.length >= game.maxPlayers) {
    ws.send(JSON.stringify({ type: "error", message: "Room is full" }));
    return;
  }

  game.players.push({ username: ws.username, ws });
  game.boards[ws.username] = ws.board;

  ws.send(
    JSON.stringify({
      type: "waitingForPlayers",
      payload: {
        playersCount: game.players.length,
        playersNeeded: game.maxPlayers,
      },
    })
  );

  if (game.players.length === game.maxPlayers) {
    startGame(games, gameID);
  }
}

function startGame(games, gameID) {
  const game = games[gameID];
  game.startedAt = new Date();

  const playersTurnIndexes = {};
  game.players.forEach((player, index) => {
    playersTurnIndexes[player.username] = index;
  });

  game.players.forEach((player) => {
    const opponents = game.players
      .filter((p) => p.username !== player.username)
      .map((p) => ({
        name: p.username,
        turnIndex: playersTurnIndexes[p.username],
      }));

    game.playerTargets[player.username] = {
      opponents: opponents.map((op) => op.name),
      currentTargetIndex: 0,
    };

    game.playerShotsLeft[player.username] = opponents.length;

    player.ws.send(
      JSON.stringify({
        type: "gameStarted",
        payload: {
          username: player.username,
          opponents,
          turnIndex: playersTurnIndexes[player.username],
          globalTurn: game.globalTurn,
        },
      })
    );
  });

  game.globalTurn = 0;
}

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

async function endGame(games, gameID, winner) {
  const game = games[gameID];

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
        type: "gameEnded",
        payload: { winner },
      })
    );
  });

  delete games[gameID];
}

function markPlayerReady(games, payload) {
  const game = games[payload.gameID];
  if (!game) return;

  const player = game.players.find((p) => p.username === payload.username);
  if (!player) return;

  player.isReady = true;

  if (game.players.every((p) => p.isReady)) {
    startGame(games, payload.gameID);
  }
}

function addLog(games, payload) {
  const game = games[payload.gameID];
  if (!game) return;

  game.logs.push(payload.log);
}

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

module.exports = {
  initGames,
  processShot,
  markPlayerReady,
  addLog,
  handleDisconnect,
  endGame,
};
