import { computed, onMounted, ref, watch } from "vue"
import type { FilterOptions, ImportParseResult, PickHistory, Student, StudentDraft, StudentFilters } from "@/types"
import { resolveGrade } from "@/utils/gradeInference"
import { createId } from "@/utils/id"
import { pickRandomStudent } from "@/utils/random"
import { describeFilters, EMPTY_FILTERS, filterStudents, getFilterOptions, sanitizeFilters } from "@/utils/studentFilters"
import { createStudentFromDraft, mergeStudentDraftsWithExisting, normalizeList, normalizeStudent, type LegacyStudent } from "@/utils/studentMerge"

const STUDENTS_KEY = "random-picker-vue3-students"
const HISTORY_KEY = "random-picker-vue3-history"
const MAX_HISTORY = 100

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
    const normalizedStudents = readStorage<LegacyStudent[]>(STUDENTS_KEY, []).map((student) => normalizeStudent(student))
    students.value = normalizedStudents
    history.value = readStorage<PickHistory[]>(HISTORY_KEY, [])
    isLoaded.value = true
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(normalizedStudents))
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
    students.value = result.nextStudents
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

  function deleteStudent(id: string): void {
    students.value = students.value.filter((student) => student.id !== id)
    if (selectedStudent.value?.id === id) {
      selectedStudent.value = null
    }
  }

  function clearStudents(): void {
    students.value = []
    selectedStudent.value = null
    localStorage.removeItem(STUDENTS_KEY)
  }

  function resetPickCounts(): void {
    students.value = students.value.map((student) => ({
      ...student,
      pickCount: 0,
      updatedAt: nowIso(),
    }))
  }

  function clearHistory(): void {
    history.value = []
    localStorage.removeItem(HISTORY_KEY)
  }

  function deleteHistoryRecord(id: string): void {
    const record = history.value.find((item) => item.id === id)
    if (!record) return

    history.value = history.value.filter((item) => item.id !== id)
    students.value = students.value.map((student) =>
      student.id === record.studentId
        ? {
            ...student,
            pickCount: Math.max(student.pickCount - 1, 0),
            updatedAt: nowIso(),
          }
        : student,
    )
  }

  function recordPick(student: Student): PickHistory {
    const record: PickHistory = {
      id: createId("history"),
      studentId: student.id,
      studentName: student.name,
      pickedAt: nowIso(),
    }

    history.value = [record, ...history.value].slice(0, MAX_HISTORY)
    students.value = students.value.map((item) =>
      item.id === student.id
        ? {
            ...item,
            pickCount: item.pickCount + 1,
            updatedAt: nowIso(),
          }
        : item,
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
