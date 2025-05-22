const WebSocket = require("ws");
const handleWebSocketConnection = require("../controllers/ws.controller");

function startWebSocketServer() {
  const WS_PORT = process.env.PORT;
  const wss = new WebSocket.Server({ port: WS_PORT }, () => {
    console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
  });

  wss.on("connection", (ws) => handleWebSocketConnection(ws));
}

module.exports = startWebSocketServer;
