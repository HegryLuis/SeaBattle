const mongoose = require("mongoose");

const cellSchema = new mongoose.Schema({
  mark: {
    name: String,
  },
});

const boardSchema = new mongoose.Schema({
  username: String,
  cells: [[cellSchema]],
});

const logSchema = new mongoose.Schema({
  message: String,
  timestamp: Date,
});

const gameSchema = new mongoose.Schema({
  gameID: String,
  players: [String],
  boards: [boardSchema],
  winner: String,
  startedAt: Date,
  endedAt: Date,
  logs: [logSchema],
});

module.exports = mongoose.model("Game", gameSchema);
