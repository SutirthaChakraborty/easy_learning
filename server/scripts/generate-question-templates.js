/**
 * generate-question-templates.js
 *
 * Dev-only, run-once script. Builds the 12 static .xlsx templates teachers
 * download before uploading questions — one per module+subject, with the
 * exact column layout `questionValidation.js` expects. Not part of the
 * request path; re-run manually if the column layout ever changes.
 *
 * Usage:
 *   cd server
 *   node scripts/generate-question-templates.js
 */

const fs = require('fs')
const path = require('path')
const ExcelJS = require('exceljs')
const { TEMPLATE_COLUMNS, WRITE_TYPES, SPEAK_SCIENCE_CATEGORIES } = require('../utils/questionValidation')

const OUT_DIR = path.join(__dirname, '../templates/questions')

const EXAMPLE_ROWS = {
  read: [
    { title: 'Colours', content: 'Red, blue and yellow are primary colours.', question: 'What are red, blue and yellow called?', option1: 'Secondary colours', option2: 'Primary colours', option3: 'Warm colours', answer: 'Primary colours', emoji: '🎨' },
    { title: 'The Sun', content: 'The Sun gives us light and warmth.', question: 'What does the Sun give us?', option1: 'Light and warmth', option2: 'Rain', option3: 'Snow', answer: 'Light and warmth', emoji: '☀️' },
  ],
  write: [
    { character: 'A', type: 'letter', hint: 'Trace the capital letter A', level: 1, emoji: '🔤' },
    { character: 'cat', type: 'word', hint: 'Trace the word for a small pet', level: 2, emoji: '🐱' },
  ],
  listen: [
    { sentence: 'The cat sat on the mat.', level: 1, xp: 10, emoji: '🐱' },
    { sentence: 'She sells seashells by the seashore.', level: 3, xp: 20, emoji: '🐚' },
  ],
  speak: [
    { text: 'Good morning!', emoji: '👋' },
    { text: 'How are you today?', emoji: '😊' },
  ],
  speakScience: [
    { text: 'Plants need sunlight to grow.', emoji: '🌱', category: 'nature' },
    { text: 'The Earth orbits the Sun.', emoji: '🌍', category: 'space' },
  ],
}

function instructionsFor(module, subject, columns) {
  const lines = [
    ['Column', 'Required', 'Notes'],
    ...columns.map((c) => [
      c.header,
      c.required ? 'Yes' : 'No',
      c.enum ? `Must be one of: ${c.enum.join(', ')}`
        : c.int ? `Whole number${c.int.max !== undefined ? ` from ${c.int.min} to ${c.int.max}` : ` >= ${c.int.min}`}`
        : module === 'read' && c.key === 'answer' ? 'Must exactly match option1, option2, or option3'
          : '',
    ]),
  ]
  return lines
}

async function generateTemplate(module, subject, columns) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Questions')
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: 24 }))
  sheet.getRow(1).font = { bold: true }

  const examples = module === 'speak' && subject === 'science' ? EXAMPLE_ROWS.speakScience : EXAMPLE_ROWS[module]
  examples.forEach((row) => sheet.addRow(row))

  const infoSheet = workbook.addWorksheet('Instructions')
  infoSheet.columns = [{ width: 14 }, { width: 10 }, { width: 60 }]
  instructionsFor(module, subject, columns).forEach((row, i) => {
    const r = infoSheet.addRow(row)
    if (i === 0) r.font = { bold: true }
  })

  const outPath = path.join(OUT_DIR, `${module}-${subject}.xlsx`)
  await workbook.xlsx.writeFile(outPath)
  console.log(`  ✓ ${outPath}`)
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  for (const [module, subjects] of Object.entries(TEMPLATE_COLUMNS)) {
    for (const [subject, columns] of Object.entries(subjects)) {
      await generateTemplate(module, subject, columns)
    }
  }
  console.log('\nAll 12 question templates generated.')
}

main().catch((err) => {
  console.error('Template generation failed:', err.message)
  process.exit(1)
})
