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

      if (req.event == "connect") {
        wsClient.username = req.payload.username;
        // console.log("req = ", req);
        initGames(wsClient, req.payload.gameID);
      }

      broadcast(req);
    });

    wsClient.on("close", () => {
      Object.keys(games).forEach((gameID) => {
        games[gameID].players = games[gameID].players.filter(
          (p) => p.ws !== wsClient
        );

        if (games[gameID].players.length === 0) {
          delete games[gameID]; // Удаляем пустую игру
          console.log(`Game ${gameID} deleted`);
        }
      });
    });
  });

  function initGames(ws, gameID) {
    //console.log("Получен gameID:", gameID);
    if (!games[gameID]) {
      games[gameID] = {
        players: [],
        boards: {},
      };
    }

    if (!games[gameID].players.find((p) => p.username === ws.username)) {
      games[gameID].players.push({ username: ws.username, ws: ws });
    }
    // if (!games[gameID]) games[gameID] = [ws];
    // else if (games[gameID].players.length < 2) games[gameID].players.push(ws);

    if (games[gameID].players.length === 2) {
      const [player1, player2] = games[gameID].players;

      console.log(`Player1: ${player1.username}, Enemy: ${player2.username}`);
      console.log(`Player2: ${player2.username}, Enemy: ${player1.username}`);

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

      games[gameID].turn = player1.username; // Збережемо, хто ходить
    }
  }

  function broadcast(params, wsClient) {
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

          //console.log(`Player ${username} connected to game ${gameID}`);

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

          console.log("shoot");

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
            cell.mark = { name: "empty" }; // Добавляем пустую метку
          }

          const isPerfectHit =
            cell?.mark?.name === "ship" || cell?.mark?.name === "hit"; // Shoot check

          if (cell.mark) {
            cell.mark.name = isPerfectHit ? "hit" : "miss";
          }

          if (isPerfectHit) {
            cell.mark.name = "hit"; // Помечаем клетку как "попадание"
          } else {
            cell.mark.name = "miss"; // Помечаем клетку как "промах"
          }

          res = {
            type: isPerfectHit ? "hit" : "miss",
            payload: { username, x, y },
          };

          if (!isPerfectHit) {
            games[gameID].turn = enemy.username; // Оновлюємо, хто має ходит

            games[gameID].players.forEach((player) => {
              player.ws.send(
                JSON.stringify({
                  type: "changeTurn",
                  payload: { nextTurn: enemy.username },
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
          console.log(res);
          client.ws.send(JSON.stringify(res));
        }
      });

      // client.send(JSON.stringify(res));
    });
  }
}

start();
