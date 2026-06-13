const StudentActivity   = require('../models/StudentActivity')
const StudentAchievement = require('../models/StudentAchievement')
const StudentAnswer      = require('../models/StudentAnswer')

// ── Achievement definitions ────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: 'first_step',      name: 'First Step',      icon: '🌟', description: 'Complete your first lesson', category: 'learning', xp: 10 },
  { id: 'bookworm',        name: 'Bookworm',         icon: '📚', description: 'Complete 5 reading lessons', category: 'learning', xp: 25 },
  { id: 'sharp_ears',      name: 'Sharp Ears',       icon: '👂', description: 'Complete 5 listening lessons', category: 'learning', xp: 25 },
  { id: 'penpal',          name: 'Penpal',           icon: '✍️', description: 'Complete 5 writing lessons', category: 'learning', xp: 25 },
  { id: 'public_speaker',  name: 'Public Speaker',   icon: '🎤', description: 'Complete 5 speaking lessons', category: 'learning', xp: 25 },
  { id: 'all_rounder',     name: 'All-Rounder',      icon: '🌈', description: 'Try all 3 subjects', category: 'learning', xp: 40 },
  { id: 'gamer',           name: 'Gamer',            icon: '🎮', description: 'Play any game', category: 'games', xp: 15 },
  { id: 'spelling_bee',    name: 'Spelling Bee',     icon: '🐝', description: 'Complete the Spelling game', category: 'games', xp: 30 },
  { id: 'memory_master',   name: 'Memory Master',    icon: '🧠', description: 'Complete the Memory Match game', category: 'games', xp: 30 },
  { id: 'puzzle_whiz',     name: 'Puzzle Whiz',      icon: '🧩', description: 'Solve a Word Puzzle', category: 'games', xp: 30 },
  { id: 'three_day_streak', name: 'On Fire',         icon: '🔥', description: 'Active 3 days in a row', category: 'streak', xp: 50 },
  { id: 'week_warrior',    name: 'Week Warrior',     icon: '⚔️', description: 'Active 7 days in a row', category: 'streak', xp: 100 },
  { id: 'century',         name: 'Century',          icon: '💯', description: 'Earn 100 XP', category: 'xp', xp: 0 },
  { id: 'champion',        name: 'Champion',         icon: '🏆', description: 'Earn 500 XP', category: 'xp', xp: 0 },
  { id: 'early_bird',      name: 'Early Bird',       icon: '🐦', description: 'Study before 8 AM', category: 'special', xp: 20 },
  { id: 'night_owl',       name: 'Night Owl',        icon: '🦉', description: 'Study after 9 PM', category: 'special', xp: 20 },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function midnight(d = new Date()) {
  const dt = new Date(d)
  dt.setUTCHours(0, 0, 0, 0)
  return dt
}

function calcStreak(activityDocs) {
  if (!activityDocs.length) return 0
  const dates = activityDocs
    .map(a => midnight(a.date).getTime())
    .sort((a, b) => b - a)

  const todayMs = midnight().getTime()
  let streak = 0
  for (let i = 0; i < dates.length; i++) {
    const expected = todayMs - i * 86400000
    if (dates[i] === expected) streak++
    else break
  }
  return streak
}

