const { geminiFlash } = require("../config/gemini");
const { groqClient } = require("../config/groq");

// Helper to strip markdown JSON blocks
const cleanJsonResponse = (text) => {
  if (!text) return "{}";
  return text.replace(/```json|```/g, "").trim();
};

/**
 * Analyzes a meal image using Google Gemini Vision
 */
const analyzeMealImage = async (prompt, imagePart) => {
  const result = await geminiFlash.generateContent([prompt, imagePart]);
  const responseText = result.response.text();
  const cleanJson = cleanJsonResponse(responseText);
  return JSON.parse(cleanJson);
};

/**
 * Generates a structured workout plan using Groq (Llama-3-70b)
 */
const generateWorkoutPlan = async (prompt) => {
  const completion = await groqClient.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
  });

  const responseText = completion.choices[0]?.message?.content;
  const cleanJson = cleanJsonResponse(responseText);
  return JSON.parse(cleanJson);
};

/**
 * Generates a coach chat reply using Groq (Llama-3-8b for speed)
 */
const generateCoachReply = async (fullPrompt) => {
  const completion = await groqClient.chat.completions.create({
    messages: [{ role: "user", content: fullPrompt }],
    model: "llama-3.1-8b-instant",
  });

  return (
    completion.choices[0]?.message?.content?.trim() ||
    "I'm having trouble thinking right now. Please try again."
  );
};

module.exports = {
  analyzeMealImage,
  generateWorkoutPlan,
  generateCoachReply,
};
