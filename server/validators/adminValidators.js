const { body } = require('express-validator')
const { DESIGNATION_OPTIONS, ORG_TYPE_OPTIONS, PHONE_REGEX } = require('../utils/constants')

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
    .isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).matches(PHONE_REGEX).withMessage('Invalid phone number'),
  body('subject').optional({ checkFalsy: true }).trim().isLength({ max: 50 }).withMessage('Subject is too long'),
]

const createStudentValidator = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('age').optional({ checkFalsy: true }).isInt({ min: 3, max: 25 }).withMessage('Age must be between 3 and 25'),
  body('grade').optional({ checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('Grade is too long'),
]

const createParentValidator = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).matches(PHONE_REGEX).withMessage('Invalid phone number'),
]

const createBatchValidator = [
  body('name').trim().notEmpty().withMessage('Batch name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Batch name must be 2-100 characters'),
  body('subject').optional({ checkFalsy: true }).trim().isLength({ max: 50 }).withMessage('Subject is too long'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 300 }).withMessage('Description is too long'),
]

module.exports = {
  registerOrgValidator, updateIdentityValidator,
  createTutorValidator, createStudentValidator, createParentValidator, createBatchValidator,
}
