import dotenv from "dotenv";
import Admin from "../models/Admin.js";

dotenv.config();

const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: "Unauthorized. Please login first." });
    }

    const admin = await Admin.findById(req.user.userId);
    if (!admin) {
      return res.status(403).json({ msg: "Access denied. Admins only." });
    }

    req.admin = admin;
    next();
  } catch (err) {
    console.error("Admin Middleware Error:", err);
    res.status(500).json({ msg: "Server error. Unable to verify admin." });
  }
};

export default adminMiddleware;
