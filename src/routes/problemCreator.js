const express = require("express");
const problemRouter = express.Router();

const adminMiddleware = require("../middleware/adminMiddleware");
const userMiddleware = require("../middleware/userMiddleware");

const {
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemById,
  getAllProblem,
  solvedAllProblembyUser,
  submittedProblem
} = require("../controllers/userProblem");

// -------------------- ADMIN ROUTES --------------------
// Only admin can create, update, delete
problemRouter.post("/admin/create", adminMiddleware, createProblem);
problemRouter.put("/admin/update/:id", adminMiddleware, updateProblem);
problemRouter.delete("/admin/delete/:id", adminMiddleware, deleteProblem);

// -------------------- USER ROUTES --------------------
// Protected routes (user must be logged in)
problemRouter.get("/user/solved", userMiddleware, solvedAllProblembyUser);
problemRouter.get("/user/submissions/:pid", userMiddleware, submittedProblem);

// -------------------- PUBLIC ROUTES --------------------
// Anyone can view all problems or a single problem
problemRouter.get("/", getAllProblem);        // All problems (public)
problemRouter.get("/:id", getProblemById);    // Single problem (public)

module.exports = problemRouter;
