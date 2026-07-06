const { body } = require('express-validator')

const contactValidator = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address'),
  body('role').notEmpty().withMessage('Role is required')
    .isIn(['student', 'admin', 'teacher', 'parent', 'other']).withMessage('Invalid role'),
  body('orgName').optional({ checkFalsy: true }).trim().isLength({ max: 150 }).withMessage('Organization name is too long'),
  body('subject').trim().notEmpty().withMessage('Subject is required')
    .isLength({ min: 3, max: 150 }).withMessage('Subject must be 3-150 characters'),
  body('message').trim().notEmpty().withMessage('Message is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters'),
]

module.exports = { contactValidator }
