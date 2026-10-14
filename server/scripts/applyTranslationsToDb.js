/**
 * applyTranslationsToDb.js
 *
 * Pushes the `translations` field (built by mergeTranslations.js into
 * server/data/*.json) onto the matching live question documents, by `id`.
 * Only sets `translations` — no other field is touched, so this is safe to
 * run against the shared production DB and safe to re-run.
 *
 * Usage:
 *   cd server
 *   node scripts/applyTranslationsToDb.js
 */

const path = require('path')
const mongoose = require('mongoose')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const ReadMaths     = require('../models/ReadMaths')
const WriteMaths    = require('../models/WriteMaths')
const ListenMaths   = require('../models/ListenMaths')
const SpeakMaths    = require('../models/SpeakMaths')
const ReadScience   = require('../models/ReadScience')
const WriteScience  = require('../models/WriteScience')
const ListenScience = require('../models/ListenScience')
const SpeakScience  = require('../models/SpeakScience')

const TARGETS = [
  { model: ReadMaths,     file: 'math_read.json',      name: 'ReadMaths' },
  { model: WriteMaths,    file: 'math_write.json',     name: 'WriteMaths' },
  { model: ListenMaths,   file: 'math_listen.json',    name: 'ListenMaths' },
  { model: SpeakMaths,    file: 'math_speak.json',     name: 'SpeakMaths' },
  { model: ReadScience,   file: 'science_read.json',   name: 'ReadScience' },
  { model: WriteScience,  file: 'science_write.json',  name: 'WriteScience' },
  { model: ListenScience, file: 'science_listen.json', name: 'ListenScience' },
  { model: SpeakScience,  file: 'science_speak.json',  name: 'SpeakScience' },
]

async function run() {
  console.log('Connecting to MongoDB…')
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected.\n')

  for (const { model, file, name } of TARGETS) {
    const { questions } = require(path.join(__dirname, '../data', file))
    const withTranslations = questions.filter((q) => q.translations && Object.keys(q.translations).length > 0)
    if (withTranslations.length === 0) {
      console.log(`  - ${name}: no translations found in ${file}, skipping`)
      continue
    }
    const ops = withTranslations.map((q) => ({
      updateOne: { filter: { id: q.id }, update: { $set: { translations: q.translations } } },
    }))
    const result = await model.bulkWrite(ops)
    console.log(`  ✓ ${name}: matched ${result.matchedCount}, modified ${result.modifiedCount} (of ${withTranslations.length} with translations)`)
  }

  await mongoose.disconnect()
  console.log('\nDone.')
}

run().catch((err) => {
  console.error('applyTranslationsToDb failed:', err.message)
  process.exit(1)
})
