const { getLanguageById, submitBatch, submitToken } = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");
const SolutionVideo = require("../models/solutionVideo");

/* ---------------- CREATE PROBLEM ---------------- */
const createProblem = async (req, res) => {
  try {
    console.log("REQ BODY 👉", req.body);
    console.log("ADMIN 👉", req.user?._id);

    
    const {
      title,
      description,
      difficulty,
      tags,
      visibleTestCases,
      hiddenTestCases,
      startCode,
      referenceSolution
    } = req.body;

    /* ---------- BASIC VALIDATION ---------- */
    if (!title || !description || !difficulty) {
      return res.status(400).json({ message: "Title, description, difficulty required" });
    }

    if (!Array.isArray(visibleTestCases) || visibleTestCases.length === 0) {
      return res.status(400).json({ message: "At least 1 visible test case required" });
    }

    if (!Array.isArray(referenceSolution) || referenceSolution.length === 0) {
      return res.status(400).json({ message: "Reference solution required" });
    }

    /* ---------- JUDGE VALIDATION (SAFE MODE) ---------- */
    for (const rs of referenceSolution) {
      const { language, completeCode } = rs;

      const languageId = getLanguageById(language);
      if (!languageId) {
        return res.status(400).json({ message: `Unsupported language: ${language}` });
      }

      // ⚠️ DO NOT use expected_output (Judge crash protection)
      const submissions = visibleTestCases.map(tc => ({
        source_code: completeCode,
        language_id: languageId,
        stdin: tc.input
      }));

      let submitResponse;
      try {
        submitResponse = await submitBatch(submissions);
      } catch (err) {
        console.error("Judge submitBatch failed:", err);
        return res.status(500).json({ message: "Judge submit failed" });
      }

      const tokens = submitResponse.map(r => r.token);

      // 🔁 Wait until all testcases finished
      let results;
      let finished = false;

      while (!finished) {
        results = await submitToken(tokens);
        finished = results.every(
          r => r.status_id !== 1 && r.status_id !== 2
        );
      }

      // ❌ If any test fails → reject problem
      for (const r of results) {
        if (r.status_id !== 3) {
          return res.status(400).json({
            message: "Reference solution failed test cases",
            judgeError: r
          });
        }
      }
    }

    /* ---------- SAVE PROBLEM ---------- */
   const problem = await Problem.create({
  title,
  description,
  difficulty,
  tags: Array.isArray(tags) ? tags : [tags],
  visibleTestCases,
  hiddenTestCases,
  startCode,
  referenceSolution,
  problemCreator: req.user._id   // ✅ FIXED
});


    return res.status(201).json({
      message: "Problem created successfully ✅",
      problem
    });

  } catch (err) {
    console.error("Create Problem Fatal Error:", err);
    return res.status(500).json({
      message: "Server Error",
      error: err.message
    });
  }
};


/* ---------------- UPDATE PROBLEM ---------------- */
const updateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Problem.findById(id);
    if (!existing) return res.status(404).json({ message: "Problem not found" });

    const updated = await Problem.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    res.status(200).json({ message: "Problem updated successfully", updated });
  } catch (err) {
    console.error("Update Problem Error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/* ---------------- DELETE PROBLEM ---------------- */
const deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Problem.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Problem not found" });
    res.status(200).json({ message: "Problem deleted successfully" });
  } catch (err) {
    console.error("Delete Problem Error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/* ---------------- GET PROBLEM BY ID ---------------- */
const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await Problem.findById(id)
      .select("_id title description difficulty tags visibleTestCases hiddenTestCases startCode referenceSolution");

    if (!problem) return res.status(404).json({ message: "Problem not found" });

    const video = await SolutionVideo.findOne({ problemId: id });
    const data = {
      ...problem._doc,
      ...(video ? { secureUrl: video.secureUrl, thumbnailUrl: video.thumbnailUrl, duration: video.duration } : {})
    };

    res.status(200).json(data);
  } catch (err) {
    console.error("Get Problem Error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/* ---------------- GET ALL PROBLEMS ---------------- */
const getAllProblem = async (req, res) => {
  try {
    const problems = await Problem.find().select("_id title difficulty tags");
    res.status(200).json(problems);
  } catch (err) {
    console.error("Get All Problems Error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/* ---------------- SOLVED PROBLEMS ---------------- */
const solvedAllProblembyUser = async (req, res) => {
  try {
   if (!req.user || !req.user._id)
  return res.status(401).json({ message: "Unauthorized" });

const user = await User.findById(req.user._id).select("problemSolved");
res.status(200).json(user.problemSolved || []);

  } catch (err) {
    console.error("Solved Problems Error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/* ---------------- SUBMISSIONS ---------------- */
const submittedProblem = async (req, res) => {
  try {
   if (!req.user || !req.user._id)
  return res.status(401).json({ message: "Unauthorized" });

const submissions = await Submission.find({
  userId: req.user._id,
  problemId: req.params.pid
});

    res.status(200).json(submissions);
  } catch (err) {
    console.error("Submitted Problem Error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

module.exports = {
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemById,
  getAllProblem,
  solvedAllProblembyUser,
  submittedProblem
};
