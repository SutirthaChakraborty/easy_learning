const Batch = require('../models/admin/Batch')

function timesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

// Finds this teacher's existing schedule slots (across any batch/subject in the org) that
// overlap the given day/time. `exclude.scheduleSlotId` skips the slot being edited so an
// in-place time change doesn't conflict with itself.
async function checkTeacherConflict(orgId, tutorId, { dayOfWeek, startTime, endTime }, exclude = {}) {
  const batches = await Batch.find({ orgId, 'subjects.teacherIds': tutorId })
    .populate('subjects.subject', 'name')

  const conflicts = []
  for (const batch of batches) {
    for (const assignment of batch.subjects) {
      const teaches = assignment.teacherIds.some((tid) => tid.toString() === tutorId.toString())
      if (!teaches) continue

      for (const slot of assignment.schedule) {
        if (exclude.scheduleSlotId && slot._id.toString() === exclude.scheduleSlotId.toString()) continue
        if (slot.dayOfWeek !== Number(dayOfWeek)) continue
        if (!timesOverlap(startTime, endTime, slot.startTime, slot.endTime)) continue

        conflicts.push({
          batchId: batch._id,
          batchName: batch.name,
          subjectId: assignment.subject?._id,
          subjectName: assignment.subject?.name,
          subjectAssignmentId: assignment._id,
          scheduleSlotId: slot._id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })
      }
    }
  }
  return conflicts
}

module.exports = { checkTeacherConflict, timesOverlap }
