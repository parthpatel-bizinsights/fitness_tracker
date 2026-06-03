const updateStreak = async (user) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const lastActiveStr = user.lastActiveDate;

  if (!lastActiveStr) {
    user.currentStreak = 1;
  } else {
    const today = new Date(todayStr);
    const lastActive = new Date(lastActiveStr);
    const diffTime = Math.abs(today - lastActive);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      user.currentStreak += 1;
    } else if (diffDays > 1) {
      user.currentStreak = 1;
    }
    // If diffDays === 0, keep same streak (already logged activity today)
  }

  user.lastActiveDate = todayStr;
  if (user.currentStreak > user.longestStreak) {
    user.longestStreak = user.currentStreak;
  }
  
  await user.save();
};

module.exports = {
  updateStreak,
};
