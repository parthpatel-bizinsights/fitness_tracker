const cron = require("node-cron");
const webpush = require("web-push");
const { User } = require("../models");
const { Op } = require("sequelize");

const initCronJobs = () => {
  // Run every day at 18:00 (6:00 PM) to remind users
  cron.schedule("0 18 * * *", async () => {
    console.log("[Cron] Running daily streak reminder job...");
    try {
      const today = new Date().toISOString().split("T")[0];

      // Find users who haven't been active today and have a push subscription
      const usersToRemind = await User.findAll({
        where: {
          pushSubscription: {
            [Op.not]: null,
          },
          [Op.or]: [
            { lastActiveDate: { [Op.lt]: today } },
            { lastActiveDate: null }
          ]
        }
      });

      console.log(`[Cron] Found ${usersToRemind.length} users to remind.`);

      for (const user of usersToRemind) {
        const payload = JSON.stringify({
          title: "Keep your streak alive! 🔥",
          body: `Hey ${user.fullName}, don't forget to log your workout or nutrition today!`,
          url: "/dashboard"
        });

        try {
          await webpush.sendNotification(user.pushSubscription, payload);
        } catch (error) {
          console.error(`[Cron] Failed to send push to user ${user.id}:`, error.message);
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription expired or invalid, remove it
            user.pushSubscription = null;
            await user.save();
          }
        }
      }
    } catch (err) {
      console.error("[Cron] Error running daily streak job:", err);
    }
  });
};

module.exports = initCronJobs;
