import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/authMiddleware.js";
import University from "../models/University.js";
import User from "../models/User.js";

dotenv.config();
const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, universityId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: "User already exists" });

    const university = await University.findOne({ universityId });
    if (!university)
      return res.status(400).json({ msg: "University does not exist" });
    const emailDomain = email.split("@")[1];
    const universityDomain = university.universityEmail.split("@")[1];
    if (emailDomain !== universityDomain) {
      return res
        .status(400)
        .json({ msg: "Email does not match university domain" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      universityId: university._id,
      walletBalance: 500,
    });

    await newUser.save();
    res.status(201).json({ msg: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ msg: "User not found. Please register first." });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, SECRET_KEY, {
      expiresIn: "24h",
    });

    res.json({
      token,
      expiresIn: 3600,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        universityId: user.universityId,
        walletBalance: user.walletBalance,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.get("/wallet", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(
      req.user.userId,
      "walletBalance transactions"
    );
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json({
      walletBalance: user.walletBalance,
      transactions: user.transactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.post("/wallet/add", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount <= 0) return res.status(400).json({ msg: "Invalid amount" });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const points = (amount / 10) * 30;
    user.walletBalance += points;

    user.transactions.push({
      amount: points,
      type: "credit",
      description: `Simulated wallet top-up: ₹${amount} → +${points} points`,
      date: new Date(),
    });

    await user.save();

    res.json({
      msg: "Wallet updated successfully (Simulation)",
      newBalance: user.walletBalance,
    });
  } catch (err) {
    console.error("Wallet update error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
