const mongoose = require('mongoose')

const studentAchievementSchema = new mongoose.Schema({
  email:         { type: String, required: true, lowercase: true, trim: true },
  achievementId: { type: String, required: true },
  earnedAt:      { type: Date, default: Date.now },
}, { timestamps: false })

studentAchievementSchema.index({ email: 1, achievementId: 1 }, { unique: true })

module.exports = mongoose.model('StudentAchievement', studentAchievementSchema)
