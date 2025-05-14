const WebSocket = require("ws");
const connectDB = require("./database");
const express = require("express");
const authRoutes = require("./routes/auth");
const fetchGamesRoutes = require("./routes/fetchGames");
const GameModel = require("./models/Game");
const cors = require("cors");
const User = require("./models/User");

const app = express();
const PORT = 4000;
const BACKEND_PORT = 4001;

const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json());

const games = {};
connectDB();

app.use("/api/auth", authRoutes);
app.use("/api", fetchGamesRoutes);

app.listen(BACKEND_PORT, () => {
  console.log(`🚀 Server running on http://localhost:${BACKEND_PORT}`);
});

function start() {
  const wss = new WebSocket.Server({ port: PORT }, () => {
    console.log(`WebSocket server started on port ${PORT}`);
  });

  wss.on("connection", (wsClient) => {
    wsClient.on("message", async (message) => {
      const req = JSON.parse(message.toString());

      if (req.event === "connect") {
        wsClient.username = req.payload.username;
        wsClient.playersNum = req.payload.playersNum;
        wsClient.board = req.payload.board;
        initGames(wsClient, req.payload.gameID);
      }

      if (req.event === "shoot") {
        processShot(req.payload);
      }

      if (req.event === "ready") {
        markPlayerReady(req.payload);
      }

      if (req.event === "log") {
        const { gameID, log } = req.payload;
        if (games[gameID]) {
          if (!Array.isArray(games[gameID].logs)) {
            games[gameID].logs = [];
          }

          games[gameID].logs.push(log);
        }
      }
    });

    wsClient.on("close", () => {
      Object.keys(games).forEach((gameID) => {
        games[gameID].players = games[gameID].players.filter(
          (p) => p.ws !== wsClient
        );

        if (games[gameID].players.length === 0) {
          delete games[gameID]; // Delete empty game
          console.log(`Game ${gameID} deleted`);
        }
      });
    });
  });

  function initGames(ws, gameID) {
    if (!games[gameID]) {
      games[gameID] = {
        players: [],
        boards: {},
        globalTurn: 0,
        maxPlayers: parseInt(ws.playersNum) || 2,
        playerTargets: {},
        playerShotsLeft: {},
        lostPlayers: new Set(),
      };
      console.log(`Game ${gameID} created`);
    }

    console.log(`Adding player ${ws.username} to game ${gameID}`);
    console.log(
      "Current players in game:",
      games[gameID].players.map((p) => p.username)
    );

    const game = games[gameID];

    if (game.players.some((player) => player.username === ws.username)) {
      console.log(`Player ${ws.username} is already in the game ${gameID}`);

      return;
    }

    if (game.players.length >= 4) {
      ws.send(JSON.stringify({ type: "error", message: "Room is full" }));
      return;
    }

    game.players.push({ username: ws.username, ws });
    game.boards[ws.username] = ws.board;

    ws.send(
      JSON.stringify({
        type: "waitingForPlayers",
        payload: {
          playersCount: game.players.length,
          playersNeeded: game.maxPlayers,
        },
      })
    );

    if (game.players.length === game.maxPlayers) {
      startGame(gameID);
    }
  }

  function startGame(gameID) {
    const game = games[gameID];
    game.startedAt = new Date();
    game.logs = []; // если планируешь писать логи событий

    console.log(`
      🔹 Starting game ${gameID} with players:,
      game.players.map((p) => p.username`);

    const playersTurnIndexes = {};
    game.players.forEach((player, index) => {
      playersTurnIndexes[player.username] = index;
    });

    game.players.forEach((player, index) => {
      const opponents = game.players
        .filter((p) => p.username !== player.username)
        .map((p) => ({
          name: p.username,
          turnIndex: playersTurnIndexes[p.username],
        }));

      game.playerTargets[player.username] = {
        opponents: opponents.map((op) => op.name),
        currentTargetIndex: 0,
      };

      game.playerShotsLeft[player.username] = opponents.length;

      player.ws.send(
        JSON.stringify({
          type: "gameStarted",
          payload: {
            username: player.username,
            opponents,
            turnIndex: playersTurnIndexes[player.username],
            globalTurn: game.globalTurn,
          },
        })
      );
    });

    game.globalTurn = 0;
  }

  function processShot({ username, x, y, gameID }) {
    const game = games[gameID];
    if (!game) return;

    if (game.lostPlayers.has(username)) {
      console.log(`⚠️ Player ${username} tried to shoot but already lost.`);
      return;
    }

    if (game.players[game.globalTurn].username !== username) return;

    const playerTargetData = game.playerTargets[username];
    let target =
      playerTargetData.opponents[playerTargetData.currentTargetIndex];

    // Пропускаем уже выбывших противников
    while (game.lostPlayers.has(target)) {
      playerTargetData.currentTargetIndex++;

      if (
        playerTargetData.currentTargetIndex >= playerTargetData.opponents.length
      ) {
        playerTargetData.currentTargetIndex = 0;

        do {
          game.globalTurn = (game.globalTurn + 1) % game.players.length;
        } while (game.lostPlayers.has(game.players[game.globalTurn].username));

        game.players.forEach((player) => {
          player.ws.send(
            JSON.stringify({
              type: "changeTurn",
              payload: { globalTurn: game.globalTurn },
            })
          );
        });

        return;
      }

      target = playerTargetData.opponents[playerTargetData.currentTargetIndex];
    }

    const enemyBoard = game.boards[target];
    if (!enemyBoard) return;

    const cell = enemyBoard.cells[y][x];
    if (!cell) {
      console.log(`Cell[${y}][${x}] is not found`);
      return;
    }

    if (cell?.mark?.name === "miss" || cell?.mark?.name === "hit") {
      console.log("You have already shot in this cell ");
      return;
    }

    const isHit = cell?.mark?.name === "ship";
    if (!cell.mark) {
      cell.mark = { name: "empty" };
    }
    cell.mark.name = isHit ? "hit" : "miss";

    game.players.forEach((player) => {
      player.ws.send(
        JSON.stringify({
          type: isHit ? "hit" : "miss",
          payload: { shooter: username, target, x, y },
        })
      );
    });

    // Проверка: цель проиграла?
    if (checkDefeat(target, game)) {
      console.log(`🔴 Player ${target} has lost`);

      const losingPlayer = game.players.find((p) => p.username === target);
      if (losingPlayer) {
        losingPlayer.ws.send(JSON.stringify({ type: "youLost" }));
      }

      game.lostPlayers.add(target);

      game.players.forEach((player) => {
        player.ws.send(
          JSON.stringify({
            type: "playerLost",
            payload: { username: target },
          })
        );
      });

      const alivePlayers = game.players.filter(
        (p) => !game.lostPlayers.has(p.username)
      );
      if (alivePlayers.length === 1) {
        const winner = alivePlayers[0].username;
        console.log(`🏆 Auto Victory - ${winner}`);
        endGame(gameID, winner);
        return;
      }
    }

    // Проверка: стрелявший игрок победил?
    if (checkVictory(username, game)) {
      console.log(`🏆 Player ${username} has won`);

      endGame(gameID, username);
      return;
    }

    // Проверка: стрелявший игрок проиграл?
    if (checkDefeat(username, game)) {
      console.log(`🔴 Player ${username} has lost (after shot)`);

      const losingPlayer = game.players.find((p) => p.username === username);
      if (losingPlayer) {
        losingPlayer.ws.send(JSON.stringify({ type: "youLost" }));
      }

      game.lostPlayers.add(username);

      game.players.forEach((player) => {
        player.ws.send(
          JSON.stringify({
            type: "playerLost",
            payload: { username },
          })
        );
      });

      const alivePlayers = game.players.filter(
        (p) => !game.lostPlayers.has(p.username)
      );
      if (alivePlayers.length === 1) {
        const winner = alivePlayers[0].username;
        console.log(`🏆 Auto Victory - ${winner}`);
        endGame(gameID, winner);
        return;
      }

      return;
    }

    playerTargetData.currentTargetIndex++;

    if (
      playerTargetData.currentTargetIndex >= playerTargetData.opponents.length
    ) {
      playerTargetData.currentTargetIndex = 0;

      do {
        game.globalTurn = (game.globalTurn + 1) % game.players.length;
      } while (game.lostPlayers.has(game.players[game.globalTurn].username));

      game.players.forEach((player) => {
        player.ws.send(
          JSON.stringify({
            type: "changeTurn",
            payload: { globalTurn: game.globalTurn },
          })
        );
      });
    }
  }

  // Проверка: игрок победил, если уничтожил всех противников
  function checkVictory(username, game) {
    const opponents = game.playerTargets[username].opponents;

    return opponents.every((enemyName) => {
      const board = game.boards[enemyName];
      return board.cells.every((row) =>
        row.every((cell) => cell.mark?.name !== "ship")
      );
    });
  }

  // Проверка: игрок проиграл, если все его корабли уничтожены
  function checkDefeat(username, game) {
    const board = game.boards[username];
    return board.cells.every((row) =>
      row.every((cell) => cell.mark?.name !== "ship")
    );
  }

  async function endGame(gameID, winner) {
    const game = games[gameID];

    if (!game) return;

    // Запис гри в бд
    const gameData = new GameModel({
      gameID,
      players: game.players.map((p) => p.username),
      boards: game.players.map((p) => ({
        username: p.username,
        cells: game.boards[p.username].cells,
      })),
      winner,
      startedAt: game.startedAt || new Date(Date.now() - 1000 * 60 * 5),
      endedAt: new Date(),
      logs: game.logs || [],
    });

    //Оновлення статусу всіх гравців
    for (const player of game.players) {
      await User.findOneAndUpdate(
        { username: player.username },
        {
          $inc: {
            totalGames: 1,
            wins: player.username === winner ? 1 : 0,
          },
        },
        { new: true }
      );
    }

    try {
      await updateUserStats(gameData.gameID);
      await gameData.save();
      console.log(`✅ Game ${gameID} saved to database`);
    } catch (err) {
      console.error(`❌ Failed to save game ${gameID}:`, err);
    }

    games[gameID].players.forEach((player) => {
      player.ws.send(JSON.stringify({ type: "victory", payload: { winner } }));
    });
  }
}

start();
