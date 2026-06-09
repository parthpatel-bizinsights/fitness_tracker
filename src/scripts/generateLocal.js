require("dotenv").config();
const { Exercise, sequelize } = require("../models");

const categories = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'];
const difficulties = ['beginner', 'intermediate', 'advanced'];
const equipments = ['body weight', 'cable', 'dumbbell', 'barbell', 'kettlebell', 'machine', 'band'];

const baseMovements = {
  chest: ['Bench Press', 'Fly', 'Push-up', 'Dip', 'Pullover', 'Press', 'Squeeze Press'],
  back: ['Pull-up', 'Row', 'Pulldown', 'Deadlift', 'Shrug', 'Extension', 'Face Pull'],
  legs: ['Squat', 'Lunge', 'Leg Press', 'Curl', 'Extension', 'Calf Raise', 'Hip Thrust'],
  shoulders: ['Overhead Press', 'Lateral Raise', 'Front Raise', 'Upright Row', 'Reverse Fly', 'Push Press', 'Arnold Press'],
  arms: ['Bicep Curl', 'Tricep Extension', 'Hammer Curl', 'Skull Crusher', 'Preacher Curl', 'Kickback', 'Pushdown'],
  core: ['Crunch', 'Plank', 'Leg Raise', 'Russian Twist', 'Sit-up', 'Ab Wheel Rollout', 'Woodchopper'],
  cardio: ['Sprint', 'Jump Rope', 'Burpee', 'Mountain Climber', 'Jumping Jack', 'High Knees', 'Box Jump']
};

const prefixes = ['Incline', 'Decline', 'Seated', 'Standing', 'Single-Arm', 'Single-Leg', 'Alternating', 'Paused', 'Explosive', 'Tempo', 'Deficit', 'Wide-Grip', 'Close-Grip', 'Reverse-Grip', 'Banded', 'Weighted'];

const generate = async () => {
  try {
    await sequelize.authenticate();
    await Exercise.destroy({ where: {} });
    const exercises = [];
    
    for (let i = 0; i < 500; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const equip = equipments[Math.floor(Math.random() * equipments.length)];
      const diff = difficulties[Math.floor(Math.random() * difficulties.length)];
      const base = baseMovements[category][Math.floor(Math.random() * baseMovements[category].length)];
      const prefix1 = prefixes[Math.floor(Math.random() * prefixes.length)];
      const prefix2 = Math.random() > 0.5 ? prefixes[Math.floor(Math.random() * prefixes.length)] : '';
      
      const finalName = Array.from(new Set([prefix1, prefix2, equip, base])).filter(Boolean).join(' ');

      exercises.push({
        name: finalName,
        category: category,
        instructions: [
          'Maintain proper posture and alignment throughout the movement.',
          'Engage your core to stabilize your spine.',
          'Execute the concentric phase with power.',
          'Control the eccentric phase for 2-3 seconds.'
        ],
        videoUrl: `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(finalName + ' exercise form')}`,
        imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
        targetMusclePhoto: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=80',
        videoThumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
        muscleGroup: category,
        difficulty: diff,
        equipment: equip,
        commonMistakes: ['Rushing the negative phase', 'Using momentum to lift the weight'],
        muscleActivationIndex: { [category]: 85, 'Stabilizers': 15 }
      });
    }

    const uniqueExercises = Array.from(new Map(exercises.map(item => [item.name, item])).values());
    await Exercise.bulkCreate(uniqueExercises, { ignoreDuplicates: true });
    
    console.log(`✅ Inserted ${uniqueExercises.length} completely randomized exercises!`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

generate();
