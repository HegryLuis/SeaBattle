const WebSocket = require("ws");

const PORT = 4000;
const games = {};

function start() {
  const wss = new WebSocket.Server({ port: PORT }, () => {
    console.log(`WebSocket server started on port ${PORT}`);
  });

  wss.on("connection", (wsClient) => {
    wsClient.on("message", async (message) => {
      const req = JSON.parse(message.toString());

      console.time(`Processing time for ${req.event}`);

      if (req.event == "connect") {
        wsClient.username = req.payload.username;
        initGames(wsClient, req.payload.gameID);
      }

      broadcast(req);

      console.timeEnd(`Processing time for ${req.event}`);
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
    console.time("initGames");

    if (!games[gameID]) {
      games[gameID] = {
        players: [],
        boards: {},
      };
    }

    if (!games[gameID].players.find((p) => p.username === ws.username)) {
      games[gameID].players.push({ username: ws.username, ws: ws });
    }

    if (games[gameID].players.length === 2) {
      const [player1, player2] = games[gameID].players;

      if (player1.username === player2.username) {
        console.log("Same names!");
        player2.username = `${player2.username} (1)`;
      }

      player1.ws.send(
        JSON.stringify({
          type: "connectToPlay",
          payload: {
            success: true,
            enemyName: player2.username,
            nickname: player1.username,
            isMyTurn: true,
          },
        })
      );

      player2.ws.send(
        JSON.stringify({
          type: "connectToPlay",
          payload: {
            success: true,
            enemyName: player1.username,
            nickname: player2.username,
            isMyTurn: false,
          },
        })
      );

      games[gameID].turn = player1.username;
    }

    console.timeEnd("initGames");
  }

  function broadcast(params, wsClient) {
    console.time("broadcast");

    let res;

    const { username, gameID, board } = params.payload;

    games[gameID].players.forEach((client) => {
      switch (params.event) {
        case "connect":
          if (!games[gameID]) {
            games[gameID] = {
              players: [],
              boards: {},
            };
          }

          if (!games[gameID].players.find((p) => p.username === username)) {
            games[gameID].players.push({ username, ws: wsClient });
          }

          games[gameID].boards[username] = board.cells;

          res = {
            type: "connectToPlay",
            payload: {
              success: true,
              enemyName: games[gameID].players.find(
                (p) => p.username !== username
              )?.username,
              username: username,
              isMyTurn: games[gameID].players[0].username === username,
            },
          };
          break;

        case "ready":
          games[gameID].boards[username] = params.payload.board;

          res = {
            type: "readyToPlay",
            payload: {
              canStart: Object.keys(games[gameID].boards).length === 2,
              username,
            },
          };
          break;

        case "shoot":
          if (!games[gameID]) {
            console.log(`Game ${gameID} not found!`);
            return;
          }

          const enemy = games[gameID].players.find(
            (player) => player.username !== username
          );
          if (!enemy) {
            console.log("Enemy not found!");
            return;
          }

          const { x, y } = params.payload;

          const enemyBoard = games[gameID].boards?.[enemy.username];
          if (!enemyBoard) {
            console.log(`Board for enemy ${enemy.username} not found!`);
            return;
          }

          const cell = enemyBoard[y]?.[x]; // Get cell

          if (!cell) {
            console.log(`Cell at (${x}, ${y}) not found!`);
            return;
          }

          if (!cell.mark) {
            console.log(
              `Cell at (${x}, ${y}) has no mark! Creating default mark.`
            );
            cell.mark = { name: "empty" }; // Add empty mark
          }

          const isPerfectHit =
            cell?.mark?.name === "ship" || cell?.mark?.name === "hit"; // Shoot check

          if (cell.mark) {
            cell.mark.name = isPerfectHit ? "hit" : "miss";
          }

          // Victory search
          // если больше нет кораблей -> вывести на консоль имя победителя
          let hasShipsLeft = false;
          for (let row of enemyBoard) {
            for (let cell of row) {
              if (cell.mark?.name === "ship") {
                hasShipsLeft = true;
                break;
              }
            }
          }

          if (!hasShipsLeft) {
            console.log(`\nPlayer ${username} wins!`);
            games[gameID].players.forEach((player) => {
              player.ws.send(
                JSON.stringify({
                  type: "victory",
                  payload: { winner: username },
                })
              );
            });
          }

          res = {
            type: isPerfectHit ? "hit" : "miss",
            payload: { username, x, y },
          };

          if (!isPerfectHit) {
            games[gameID].turn = enemy.username;

            games[gameID].players.forEach((player) => {
              player.ws.send(
                JSON.stringify({
                  type: "changeTurn",
                  payload: { nextTurn: enemy.username, x, y },
                })
              );
            });
          }

          break;

        default:
          res = { type: "logout", payload: params.payload };
          break;
      }

      games[gameID].players.forEach((client) => {
        if (typeof client.ws.send !== "function") {
          console.error("client.ws не является WebSocket:", client);
        } else {
          client.ws.send(JSON.stringify(res));
        }
      });
    });

    console.timeEnd("broadcast");
  }
}

start();
