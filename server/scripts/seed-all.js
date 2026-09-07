/**
 * seed-all.js
 *
 * Re-seeds the Maths/Science content collections from the new JSON files
 * (English collections are seeded via their own POST /seed endpoints, as
 * before). Existing org-uploaded questions (uploadBatchId set) are left
 * untouched — only the uploadBatchId:null dev/seed set is replaced.
 *
 * Usage:
 *   cd server
 *   node scripts/seed-all.js
 */

const path = require('path')
const mongoose = require('mongoose')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

// Models
const ReadScience   = require('../models/ReadScience')
const ReadMaths     = require('../models/ReadMaths')
const ListenScience = require('../models/ListenScience')
const ListenMaths   = require('../models/ListenMaths')
const SpeakScience  = require('../models/SpeakScience')
const SpeakMaths    = require('../models/SpeakMaths')
const WriteScience  = require('../models/WriteScience')
const WriteMaths    = require('../models/WriteMaths')

const SEEDS = [
  { model: ReadScience,   file: 'science_read.json',   name: 'ReadScience'   },
  { model: ReadMaths,     file: 'math_read.json',       name: 'ReadMaths'     },
  { model: ListenScience, file: 'science_listen.json', name: 'ListenScience' },
  { model: ListenMaths,   file: 'math_listen.json',     name: 'ListenMaths'   },
  { model: SpeakScience,  file: 'science_speak.json',  name: 'SpeakScience'  },
  { model: SpeakMaths,    file: 'math_speak.json',      name: 'SpeakMaths'    },
  { model: WriteScience,  file: 'science_write.json',  name: 'WriteScience'  },
  { model: WriteMaths,    file: 'math_write.json',      name: 'WriteMaths'    },
]

async function seedAll() {
  console.log('Connecting to MongoDB…')
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected.\n')

  for (const { model, file, name } of SEEDS) {
    const { questions } = require(path.join(__dirname, '../data', file))
    await model.deleteMany({ uploadBatchId: null })
    const inserted = await model.insertMany(questions)
    console.log(`  ✓ ${name}: ${inserted.length} documents`)
  }

  await mongoose.disconnect()
  console.log('\nAll collections re-seeded.')
}

seedAll().catch(err => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
