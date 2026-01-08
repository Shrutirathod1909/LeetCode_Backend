const redisClient = require("../config/redis");
const User = require("../models/user");
const validate = require("../utils/validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* ================= USER REGISTER ================= */
const register = async (req, res) => {
  try {
    validate(req.body);
    const { firstName, emailId, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      emailId,
      password: hashedPassword,
      role: "user",
    });

    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_KEY, {
      expiresIn: "1h",
    });

    // Send cookie + token in JSON
    res.cookie("token", token, { maxAge: 60 * 60 * 1000, httpOnly: true });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        emailId: user.emailId,
        role: user.role,
      },
      message: "User registered successfully",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ================= USER LOGIN ================= */
const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_KEY, {
      expiresIn: "1h",
    });

    // ✅ Cookie + JSON token
     res.cookie("token", token, {
  httpOnly: true,
  secure: true,        // REQUIRED on HTTPS
  sameSite: "none",    // 🔥 REQUIRED for Netlify + Render
  maxAge: 60 * 60 * 1000,
});
    res.status(200).json({
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        emailId: user.emailId,
        role: user.role,
      },
      message: "Login successful",
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

/* ================= ADMIN REGISTER ================= */
const adminRegister = async (req, res) => {
  try {
    validate(req.body);
    const { firstName, emailId, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      firstName,
      emailId,
      password: hashedPassword,
      role: "admin",
    });

    res.status(201).json({
      message: "Admin registered successfully",
      admin: {
        _id: admin._id,
        firstName: admin.firstName,
        emailId: admin.emailId,
        role: admin.role,
      },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ================= ADMIN LOGIN ================= */
const adminLogin = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const admin = await User.findOne({ emailId, role: "admin" });
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ _id: admin._id, role: admin.role }, process.env.JWT_KEY, {
      expiresIn: "1h",
    });

    // ✅ Cookie + JSON token
    res.cookie("token", token, {
  httpOnly: true,
  secure: true,        // REQUIRED on HTTPS
  sameSite: "none",    // 🔥 REQUIRED for Netlify + Render
  maxAge: 60 * 60 * 1000,
});
    res.status(200).json({
      token,
      admin: {
        _id: admin._id,
        firstName: admin.firstName,
        emailId: admin.emailId,
        role: admin.role,
      },
      message: "Admin login successful",
    });
  } catch (err) {
    res.status(500).json({ message: "Admin login failed", error: err.message });
  }
};

/* ================= LOGOUT ================= */
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;
    if (!token) return res.status(400).json({ message: "Token missing" });

    const payload = jwt.decode(token);

    await redisClient.set(`token:${token}`, "blocked");
    await redisClient.expireAt(`token:${token}`, payload.exp);

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed", error: err.message });
  }
};

/* ================= DELETE PROFILE ================= */
const deleteProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

module.exports = {
  register,
  login,
  adminRegister,
  adminLogin,
  logout,
  deleteProfile,
};
