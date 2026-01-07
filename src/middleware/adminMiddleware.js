const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");

const adminMiddleware = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token not provided" });
    }

    const payload = jwt.verify(token, process.env.JWT_KEY);

    const isBlocked = await redisClient.exists(`token:${token}`);
    if (isBlocked) {
      return res.status(401).json({ message: "Token is blocked" });
    }

    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const admin = await User.findById(payload._id);
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    req.user = admin; // ✅ FIXED
    next();
  } catch (err) {
    console.error("Admin Middleware Error:", err);
    res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = adminMiddleware;
