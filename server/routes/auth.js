const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

const JWT_SECRET = "adsLDWpaslDLQPe12323ad-adas";

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  console.log("Request body:", req.body);

  if (!username || !password)
    return res.status(400).json({ msg: "All fields are required" });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/register", async (req, res) => {
  const { username, password, email } = req.body;

  console.log("Request body:", req.body);

  if (!username || !password || !email)
    return res.status(400).json({ msg: "All fields are required" });

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ msg: "Nickname already exists" });
    const newUser = new User({ username, password, email });
    await newUser.save();
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.status(201).json({ token, username: newUser.username });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
