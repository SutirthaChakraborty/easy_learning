const Organization = require('../models/admin/Organization')
const SAOrganization = require('../models/superadmin/Organization')
const Tutor = require('../models/admin/Tutor')
const Student = require('../models/admin/Student')
const Parent = require('../models/admin/Parent')
const Batch = require('../models/admin/Batch')
const Subject = require('../models/admin/Subject')
const OrgAdmin = require('../models/admin/OrgAdmin')
const { getPerformanceForEmail } = require('../utils/performance')
const { fileUrl } = require('../middleware/upload')
const batchService = require('../services/batchService')
const { checkTeacherConflict } = require('../services/scheduleConflictService')

const handleServiceError = (res, err) => {
  if (err instanceof batchService.ServiceError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.max !== undefined ? { capacity: { max: err.max, current: err.current, attempted: err.attempted } } : {}),
      ...(err.conflicts !== undefined ? { conflicts: err.conflicts } : {}),
    })
  }
  console.error(err)
  return res.status(500).json({ success: false, message: 'Internal server error' })
}

// ── Organization ─────────────────────────────────────────────────────────────

const registerOrg = async (req, res) => {
  try {
    const { name, type, address, phone, designation, designationOther } = req.body

    const existing = await Organization.findOne({ adminUid: req.admin.uid })
    const logoUrl = req.file ? fileUrl(req, 'org-logos', req.file.filename) : ''

    if (existing) {
      if (existing.status !== 'rejected') {
        return res.status(409).json({ success: false, message: 'You already have a registered organization', org: existing })
      }

      // Resubmission after rejection: edit in place, go back to pending.
      // The rejection reason was already archived into rejectionHistory by rejectOrg at rejection time.
      existing.name = name
      existing.type = type || 'school'
      existing.address = address || ''
      existing.phone = phone || ''
      if (logoUrl) existing.logoUrl = logoUrl
      existing.status = 'pending'
      existing.rejectionReason = ''
      await existing.save()

      await SAOrganization.findOneAndUpdate({ adminOrgId: existing._id.toString() }, {
        name, type: type || 'school', address: address || '', phone: phone || '',
        status: 'pending', rejectionReason: '',
        adminDesignation: designation === 'other' ? designationOther : designation,
        ...(logoUrl ? { logoUrl } : {}),
      })

      await OrgAdmin.findByIdAndUpdate(req.admin.id, {
        orgId: existing._id,
        designation: designation || '',
        designationOther: designation === 'other' ? (designationOther || '') : '',
        ...(phone ? { phone } : {}),
      })

      return res.json({ success: true, org: existing, resubmitted: true })
    }

    const org = await Organization.create({
      name, type: type || 'school', address: address || '', phone: phone || '',
      adminEmail: req.admin.email, adminUid: req.admin.uid, logoUrl,
    })

    // Mirror to super admin DB for approval
    await SAOrganization.create({
      name, type: type || 'school', address: address || '', phone: phone || '',
      adminEmail: req.admin.email, adminName: req.admin.name,
      adminUid: req.admin.uid, adminOrgId: org._id.toString(), logoUrl,
      adminDesignation: designation === 'other' ? designationOther : designation,
    })

    // Link org to admin and record their declared identity
    await OrgAdmin.findByIdAndUpdate(req.admin.id, {
      orgId: org._id,
      designation: designation || '',
      designationOther: designation === 'other' ? (designationOther || '') : '',
      ...(phone ? { phone } : {}),
    })

    await batchService.ensureDefaultSubjects(org._id)

    res.status(201).json({ success: true, org })
  } catch (err) {
    console.error('registerOrg error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getOrg = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    res.json({ success: true, org })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── Admin identity / profile ─────────────────────────────────────────────────

const getProfile = async (req, res) => {
  try {
    const admin = await OrgAdmin.findById(req.admin.id)
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' })
    res.json({ success: true, admin })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const updateProfile = async (req, res) => {
  try {
    const { designation, designationOther, phone } = req.body
    const update = {}
    if (designation !== undefined) {
      update.designation = designation
      update.designationOther = designation === 'other' ? (designationOther || '') : ''
    }
    if (phone !== undefined) update.phone = phone
    if (req.file) update.photoURL = fileUrl(req, 'avatars', req.file.filename)

    const admin = await OrgAdmin.findByIdAndUpdate(req.admin.id, update, { new: true })
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' })

    // Keep the mirrored super-admin org copy of the admin's designation in sync
    if (designation !== undefined) {
      const org = await Organization.findOne({ adminUid: req.admin.uid })
      if (org) {
        await SAOrganization.findOneAndUpdate(
          { adminOrgId: org._id.toString() },
          { adminDesignation: designation === 'other' ? designationOther : designation }
        )
      }
    }

    res.json({ success: true, admin })
  } catch (err) {
    console.error('updateProfile error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── Tutors ────────────────────────────────────────────────────────────────────

const getTutors = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.json({ success: true, tutors: [] })
    const filter = { orgId: org._id }
    if (req.query.search) filter.name = { $regex: req.query.search.trim(), $options: 'i' }
    const tutors = await Tutor.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, tutors })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const createTutor = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Register your organization first' })

    const { name, email, phone, subject } = req.body

    const dup = await Tutor.findOne({ orgId: org._id, email: email.toLowerCase() })
    if (dup) return res.status(409).json({ success: false, message: 'A tutor with this email already exists' })

    const tutor = await Tutor.create({ name, email, phone: phone || '', subject: subject || '', orgId: org._id })
    res.status(201).json({ success: true, tutor })
  } catch (err) {
    console.error('createTutor error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const deleteTutor = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })
    const tutor = await Tutor.findOne({ _id: req.params.id, orgId: org._id })
    if (!tutor) return res.status(404).json({ success: false, message: 'Tutor not found' })
    await batchService.deleteTutorCascade(tutor._id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getTutorPerformance = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })

    const tutor = await Tutor.findOne({ _id: req.params.id, orgId: org._id }).populate('studentIds', 'name email')
    if (!tutor) return res.status(404).json({ success: false, message: 'Tutor not found' })

    const students = await Promise.all(
      (tutor.studentIds || []).map(async (s) => ({
        studentId: s._id, name: s.name, email: s.email,
        performance: await getPerformanceForEmail(s.email),
      }))
    )

    res.json({ success: true, tutor: { id: tutor._id, name: tutor.name, email: tutor.email }, students })
  } catch (err) {
    console.error('getTutorPerformance error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── Batches ───────────────────────────────────────────────────────────────────

const getBatches = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.json({ success: true, batches: [] })
    const batches = await Batch.find({ orgId: org._id })
      .populate('tutorIds', 'name email')
      .populate('directTutorIds', 'name email')
      .populate('studentIds', 'name email')
      .populate('subjects.subject', 'name code')
      .populate('subjects.teacherIds', 'name email')
      .sort({ createdAt: -1 })
    res.json({ success: true, batches })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getBatch = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })
    const batch = await Batch.findOne({ _id: req.params.id, orgId: org._id })
      .populate('studentIds', 'name email age grade')
      .populate('directTutorIds', 'name email')
      .populate('subjects.subject', 'name code')
      .populate('subjects.teacherIds', 'name email')
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })
    res.json({ success: true, batch })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const createBatch = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Register your organization first' })

    const { name, subject, description, academicYear, term, maxStudents } = req.body
    const batch = await Batch.create({
      name, subject: subject || '', description: description || '',
      academicYear: academicYear || '', term: term || '',
      maxStudents: maxStudents ? Number(maxStudents) : null,
      orgId: org._id,
    })
    res.status(201).json({ success: true, batch })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const updateBatch = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })

    const { name, description, academicYear, term, maxStudents, status } = req.body
    const update = {}
    if (name !== undefined) update.name = name
    if (description !== undefined) update.description = description
    if (academicYear !== undefined) update.academicYear = academicYear
    if (term !== undefined) update.term = term
    if (maxStudents !== undefined) update.maxStudents = maxStudents === null || maxStudents === '' ? null : Number(maxStudents)
    if (status !== undefined) update.status = status

    const batch = await Batch.findOneAndUpdate({ _id: req.params.id, orgId: org._id }, update, { new: true })
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })
    res.json({ success: true, batch })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const deleteBatch = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })
    const batch = await Batch.findOne({ _id: req.params.id, orgId: org._id })
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })
    await batchService.deleteBatchCascade(batch._id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const addStudentsToBatchHandler = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })
    const batch = await Batch.findOne({ _id: req.params.id, orgId: org._id })
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })

    const updated = await batchService.addStudentsToBatch(batch._id, req.body.studentIds)
    res.json({ success: true, batch: updated })
  } catch (err) {
    handleServiceError(res, err)
  }
}

