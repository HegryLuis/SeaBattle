const WebSocket = require("ws");

const PORT = 4000;
const games = {}; // { gameID: { players: [], boards: {}, turnIndex: 0 } }

function start() {
  const wss = new WebSocket.Server({ port: PORT }, () => {
    console.log(`WebSocket server started on port ${PORT}`);
  });

  wss.on("connection", (wsClient) => {
    wsClient.on("message", async (message) => {
      const req = JSON.parse(message.toString());

      if (req.event === "connect") {
        wsClient.username = req.payload.username;
        wsClient.playersNum = req.payload.playersNum;
        wsClient.board = req.payload.board;
        initGames(wsClient, req.payload.gameID);
      }

      if (req.event === "shoot") {
        processShot(req.payload);
      }

      if (req.event === "ready") {
        markPlayerReady(req.payload);
      }
    });

    wsClient.on("close", () => {
      Object.keys(games).forEach((gameID) => {
        games[gameID].players = games[gameID].players.filter(
          (p) => p.ws !== wsClient
        );

        if (games[gameID].players.length === 0) {
          delete games[gameID]; // Delete empty game
          console.log(`Game ${gameID} deleted`);
        }
      });
    });
  });

  function initGames(ws, gameID) {
    if (!games[gameID]) {
      games[gameID] = {
        players: [],
        boards: {},
        globalTurn: 0,
        maxPlayers: parseInt(ws.playersNum) || 2,
        playerTargets: {},
      };
      console.log(`Game ${gameID} created`);
    }

    console.log(`Adding player ${ws.username} to game ${gameID}`);
    console.log(
      "Current players in game:",
      games[gameID].players.map((p) => p.username)
    );

    const game = games[gameID];

    if (game.players.some((player) => player.username === ws.username)) {
      console.log(`Player ${ws.username} is already in the game ${gameID}`);

      return;
    }

    if (game.players.length >= 4) {
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
      startGame(gameID);
    }
  }

  function startGame(gameID) {
    const game = games[gameID];

    console.log(
      `🔹 Starting game ${gameID} with players:`,
      game.players.map((p) => p.username)
    );

    const playersTurnIndexes = {};
    game.players.forEach((player, index) => {
      playersTurnIndexes[player.username] = index;
    });

    game.players.forEach((player, index) => {
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
      console.log(`🔸 Sending "gameStarted" to ${player.username}`);

      // console.log(`\n\nInformation: \n\tPlayer name : ${player.username}\n
      //     Opponents : ${JSON.stringify(opponents, null, 2)}\n
      //     Turn Index : ${index}\n
      //   `);

      // console.log("🔼 Отправка gameStarted:", {
      //   type: "gameStarted",
      //   payload: {
      //     username: player.username,
      //     opponents,
      //     turnIndex: index,
      //     globalTurn: game.globalTurn,
      //   },
      // });

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

  function processShot({ username, x, y, gameID, target }) {
    const game = games[gameID];
    if (!game) return;

    const enemyBoard = game.boards[target];
    if (!enemyBoard) return;

    const cell = enemyBoard.cells[y][x];

    if (!cell) {
      console.log(`Cell[${y}][${x}] is not found`);
      return;
    }
    if (cell?.mark?.name === "miss" || cell?.mark?.name === "hit") {
      console.log("You have already shot in this cell ");
      return;
    }
    const isHit = cell?.mark?.name === "ship";

    if (!cell.mark) {
      cell.mark = { name: "empty" }; // Add empty mark
    }

    cell.mark.name = isHit ? "hit" : "miss";

    game.players.forEach((player) => {
      // console.log(`${player.username}`, "🔼 Отправка gameStarted:", {
      //   type: "hit/miss",
      //   payload: { shooter: username, target, x, y },
      // });

      player.ws.send(
        JSON.stringify({
          type: isHit ? "hit" : "miss",
          payload: { shooter: username, target, x, y },
        })
      );
    });

    game.globalTurn = (game.globalTurn + 1) % game.players.length;

    game.players.forEach((player) => {
      player.ws.send(
        JSON.stringify({
          type: "changeTurn",
          payload: { globalTurn: game.globalTurn },
        })
      );
    });
  }

  function endGame(gameID, winner) {
    games[gameID].players.forEach((player) => {
      player.ws.send(JSON.stringify({ type: "victory", payload: { winner } }));
    });

    delete games[gameID];
  }
}

start();

// if (checkVictory(gameID, target)) {
//   endGame(gameID, username);
// } else {
// const targetInfo = game.playerTargets[username];

// if (!isHit) {
//   targetInfo.currentTargetIndex++;

//   if (targetInfo.currentTargetIndex >= targetInfo.opponents.length) {
//     targetInfo.currentTargetIndex = 0;
//     game.globalTurn = (game.globalTurn + 1) % game.players.length;
//   }

//   game.players.forEach((player) => {
//     player.ws.send(
//       JSON.stringify({
//         type: "changeTurn",
//         payload: { globalTurn: game.globalTurn },
//       })
//     );
//   });
// }
// }

// function checkVictory(gameID, target) {
// const board = games[gameID].boards.cells[target];
// if (!board) return false;
// return board.every((row) =>
//   row.every((cell) => cell.mark?.name !== "ship")
// );
// }
