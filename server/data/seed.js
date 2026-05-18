const path = require('path')
const mongoose = require('mongoose')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const SpellEnglish = require('../models/SpellEnglish')
const spellData    = require('./spell_english.json')

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  await SpellEnglish.deleteMany({})
  const inserted = await SpellEnglish.insertMany(spellData)
  console.log(`✓ Seeded ${inserted.length} spelling bee words`)

  await mongoose.disconnect()
  console.log('Done.')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
