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
        console.log("req = ", req);
        initGames(wsClient, req.payload.gameID);
      }

      broadcast(req);
    });
  });

  function initGames(ws, gameID) {
    if (!games[gameID]) {
      games[gameID] = {
        players: [],
        boards: {},
      };
    }

    // if (!games[gameID]) games[gameID] = [ws];
    else if (games[gameID].players.length < 2) games[gameID].players.push(ws);

    if (games[gameID].players.length === 2) {
      games[gameID].players.forEach((player) => {
        player.send(
          JSON.stringify({
            type: "connectToPlay",
            payload: {
              success: true,
              enemyName: games[gameID].players.find(
                (w) => w !== player?.username
              ),
            },
          })
        );
      });
    }
  }

  function broadcast(params, wsClient) {
    let res;

    // const { username, gameID } = params.payload;
    const { username, gameID, board } = params.payload;

    games[gameID].players.forEach((client) => {
      switch (params.event) {
        case "connect":
          if (!games[gameID]) {
            games[gameID] = {
              players: [],
              boards: {}, // <-- Убедитесь, что объект инициализирован
            };
          }

          if (!games[gameID].players.find((p) => p.username === username)) {
            games[gameID].players.push({ username, ws: wsClient });
          }

          games[gameID].boards[username] = board.cells; // <-- Сохраняем доску корректно

          console.log(`Player ${username} connected to game ${gameID}`);
          console.log("Current game state: ", JSON.stringify(games, null, 2));

          res = {
            type: "connectToPlay",
            payload: {
              success: true,
              enemyName: games[gameID].players.find(
                (p) => p.username !== username
              )?.username,
              username: username,
            },
          };
          break;

        case "ready":
          games[gameID].boards[username] = params.payload.board; // Сохраняем доску игрока

          res = {
            type: "readyToPlay",
            payload: {
              canStart: Object.keys(games[gameID].boards).length === 2,
              username,
            },
          };
          break;

        case "shoot":
          console.log("Shoot received from", username);

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

          const cell = enemyBoard[y]?.[x]; // Получаем клетку
          if (!cell) {
            console.log(`Cell at (${x}, ${y}) not found!`);
            return;
          }

          const isPerfectHit = cell?.mark?.name === "ship"; // Проверяем попадание

          console.log(isPerfectHit ? "Hit!" : "Missed!");

          games[gameID].players.forEach((client) => {
            client.send(
              JSON.stringify({
                type: "isPerfectHit",
                payload: { username, x, y, isPerfectHit },
              })
            );
          });

          // res = { type: "afterShootByMe", payload: params.payload };
          break;

        // case "checkShoot":
        //   res = { type: "isPerfectHit", payload: params.payload };
        //   break;

        default:
          res = { type: "logout", payload: params.payload };
          break;
      }

      client.send(JSON.stringify(res));
    });
  }
}

start();
