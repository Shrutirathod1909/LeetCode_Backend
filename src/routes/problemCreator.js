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
problemRouter.post("/create", adminMiddleware, createProblem);
problemRouter.put("/update/:id", adminMiddleware, updateProblem);
problemRouter.delete("/delete/:id", adminMiddleware, deleteProblem);

// -------------------- USER / AUTH ROUTES --------------------
// Optional: getAllProblem & getProblemById can be public
problemRouter.get("/", getAllProblem); // All problems (public)
problemRouter.get("/:id", getProblemById); // Single problem (public)

// Protected routes (user must be logged in)
problemRouter.get("/solved", userMiddleware, solvedAllProblembyUser);
problemRouter.get("/submissions/:pid", userMiddleware, submittedProblem);

module.exports = problemRouter;
