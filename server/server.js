const { type } = require("@testing-library/user-event/dist/type");
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
    console.log("ws in initGames", ws.username);

    if (!games[gameID]) games[gameID] = [ws];
    else if (games[gameID].length < 2) games[gameID].push(ws);

    if (games[gameID].length === 2) {
      games[gameID].forEach((player) => {
        player.send(
          JSON.stringify({
            type: "connectToPlay",
            payload: {
              success: true,
              enemyName: games[gameID].find((w) => w !== player?.username),
            },
          })
        );
      });
    }

    // if (games[gameID] && games[gameID]?.length < 2)
    //   games[gameID] = [...games[gameID], ws];

    // if (games[gameID] && games[gameID].length === 2) {
    //   games[gameID] = games[gameID].filter(
    //     (wsc) => wsc.username !== ws.username
    //   );
    //   games[gameID] = [...games[gameID], ws];
    // }
  }

  function broadcast(params) {
    let res;

    const { username, gameID } = params.payload;

    games[gameID].forEach((client) => {
      switch (params.event) {
        case "connect":
          res = {
            type: "connectToPlay",
            payload: {
              success: true,
              enemyName: games[gameID].find((user) => user !== client)
                ?.username,
              username: username,
            },
          };
          break;

        case "ready":
          res = {
            type: "readyToPlay",
            payload: { canStart: games[gameID].length > 1, username },
          };
          break;

        case "shoot":
          res = { type: "afterShootByMe", payload: params.payload };
          break;

        case "checkShoot":
          res = { type: "isPerfectHit", payload: params.payload };
          break;

        default:
          res = { type: "logout", payload: params.payload };
          break;
      }

      client.send(JSON.stringify(res));
    });
  }
}

start();
