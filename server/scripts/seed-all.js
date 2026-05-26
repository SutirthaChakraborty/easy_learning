/**
 * seed-all.js
 *
 * Re-seeds every content collection from the JSON files.
 * Run this AFTER translate-content.js has finished.
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
const SpellEnglish  = require('../models/SpellEnglish')
const MemoryMatch   = require('../models/MemoryMatch')
const WordPuzzle    = require('../models/WordPuzzle')

const SEEDS = [
  { model: ReadScience,   file: 'read_science.json',   name: 'ReadScience'   },
  { model: ReadMaths,     file: 'read_maths.json',     name: 'ReadMaths'     },
  { model: ListenScience, file: 'listen_science.json', name: 'ListenScience' },
  { model: ListenMaths,   file: 'listen_maths.json',   name: 'ListenMaths'   },
  { model: SpeakScience,  file: 'speak_science.json',  name: 'SpeakScience'  },
  { model: SpeakMaths,    file: 'speak_maths.json',    name: 'SpeakMaths'    },
  { model: WriteScience,  file: 'write_science.json',  name: 'WriteScience'  },
  { model: WriteMaths,    file: 'write_maths.json',    name: 'WriteMaths'    },
  { model: SpellEnglish,  file: 'spell_english.json',  name: 'SpellEnglish'  },
  { model: MemoryMatch,   file: 'memory_match.json',   name: 'MemoryMatch'   },
  { model: WordPuzzle,    file: 'word_puzzle.json',    name: 'WordPuzzle'    },
]

async function seedAll() {
  console.log('Connecting to MongoDB…')
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected.\n')

  for (const { model, file, name } of SEEDS) {
    const data = require(path.join(__dirname, '../data', file))
    await model.deleteMany({})
    const inserted = await model.insertMany(data)
    console.log(`  ✓ ${name}: ${inserted.length} documents`)
  }

  await mongoose.disconnect()
  console.log('\nAll collections re-seeded. Language switching will now work for all content.')
}

seedAll().catch(err => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
