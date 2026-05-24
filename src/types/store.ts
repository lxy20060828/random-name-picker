import type { ComputedRef, Ref } from "vue"
import type { PickHistory, Student, StudentDraft } from "@/types"

export interface StudentStore {
  students: Ref<Student[]>
  history: Ref<PickHistory[]>
  selectedStudent: Ref<Student | null>
  studentCount: ComputedRef<number>
  totalPickCount: ComputedRef<number>
  mostPickedStudents: ComputedRef<Student[]>
  addStudent: (draft: StudentDraft) => void
  addStudents: (drafts: StudentDraft[]) => number
  updateStudent: (id: string, draft: StudentDraft) => void
  deleteStudent: (id: string) => void
  clearStudents: () => void
  resetPickCounts: () => void
  clearHistory: () => void
  deleteHistoryRecord: (id: string) => void
  pickOne: () => Student | null
  recordPick: (student: Student) => PickHistory
}
