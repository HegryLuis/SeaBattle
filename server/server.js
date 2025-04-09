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
        initGames(wsClient, req.payload.gameID);
      }

      if (req.event === "shoot") {
        processShot(req.payload);
      }

      if (req.event === "ready") {
        markPlayerReady(req.payload);
      }

      //broadcast(req);
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
        turnIndex: 0,
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

      console.log(`\n\nInformation: \n\tPlayer name : ${player.username}\n
          Opponents : ${JSON.stringify(opponents, null, 2)}\n
          Turn Index : ${index}\n
        `);

      console.log("🔼 Отправка gameStarted:", {
        type: "gameStarted",
        payload: {
          username: player.username,
          opponents,
          turnIndex: index,
        },
      });

      player.ws.send(
        JSON.stringify({
          type: "gameStarted",
          payload: {
            username: player.username,
            opponents,
            turnIndex: index,
          },
        })
      );
    });

    game.turnIndex = 0;
  }

  function processShot({ username, x, y, gameID, target }) {
    const game = games[gameID];
    if (!game) return;

    const enemyBoard = game.boards[target];
    if (!enemyBoard) return;

    const cell = enemyBoard[y][x];
    const isHit = cell?.mark?.name === "ship";

    if (!cell.mark) {
      console.log(`Cell at (${x}, ${y}) has no mark! Creating default mark.`);
      cell.mark = { name: "empty" }; // Add empty mark
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

    if (checkVictory(gameID, target)) {
      endGame(gameID, username);
    } else {
      // nextTurn(gameID);
      const targetInfo = game.playerTargets[username];

      if (!isHit) {
        targetInfo.currentTargetIndex++;

        if (targetInfo.currentTargetIndex >= targetInfo.opponents.length) {
          targetInfo.currentTargetIndex = 0;
          game.turnIndex = (game.turnIndex + 1) % game.players.length;
        }

        game.players.forEach((player) => {
          player.ws.send(
            JSON.stringify({
              type: "changeTurn",
              payload: { turnIndex: game.turnIndex },
            })
          );
        });
      }
    }
  }

  function checkVictory(gameID, target) {
    const board = games[gameID].boards[target];
    if (!board) return false;
    return board.every((row) =>
      row.every((cell) => cell.mark?.name !== "ship")
    );
  }

  function endGame(gameID, winner) {
    games[gameID].players.forEach((player) => {
      player.ws.send(JSON.stringify({ type: "victory", payload: { winner } }));
    });

    delete games[gameID];
  }

  function nextTurn(gameID) {
    const game = games[gameID];
    game.turnIndex = (game.turnIndex + 1) % game.players.length;

    game.players.forEach((player) => {
      player.ws.send(
        JSON.stringify({
          type: "changeTurn",
          payload: { turnIndex: game.turnIndex },
        })
      );
    });
  }

  // function broadcast(params, wsClient) {
  //   console.time("broadcast");

  //   let res;

  //   const { username, gameID, board } = params.payload;

  //   games[gameID].players.forEach((client) => {
  //     switch (params.event) {
  //       case "connect":
  //         if (!games[gameID]) {
  //           games[gameID] = {
  //             players: [],
  //             boards: {},
  //           };
  //         }

  //         if (!games[gameID].players.find((p) => p.username === username)) {
  //           games[gameID].players.push({ username, ws: wsClient });
  //         }

  //         games[gameID].boards[username] = board.cells;

  //         res = {
  //           type: "connectToPlay",
  //           payload: {
  //             success: true,
  //             enemyName: games[gameID].players.find(
  //               (p) => p.username !== username
  //             )?.username,
  //             username: username,
  //             isMyTurn: games[gameID].players[0].username === username,
  //           },
  //         };
  //         break;

  //       case "ready":
  //         games[gameID].boards[username] = params.payload.board;

  //         res = {
  //           type: "readyToPlay",
  //           payload: {
  //             canStart: Object.keys(games[gameID].boards).length === 2,
  //             username,
  //           },
  //         };
  //         break;

  //       case "shoot":
  //         if (!games[gameID]) {
  //           console.log(`Game ${gameID} not found!`);
  //           return;
  //         }

  //         const enemy = games[gameID].players.find(
  //           (player) => player.username !== username
  //         );
  //         if (!enemy) {
  //           console.log("Enemy not found!");
  //           return;
  //         }

  //         const { x, y } = params.payload;

  //         const enemyBoard = games[gameID].boards?.[enemy.username];
  //         if (!enemyBoard) {
  //           console.log(`Board for enemy ${enemy.username} not found!`);
  //           return;
  //         }

  //         const cell = enemyBoard[y]?.[x]; // Get cell

  //         if (!cell) {
  //           console.log(`Cell at (${x}, ${y}) not found!`);
  //           return;
  //         }

  //         if (!cell.mark) {
  //           console.log(
  //             `Cell at (${x}, ${y}) has no mark! Creating default mark.`
  //           );
  //           cell.mark = { name: "empty" }; // Add empty mark
  //         }

  //         const isPerfectHit =
  //           cell?.mark?.name === "ship" || cell?.mark?.name === "hit"; // Shoot check

  //         if (cell.mark) {
  //           cell.mark.name = isPerfectHit ? "hit" : "miss";
  //         }

  //         // Victory search
  //         // если больше нет кораблей -> вывести на консоль имя победителя
  //         let hasShipsLeft = false;
  //         for (let row of enemyBoard) {
  //           for (let cell of row) {
  //             if (cell.mark?.name === "ship") {
  //               hasShipsLeft = true;
  //               break;
  //             }
  //           }
  //         }

  //         if (!hasShipsLeft) {
  //           console.log(`\nPlayer ${username} wins!`);
  //           games[gameID].players.forEach((player) => {
  //             player.ws.send(
  //               JSON.stringify({
  //                 type: "victory",
  //                 payload: { winner: username },
  //               })
  //             );
  //           });
  //         }

  //         res = {
  //           type: isPerfectHit ? "hit" : "miss",
  //           payload: { username, x, y },
  //         };

  //         if (!isPerfectHit) {
  //           games[gameID].turn = enemy.username;

  //           games[gameID].players.forEach((player) => {
  //             player.ws.send(
  //               JSON.stringify({
  //                 type: "changeTurn",
  //                 payload: { nextTurn: enemy.username, x, y },
  //               })
  //             );
  //           });
  //         }

  //         break;

  //       default:
  //         res = { type: "logout", payload: params.payload };
  //         break;
  //     }

  //     games[gameID].players.forEach((client) => {
  //       if (typeof client.ws.send !== "function") {
  //         console.error("client.ws не является WebSocket:", client);
  //       } else {
  //         client.ws.send(JSON.stringify(res));
  //       }
  //     });
  //   });

  //   console.timeEnd("broadcast");
  // }
}

start();
