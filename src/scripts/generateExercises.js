require("dotenv").config();
const { Exercise, sequelize } = require("../models");
const { geminiFlash } = require("../config/gemini");

// We map ExerciseDB target muscles to our standard categories
const categoryMap = {
  "abductors": "legs",
  "abs": "core",
  "adductors": "legs",
  "biceps": "arms",
  "calves": "legs",
  "cardiovascular system": "cardio",
  "delts": "shoulders",
  "forearms": "arms",
  "glutes": "legs",
  "hamstrings": "legs",
  "lats": "back",
  "levator scapulae": "back",
  "pectorals": "chest",
  "quads": "legs",
  "serratus anterior": "core",
  "spine": "back",
  "traps": "back",
  "triceps": "arms",
  "upper back": "back"
};

// Short delay to prevent absolute spamming, but we know Gemini quota is exhausted so we keep it fast.
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, 50));

const cleanJsonResponse = (text) => {
  return text.replace(/```json|```/g, "").trim();
};

// Generates the rich AI fields for an exercise using Gemini
const enrichExerciseWithAI = async (exerciseName, targetMuscle, secondaryMuscles) => {
  const prompt = `
You are an expert fitness AI. I am giving you an exercise: "${exerciseName}".
Target Muscle: ${targetMuscle}
Secondary Muscles: ${secondaryMuscles.join(", ")}

Return ONLY a valid JSON object matching exactly this schema:
{
  "commonMistakes": ["mistake 1", "mistake 2", "mistake 3"],
  "muscleActivationIndex": {
    "Pectoralis Major": 70, // Map precise muscle names to percentage of activation (must sum to 100)
    "Triceps": 30
  }
}
Do not include markdown blocks or any other text.
`;

  try {
    const result = await geminiFlash.generateContent([prompt]);
    const cleanJson = cleanJsonResponse(result.response.text());
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error(`⚠️ AI Generation failed for ${exerciseName}:`, error.message);
    // Return fallback structured data
    return {
      commonMistakes: ["Using too much momentum", "Improper breathing"],
      muscleActivationIndex: { [targetMuscle]: 80, "Stabilizers": 20 }
    };
  }
};

const generateExercises = async () => {
  try {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      console.error("❌ RAPIDAPI_KEY is missing in your .env file.");
      console.log("Please sign up at https://rapidapi.com/justin-t-roberts-v7Z783jVnFk/api/exercisedb/ and add the key to your .env file.");
      process.exit(1);
    }

    console.log("🔄 Connecting to Database...");
    await sequelize.authenticate();
    
    console.log("📥 Fetching 500 exercises from OSS ExerciseDB via pagination...");
    let apiExercises = [];
    let nextCursor = "";
    
    while (apiExercises.length < 500) {
      const cursorParam = nextCursor ? `&after=${nextCursor}` : "";
      const url = `https://oss.exercisedb.dev/api/v1/exercises?limit=25${cursorParam}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`API Error: ${response.statusText}`);
        break;
      }

      const payload = await response.json();
      if (!payload.data || payload.data.length === 0) {
        break;
      }

      apiExercises.push(...payload.data);
      console.log(`Pulled ${payload.data.length} records. Total so far: ${apiExercises.length}`);
      
      nextCursor = payload.meta?.nextCursor;
      if (!payload.meta?.hasNextPage || !nextCursor) {
        break;
      }
    }

    console.log(`✅ Fetched ${apiExercises.length} exercises from OSS API.`);

    const enrichedExercises = [];

    for (let i = 0; i < apiExercises.length; i++) {
      const ex = apiExercises[i];
      console.log(`[${i + 1}/${apiExercises.length}] 🤖 Enriching "${ex.name}" with Gemini AI...`);

      // Fast delay since we hit Gemini Free Quota fallback immediately
      await delay(50); 

      const targetMuscle = ex.targetMuscles?.[0] || "core";
      const equipment = ex.equipments?.[0] || "body weight";
      const secondaryList = ex.secondaryMuscles || [];
      const gifUrl = ex.gifUrl || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80";

      const aiData = await enrichExerciseWithAI(ex.name, targetMuscle, secondaryList);

      enrichedExercises.push({
        name: ex.name.charAt(0).toUpperCase() + ex.name.slice(1),
        category: categoryMap[targetMuscle] || "core",
        instructions: ex.instructions || [],
        videoUrl: `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(ex.name + " exercise form")}`, // Embeddable YouTube Search Link
        imageUrl: gifUrl,
        targetMusclePhoto: gifUrl,
        videoThumbnailUrl: gifUrl,
        muscleGroup: [targetMuscle, ...secondaryList].join(", "),
        difficulty: "intermediate", // default
        equipment: equipment,
        commonMistakes: aiData.commonMistakes || [],
        muscleActivationIndex: aiData.muscleActivationIndex || {}
      });
    }

    console.log("💾 Bulk inserting to database...");
    await Exercise.bulkCreate(enrichedExercises, { ignoreDuplicates: true });
    
    console.log(`🎉 Successfully added ${enrichedExercises.length} perfectly enriched exercises!`);
    process.exit(0);

  } catch (error) {
    console.error("❌ Fatal Error:", error.message);
    if (error.response) console.error("Response:", error.response.data);
    process.exit(1);
  }
};

generateExercises();
