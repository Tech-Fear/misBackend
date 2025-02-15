import express from "express";
import { sendEmail } from "../config/emailConfig.js";
import adminMiddleware from "../middlewares/adminAuthMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import Shuttle from "../models/Shuttle.js";
import User from "../models/User.js";
import { isPeakHour, setPeakHourOverride } from "../utils/timeUtils.js";

const router = express.Router();

router.get("/shuttles", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const shuttles = await Shuttle.find().populate("route");
    res.json({ shuttles });
  } catch (err) {
    console.error("Error fetching shuttles:", err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.post(
  "/shuttle/add",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { name, route, capacity } = req.body;

      const existingShuttle = await Shuttle.findOne({ name });
      if (existingShuttle) {
        return res
          .status(400)
          .json({ msg: "Shuttle with this name already exists." });
      }

      const newShuttle = new Shuttle({
        name,
        route,
        capacity,
        currentLocation: { lat: 0, lng: 0 },
      });

      await newShuttle.save();
      res.json({ msg: "Shuttle added successfully", shuttle: newShuttle });
    } catch (err) {
      console.error("Error adding shuttle:", err);
      res.status(500).json({ msg: "Server Error" });
    }
  }
);

router.delete(
  "/shuttle/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const shuttle = await Shuttle.findByIdAndDelete(req.params.id);
      if (!shuttle) return res.status(404).json({ msg: "Shuttle not found" });

      res.json({ msg: "Shuttle deleted successfully" });
    } catch (err) {
      console.error("Error deleting shuttle:", err);
      res.status(500).json({ msg: "Server Error" });
    }
  }
);

router.get("/peak-hour", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const peakHourStatus = await isPeakHour();
    res.json({ isPeakHour: peakHourStatus });
  } catch (err) {
    console.error("Error fetching peak hour status:", err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.post(
  "/set-peak-hour",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { isPeakHour, manualOverride } = req.body;
      const response = await setPeakHourOverride(isPeakHour, manualOverride);
      res.json(response);
    } catch (err) {
      console.error("Error setting peak hour:", err);
      res.status(500).json({ msg: "Server Error" });
    }
  }
);

router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, "name email walletBalance transactions");
    res.json({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.post(
  "/wallet/add",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { userId, amount } = req.body;
      if (amount <= 0) return res.status(400).json({ msg: "Invalid amount" });

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ msg: "User not found" });

      const points = (amount / 10) * 30;
      user.walletBalance += points;
      user.transactions.push({
        amount: points,
        type: "credit",
        description: `Admin added ${points} points for ₹${amount}`,
      });

      await user.save();

      const emailSubject = "Wallet Recharge by Admin";
      const emailText = `Hello ${user.name},\n\nAn admin has added ₹${amount} to your wallet.\nYou now have ${user.walletBalance} points available.\n\nThanks for using Shuttle Management System!`;

      await sendEmail(user.email, emailSubject, emailText);

      res.json({
        msg: "Funds added successfully, email sent!",
        newBalance: user.walletBalance,
      });
    } catch (err) {
      console.error("Error adding wallet funds:", err);
      res.status(500).json({ msg: "Server Error" });
    }
  }
);

router.delete(
  "/user/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ msg: "User not found" });

      await User.findByIdAndDelete(req.params.id);

      const emailSubject = "Account Deletion Notice";
      const emailText = `Hello ${user.name},\n\nYour account has been removed by an admin.\n\nIf you think this is a mistake, please contact support.\n\nThanks for using Shuttle Management System!`;

      await sendEmail(user.email, emailSubject, emailText);

      res.json({ msg: "User deleted successfully and notified via email." });
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ msg: "Server Error" });
    }
  }
);

export default router;
