const express = require("express");
const router = express.Router();
const Game = require("../models/Game"); // модель Game

// Получить все игры
router.get("/games", async (req, res) => {
  const { nickname } = req.query;

  try {
    if (nickname) {
      const games = await Game.find({
        players: nickname,
      }).sort({ startedAt: -1 });

      res.json(games);
    } else {
      // fallback, если никнейм не передан — можно вообще не возвращать игры
      res.json([]);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch games" });
  }
});

module.exports = router;
