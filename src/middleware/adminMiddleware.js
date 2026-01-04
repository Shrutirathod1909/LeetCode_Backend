const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");

const adminMiddleware = async (req, res, next) => {
  try {
    // 1️⃣ Get token
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: "Token not provided" });
    }

    // 2️⃣ Verify token
    const payload = jwt.verify(token, process.env.JWT_KEY);

    // 3️⃣ Check admin role
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // 4️⃣ Check token blocked or not (Redis)
    const isBlocked = await redisClient.exists(`token:${token}`);
    if (isBlocked) {
      return res.status(401).json({ message: "Token is blocked" });
    }

    // 5️⃣ Find admin user
    const admin = await User.findById(payload._id);
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    // 6️⃣ Attach admin to request
    req.result = admin;
    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized", error: err.message });
  }
};

module.exports = adminMiddleware;
