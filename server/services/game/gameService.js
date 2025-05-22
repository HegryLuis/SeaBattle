const { initGames } = require("./gameInit");
const { processShot } = require("./gameShot");
const { markPlayerReady, addLog } = require("./gameUtils");
const { handleDisconnect } = require("./gameDisconnect");
const { endGame } = require("./gameEnd");

module.exports = {
  initGames,
  processShot,
  markPlayerReady,
  addLog,
  handleDisconnect,
  endGame,
};