const removeStudentFromBatchHandler = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })
    const batch = await Batch.findOne({ _id: req.params.id, orgId: org._id })
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })

    const updated = await batchService.removeStudentFromBatch(batch._id, req.params.studentId)
    res.json({ success: true, batch: updated })
  } catch (err) {
    handleServiceError(res, err)
  }
}

const addSubjectToBatchHandler = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })
    const batch = await Batch.findOne({ _id: req.params.id, orgId: org._id })
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })

    const updated = await batchService.addSubjectToBatch(batch._id, req.body.subjectId)
    res.json({ success: true, batch: updated })
  } catch (err) {
    handleServiceError(res, err)
  }
}

const removeSubjectFromBatchHandler = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })
    const batch = await Batch.findOne({ _id: req.params.id, orgId: org._id })
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })

    const updated = await batchService.removeSubjectFromBatch(batch._id, req.params.subjectAssignmentId)
    res.json({ success: true, batch: updated })
  } catch (err) {
    handleServiceError(res, err)
  }
}

const assignTeacherToSubjectHandler = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })
    const batch = await Batch.findOne({ _id: req.params.id, orgId: org._id })
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })

    const updated = await batchService.assignTeacherToSubject(batch._id, req.params.subjectAssignmentId, req.body.tutorId)
    res.json({ success: true, batch: updated })
  } catch (err) {
    handleServiceError(res, err)
  }
}

