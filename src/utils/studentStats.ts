import type { PickHistory, Student } from "@/types"

function countHistoryByStudent(history: PickHistory[]): Map<string, number> {
  return history.reduce((counts, record) => {
    counts.set(record.studentId, (counts.get(record.studentId) ?? 0) + 1)
    return counts
  }, new Map<string, number>())
}

export interface ScopedStudentStats {
  scopedHistory: PickHistory[]
  studentsWithScopedCounts: Student[]
  pickedStudentCount: number
  averagePickCount: string
  topStudents: Student[]
}

export function syncPickCountsFromHistory(students: Student[], history: PickHistory[]): Student[] {
  const counts = countHistoryByStudent(history)

  return students.map((student) => ({
    ...student,
    pickCount: counts.get(student.id) ?? 0,
  }))
}

export function removeOrphanHistory(history: PickHistory[], students: Student[]): PickHistory[] {
  const studentIds = new Set(students.map((student) => student.id))
  return history.filter((record) => studentIds.has(record.studentId))
}

export function getScopedStudentStats(students: Student[], history: PickHistory[]): ScopedStudentStats {
  const studentIds = new Set(students.map((student) => student.id))
  const scopedHistory = history.filter((record) => studentIds.has(record.studentId))
  const scopedCounts = countHistoryByStudent(scopedHistory)
  const studentsWithScopedCounts = students.map((student) => ({
    ...student,
    pickCount: scopedCounts.get(student.id) ?? 0,
  }))
  const topStudents = [...studentsWithScopedCounts]
    .filter((student) => student.pickCount > 0)
    .sort((a, b) => b.pickCount - a.pickCount)
    .slice(0, 5)

  return {
    scopedHistory,
    studentsWithScopedCounts,
    pickedStudentCount: studentsWithScopedCounts.filter((student) => student.pickCount > 0).length,
    averagePickCount: students.length === 0 ? "0.0" : (scopedHistory.length / students.length).toFixed(1),
    topStudents,
  }
}
