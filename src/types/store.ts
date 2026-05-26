import type { ComputedRef, Ref } from "vue"
import type { FilterOptions, ImportParseResult, PickHistory, Student, StudentDraft, StudentFilters } from "@/types"

export interface StudentStore {
  students: Ref<Student[]>
  filteredStudents: ComputedRef<Student[]>
  history: Ref<PickHistory[]>
  selectedStudent: Ref<Student | null>
  filters: Ref<StudentFilters>
  filterOptions: ComputedRef<FilterOptions>
  activeFilterSummary: ComputedRef<string>
  studentCount: ComputedRef<number>
  totalPickCount: ComputedRef<number>
  mostPickedStudents: ComputedRef<Student[]>
  addStudent: (draft: StudentDraft) => void
  mergeStudentDrafts: (drafts: StudentDraft[]) => ImportParseResult
  updateStudent: (id: string, draft: StudentDraft) => void
  findStudentNoConflict: (id: string, studentNo: string) => Student | undefined
  mergeStudentWithExistingNumber: (id: string, draft: StudentDraft) => void
  deleteStudent: (id: string) => void
  clearStudents: () => void
  resetPickCounts: () => void
  clearHistory: () => void
  deleteHistoryRecord: (id: string) => void
  pickOne: () => Student | null
  recordPick: (student: Student) => PickHistory
  setFilters: (value: StudentFilters) => void
  resetFilters: () => void
}