const unassignTeacherFromSubjectHandler = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })
    const batch = await Batch.findOne({ _id: req.params.id, orgId: org._id })
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })

    const updated = await batchService.unassignTeacherFromSubject(batch._id, req.params.subjectAssignmentId, req.params.tutorId)
    res.json({ success: true, batch: updated })
  } catch (err) {
    handleServiceError(res, err)
  }
}

const assignTeacherToBatchHandler = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })
    const batch = await Batch.findOne({ _id: req.params.id, orgId: org._id })
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })

    const updated = await batchService.addTeacherToBatch(batch._id, req.body.tutorId)
    res.json({ success: true, batch: updated })
  } catch (err) {
    handleServiceError(res, err)
  }
}

const removeTeacherFromBatchHandler = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })
    const batch = await Batch.findOne({ _id: req.params.id, orgId: org._id })
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })

    const updated = await batchService.removeTeacherFromBatch(batch._id, req.params.tutorId)
    res.json({ success: true, batch: updated })
  } catch (err) {
    handleServiceError(res, err)
  }
}

// ── Weekly schedule ─────────────────────────────────────────────────────────

const addScheduleSlotHandler = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })
    const batch = await Batch.findOne({ _id: req.params.id, orgId: org._id })
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })

    const { dayOfWeek, startTime, endTime } = req.body
    const updated = await batchService.addScheduleSlot(batch._id, req.params.subjectAssignmentId, {
      dayOfWeek: Number(dayOfWeek), startTime, endTime,
    })
    res.json({ success: true, batch: updated })
  } catch (err) {
    handleServiceError(res, err)
  }
}

const removeScheduleSlotHandler = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })
    const batch = await Batch.findOne({ _id: req.params.id, orgId: org._id })
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' })

    const updated = await batchService.removeScheduleSlot(batch._id, req.params.subjectAssignmentId, req.params.slotId)
    res.json({ success: true, batch: updated })
  } catch (err) {
    handleServiceError(res, err)
  }
}

const checkScheduleConflict = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })

    const { tutorId, dayOfWeek, startTime, endTime, scheduleSlotId } = req.body
    const conflicts = await checkTeacherConflict(
      org._id, tutorId, { dayOfWeek: Number(dayOfWeek), startTime, endTime }, { scheduleSlotId }
    )
    res.json({ success: true, conflicts })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getTutorSchedule = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })

    const tutor = await Tutor.findOne({ _id: req.params.id, orgId: org._id })
    if (!tutor) return res.status(404).json({ success: false, message: 'Tutor not found' })

    const batches = await Batch.find({ orgId: org._id, 'subjects.teacherIds': tutor._id })
      .populate('subjects.subject', 'name')

    const schedule = []
    for (const batch of batches) {
      for (const assignment of batch.subjects) {
        const teaches = assignment.teacherIds.some((tid) => tid.toString() === tutor._id.toString())
        if (!teaches) continue
        for (const slot of assignment.schedule) {
          schedule.push({
            batchId: batch._id, batchName: batch.name,
            subjectId: assignment.subject?._id, subjectName: assignment.subject?.name,
            dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime,
          })
        }
      }
    }
    res.json({ success: true, schedule })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── Subjects ──────────────────────────────────────────────────────────────────

