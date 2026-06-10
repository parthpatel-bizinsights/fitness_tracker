require('dotenv').config();
const { sequelize, Exercise } = require('../models');
const ytSearch = require('yt-search');

// Small delay to be polite to the search engine
const delay = (ms) => new Promise(r => setTimeout(r, ms));

const run = async () => {
  try {
    console.log("🔄 Connecting to Database...");
    await sequelize.authenticate();
    
    // Fetch all exercises that currently have the fallback "listType=search" link
    const exercises = await Exercise.findAll();
    console.log(`Found ${exercises.length} total exercises in the database.`);

    let updatedCount = 0;

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      
      // Skip if it already has a direct embed link
      if (ex.videoUrl && !ex.videoUrl.includes('listType=search') && ex.videoUrl.includes('youtube.com/embed/')) {
        console.log(`[${i+1}/${exercises.length}] Skipping "${ex.name}" (already has direct embed).`);
        continue;
      }

      console.log(`[${i+1}/${exercises.length}] 🔍 Searching YouTube for: "${ex.name}"...`);
      
      try {
        const r = await ytSearch(`${ex.name} exercise proper form tutorial`);
        const videos = r.videos;
        
        if (videos.length > 0) {
          // Get the top video ID
          const topVideoId = videos[0].videoId;
          const directEmbedUrl = `https://www.youtube.com/embed/${topVideoId}`;
          
          ex.videoUrl = directEmbedUrl;
          await ex.save();
          
          updatedCount++;
          console.log(`   ✅ Attached: ${directEmbedUrl} (${videos[0].title})`);
        } else {
          console.log(`   ⚠️ No videos found for "${ex.name}".`);
        }
      } catch (err) {
        console.error(`   ❌ Search failed for "${ex.name}":`, err.message);
      }

      // 1.5 second delay to avoid getting rate-limited by YouTube
      await delay(1500);
    }

    console.log(`🎉 Successfully updated ${updatedCount} exercises with direct YouTube video links!`);
    process.exit(0);

  } catch (error) {
    console.error("❌ Fatal Error:", error);
    process.exit(1);
  }
};

run();
