const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");

const userMiddleware = async (req, res, next) => {
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

    const user = await User.findById(payload._id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; // ✅ FIXED
    next();
  } catch (err) {
    console.error("User Middleware Error:", err);
    res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = userMiddleware;
