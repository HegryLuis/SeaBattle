const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  players: [String], // usernames
  boards: mongoose.Schema.Types.Mixed,
  logs: [String], // battle logs
  winner: String,
  startedAt: Date,
  endedAt: Date,
});

module.exports = mongoose.model("Game", gameSchema);
