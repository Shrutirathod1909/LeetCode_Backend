const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");

const userMiddleware = async (req, res, next) => {
  try {
    // 1️⃣ Get token from cookie OR Authorization header (safe optional chaining)
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token not provided" });
    }

    // 2️⃣ Verify JWT safely
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

    // 4️⃣ Find user in DB
    const user = await User.findById(payload._id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // 5️⃣ Attach user to request
    req.result = user;

    next();
  } catch (err) {
    console.error("User Middleware Error:", err);
    res.status(401).json({ message: "Unauthorized", error: err.message });
  }
};

module.exports = userMiddleware;
