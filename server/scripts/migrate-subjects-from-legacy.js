/**
 * migrate-subjects-from-legacy.js
 *
 * One-time migration: seeds each organization's Subject catalog (English/Maths/Science)
 * and creates additional Subject docs from any legacy free-text Tutor.subject / Batch.subject
 * values that don't already match. Does NOT attempt to infer batch-subject-teacher
 * assignments — there's no reliable way to reconstruct those from a single free-text field.
 *
 * Usage:
 *   cd server
 *   node scripts/migrate-subjects-from-legacy.js
 */

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const adminDb = require('../db/adminDb')
const Organization = require('../models/admin/Organization')
const Tutor = require('../models/admin/Tutor')
const Batch = require('../models/admin/Batch')
const Subject = require('../models/admin/Subject')
const { ensureDefaultSubjects } = require('../services/batchService')

function slugify(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function waitForConnection(conn) {
  if (conn.readyState === 1) return Promise.resolve()
  return new Promise((resolve, reject) => {
    conn.once('connected', resolve)
    conn.once('error', reject)
  })
}

async function migrateOrg(org) {
  await ensureDefaultSubjects(org._id)

  const [tutors, batches] = await Promise.all([
    Tutor.find({ orgId: org._id, subject: { $ne: '' } }).select('subject'),
    Batch.find({ orgId: org._id, subject: { $ne: '' } }).select('subject'),
  ])

  const rawNames = [...tutors.map((t) => t.subject), ...batches.map((b) => b.subject)]
    .map((s) => (s || '').trim())
    .filter(Boolean)

  if (rawNames.length === 0) return 0

  const existingSubjects = await Subject.find({ orgId: org._id })
  const existingLowerNames = new Set(existingSubjects.map((s) => s.name.toLowerCase()))

  let created = 0
  const seenThisRun = new Set()
  for (const rawName of rawNames) {
    const key = rawName.toLowerCase()
    if (existingLowerNames.has(key) || seenThisRun.has(key)) continue
    seenThisRun.add(key)
    await Subject.create({ name: rawName, code: slugify(rawName), orgId: org._id, isDefault: false })
    created += 1
  }
  return created
}

async function run() {
  await waitForConnection(adminDb)

  const orgs = await Organization.find({})
  console.log(`Found ${orgs.length} organization(s)`)

  for (const org of orgs) {
    const created = await migrateOrg(org)
    console.log(`  ${org.name} (${org._id}): ${created} subject(s) created from legacy text`)
  }

  await adminDb.close()
  console.log('Done.')
  process.exit(0)
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
