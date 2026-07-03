const StudentActivity = require('../models/StudentActivity')
const StudentAnswer = require('../models/StudentAnswer')
const StudentRound = require('../models/StudentRound')
const StudentAchievement = require('../models/StudentAchievement')

// Aggregates the learning-side performance data (default DB, keyed by email) for a
// given student email, whether the lookup is initiated by an org admin or the super admin.
async function getPerformanceForEmail(email) {
  if (!email) {
    return {
      linked: false,
      totalXP: 0, totalMinutes: 0, totalSessions: 0,
      averageScore: 0, achievementCount: 0, recentRounds: [],
    }
  }

  const [activity, achievements, rounds] = await Promise.all([
    StudentActivity.find({ email }).lean(),
    StudentAchievement.find({ email }).lean(),
    StudentRound.find({ email }).sort({ completedAt: -1 }).limit(10).lean(),
  ])

  const totalXP = activity.reduce((s, a) => s + a.totalXP, 0)
  const totalMinutes = activity.reduce((s, a) => s + a.totalMinutes, 0)
  const totalSessions = activity.reduce((s, a) => s + a.totalSessions, 0)

  let scoreSum = 0
  let scoreCount = 0
  activity.forEach((day) => {
    day.sessions.forEach((s) => {
      scoreSum += s.score || 0
      scoreCount += 1
    })
  })
  const averageScore = scoreCount ? Math.round(scoreSum / scoreCount) : 0

  return {
    linked: activity.length > 0 || achievements.length > 0 || rounds.length > 0,
    totalXP, totalMinutes, totalSessions, averageScore,
    achievementCount: achievements.length,
    recentRounds: rounds,
  }
}

module.exports = { getPerformanceForEmail }
