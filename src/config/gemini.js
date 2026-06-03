const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️ GEMINI_API_KEY is missing from environment variables!");
}

const genAI = new GoogleGenerativeAI(apiKey || "");
const geminiFlash = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

module.exports = {
  genAI,
  geminiFlash,
};