async function checkAndAwardAchievements(email) {
  const [allActivity, earned] = await Promise.all([
    StudentActivity.find({ email }),
    StudentAchievement.find({ email }).select('achievementId'),
  ])
  const earnedSet = new Set(earned.map(a => a.achievementId))

  const totalSessions = allActivity.reduce((s, a) => s + a.totalSessions, 0)
  const totalXP       = allActivity.reduce((s, a) => s + a.totalXP, 0)

  const moduleCounts = {}
  const subjects = new Set()
  const hours = []
  allActivity.forEach(day => {
    day.sessions.forEach(s => {
      moduleCounts[s.module] = (moduleCounts[s.module] || 0) + 1
      if (s.subject && s.subject !== 'general') subjects.add(s.subject)
      if (s.startTime) hours.push(new Date(s.startTime).getUTCHours())
    })
  })

  const streak = calcStreak(allActivity)

  const newAchievements = []
  const award = async (id) => {
    if (!earnedSet.has(id)) {
      try {
        await StudentAchievement.create({ email, achievementId: id, earnedAt: new Date() })
        newAchievements.push(id)
      } catch (_) {}
    }
  }

  if (totalSessions >= 1)  await award('first_step')
  if ((moduleCounts['read']  || 0) >= 5) await award('bookworm')
  if ((moduleCounts['listen'] || 0) >= 5) await award('sharp_ears')
  if ((moduleCounts['write'] || 0) >= 5) await award('penpal')
  if ((moduleCounts['speak'] || 0) >= 5) await award('public_speaker')
  if (subjects.size >= 3)  await award('all_rounder')

  const gameCount = (moduleCounts['spelling'] || 0) + (moduleCounts['memory'] || 0) + (moduleCounts['puzzle'] || 0)
  if (gameCount >= 1)                     await award('gamer')
  if ((moduleCounts['spelling'] || 0) >= 1) await award('spelling_bee')
  if ((moduleCounts['memory']  || 0) >= 1) await award('memory_master')
  if ((moduleCounts['puzzle']  || 0) >= 1) await award('puzzle_whiz')

  if (streak >= 3) await award('three_day_streak')
  if (streak >= 7) await award('week_warrior')
  if (totalXP >= 100) await award('century')
  if (totalXP >= 500) await award('champion')

  if (hours.some(h => h < 8))  await award('early_bird')
  if (hours.some(h => h >= 21)) await award('night_owl')

  return newAchievements
}

// ── Controllers ────────────────────────────────────────────────────────────────

