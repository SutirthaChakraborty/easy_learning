/**
 * backfill-question-status.js
 *
 * One-off migration for the teacher-upload feature. Run ONCE, before the
 * status:'approved' filter is deployed on the module read endpoints —
 * otherwise every existing question disappears from student rounds, since a
 * missing `status` field never matches a `{status:'approved'}` query filter.
 *
 * - Sets status:'approved' (+submittedBy/uploadBatchId: null) on every
 *   existing document across the 12 question collections.
 * - Seeds a Counter doc per collection at the current max `id`, so the first
 *   teacher-uploaded row in each collection starts numbering above it.
 *
 * Idempotent — safe to re-run (only touches docs missing `status`).
 *
 * Usage:
 *   cd server
 *   node scripts/backfill-question-status.js
 */

const path = require('path')
const mongoose = require('mongoose')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const Counter = require('../models/Counter')
const { questionModels } = require('../utils/questionModels')

async function backfill() {
  console.log('Connecting to MongoDB…')
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected.\n')

  for (const [module, subjects] of Object.entries(questionModels)) {
    for (const [subject, Model] of Object.entries(subjects)) {
      const name = Model.modelName

      const result = await Model.updateMany(
        { status: { $exists: false } },
        { $set: { status: 'approved', submittedBy: null, uploadBatchId: null } }
      )

      const maxDoc = await Model.findOne().sort({ id: -1 }).select('id')
      const maxId = maxDoc?.id || 0
      await Counter.findOneAndUpdate(
        { _id: name },
        { $max: { seq: maxId } },
        { upsert: true }
      )

      console.log(`  ✓ ${name} (${module}/${subject}): backfilled ${result.modifiedCount} docs, counter set to >= ${maxId}`)
    }
  }

  await mongoose.disconnect()
  console.log('\nBackfill complete. Safe to deploy the status:\'approved\' read filter now.')
}

backfill().catch((err) => {
  console.error('Backfill failed:', err.message)
  process.exit(1)
})