const getSubjects = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.json({ success: true, subjects: [] })
    await batchService.ensureDefaultSubjects(org._id)
    const filter = { orgId: org._id }
    if (req.query.status) filter.status = req.query.status
    const subjects = await Subject.find(filter).sort({ name: 1 })
    res.json({ success: true, subjects })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const createSubject = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Register your organization first' })

    const { name, code, description } = req.body
    const dup = await Subject.findOne({ orgId: org._id, name: { $regex: `^${name.trim()}$`, $options: 'i' } })
    if (dup) return res.status(409).json({ success: false, message: 'A subject with this name already exists' })

    const subject = await Subject.create({ name, code: code || '', description: description || '', orgId: org._id })
    res.status(201).json({ success: true, subject })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const updateSubject = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })

    const { name, description, status } = req.body
    const update = {}
    if (name !== undefined) update.name = name
    if (description !== undefined) update.description = description
    if (status !== undefined) update.status = status

    const subject = await Subject.findOneAndUpdate({ _id: req.params.id, orgId: org._id }, update, { new: true })
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' })
    res.json({ success: true, subject })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const deleteSubject = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })

    const subject = await Subject.findOne({ _id: req.params.id, orgId: org._id })
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' })

    const inUse = await Batch.exists({ orgId: org._id, 'subjects.subject': subject._id })
    if (inUse) {
      subject.status = 'inactive'
      await subject.save()
      return res.json({ success: true, deactivated: true, subject })
    }

    await Subject.deleteOne({ _id: subject._id })
    res.json({ success: true, deactivated: false })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── Students ──────────────────────────────────────────────────────────────────

const getStudents = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.json({ success: true, students: [] })
    const filter = { orgId: org._id }
    if (req.query.search) filter.name = { $regex: req.query.search.trim(), $options: 'i' }
    const students = await Student.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, students })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const createStudent = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Register your organization first' })

    const { name, email, age, grade } = req.body

    if (email) {
      const dup = await Student.findOne({ orgId: org._id, email: email.toLowerCase() })
      if (dup) return res.status(409).json({ success: false, message: 'A student with this email already exists' })
    }

    const student = await Student.create({ name, email: email || '', age: age || null, grade: grade || '', orgId: org._id })
    res.status(201).json({ success: true, student })
  } catch (err) {
    console.error('createStudent error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const deleteStudent = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })
    const student = await Student.findOne({ _id: req.params.id, orgId: org._id })
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })
    await batchService.deleteStudentCascade(student._id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const getStudentPerformance = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Organization not found' })

    const student = await Student.findOne({ _id: req.params.id, orgId: org._id })
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })

    const performance = await getPerformanceForEmail(student.email)
    res.json({ success: true, student: { id: student._id, name: student.name, email: student.email }, performance })
  } catch (err) {
    console.error('getStudentPerformance error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── Parents ───────────────────────────────────────────────────────────────────

const getParents = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.json({ success: true, parents: [] })
    const parents = await Parent.find({ orgId: org._id }).populate('studentIds', 'name').sort({ createdAt: -1 })
    res.json({ success: true, parents })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const createParent = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.status(400).json({ success: false, message: 'Register your organization first' })

    const { name, email, phone } = req.body

    const dup = await Parent.findOne({ orgId: org._id, email: email.toLowerCase() })
    if (dup) return res.status(409).json({ success: false, message: 'A parent with this email already exists' })

    const parent = await Parent.create({ name, email, phone: phone || '', orgId: org._id })
    res.status(201).json({ success: true, parent })
  } catch (err) {
    console.error('createParent error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

const getStats = async (req, res) => {
  try {
    const org = await Organization.findOne({ adminUid: req.admin.uid })
    if (!org) return res.json({ success: true, stats: { tutors: 0, students: 0, batches: 0, parents: 0, org: null } })

    const [tutors, students, batches, parents] = await Promise.all([
      Tutor.countDocuments({ orgId: org._id }),
      Student.countDocuments({ orgId: org._id }),
      Batch.countDocuments({ orgId: org._id }),
      Parent.countDocuments({ orgId: org._id }),
    ])

    res.json({ success: true, stats: { tutors, students, batches, parents, org } })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

module.exports = {
  registerOrg, getOrg,
  getProfile, updateProfile,
  getTutors, createTutor, deleteTutor, getTutorPerformance, getTutorSchedule,
  getBatches, getBatch, createBatch, updateBatch, deleteBatch,
  addStudentsToBatch: addStudentsToBatchHandler, removeStudentFromBatch: removeStudentFromBatchHandler,
  addSubjectToBatch: addSubjectToBatchHandler, removeSubjectFromBatch: removeSubjectFromBatchHandler,
  assignTeacherToSubject: assignTeacherToSubjectHandler, unassignTeacherFromSubject: unassignTeacherFromSubjectHandler,
  assignTeacherToBatch: assignTeacherToBatchHandler, removeTeacherFromBatch: removeTeacherFromBatchHandler,
  addScheduleSlot: addScheduleSlotHandler, removeScheduleSlot: removeScheduleSlotHandler, checkScheduleConflict,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getStudents, createStudent, deleteStudent, getStudentPerformance,
  getParents, createParent,
  getStats,
}
