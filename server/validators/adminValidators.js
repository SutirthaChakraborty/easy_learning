const { body } = require('express-validator')
const { DESIGNATION_OPTIONS, ORG_TYPE_OPTIONS, PHONE_REGEX, TIME_REGEX } = require('../utils/constants')

const registerOrgValidator = [
  body('name').trim().notEmpty().withMessage('Organization name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Organization name must be 2-100 characters'),
  body('type').optional({ checkFalsy: true }).isIn(ORG_TYPE_OPTIONS).withMessage('Invalid organization type'),
  body('address').optional({ checkFalsy: true }).trim().isLength({ max: 200 }).withMessage('Address is too long'),
  body('phone').optional({ checkFalsy: true }).matches(PHONE_REGEX).withMessage('Invalid phone number'),
  body('designation').notEmpty().withMessage('Please declare your designation')
    .isIn(DESIGNATION_OPTIONS).withMessage('Invalid designation'),
  body('designationOther').if(body('designation').equals('other'))
    .trim().notEmpty().withMessage('Please specify your designation')
    .isLength({ max: 50 }).withMessage('Designation is too long'),
]

const updateIdentityValidator = [
  body('designation').optional({ checkFalsy: true }).isIn(DESIGNATION_OPTIONS).withMessage('Invalid designation'),
  body('designationOther').if(body('designation').equals('other'))
    .trim().notEmpty().withMessage('Please specify your designation')
    .isLength({ max: 50 }).withMessage('Designation is too long'),
  body('phone').optional({ checkFalsy: true }).matches(PHONE_REGEX).withMessage('Invalid phone number'),
]

const createTutorValidator = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address'),
  body('phone').optional({ checkFalsy: true }).matches(PHONE_REGEX).withMessage('Invalid phone number'),
  body('subject').optional({ checkFalsy: true }).trim().isLength({ max: 50 }).withMessage('Subject is too long'),
]

const createStudentValidator = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Invalid email address'),
  body('age').optional({ checkFalsy: true }).isInt({ min: 3, max: 25 }).withMessage('Age must be between 3 and 25'),
  body('grade').optional({ checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('Grade is too long'),
]

const createParentValidator = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address'),
  body('phone').optional({ checkFalsy: true }).matches(PHONE_REGEX).withMessage('Invalid phone number'),
]

const createBatchValidator = [
  body('name').trim().notEmpty().withMessage('Batch name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Batch name must be 2-100 characters'),
  body('subject').optional({ checkFalsy: true }).trim().isLength({ max: 50 }).withMessage('Subject is too long'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 300 }).withMessage('Description is too long'),
  body('academicYear').optional({ checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('Academic year is too long'),
  body('term').optional({ checkFalsy: true }).trim().isLength({ max: 30 }).withMessage('Term is too long'),
  body('maxStudents').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Max students must be a positive number'),
]

const updateBatchValidator = [
  body('name').optional({ checkFalsy: true }).trim().isLength({ min: 2, max: 100 }).withMessage('Batch name must be 2-100 characters'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 300 }).withMessage('Description is too long'),
  body('academicYear').optional({ checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('Academic year is too long'),
  body('term').optional({ checkFalsy: true }).trim().isLength({ max: 30 }).withMessage('Term is too long'),
  body('maxStudents').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Max students must be a positive number'),
  body('status').optional({ checkFalsy: true }).isIn(['active', 'inactive']).withMessage('Invalid status'),
]

const createSubjectValidator = [
  body('name').trim().notEmpty().withMessage('Subject name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Subject name must be 2-60 characters'),
  body('code').optional({ checkFalsy: true }).trim().isLength({ max: 30 }).withMessage('Subject code is too long'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 200 }).withMessage('Description is too long'),
]

const updateSubjectValidator = [
  body('name').optional({ checkFalsy: true }).trim().isLength({ min: 2, max: 60 }).withMessage('Subject name must be 2-60 characters'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 200 }).withMessage('Description is too long'),
  body('status').optional({ checkFalsy: true }).isIn(['active', 'inactive']).withMessage('Invalid status'),
]

const addStudentsToBatchValidator = [
  body('studentIds').isArray({ min: 1 }).withMessage('At least one student is required'),
  body('studentIds.*').isMongoId().withMessage('Invalid student id'),
]

const addSubjectToBatchValidator = [
  body('subjectId').notEmpty().withMessage('Subject is required').isMongoId().withMessage('Invalid subject id'),
]

const assignTeacherValidator = [
  body('tutorId').notEmpty().withMessage('Teacher is required').isMongoId().withMessage('Invalid teacher id'),
]

const scheduleSlotValidator = [
  body('dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('Day of week must be between 0 (Sun) and 6 (Sat)'),
  body('startTime').matches(TIME_REGEX).withMessage('Start time must be in HH:mm format'),
  body('endTime').matches(TIME_REGEX).withMessage('End time must be in HH:mm format')
    .custom((value, { req }) => {
      if (value <= req.body.startTime) throw new Error('End time must be after start time')
      return true
    }),
]

const checkConflictValidator = [
  body('tutorId').notEmpty().withMessage('Teacher is required').isMongoId().withMessage('Invalid teacher id'),
  body('dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('Day of week must be between 0 (Sun) and 6 (Sat)'),
  body('startTime').matches(TIME_REGEX).withMessage('Start time must be in HH:mm format'),
  body('endTime').matches(TIME_REGEX).withMessage('End time must be in HH:mm format'),
]

const sendChatMessageValidator = [
  body('message').trim().notEmpty().withMessage('Message is required')
    .isLength({ max: 2000 }).withMessage('Message is too long'),
]

const rejectUploadValidator = [
  body('reason').trim().notEmpty().withMessage('A rejection reason is required')
    .isLength({ min: 5, max: 500 }).withMessage('Reason must be 5-500 characters'),
]

module.exports = {
  registerOrgValidator, updateIdentityValidator,
  createTutorValidator, createStudentValidator, createParentValidator,
  createBatchValidator, updateBatchValidator,
  createSubjectValidator, updateSubjectValidator,
  addStudentsToBatchValidator, addSubjectToBatchValidator, assignTeacherValidator,
  scheduleSlotValidator, checkConflictValidator,
  sendChatMessageValidator,
  rejectUploadValidator,
}
