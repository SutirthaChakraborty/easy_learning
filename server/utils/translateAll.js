'use strict'
const fs   = require('fs')
const path = require('path')

const LANGUAGES = [
  'hi', 'bn', 'es', 'fr', 'de', 'ar', 'zh', 'ja',
  'ru', 'pt', 'it', 'ko', 'tr', 'nl', 'ta', 'te',
  'mr', 'ur', 'id', 'vi',
]
const DATA_DIR = path.join(__dirname, '../data')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let _translate

async function translate(text, lang) {
  if (!_translate) {
    const mod = await import('@vitalets/google-translate-api')
    _translate = mod.translate
  }
  try {
    const result = await _translate(text, { to: lang })
    await sleep(150)
    return result.text
  } catch (err) {
    console.warn(`  ⚠  ${lang}: "${String(text).slice(0, 40)}" → ${err.message}`)
    await sleep(600)
    return null
  }
}

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf8'))
}

function writeJson(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf8')
  console.log(`  ✓ Saved ${filename}`)
}

// Files where translations[lang] = a single translated string
async function processSimple(filename, field) {
  console.log(`\n── ${filename}  (field: "${field}")`)
  const data = readJson(filename)
  let changed = false

  for (const item of data) {
    if (!item.translations) item.translations = {}
    for (const lang of LANGUAGES) {
      if (item.translations[lang]) continue
      process.stdout.write(`     id=${item.id} → ${lang} ... `)
      const t = await translate(item[field], lang)
      if (t) {
        item.translations[lang] = t
        changed = true
        process.stdout.write('✓\n')
      } else {
        process.stdout.write('✗ (skipped)\n')
      }
    }
  }

  if (changed) writeJson(filename, data)
  else console.log('  (already complete, nothing to do)')
}

// Read module files: translations[lang] = { title, content, question, options[], answer }
async function processRead(filename) {
  console.log(`\n── ${filename}  (read — multi-field)`)
  const data = readJson(filename)
  let changed = false

  for (const item of data) {
    if (!item.translations) item.translations = {}
    for (const lang of LANGUAGES) {
      if (item.translations[lang]?.title) continue
      process.stdout.write(`     id=${item.id} → ${lang} ... `)
      const t = {
        title:    await translate(item.title,    lang),
        content:  await translate(item.content,  lang),
        question: await translate(item.question, lang),
        answer:   await translate(item.answer,   lang),
        options:  [],
      }
      for (const opt of item.options) {
        t.options.push(await translate(opt, lang))
      }
      if (t.title) {
        item.translations[lang] = t
        changed = true
        process.stdout.write('✓\n')
      } else {
        process.stdout.write('✗ (skipped)\n')
      }
    }
  }

  if (changed) writeJson(filename, data)
  else console.log('  (already complete, nothing to do)')
}

async function main() {
  console.log('🌍  Starting translation — this may take several minutes...\n')

  // Maths & Science modules
  await processSimple('listen_maths.json',   'sentence')
  await processSimple('listen_science.json', 'sentence')
  await processSimple('speak_maths.json',    'text')
  await processSimple('speak_science.json',  'text')
  await processSimple('write_maths.json',    'hint')
  await processSimple('write_science.json',  'hint')
  await processRead('read_maths.json')
  await processRead('read_science.json')

  // Games
  await processSimple('memory_match.json',  'label')
  await processSimple('word_puzzle.json',   'hint')
  await processSimple('spell_english.json', 'hint')

  console.log('\n✅  Translation complete! Now re-seed the database (see instructions below).')
  console.log('    Run: node data/seed.js --all\n')
}

main().catch(console.error)
