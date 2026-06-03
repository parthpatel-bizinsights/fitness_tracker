require("dotenv").config();
const app = require("./src/app");
const { sequelize } = require("./src/models");
const seedExercises = require("./src/seeders/exercises.seeder");
const seedFoods = require("./src/seeders/foods.seeder");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("🔄 Connecting to Database...");
    await sequelize.authenticate();
    console.log("✅ Database Connection has been established successfully.");

    // Sync database schemas
    console.log("🔄 Syncing Database Schemas...");
    await sequelize.sync({ alter: true });
    console.log("✅ Database synced successfully.");

    // Run seeders
    await seedExercises();
    await seedFoods();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
    });
  } catch (error) {
    console.error("❌ Unable to start backend server:", error);
    process.exit(1);
  }
};

startServer();
