const WRITE_TYPES = ['letter', 'word', 'number', 'symbol', 'shape']
const SPEAK_SCIENCE_CATEGORIES = ['nature', 'weather', 'space', 'earth', 'body', 'science']

function readColumns() {
  return [
    { key: 'title', header: 'title', required: true },
    { key: 'content', header: 'content', required: true },
    { key: 'question', header: 'question', required: true },
    { key: 'option1', header: 'option1', required: true },
    { key: 'option2', header: 'option2', required: true },
    { key: 'option3', header: 'option3', required: true },
    { key: 'answer', header: 'answer', required: true },
    { key: 'emoji', header: 'emoji', required: false },
  ]
}

function writeColumns() {
  return [
    { key: 'character', header: 'character', required: true },
    { key: 'type', header: 'type', required: true, enum: WRITE_TYPES },
    { key: 'hint', header: 'hint', required: true },
    { key: 'level', header: 'level', required: true, int: { min: 1, max: 5 } },
    { key: 'emoji', header: 'emoji', required: false },
  ]
}

function listenColumns() {
  return [
    { key: 'sentence', header: 'sentence', required: true },
    { key: 'level', header: 'level', required: true, int: { min: 1, max: 5 } },
    { key: 'xp', header: 'xp', required: true, int: { min: 1 } },
    { key: 'emoji', header: 'emoji', required: false },
  ]
}

function speakColumns() {
  return [
    { key: 'text', header: 'text', required: true },
    { key: 'emoji', header: 'emoji', required: false },
  ]
}

function speakScienceColumns() {
  return [
    ...speakColumns(),
    { key: 'category', header: 'category', required: true, enum: SPEAK_SCIENCE_CATEGORIES },
  ]
}

// Column layout per module+subject, in the order they appear in the Excel
// template. Shared by the template generator and the upload validator so
// both always agree on the expected shape.
const TEMPLATE_COLUMNS = {
  read: { english: readColumns(), maths: readColumns(), science: readColumns() },
  write: { english: writeColumns(), maths: writeColumns(), science: writeColumns() },
  listen: { english: listenColumns(), maths: listenColumns(), science: listenColumns() },
  speak: { english: speakColumns(), maths: speakColumns(), science: speakScienceColumns() },
}

function isBlankRow(row, columns) {
  return columns.every((c) => {
    const v = row[c.header]
    return v === undefined || v === null || String(v).trim() === ''
  })
}

// Validates and normalizes one parsed spreadsheet row for a module/subject.
// Returns one of: { blank: true } | { errors: [{row, field, message}] } | { data }
function validateRow(module, subject, row, rowNumber) {
  const columns = TEMPLATE_COLUMNS[module]?.[subject]
  if (!columns) return { errors: [{ row: rowNumber, field: '', message: 'Unknown module/subject' }] }
  if (isBlankRow(row, columns)) return { blank: true }

  const errors = []
  const data = {}

  for (const col of columns) {
    const raw = row[col.header]
    const value = raw === undefined || raw === null ? '' : String(raw).trim()

    if (!value) {
      if (col.required) errors.push({ row: rowNumber, field: col.header, message: `${col.header} is required` })
      // Optional + blank: leave the key unset so the model's own schema default applies.
      continue
    }

    if (col.enum) {
      if (!col.enum.includes(value.toLowerCase())) {
        errors.push({ row: rowNumber, field: col.header, message: `${col.header} must be one of: ${col.enum.join(', ')}` })
      } else {
        data[col.key] = value.toLowerCase()
      }
      continue
    }

    if (col.int) {
      const n = Number(value)
      const outOfRange = (col.int.min !== undefined && n < col.int.min) || (col.int.max !== undefined && n > col.int.max)
      if (!Number.isInteger(n) || outOfRange) {
        const range = col.int.max !== undefined ? `${col.int.min}-${col.int.max}` : `>= ${col.int.min}`
        errors.push({ row: rowNumber, field: col.header, message: `${col.header} must be an integer ${range}` })
      } else {
        data[col.key] = n
      }
      continue
    }

    data[col.key] = value
  }

  if (errors.length) return { errors }

  if (module === 'read') {
    data.options = [data.option1, data.option2, data.option3]
    delete data.option1
    delete data.option2
    delete data.option3
    if (!data.options.includes(data.answer)) {
      return { errors: [{ row: rowNumber, field: 'answer', message: 'answer must exactly match option1, option2, or option3' }] }
    }
  }

  return { data }
}

module.exports = { TEMPLATE_COLUMNS, validateRow, WRITE_TYPES, SPEAK_SCIENCE_CATEGORIES }
