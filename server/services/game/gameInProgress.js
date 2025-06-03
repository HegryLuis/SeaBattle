const GamesInProgress = require("../../models/GameInProgress");

async function saveGameProgress(
  gameID,
  players,
  boards,
  logs,
  globalTurn,
  lostPlayers,
  playerTargets
) {
  await GamesInProgress.findOneAndUpdate(
    { gameID },
    {
      players: players.map((p) => ({
        username: p.username,
        lost: lostPlayers.has(p.username),
        playerTargets: Object.entries(playerTargets).map(
          ([username, target]) => ({
            username,
            opponents: target.opponents,
            currentTargetIndex: target.currentTargetIndex,
          })
        ),
      })),
      boards,
      logs,
      globalTurn,
    },
    { upsert: true, new: true }
  );
}

async function deleteGameProgress(gameID) {
  await GamesInProgress.deleteOne({ gameID });
  console.log(`Game ${gameID} deleted from GameInProgress`);
}

module.exports = {
  saveGameProgress,
  deleteGameProgress,
};
