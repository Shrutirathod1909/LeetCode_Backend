const { GoogleGenAI } = require("@google/genai");

const solveDoubt = async (req, res) => {
  try {
    const { messages, title, description, testCases, startCode } = req.body;

    if (!messages || !title || !description) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_KEY
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages,
      config: {
        systemInstruction: `
You are an expert Data Structures and Algorithms (DSA) tutor.

## CURRENT PROBLEM:
Title: ${title}
Description: ${description}
Examples: ${testCases || "N/A"}
Start Code: ${startCode || "N/A"}

Rules:
- Only help with THIS DSA problem
- Give hints, explanations, or code review
- No unrelated topics
- Explain clearly and step-by-step
`
      }
    });

    const aiText =
      response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      return res.status(500).json({
        message: "Failed to generate response"
      });
    }

    res.status(200).json({
      message: aiText
    });

  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports = solveDoubt;
