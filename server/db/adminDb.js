const mongoose = require('mongoose')

const adminDb = mongoose.createConnection(process.env.ADMIN_MONGODB_URI)

adminDb.on('connected', () => console.log('Admin DB connected'))
adminDb.on('error', (err) => console.error('Admin DB error:', err))

module.exports = adminDb
