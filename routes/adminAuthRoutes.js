import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import {
  adminMiddleware,
  authMiddleware,
} from "../middlewares/authMiddleware.js";
import Admin from "../models/Admin.js";
dotenv.config();
const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ msg: "Admin not found." });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { userId: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
      }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("Admin Login Error:", err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.post("/create", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (req.admin.role !== "superadmin") {
      return res
        .status(403)
        .json({ msg: "Only Superadmins can create new admins." });
    }

    const { name, email, password, role } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin)
      return res.status(400).json({ msg: "Admin already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({ name, email, password: hashedPassword, role });
    await newAdmin.save();

    res.status(201).json({ msg: "Admin created successfully." });
  } catch (err) {
    console.error("Admin Creation Error:", err);
    res.status(500).json({ msg: "Server Error" });
  }
});

export default router;
