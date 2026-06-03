const { Exercise } = require("../models");

// High quality fallback exercises in case the external API is offline
const FALLBACK_EXERCISES = [
  {
    name: "Barbell Bench Press",
    category: "chest",
    instructions: [
      "Lie flat on a bench with your grip slightly wider than shoulder-width.",
      "Unrack the bar and lower it smoothly to your mid-chest.",
      "Push the bar back up explosively to starting position while keeping your feet planted."
    ],
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=80",
    muscleGroup: "Pectorals, Triceps, Anterior Deltoids",
    difficulty: "intermediate",
    equipment: "barbell, bench"
  },
  {
    name: "Dumbbell Flyes",
    category: "chest",
    instructions: [
      "Lie on a flat bench holding dumbbells above your chest with palms facing each other.",
      "With slightly bent elbows, lower your arms out to the sides in a wide arc.",
      "Bring the weights back together at the top using your chest muscles."
    ],
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=80",
    muscleGroup: "Pectorals",
    difficulty: "beginner",
    equipment: "dumbbells, bench"
  },
  {
    name: "Pull-Ups",
    category: "back",
    instructions: [
      "Hang from a pull-up bar with an overhand grip wider than shoulder-width.",
      "Pull your body up until your chin clears the bar, pulling your elbows down.",
      "Lower yourself under control to a full hang."
    ],
    imageUrl: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600&auto=format&fit=crop&q=80",
    muscleGroup: "Lats, Rhomboids, Biceps",
    difficulty: "advanced",
    equipment: "pull-up bar"
  },
  {
    name: "Bent-Over Barbell Row",
    category: "back",
    instructions: [
      "Hold a barbell with an overhand grip, bend at your hips keeping your back flat.",
      "Pull the bar up towards your lower chest/abdomen, squeezing your shoulder blades.",
      "Lower the bar back to the starting position slowly."
    ],
    imageUrl: "https://images.unsplash.com/photo-1605296867304-46d5465a25f1?w=600&auto=format&fit=crop&q=80",
    muscleGroup: "Middle and Upper Back, Lats, Biceps",
    difficulty: "intermediate",
    equipment: "barbell"
  },
  {
    name: "Barbell Back Squat",
    category: "legs",
    instructions: [
      "Rest the barbell on your upper back, feet shoulder-width apart, toes slightly out.",
      "Hinge at your hips and bend your knees to lower your body as if sitting in a chair.",
      "Drive back up to the starting position through your heels."
    ],
    imageUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80",
    muscleGroup: "Quadriceps, Glutes, Hamstrings",
    difficulty: "intermediate",
    equipment: "barbell, squat rack"
  },
  {
    name: "Romanian Deadlift",
    category: "legs",
    instructions: [
      "Stand holding dumbbells or a barbell at hip level.",
      "Push your hips back and lower the weight along your shins with a flat back.",
      "Squeeze your glutes and hamstrings to return upright."
    ],
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80",
    muscleGroup: "Hamstrings, Glutes, Lower Back",
    difficulty: "intermediate",
    equipment: "barbell or dumbbells"
  },
  {
    name: "Overhead Dumbbell Press",
    category: "shoulders",
    instructions: [
      "Sit or stand holding dumbbells at shoulder level with palms facing forward.",
      "Press the weights straight up overhead until your arms are fully extended.",
      "Lower the dumbbells back to shoulder height slowly."
    ],
    imageUrl: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&auto=format&fit=crop&q=80",
    muscleGroup: "Deltoids, Triceps",
    difficulty: "beginner",
    equipment: "dumbbells"
  },
  {
    name: "Dumbbell Lateral Raise",
    category: "shoulders",
    instructions: [
      "Stand with dumbbells at your sides, chest out, slight bend in elbows.",
      "Raise the weights out to your sides until your arms are parallel to the floor.",
      "Lower back down slowly with control."
    ],
    imageUrl: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&auto=format&fit=crop&q=80",
    muscleGroup: "Lateral Deltoids",
    difficulty: "beginner",
    equipment: "dumbbells"
  },
  {
    name: "Incline Dumbbell Bicep Curl",
    category: "arms",
    instructions: [
      "Sit on an incline bench at 45 degrees, arms hanging straight down with dumbbells.",
      "Curl the weights up while keeping your elbows stationary.",
      "Slowly lower back down to a full stretch."
    ],
    imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80",
    muscleGroup: "Biceps brachii",
    difficulty: "beginner",
    equipment: "dumbbells, incline bench"
  },
  {
    name: "Tricep Overhead Extension",
    category: "arms",
    instructions: [
      "Hold a dumbbell with both hands overhead.",
      "Lower the weight behind your head by bending your elbows.",
      "Extend your elbows to raise the weight back to the top."
    ],
    imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80",
    muscleGroup: "Triceps brachii",
    difficulty: "beginner",
    equipment: "dumbbell"
  },
  {
    name: "Hanging Knee Raise",
    category: "core",
    instructions: [
      "Hang from a pull-up bar with straight arms.",
      "Raise your knees toward your chest by flexing your hips and curling your pelvis.",
      "Slowly lower back down to avoid swinging."
    ],
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80",
    muscleGroup: "Abs, Hip Flexors",
    difficulty: "intermediate",
    equipment: "pull-up bar"
  },
  {
    name: "Plank",
    category: "core",
    instructions: [
      "Place your forearms on the floor, elbows under shoulders, body in a straight line.",
      "Engage your abs, glutes, and quad muscles.",
      "Hold the position while breathing normally."
    ],
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80",
    muscleGroup: "Core, Shoulders",
    difficulty: "beginner",
    equipment: "bodyweight"
  }
];

