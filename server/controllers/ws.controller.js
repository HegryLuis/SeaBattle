const {
  handleConnect,
  handleShoot,
  handleReady,
  handleLog,
  handleClose,
} = require("../services/game.service");

const handleWebSocketConnection = (ws) => {
  ws.on("message", (message) => {
    const req = JSON.parse(message.toString());
    const { event, payload } = req;

    switch (event) {
      case "connect":
        handleConnect(ws, payload);
        break;
      case "shoot":
        handleShoot(payload);
        break;
      case "ready":
        handleReady(payload);
        break;
      case "log":
        handleLog(payload);
        break;
    }
  });

  ws.on("close", () => handleClose(ws));
};

module.exports = handleWebSocketConnection;
