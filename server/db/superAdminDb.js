const mongoose = require('mongoose')

const superAdminDb = mongoose.createConnection(process.env.SUPERADMIN_MONGODB_URI)

superAdminDb.on('connected', () => console.log('Super Admin DB connected'))
superAdminDb.on('error', (err) => console.error('Super Admin DB error:', err))

module.exports = superAdminDb