const seedExercises = async () => {
  try {
    console.log("🌱 Seeding exercises...");
    
    // Check if exercises already exist
    const count = await Exercise.count();
    if (count > 10) {
      console.log(`✅ Exercises already seeded (${count} exercises total). Skipping.`);
      return;
    }

    let seededList = [...FALLBACK_EXERCISES];

    try {
      console.log("📡 Fetching additional exercises from wger.de API...");
      const response = await fetch("https://wger.de/api/v2/exercise/?format=json&language=2&limit=100&offset=0");
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const wgerCategoriesMap = {
            10: "chest",
            8: "arms",
            9: "legs",
            12: "back",
            13: "shoulders",
            14: "core",
            15: "cardio"
          };

          const apiExercises = data.results
            .filter(item => item.name && item.description)
            .map(item => {
              // Extract instructions from HTML-like text
              const instructionsClean = item.description
                .replace(/<[^>]*>/g, " ")
                .split(".")
                .map(s => s.trim())
                .filter(s => s.length > 5);

              const categoryKey = wgerCategoriesMap[item.category] || "core";

              return {
                name: item.name,
                category: categoryKey,
                instructions: instructionsClean.length > 0 ? instructionsClean : ["Execute exercise slowly maintaining correct form."],
                imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80",
                muscleGroup: item.muscles_secondary?.join(", ") || item.muscles?.join(", ") || "Target Muscles",
                difficulty: "intermediate",
                equipment: "gym equipment"
              };
            });

          seededList = [...seededList, ...apiExercises];
          console.log(`Fetched ${apiExercises.length} extra exercises from wger.de successfully.`);
        }
      }
    } catch (fetchError) {
      console.warn("⚠️ Failed to fetch from wger.de API, using fallback high quality seeds only.", fetchError.message);
    }

    // Insert into database
    await Exercise.bulkCreate(seededList, { ignoreDuplicates: true });
    console.log(`✅ Seeded ${seededList.length} exercises successfully.`);
  } catch (error) {
    console.error("❌ Error seeding exercises:", error);
  }
};

module.exports = seedExercises;
