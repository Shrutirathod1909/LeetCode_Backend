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
problemRouter.post("/admin/create", adminMiddleware, createProblem);
problemRouter.put("/admin/update/:id", adminMiddleware, updateProblem);
problemRouter.delete("/admin/delete/:id", adminMiddleware, deleteProblem);

// -------------------- USER ROUTES --------------------
problemRouter.get("/user/solved", userMiddleware, solvedAllProblembyUser);
problemRouter.get("/user/submissions/:pid", userMiddleware, submittedProblem);

// -------------------- PUBLIC ROUTES --------------------
problemRouter.get("/", getAllProblem);        // GET /problem
problemRouter.get("/:id", getProblemById);    // GET /problem/:id

module.exports = problemRouter;
