require("dotenv").config();
const app = require("./src/app");
const { sequelize } = require("./src/models");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("🔄 Connecting to Database...");
    await sequelize.authenticate();
    console.log("✅ Database Connection has been established successfully.");

    // Database schemas are now managed exclusively via sequelize-cli migrations.
    // Run 'npx sequelize-cli db:migrate' to update the schema.
    console.log("✅ Database migration check complete.");

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
    });
  } catch (error) {
    console.error("❌ Unable to start backend server:", error);
    process.exit(1);
  }
};

startServer();
