const express = require("express");
const cors = require("cors");
const connectDB = require("./database");
const authRoutes = require("./routes/auth");
const fetchGamesRoutes = require("./routes/fetchGames");
const gameController = require("./controllers/game.controller");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT;
const BACKEND_PORT = process.env.BACKEND_PORT;

const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api", fetchGamesRoutes);

app.listen(BACKEND_PORT, () => {
  console.log(`🚀 Server running on http://localhost:${BACKEND_PORT}`);
});

// Запуск WebSocket сервера и логики игры
gameController.start(PORT);
