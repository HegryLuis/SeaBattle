const mongoose = require("mongoose");

const cellSchema = new mongoose.Schema({
  mark: {
    name: String, // 'Damage' | 'Miss' | null
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

const inProgressGameSchema = new mongoose.Schema({
  gameID: String,
  players: [
    {
      username: { type: String, required: true },
      lost: { type: Boolean, default: false },
    },
  ],
  boards: [boardSchema],
  logs: [logSchema],
  globalTurn: Number,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GameInProgress", inProgressGameSchema);
