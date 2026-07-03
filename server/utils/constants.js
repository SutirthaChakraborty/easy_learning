const DESIGNATION_OPTIONS = [
  'principal', 'director', 'head_of_institution',
  'father', 'mother', 'guardian', 'teacher_admin', 'other',
]

const ORG_TYPE_OPTIONS = ['school', 'coaching_centre', 'institution', 'other']

const PHONE_REGEX = /^[0-9+\-\s()]{7,15}$/

module.exports = { DESIGNATION_OPTIONS, ORG_TYPE_OPTIONS, PHONE_REGEX }
