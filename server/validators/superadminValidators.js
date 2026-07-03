const { body } = require('express-validator')

const rejectOrgValidator = [
  body('reason').trim().notEmpty().withMessage('A rejection reason is required')
    .isLength({ min: 5, max: 500 }).withMessage('Reason must be 5-500 characters'),
]

const subscriptionValidator = [
  body('plan').optional({ checkFalsy: true }).isIn(['free', 'basic', 'pro', 'enterprise']).withMessage('Invalid plan'),
  body('subscriptionStatus').optional({ checkFalsy: true }).isIn(['active', 'expired', 'cancelled']).withMessage('Invalid subscription status'),
]

const settingValidator = [
  body('key').trim().notEmpty().withMessage('Key is required')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Key may only contain letters, numbers, and underscores')
    .isLength({ min: 2, max: 50 }).withMessage('Key must be 2-50 characters'),
  body('value').custom((v) => v !== undefined && v !== null && String(v).trim() !== '').withMessage('Value is required'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 200 }).withMessage('Description is too long'),
]

const respondContactValidator = [
  body('status').optional({ checkFalsy: true }).isIn(['open', 'in_progress', 'resolved']).withMessage('Invalid status'),
  body('reply').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage('Reply is too long'),
]

module.exports = { rejectOrgValidator, subscriptionValidator, settingValidator, respondContactValidator }
