const axios = require("axios");

const getLanguageById = (lang) => {
  const language = {
    "cpp": 54,
    "c++": 54,
    "java": 62,
    "javascript": 63
  };
  return language[lang.toLowerCase()];
};

const waiting = (timer) =>
  new Promise((resolve) => setTimeout(resolve, timer));

const submitBatch = async (submissions) => {
  const options = {
    method: "POST",
    url: "https://judge0-ce.p.rapidapi.com/submissions/batch",
    params: { base64_encoded: "false" },
    headers: {
      "x-rapidapi-key": process.env.JUDGE0_KEY,
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
      "Content-Type": "application/json"
    },
    data: { submissions }
  };

  const response = await axios.request(options);
  return response.data;
};

const submitToken = async (resultToken) => {
  const options = {
    method: "GET",
    url: "https://judge0-ce.p.rapidapi.com/submissions/batch",
    params: {
      tokens: resultToken.join(","),
      base64_encoded: "false",
      fields: "*"
    },
    headers: {
      "x-rapidapi-key": process.env.JUDGE0_KEY,
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com"
    }
  };

  let attempts = 0;

  while (attempts < 10) {
    const response = await axios.request(options);

    const isDone = response.data.submissions.every(
      (r) => r.status_id > 2
    );

    if (isDone) return response.data.submissions;

    attempts++;
    await waiting(1000);
  }

  throw new Error("Judge0 timeout");
};

module.exports = {
  getLanguageById,
  submitBatch,
  submitToken
};
