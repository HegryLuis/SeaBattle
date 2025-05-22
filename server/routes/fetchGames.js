const express = require("express");
const router = express.Router();
const Game = require("../models/Game");

router.get("/games", async (req, res) => {
  const { nickname } = req.query;

  try {
    if (nickname) {
      const games = await Game.find({
        players: { $regex: new RegExp(`^${nickname}$`, "i") },
      }).sort({ startedAt: -1 });

      res.json(games);
    } else {
      res.json([]);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch games" });
  }
});

module.exports = router;
