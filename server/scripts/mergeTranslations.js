// One-off migration script: merges the per-language translation files
// produced in the scratchpad (tr_<lang>_<file>.json, keyed by question id)
// into server/data/<file>.json under each question's `translations.<lang>`.
// Run with: node server/scripts/mergeTranslations.js
// Safe to re-run — it overwrites translations.<lang> per question, nothing else.
const fs = require('fs')
const path = require('path')

const SCRATCH = process.env.TRANSLATION_SCRATCH_DIR
if (!SCRATCH) {
  console.error('Set TRANSLATION_SCRATCH_DIR to the scratchpad directory containing tr_<lang>_<file>.json')
  process.exit(1)
}

const LANGS = ['es', 'fr', 'pt', 'it', 'de', 'nl', 'ru', 'tr', 'zh', 'ja', 'ko', 'id', 'vi']
const FILES = [
  'math_read', 'math_write', 'math_listen', 'math_speak',
  'science_read', 'science_write', 'science_listen', 'science_speak',
]

const DATA_DIR = path.join(__dirname, '..', 'data')

for (const file of FILES) {
  const dataPath = path.join(DATA_DIR, `${file}.json`)
  const dataJson = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  const byId = new Map(dataJson.questions.map((q) => [q.id, q]))

  let updatedCount = 0
  for (const lang of LANGS) {
    const trPath = path.join(SCRATCH, `tr_${lang}_${file}.json`)
    if (!fs.existsSync(trPath)) {
      console.warn(`MISSING: ${trPath}`)
      continue
    }
    const trJson = JSON.parse(fs.readFileSync(trPath, 'utf8'))
    for (const [id, translation] of Object.entries(trJson)) {
      const q = byId.get(id)
      if (!q) { console.warn(`${file}: id ${id} in ${lang} translation not found in source data`); continue }
      q.translations = q.translations || {}
      q.translations[lang] = translation
      updatedCount++
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(dataJson, null, 1))
  console.log(`${file}: merged ${updatedCount} (question × language) translation entries`)
}
