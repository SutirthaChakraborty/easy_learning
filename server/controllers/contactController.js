const ContactMessage = require('../models/ContactMessage')
const { fileUrl } = require('../middleware/upload')

const createContactMessage = async (req, res) => {
  try {
    const { name, email, role, orgName, subject, message } = req.body
    const attachmentUrl = req.file ? fileUrl(req, 'contact-attachments', req.file.filename) : ''

    const contact = await ContactMessage.create({
      name, email, role, orgName: orgName || '', subject, message, attachmentUrl,
    })

    res.status(201).json({ success: true, contact })
  } catch (err) {
    console.error('createContactMessage error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = { createContactMessage }
