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

const gameSchema = new mongoose.Schema({
  gameID: String,
  players: [String],
  boards: [boardSchema],
  winner: String,
  startedAt: Date,
  endedAt: Date,
  logs: [String],
});

module.exports = mongoose.model("Game", gameSchema);
