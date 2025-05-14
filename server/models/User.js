const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  totalGames: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },

  // Додано посилання на ігри, в яких гравець брав участь
  games: [
    {
      gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game" }, // Посилання на гру
      score: { type: Number, default: 0 },
      winner: { type: Boolean, default: false },
    },
  ],
});

// Хешування пароля перед збереженням
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Порівняння пароля
UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Обчислення winRate у відсотках (%)
UserSchema.virtual("winRate").get(function () {
  if (this.totalGames === 0) return 0;
  return (this.wins / this.totalGames) * 100;
});

// Включити virtuals у JSON-представлення
UserSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("User", UserSchema);
