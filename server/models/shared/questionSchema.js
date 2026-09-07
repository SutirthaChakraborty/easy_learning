const mongoose = require('mongoose')

// Shared shape for all 12 Listen/Read/Write/Speak x English/Maths/Science
// question collections. Each question comes from the rich, ~36-field content
// bank in server/data (see server/data/README.md) — id, subject, module,
// level etc. are explicit because they're queried/sorted/filtered; everything
// else varies shape by interaction type (e.g. correct_answer is a string, an
// array, or a category map depending on the widget) so it's stored as-is via
// Mixed rather than hand-modeled.
//
// subject/module/interaction/level are NOT required: the teacher-upload
// Excel pipeline (server/utils/questionValidation.js) still writes the old
// flat shape and was intentionally left untouched by this migration (a
// 36-field spreadsheet isn't realistic for teachers to fill in), so it never
// supplies these. Those old flat fields (sentence/text/answer/etc.) stay
// declared here too, so both existing and newly-uploaded legacy-shaped
// questions keep their content instead of Mongoose silently stripping it —
// the client renders anything missing `interaction` via a generic fallback.
function buildQuestionSchema() {
  return new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    subject: { type: String },
    module: { type: String },
    type_index: { type: Number },
    question_type: { type: String },
    interaction: { type: String, index: true },
    level: { type: Number, min: 1, max: 5 },
    level_name: { type: String },
    difficulty_band: { type: String },
    joy_flavor: { type: String },
    instruction: { type: String },
    prompt: { type: String },
    audio_text: { type: String, default: null },
    audio_link: { type: String },
    module_image_link: { type: String },
    question_image_link: { type: String },
    image: { type: mongoose.Schema.Types.Mixed },
    options: { type: mongoose.Schema.Types.Mixed },
    correct_answer: { type: mongoose.Schema.Types.Mixed },
    accepted_answers: { type: mongoose.Schema.Types.Mixed },
    distractor_insight: { type: mongoose.Schema.Types.Mixed },
    hints: { type: mongoose.Schema.Types.Mixed },
    worked_example: { type: String },
    feedback: { type: mongoose.Schema.Types.Mixed },
    points: { type: Number },
    bonus: { type: mongoose.Schema.Types.Mixed },
    readability: { type: mongoose.Schema.Types.Mixed },
    academic: { type: mongoose.Schema.Types.Mixed },
    life_skill: { type: mongoose.Schema.Types.Mixed },
    cognition: { type: mongoose.Schema.Types.Mixed },
    analysis: { type: mongoose.Schema.Types.Mixed },
    tags: { type: mongoose.Schema.Types.Mixed },
    telemetry: { type: mongoose.Schema.Types.Mixed },
    adaptive: { type: mongoose.Schema.Types.Mixed },
    wellbeing: { type: mongoose.Schema.Types.Mixed },
    accessibility: { type: mongoose.Schema.Types.Mixed },
    speech_scoring: { type: mongoose.Schema.Types.Mixed },

    // Old flat schema (teacher-upload pipeline, pre-migration content)
    sentence: { type: String },
    text: { type: String },
    title: { type: String },
    content: { type: String },
    question: { type: String },
    answer: { type: String },
    character: { type: String },
    type: { type: String },
    hint: { type: String },
    emoji: { type: String },
    xp: { type: Number },
    category: { type: String },
    translations: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Teacher-upload / admin-review support (unchanged from the old schema)
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    uploadBatchId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  }, { timestamps: true })
}

module.exports = { buildQuestionSchema }
