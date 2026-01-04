const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require("../models/user");
const { getLanguageById, submitBatch, submitToken } = require("../utils/problemUtility");

// ------------------- SUBMIT CODE (Hidden Test Cases) -------------------
const submitCode = async (req, res) => {
  try {
    const userId = req.result?._id;
    const problemId = req.params.id;
    let { code, language } = req.body;

    // Validate input
    if (!userId || !problemId || !code || !language) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (language === "cpp") language = "c++";

    // Fetch problem
    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ message: "Problem not found" });

    // Store submission in DB as pending
    const submittedResult = await Submission.create({
      userId,
      problemId,
      code,
      language,
      status: "pending",
      testCasesTotal: problem.hiddenTestCases.length
    });

    // Judge0 batch submission
    const languageId = getLanguageById(language);
    const submissions = problem.hiddenTestCases.map((tc) => ({
      source_code: code,
      language_id: languageId,
      stdin: tc.input,
      expected_output: tc.output
    }));

    const submitResult = await submitBatch(submissions);
    const resultTokens = submitResult.map((r) => r.token);
    const testResults = await submitToken(resultTokens);

    // Evaluate results
    let testCasesPassed = 0, runtime = 0, memory = 0, status = "accepted", errorMessage = null;

    for (const test of testResults) {
      if (test.status_id === 3) {
        testCasesPassed++;
        runtime += parseFloat(test.time);
        memory = Math.max(memory, test.memory);
      } else {
        status = test.status_id === 4 ? "error" : "wrong";
        errorMessage = test.stderr || null;
      }
    }

    // Update submission in DB
    submittedResult.status = status;
    submittedResult.testCasesPassed = testCasesPassed;
    submittedResult.errorMessage = errorMessage;
    submittedResult.runtime = runtime;
    submittedResult.memory = memory;
    await submittedResult.save();

    // Add problemId to user's solved list if not already present
    if (!req.result.problemSolved.includes(problemId) && status === "accepted") {
      req.result.problemSolved.push(problemId);
      await req.result.save();
    }

    res.status(201).json({
      accepted: status === "accepted",
      totalTestCases: submittedResult.testCasesTotal,
      passedTestCases: testCasesPassed,
      runtime,
      memory
    });

  } catch (err) {
    console.error("Submit Code Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// ------------------- RUN CODE (Visible Test Cases) -------------------
const runCode = async (req, res) => {
  try {
    const userId = req.result?._id;
    const problemId = req.params.id;
    let { code, language } = req.body;

    if (!userId || !problemId || !code || !language) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (language === "cpp") language = "c++";

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ message: "Problem not found" });

    const languageId = getLanguageById(language);
    const submissions = problem.visibleTestCases.map((tc) => ({
      source_code: code,
      language_id: languageId,
      stdin: tc.input,
      expected_output: tc.output
    }));

    const submitResult = await submitBatch(submissions);
    const resultTokens = submitResult.map((r) => r.token);
    const testResults = await submitToken(resultTokens);

    let testCasesPassed = 0, runtime = 0, memory = 0, success = true, errorMessage = null;

    for (const test of testResults) {
      if (test.status_id === 3) {
        testCasesPassed++;
        runtime += parseFloat(test.time);
        memory = Math.max(memory, test.memory);
      } else {
        success = false;
        errorMessage = test.stderr || null;
      }
    }

    res.status(201).json({
      success,
      testCasesPassed,
      totalTestCases: problem.visibleTestCases.length,
      runtime,
      memory,
      errorMessage,
      testResults
    });

  } catch (err) {
    console.error("Run Code Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

module.exports = { submitCode, runCode };
