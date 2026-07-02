/**
 * translate-content.js
 *
 * One-time script: translates all content JSON files into 20 languages
 * using Google Translate's free unofficial API (no API key required).
 *
 * Usage:
 *   cd server
 *   node scripts/translate-content.js
 *
 * The script is resumable — already-translated items are skipped.
 * After it finishes, run:  node scripts/seed-all.js
 */

const translate = require('google-translate-api-x')
const fs  = require('fs')
const path = require('path')

const LANGS = [
  'hi','bn','mr','ta','te','ur',
  'es','pt','fr','it','de','nl',
  'ru','tr','ar','zh','ja','ko','id','vi'
]

const DATA_DIR = path.join(__dirname, '../data')
const DELAY    = 350  // ms between API calls — increase to 600 if you get errors

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ─── Core translate helper ─────────────────────────────────────────────────

async function tx(texts, lang, attempt = 1) {
  await sleep(DELAY)
  const isArray = Array.isArray(texts)
  try {
    const res = await translate(isArray ? texts : [texts], { from: 'en', to: lang })
    const out = Array.isArray(res) ? res.map(r => r.text) : [res.text]
    return isArray ? out : out[0]
  } catch (err) {
    if (attempt < 3) {
      await sleep(1500 * attempt)
      return tx(texts, lang, attempt + 1)
    }
    console.error(`    ! [${lang}] failed after retries: ${err.message}`)
    return isArray ? texts : texts  // fallback: keep originals
  }
}

// ─── READ files ────────────────────────────────────────────────────────────
// translations[lang] = { title, content, question, options[], answer }
// Strategy: batch 5 items × 7 fields = 35 strings per API call per language

async function processReadFile(filename) {
  const fp   = path.join(DATA_DIR, filename)
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'))
  console.log(`\n📖  ${filename}  (${data.length} items)`)

  const CHUNK = 5 // items per batch

  for (const lang of LANGS) {
    const pending = data.filter(item => !item.translations?.[lang])
    if (pending.length === 0) { process.stdout.write(` [${lang}]✓`); continue }

    for (let c = 0; c < pending.length; c += CHUNK) {
      const chunk = pending.slice(c, c + CHUNK)

      // Build flat array: [title1,content1,q1,o1a,o1b,o1c,ans1, title2,...]
      const flat = []
      const lens = []
      for (const item of chunk) {
        const fields = [item.title, item.content, item.question, ...item.options, item.answer]
        flat.push(...fields)
        lens.push(fields.length)
      }

      const translated = await tx(flat, lang)

      // Reconstruct
      let idx = 0
      for (let i = 0; i < chunk.length; i++) {
        const item = chunk[i]
        if (!item.translations) item.translations = {}
        const t = translated.slice(idx, idx + lens[i])
        const nOpts = item.options.length
        item.translations[lang] = {
          title:    t[0],
          content:  t[1],
          question: t[2],
          options:  t.slice(3, 3 + nOpts),
          answer:   t[3 + nOpts],
        }
        idx += lens[i]
      }

      process.stdout.write(` [${lang}:${c + chunk.length}/${pending.length}]`)
    }
    process.stdout.write('\n')
  }

  fs.writeFileSync(fp, JSON.stringify(data, null, 2))
  console.log(`  ✓ written → ${filename}`)
}

// ─── SIMPLE files ──────────────────────────────────────────────────────────
// translations[lang] = "translated string"
// Strategy: batch all pending items for a language in chunks of 20

async function processSimpleFile(filename, field) {
  const fp   = path.join(DATA_DIR, filename)
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'))
  console.log(`\n📄  ${filename}  field:"${field}"  (${data.length} items)`)

  const CHUNK = 20

  for (const lang of LANGS) {
    const pending = data.filter(item => !item.translations?.[lang])
    if (pending.length === 0) { process.stdout.write(` [${lang}]✓`); continue }

    const allTrans = []
    for (let c = 0; c < pending.length; c += CHUNK) {
      const texts = pending.slice(c, c + CHUNK).map(item => item[field])
      const res   = await tx(texts, lang)
      allTrans.push(...(Array.isArray(res) ? res : [res]))
    }

    pending.forEach((item, i) => {
      if (!item.translations) item.translations = {}
      item.translations[lang] = allTrans[i]
    })

    process.stdout.write(` [${lang}:${pending.length}]`)
  }

  process.stdout.write('\n')
  fs.writeFileSync(fp, JSON.stringify(data, null, 2))
  console.log(`  ✓ written → ${filename}`)
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  Learningo — Content Translation Script (Free)')
  console.log(`  Languages (${LANGS.length}): ${LANGS.join(', ')}`)
  console.log(`  Delay: ${DELAY}ms  |  Resumable: yes`)
  console.log('═══════════════════════════════════════════════════════')

  // ── Read modules (complex: title + content + question + options + answer)
  await processReadFile('read_science.json')
  await processReadFile('read_maths.json')

  // ── Listen modules (single: sentence)
  await processSimpleFile('listen_science.json', 'sentence')
  await processSimpleFile('listen_maths.json',   'sentence')

  // ── Speak modules (single: text)
  await processSimpleFile('speak_science.json', 'text')
  await processSimpleFile('speak_maths.json',   'text')

  // ── Write modules (single: hint)
  await processSimpleFile('write_science.json', 'hint')
  await processSimpleFile('write_maths.json',   'hint')

  // ── Spelling game (single: hint — English word stays unchanged)
  await processSimpleFile('spell_english.json', 'hint')

  // ── Memory Match game (single: label)
  await processSimpleFile('memory_match.json', 'label')

  // ── Word Puzzle game (single: hint — English word stays unchanged)
  await processSimpleFile('word_puzzle.json', 'hint')

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  ✅  All files translated!')
  console.log('\n  Next step — re-seed your database:')
  console.log('    node scripts/seed-all.js')
  console.log('═══════════════════════════════════════════════════════\n')
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message)
  process.exit(1)
})
