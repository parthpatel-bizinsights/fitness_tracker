const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

async function run() {
  try {
    console.log("Listing models...");
    // The standard API doesn't expose listModels on the main client directly in all versions, 
    // but we can query it or fallback to trying standard ones like gemini-2.5-flash, gemini-3.5-flash.
    // Let's print out the client configuration or test a standard model generation.
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Hello, respond with 'OK' if you can read this.");
    console.log("Model response:", result.response.text());
  } catch (error) {
    console.error("Error listing/testing models:", error);
  }
}

run();
