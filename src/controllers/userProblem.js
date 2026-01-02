const { getLanguageById, submitBatch, submitToken } = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");
const SolutionVideo = require("../models/solutionVideo");

/* ---------------- CREATE PROBLEM ---------------- */
const createProblem = async (req, res) => {
  try {
    const { referenceSolution, visibleTestCases } = req.body;

    for (const { language, completeCode } of referenceSolution) {
      const languageId = getLanguageById(language);

      const submissions = visibleTestCases.map(tc => ({
        source_code: completeCode,
        language_id: languageId,
        stdin: tc.input,
        expected_output: tc.output
      }));

      const submitResult = await submitBatch(submissions);
      const tokens = submitResult.map(r => r.token);
      const results = await submitToken(tokens);

      for (const test of results) {
        if (test.status_id !== 3) {
          return res.status(400).send("Reference solution failed");
        }
      }
    }

    await Problem.create({
      ...req.body,
      problemCreator: req.result._id
    });

    res.status(201).send("Problem created successfully");
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

/* ---------------- UPDATE PROBLEM ---------------- */
const updateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Problem.findById(id);

    if (!existing) return res.status(404).send("Problem not found");

    await Problem.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).send("Problem updated successfully");
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

/* ---------------- DELETE PROBLEM ---------------- */
const deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Problem.findByIdAndDelete(id);

    if (!deleted) return res.status(404).send("Problem not found");

    res.status(200).send("Problem deleted");
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

/* ---------------- GET PROBLEM BY ID ---------------- */
const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await Problem.findById(id)
      .select("_id title description difficulty tags visibleTestCases hiddenTestCases startCode referenceSolution");

    if (!problem) return res.status(404).send("Problem not found");

    const video = await SolutionVideo.findOne({ problemId: id });

    let data = { ...problem._doc };
    if (video) {
      data = {
        ...data,
        secureUrl: video.secureUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration
      };
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

/* ---------------- GET ALL PROBLEMS ---------------- */
const getAllProblem = async (req, res) => {
  try {
    const problems = await Problem.find({})
      .select("_id title difficulty tags");

    res.status(200).json(problems);
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

/* ---------------- SOLVED PROBLEMS ---------------- */
const solvedAllProblembyUser = async (req, res) => {
  try {
    const user = await User.findById(req.result._id)
      .select("problemSolved");

    res.status(200).json(user.problemSolved);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

/* ---------------- SUBMISSIONS ---------------- */
const submittedProblem = async (req, res) => {
  try {
    const submissions = await Submission.find({
      userId: req.result._id,
      problemId: req.params.pid
    });

    res.status(200).json(submissions);
  } catch (err) {
    res.status(500).send("Server Error");
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
