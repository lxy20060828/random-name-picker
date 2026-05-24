import { computed, onMounted, ref, watch } from "vue"
import type { PickHistory, Student, StudentDraft } from "@/types"
import { createId } from "@/utils/id"
import { pickRandomStudent } from "@/utils/random"

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

function createStudent(draft: StudentDraft): Student {
  const currentTime = nowIso()
  return {
    id: createId("student"),
    name: draft.name.trim(),
    studentNo: draft.studentNo?.trim() || undefined,
    className: draft.className?.trim() || undefined,
    note: draft.note?.trim() || undefined,
    pickCount: 0,
    createdAt: currentTime,
    updatedAt: currentTime,
  }
}

export function useStudents() {
  const students = ref<Student[]>([])
  const history = ref<PickHistory[]>([])
  const selectedStudent = ref<Student | null>(null)
  const isLoaded = ref(false)

  const studentCount = computed(() => students.value.length)
  const totalPickCount = computed(() => history.value.length)
  const mostPickedStudents = computed(() =>
    [...students.value]
      .filter((student) => student.pickCount > 0)
      .sort((a, b) => b.pickCount - a.pickCount)
      .slice(0, 5),
  )

  onMounted(() => {
    students.value = readStorage<Student[]>(STUDENTS_KEY, [])
    history.value = readStorage<PickHistory[]>(HISTORY_KEY, [])
    isLoaded.value = true
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
    history,
    (value) => {
      if (!isLoaded.value) return
      localStorage.setItem(HISTORY_KEY, JSON.stringify(value))
    },
    { deep: true },
  )

  function addStudent(draft: StudentDraft): void {
    if (!draft.name.trim()) return
    students.value.push(createStudent(draft))
  }

  function addStudents(drafts: StudentDraft[]): number {
    const newStudents = drafts.map(createStudent)
    students.value = [...students.value, ...newStudents]
    return newStudents.length
  }

  function updateStudent(id: string, draft: StudentDraft): void {
    students.value = students.value.map((student) =>
      student.id === id
        ? {
            ...student,
            name: draft.name.trim(),
            studentNo: draft.studentNo?.trim() || undefined,
            className: draft.className?.trim() || undefined,
            note: draft.note?.trim() || undefined,
            updatedAt: nowIso(),
          }
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
    const student = pickRandomStudent(students.value)
    if (!student) return null

    selectedStudent.value = student
    return student
  }

  return {
    students,
    history,
    selectedStudent,
    studentCount,
    totalPickCount,
    mostPickedStudents,
    addStudent,
    addStudents,
    updateStudent,
    deleteStudent,
    clearStudents,
    resetPickCounts,
    clearHistory,
    deleteHistoryRecord,
    pickOne,
    recordPick,
  }
}
