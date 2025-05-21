const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const router = express.Router();

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

const transporter = nodemailer.createTransport({
  host: "in-v3.mailjet.com",
  port: 587,
  auth: {
    user: process.env.API_KEY,
    pass: process.env.API_SECRET_KEY,
  },
  secure: false,
});

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

router.post("/check-email", async (req, res) => {
  const { username, email } = req.body;

  console.log(`Username = ${username}, email = ${email}`);

  if (!username || !email)
    return res.status(400).json({ msg: "Username and email are required" });

  try {
    const user = await User.findOne({ username });

    if (!user) return res.status(400).json({ msg: "User not found" });

    if (user.email !== email)
      return res.status(400).json({ msg: "Email does not match our record" });

    return res.status(200).json({ msg: "Email matches" });
  } catch (error) {
    return res.status(500).json({ msg: "Server error" });
  }
});

//
const resetCodes = {};

router.post("/send-reset-code", async (req, res) => {
  console.log("Sending reset code...");
  const { username, email } = req.body;

  if (!username || !email)
    return res.status(400).json({ msg: "Username and email required" });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.email !== email)
      return res.status(400).json({ msg: "Email does not match" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    resetCodes[username] = {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000,
    };

    console.log(
      `send-reset-code\n\tresetCodes[${username}] = ${resetCodes[username].code}`
    );

    await transporter.sendMail({
      from: `"SeaBattle Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Code",
      text: `Your password reset code is: ${code}`,
      html: `<p>Your password reset code is: <strong>${code}</strong></p>`,
    });

    res.status(200).json({ msg: "Reset code sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/verify-reset-code", async (req, res) => {
  const { username, code } = req.body;

  if (!username || !code)
    return res.status(400).json({ msg: "Username and code are required" });

  const stored = resetCodes[username];

  if (!stored) {
    return res.status(400).json({ msg: "No reset code found for this user" });
  }

  if (Date.now() > stored.expiresAt) {
    delete resetCodes[username];
    return res.status(400).json({ msg: "Code has expired" });
  }

  if (stored.code !== code) {
    return res.status(400).json({ msg: "Invalid code" });
  }

  console.log("Code verified");
  delete resetCodes[username];
  return res.status(200).json({ msg: "Code verified" });
});

router.post("/change-password", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ msg: "Username and new password are required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.password = password;
    await user.save();

    res.status(200).json({ msg: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
