const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  totalGames: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },

  games: [
    {
      gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
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

UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.virtual("winRate").get(function () {
  if (this.totalGames === 0) return 0;
  return (this.wins / this.totalGames) * 100;
});

UserSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("User", UserSchema);
