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

    if (!userId || !problemId || !code || !language) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (language === "cpp") language = "c++";

    const languageId = getLanguageById(language);
    if (!languageId) {
      return res.status(400).json({ message: "Unsupported language" });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ message: "Problem not found" });

    const submittedResult = await Submission.create({
      userId,
      problemId,
      code,
      language,
      status: "pending",
      testCasesTotal: problem.hiddenTestCases.length
    });

    const submissions = problem.hiddenTestCases.map(tc => ({
      source_code: code,
      language_id: languageId,
      stdin: tc.input,
      expected_output: tc.output
    }));

    const submitResult = await submitBatch(submissions);
    const tokens = submitResult.submissions.map(r => r.token);
    const testResults = await submitToken(tokens);

    let passed = 0, runtime = 0, memory = 0;
    let status = "accepted", errorMessage = null;

    for (const test of testResults) {
      if (test.status_id === 3) {
        passed++;
        runtime += Number(test.time || 0);
        memory = Math.max(memory, test.memory || 0);
      } else {
        status = "wrong";
        errorMessage = test.stderr || test.compile_output || null;
        break;
      }
    }

    submittedResult.status = status;
    submittedResult.testCasesPassed = passed;
    submittedResult.runtime = runtime;
    submittedResult.memory = memory;
    submittedResult.errorMessage = errorMessage;
    await submittedResult.save();

    if (status === "accepted" && !req.result.problemSolved.includes(problemId)) {
      req.result.problemSolved.push(problemId);
      await req.result.save();
    }

    res.status(201).json({
      accepted: status === "accepted",
      passedTestCases: passed,
      totalTestCases: problem.hiddenTestCases.length,
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
