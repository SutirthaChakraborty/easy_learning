const { body } = require('express-validator')

const createChildValidator = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address'),
  body('age').notEmpty().withMessage('Age is required')
    .isInt({ min: 1, max: 25 }).withMessage('Age must be between 1 and 25'),
]

const updateChildValidator = [
  body('name').optional({ checkFalsy: true }).trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Invalid email address'),
  body('age').optional({ checkFalsy: true }).isInt({ min: 1, max: 25 }).withMessage('Age must be between 1 and 25'),
]

module.exports = { createChildValidator, updateChildValidator }
