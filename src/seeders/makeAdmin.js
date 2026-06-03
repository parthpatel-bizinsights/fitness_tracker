/**
 * Super Admin Seeder
 * Run: node src/seeders/makeAdmin.js <email>
 * Example: node src/seeders/makeAdmin.js admin@fitnessapp.com
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const { User, sequelize } = require("../models");

const email = process.argv[2];

if (!email) {
  console.error("❌  Usage: node src/seeders/makeAdmin.js <email>");
  process.exit(1);
}

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅  Database connected.");

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.error(`❌  No user found with email: ${email}`);
      process.exit(1);
    }

    if (user.role === "superadmin") {
      console.log(`⚠️   User "${user.fullName}" is already a superadmin.`);
      process.exit(0);
    }

    user.role = "superadmin";
    await user.save();

    console.log(`✅  Successfully promoted "${user.fullName}" (${email}) to superadmin!`);
    console.log("    You can now log in at /admin with this account.");
    process.exit(0);
  } catch (error) {
    console.error("❌  Error:", error.message);
    process.exit(1);
  }
})();
