const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");

const adminMiddleware = async (req, res, next) => {
  try {
    // 1️⃣ Get token from cookie OR Authorization header
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token not provided" });
    }

    // 2️⃣ Verify JWT
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_KEY);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (!payload?._id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // 3️⃣ Check if token is blocked in Redis
    const isBlocked = await redisClient.exists(`token:${token}`);
    if (isBlocked) {
      return res.status(401).json({ message: "Token is blocked" });
    }

    // 4️⃣ Check admin role
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // 5️⃣ Find admin user in DB
    const admin = await User.findById(payload._id);
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    // 6️⃣ Attach admin to request
    req.result = admin;

    next();
  } catch (err) {
    console.error("Admin Middleware Error:", err);
    return res.status(401).json({ message: "Unauthorized", error: err.message });
  }
};

module.exports = adminMiddleware;