const logSession = async (req, res) => {
  try {
    const { email } = req.user
    const { module: mod, subject, durationMinutes, xpEarned, score, startTime } = req.body

    if (!mod) return res.status(400).json({ success: false, message: 'module is required' })

    const now     = new Date()
    const start   = startTime ? new Date(startTime) : new Date(now - (durationMinutes || 1) * 60000)
    const dayKey  = midnight(now)

    const sessionEntry = {
      startTime: start,
      endTime: now,
      durationMinutes: durationMinutes || 0,
      module: mod,
      subject: subject || 'general',
      xpEarned: xpEarned || 0,
      score: score || 0,
    }

    await StudentActivity.findOneAndUpdate(
      { email, date: dayKey },
      {
        $push: { sessions: sessionEntry },
        $inc: {
          totalMinutes: durationMinutes || 0,
          totalXP: xpEarned || 0,
          totalSessions: 1,
        },
      },
      { upsert: true, new: true }
    )

    const newAchievements = await checkAndAwardAchievements(email)
    res.json({ success: true, newAchievements })
  } catch (err) {
    console.error('logSession error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getStats = async (req, res) => {
  try {
    const { email } = req.user
    const [allActivity, achievements] = await Promise.all([
      StudentActivity.find({ email }),
      StudentAchievement.find({ email }),
    ])

    const totalXP       = allActivity.reduce((s, a) => s + a.totalXP, 0)
    const totalMinutes  = allActivity.reduce((s, a) => s + a.totalMinutes, 0)
    const totalSessions = allActivity.reduce((s, a) => s + a.totalSessions, 0)
    const streak        = calcStreak(allActivity)

    const todayDoc = allActivity.find(a => midnight(a.date).getTime() === midnight().getTime())
    const todayMinutes = todayDoc?.totalMinutes || 0
    const todayXP      = todayDoc?.totalXP || 0

    const hourBuckets = new Array(24).fill(0)
    allActivity.forEach(day => {
      day.sessions.forEach(s => {
        if (s.startTime) hourBuckets[new Date(s.startTime).getHours()]++
      })
    })
    const maxHour = hourBuckets.indexOf(Math.max(...hourBuckets))
    const peakLabel = `${maxHour % 12 || 12}${maxHour < 12 ? 'AM' : 'PM'} – ${(maxHour + 2) % 12 || 12}${(maxHour + 2) < 12 ? 'AM' : 'PM'}`

    const level = Math.floor(totalXP / 100) + 1

    res.json({
      success: true,
      data: {
        totalXP, totalMinutes, totalSessions, streak,
        todayMinutes, todayXP,
        peakTimeLabel: hourBuckets.every(b => b === 0) ? null : peakLabel,
        level,
        achievementCount: achievements.length,
      },
    })
  } catch (err) {
    console.error('getStats error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getActivity = async (req, res) => {
  try {
    const { email } = req.user
    let dateFilter

    if (req.query.year) {
      const y = parseInt(req.query.year)
      dateFilter = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) }
    } else {
      const days = parseInt(req.query.days) || 365
      const since = new Date()
      since.setDate(since.getDate() - days)
      dateFilter = { $gte: since }
    }

    const activity = await StudentActivity.find({ email, date: dateFilter })
      .select('date totalMinutes totalXP totalSessions')
      .lean()

    res.json({ success: true, data: activity })
  } catch (err) {
    console.error('getActivity error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getAchievements = async (req, res) => {
  try {
    const { email } = req.user
    const earned = await StudentAchievement.find({ email }).lean()
    const earnedMap = {}
    earned.forEach(a => { earnedMap[a.achievementId] = a.earnedAt })

    const result = ACHIEVEMENTS.map(def => ({
      ...def,
      earned: !!earnedMap[def.id],
      earnedAt: earnedMap[def.id] || null,
    }))

    res.json({ success: true, data: result })
  } catch (err) {
    console.error('getAchievements error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getPerformance = async (req, res) => {
  try {
    const { email } = req.user
    const days = parseInt(req.query.days) || 30
    const since = new Date()
    since.setDate(since.getDate() - days)

    const activity = await StudentActivity.find({ email, date: { $gte: since } })
      .select('date totalXP totalSessions totalMinutes')
      .sort({ date: 1 })
      .lean()

    res.json({ success: true, data: activity })
  } catch (err) {
    console.error('getPerformance error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const logAnswer = async (req, res) => {
  try {
    const { email } = req.user
    const { module: mod, subject, question, userAnswer, correctAnswer, correct, xpEarned, timeTaken, mode } = req.body
    await StudentAnswer.create({
      email,
      module: mod || 'unknown',
      subject: subject || 'general',
      question: question || '',
      userAnswer: userAnswer || '',
      correctAnswer: correctAnswer || '',
      correct: !!correct,
      xpEarned: xpEarned || 0,
      timeTaken: (typeof timeTaken === 'number' && timeTaken > 0) ? timeTaken : null,
      mode: mode || 'practice',
    })
    res.json({ success: true })
  } catch (err) {
    console.error('logAnswer error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getAnswers = async (req, res) => {
  try {
    const { email } = req.user
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const answers = await StudentAnswer.find({ email })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean()
    res.json({ success: true, data: answers })
  } catch (err) {
    console.error('getAnswers error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getModuleStars = async (req, res) => {
  try {
    const { email } = req.user
    const activity = await StudentActivity.find({ email }).select('sessions').lean()

    const totals = {}
    activity.forEach(day => {
      day.sessions.forEach(s => {
        const key = s.subject && s.subject !== 'general'
          ? `${s.module}_${s.subject}`
          : s.module
        if (!totals[key]) totals[key] = { sum: 0, count: 0 }
        totals[key].sum += (s.score || 0)
        totals[key].count += 1
      })
    })

    const stars = {}
    Object.entries(totals).forEach(([key, { sum, count }]) => {
      const avg = sum / count
      stars[key] = avg >= 84 ? 3 : avg >= 66 ? 2 : avg >= 33 ? 1 : 0
    })

    res.json({ success: true, data: stars })
  } catch (err) {
    console.error('getModuleStars error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { logSession, getStats, getActivity, getAchievements, getPerformance, getModuleStars, logAnswer, getAnswers }
