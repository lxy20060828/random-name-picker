import { computed, onMounted, ref, watch } from "vue"
import type { FilterOptions, ImportParseResult, PickHistory, Student, StudentDraft, StudentFilters } from "@/types"
import { resolveGrade } from "@/utils/gradeInference"
import { createId } from "@/utils/id"
import { pickRandomStudent } from "@/utils/random"
import { describeFilters, EMPTY_FILTERS, filterStudents, getFilterOptions, sanitizeFilters } from "@/utils/studentFilters"
import { removeOrphanHistory, syncPickCountsFromHistory } from "@/utils/studentStats"
import {
  createStudentFromDraft,
  mergeStudentDraftsWithExisting,
  mergeStudentProfiles,
  normalizeList,
  normalizeStudent,
  type LegacyStudent,
} from "@/utils/studentMerge"

const STUDENTS_KEY = "random-picker-vue3-students"
const HISTORY_KEY = "random-picker-vue3-history"

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

export function useStudents() {
  const students = ref<Student[]>([])
  const history = ref<PickHistory[]>([])
  const selectedStudent = ref<Student | null>(null)
  const filters = ref<StudentFilters>({ ...EMPTY_FILTERS })
  const isLoaded = ref(false)

  const studentCount = computed(() => students.value.length)
  const filteredStudents = computed(() => filterStudents(students.value, filters.value))
  const filterOptions = computed<FilterOptions>(() => getFilterOptions(students.value))
  const activeFilterSummary = computed(() => describeFilters(filters.value, filteredStudents.value.length))
  const totalPickCount = computed(() => history.value.length)
  const mostPickedStudents = computed(() =>
    [...students.value]
      .filter((student) => student.pickCount > 0)
      .sort((a, b) => b.pickCount - a.pickCount)
      .slice(0, 5),
  )

  onMounted(() => {
    const loadedStudents = readStorage<LegacyStudent[]>(STUDENTS_KEY, []).map((student) => normalizeStudent(student))
    const loadedHistory = removeOrphanHistory(readStorage<PickHistory[]>(HISTORY_KEY, []), loadedStudents)
    const normalizedStudents = syncPickCountsFromHistory(loadedStudents, loadedHistory)
    students.value = normalizedStudents
    history.value = loadedHistory
    isLoaded.value = true
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(normalizedStudents))
    localStorage.setItem(HISTORY_KEY, JSON.stringify(loadedHistory))
  })

  watch(
    students,
    (value) => {
      if (!isLoaded.value) return
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(value))
    },
    { deep: true },
  )

  watch(
    filterOptions,
    (options) => {
      const sanitized = sanitizeFilters(filters.value, options)
      if (JSON.stringify(sanitized) !== JSON.stringify(filters.value)) {
        filters.value = sanitized
      }
    },
    { deep: true },
  )

  watch(
    history,
    (value) => {
      if (!isLoaded.value) return
      localStorage.setItem(HISTORY_KEY, JSON.stringify(value))
    },
    { deep: true },
  )

  function addStudent(draft: StudentDraft): void {
    if (!draft.name.trim()) return
    students.value.push(createStudentFromDraft(draft))
  }

  function mergeStudentDrafts(drafts: StudentDraft[]): ImportParseResult {
    const result = mergeStudentDraftsWithExisting(students.value, drafts)
    students.value = syncPickCountsFromHistory(result.nextStudents, history.value)
    return result
  }

  function updateStudent(id: string, draft: StudentDraft): void {
    students.value = students.value.map((student) =>
      student.id === id
        ? normalizeStudent({
            ...student,
            name: draft.name.trim(),
            studentNo: draft.studentNo?.trim() || "",
            grade: resolveGrade(draft.grade, normalizeList(draft.classes)),
            department: draft.department?.trim() || undefined,
            major: draft.major?.trim() || undefined,
            classes: normalizeList(draft.classes),
            courses: normalizeList(draft.courses),
            tags: normalizeList(draft.tags),
            note: draft.note?.trim() || undefined,
            updatedAt: nowIso(),
          })
        : student,
    )
  }

  function findStudentNoConflict(id: string, studentNo: string): Student | undefined {
    const normalizedStudentNo = studentNo.trim()
    if (!normalizedStudentNo) return undefined

    return students.value.find((student) => student.id !== id && student.studentNo === normalizedStudentNo)
  }

  function mergeStudentWithExistingNumber(id: string, draft: StudentDraft): void {
    const source = students.value.find((student) => student.id === id)
    if (!source) return

    const target = findStudentNoConflict(id, draft.studentNo ?? "")
    if (!target) {
      updateStudent(id, draft)
      return
    }

    const incoming = normalizeStudent({
      ...source,
      name: draft.name.trim() || source.name,
      studentNo: draft.studentNo?.trim() || source.studentNo,
      grade: resolveGrade(draft.grade, normalizeList(draft.classes)),
      department: draft.department?.trim() || undefined,
      major: draft.major?.trim() || undefined,
      classes: normalizeList(draft.classes),
      courses: normalizeList(draft.courses),
      tags: normalizeList(draft.tags),
      note: draft.note?.trim() || undefined,
      updatedAt: nowIso(),
    })
    const mergedTarget = mergeStudentProfiles(target, incoming)
    const migratedHistory = history.value.map((record) =>
      record.studentId === source.id
        ? {
            ...record,
            studentId: target.id,
            studentName: mergedTarget.name,
          }
        : record,
    )
    const nextStudents = students.value
      .filter((student) => student.id !== source.id)
      .map((student) => (student.id === target.id ? mergedTarget : student))

    history.value = migratedHistory
    students.value = syncPickCountsFromHistory(nextStudents, migratedHistory)

    if (selectedStudent.value?.id === source.id || selectedStudent.value?.id === target.id) {
      selectedStudent.value = students.value.find((student) => student.id === target.id) ?? null
    }
  }

  function deleteStudent(id: string): void {
    const nextStudents = students.value.filter((student) => student.id !== id)
    const nextHistory = removeOrphanHistory(history.value, nextStudents)
    students.value = syncPickCountsFromHistory(nextStudents, nextHistory)
    history.value = nextHistory
    if (selectedStudent.value?.id === id) {
      selectedStudent.value = null
    }
  }

  function clearStudents(): void {
    students.value = []
    history.value = []
    selectedStudent.value = null
    filters.value = { ...EMPTY_FILTERS }
    localStorage.removeItem(STUDENTS_KEY)
    localStorage.removeItem(HISTORY_KEY)
  }

  function resetPickCounts(): void {
    history.value = []
    students.value = students.value.map((student) => ({
      ...student,
      pickCount: 0,
      updatedAt: nowIso(),
    }))
    localStorage.removeItem(HISTORY_KEY)
  }

  function clearHistory(): void {
    history.value = []
    students.value = students.value.map((student) => ({
      ...student,
      pickCount: 0,
      updatedAt: nowIso(),
    }))
    localStorage.removeItem(HISTORY_KEY)
  }

  function deleteHistoryRecord(id: string): void {
    const record = history.value.find((item) => item.id === id)
    if (!record) return

    const nextHistory = history.value.filter((item) => item.id !== id)
    history.value = nextHistory
    students.value = syncPickCountsFromHistory(students.value, nextHistory)
  }

  function recordPick(student: Student): PickHistory {
    const record: PickHistory = {
      id: createId("history"),
      studentId: student.id,
      studentName: student.name,
      pickedAt: nowIso(),
    }

    history.value = [record, ...history.value]
    students.value = syncPickCountsFromHistory(
      students.value.map((item) => (item.id === student.id ? { ...item, updatedAt: nowIso() } : item)),
      history.value,
    )

    const updated = students.value.find((item) => item.id === student.id)
    selectedStudent.value = updated ?? student

    return record
  }

  function pickOne(): Student | null {
    const student = pickRandomStudent(filteredStudents.value)
    if (!student) return null

    selectedStudent.value = student
    return student
  }

  function setFilters(value: StudentFilters): void {
    filters.value = sanitizeFilters({ ...value }, filterOptions.value)
  }

  function resetFilters(): void {
    filters.value = { ...EMPTY_FILTERS }
  }

  return {
    students,
    filteredStudents,
    history,
    selectedStudent,
    filters,
    filterOptions,
    activeFilterSummary,
    studentCount,
    totalPickCount,
    mostPickedStudents,
    addStudent,
    mergeStudentDrafts,
    updateStudent,
    findStudentNoConflict,
    mergeStudentWithExistingNumber,
    deleteStudent,
    clearStudents,
    resetPickCounts,
    clearHistory,
    deleteHistoryRecord,
    pickOne,
    recordPick,
    setFilters,
    resetFilters,
  }
}
