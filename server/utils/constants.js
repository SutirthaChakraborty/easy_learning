const DESIGNATION_OPTIONS = [
  'principal', 'director', 'head_of_institution',
  'father', 'mother', 'guardian', 'teacher_admin', 'other',
]

const ORG_TYPE_OPTIONS = ['school', 'coaching_centre', 'institution', 'other']

const PHONE_REGEX = /^[0-9+\-\s()]{7,15}$/

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

module.exports = { DESIGNATION_OPTIONS, ORG_TYPE_OPTIONS, PHONE_REGEX, DAYS_OF_WEEK, TIME_REGEX }
