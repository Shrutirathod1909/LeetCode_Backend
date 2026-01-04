const express = require("express");
const authRouter = express.Router();

const {
  register,
  login,
  logout,
  adminRegister,
  deleteProfile,
  adminLogin,
} = require("../controllers/userAuthent");

const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// User auth
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", userMiddleware, logout);

// Admin auth
authRouter.post("/admin/login", adminLogin);
authRouter.post("/admin/register", adminMiddleware, adminRegister);

// User profile
authRouter.delete("/deleteProfile", userMiddleware, deleteProfile);

// Token check
authRouter.get("/check", userMiddleware, (req, res) => {
  res.status(200).json({
    user: {
      firstName: req.result.firstName,
      emailId: req.result.emailId,
      _id: req.result._id,
      role: req.result.role,
    },
    message: "Valid User",
  });
});

module.exports = authRouter;
