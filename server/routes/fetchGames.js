const express = require("express");
const router = express.Router();
const Game = require("../models/Game");
const User = require("../models/User");
const GameInProgress = require("../models/GameInProgress");

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

router.get("/playersStats", async (req, res) => {
  try {
    const { usernames } = req.query;

    let query = {};

    if (usernames) {
      const namesArray = usernames.split(",").map((name) => name.trim());
      query.username = { $in: namesArray };
    }

    const players = await User.find(query, "username totalGames wins").lean();

    if (!players || players.length === 0)
      return res.status(400).json({ msg: "Players not found!" });

    res.status(200).json(players);
  } catch (error) {
    console.error("Error fetching players: ", error);
    res.status(500).json({ msg: "Error fetching players" });
  }
});

router.get("/activeGamesIDs", async (req, res) => {
  try {
    const games = await GameInProgress.find({}, "gameID");
    const gameIDs = games.map((game) => game.gameID);

    res.status(200).json({ gameIDs });
  } catch (error) {
    res.status(500).json({ msg: "Error fetching ID`s" });
  }
});

module.exports = router;
