const WebSocket = require("ws");
const gameService = require("./../services/game/gameService");

const games = {};

function start(PORT) {
  const wss = new WebSocket.Server({ port: PORT }, () => {
    console.log(`WebSocket server started on port ${PORT}`);
  });

  wss.on("connection", (wsClient) => {
    wsClient.on("message", async (message) => {
      try {
        const req = JSON.parse(message.toString());

        switch (req.event) {
          case "connect":
            wsClient.username = req.payload.username;
            wsClient.playersNum = req.payload.playersNum;
            wsClient.board = req.payload.board;
            gameService.initGames(games, wsClient, req.payload.gameID);
            break;

          case "shoot":
            gameService.processShot(games, req.payload);
            break;

          case "ready":
            gameService.markPlayerReady(games, req.payload);
            break;

          case "log":
            gameService.addLog(games, req.payload);
            break;

          default:
            console.log(`Unknown event: ${req.event}`);
        }
      } catch (err) {
        console.error("Error processing message:", err);
      }
    });

    wsClient.on("close", () => {
      gameService.handleDisconnect(games, wsClient);
    });
  });
}

module.exports = { start };
