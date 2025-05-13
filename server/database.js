const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(
      "mongodb://sea_user:sea_password@localhost:27017/sea-battle",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed : ", error);
  }
}

module.exports = connectDB;
