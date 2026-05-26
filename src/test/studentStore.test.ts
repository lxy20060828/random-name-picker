import { describe, expect, it, vi } from "vitest"
import { nextTick } from "vue"
import { useStudents } from "@/composables/useStudents"
import type { Student } from "@/types"

function createStudent(id: string, name: string, studentNo: string): Student {
  return {
    id,
    name,
    studentNo,
    classes: [],
    courses: [],
    tags: [],
    pickCount: 0,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  }
}

describe("useStudents store operations", () => {
  it("detects repeated student numbers while editing", () => {
    const store = useStudents()
    store.students.value = [
      createStudent("student-1", "张三", "20260001"),
      createStudent("student-2", "李四", "20260002"),
    ]

    expect(store.findStudentNoConflict("student-1", "20260002")?.name).toBe("李四")
    expect(store.findStudentNoConflict("student-1", "20260001")).toBeUndefined()
  })

  it("merges repeated student numbers and migrates history records", async () => {
    const store = useStudents()
    store.students.value = [
      { ...createStudent("student-1", "张三", "20260001"), classes: ["软件1班"], courses: ["数据结构"] },
      { ...createStudent("student-2", "李四", "20260002"), classes: ["软件2班"], tags: ["二组"] },
    ]
    store.history.value = [
      { id: "history-1", studentId: "student-1", studentName: "张三", pickedAt: "2026-06-01T00:00:00.000Z" },
      { id: "history-2", studentId: "student-2", studentName: "李四", pickedAt: "2026-06-01T00:01:00.000Z" },
    ]

    store.mergeStudentWithExistingNumber("student-1", {
      name: "张三",
      studentNo: "20260002",
      classes: ["软件1班"],
      courses: ["高等数学"],
      tags: ["一组"],
    })
    await nextTick()

    expect(store.students.value).toHaveLength(1)
    expect(store.students.value[0]).toMatchObject({
      id: "student-2",
      studentNo: "20260002",
      pickCount: 2,
    })
    expect(store.students.value[0].classes).toEqual(["软件2班", "软件1班"])
    expect(store.students.value[0].courses).toEqual(["高等数学"])
    expect(store.students.value[0].tags).toEqual(["二组", "一组"])
    expect(store.history.value.every((record) => record.studentId === "student-2")).toBe(true)
  })

  it("clears history when resetting pick counts", () => {
    const store = useStudents()
    store.students.value = [{ ...createStudent("student-1", "张三", "20260001"), pickCount: 3 }]
    store.history.value = [
      { id: "history-1", studentId: "student-1", studentName: "张三", pickedAt: "2026-06-01T00:00:00.000Z" },
    ]

    store.resetPickCounts()

    expect(store.history.value).toEqual([])
    expect(store.students.value[0].pickCount).toBe(0)
  })

  it("resets pick counts when clearing history directly", () => {
    const store = useStudents()
    store.students.value = [{ ...createStudent("student-1", "张三", "20260001"), pickCount: 2 }]
    store.history.value = [
      { id: "history-1", studentId: "student-1", studentName: "张三", pickedAt: "2026-06-01T00:00:00.000Z" },
    ]

    store.clearHistory()

    expect(store.history.value).toEqual([])
    expect(store.students.value[0].pickCount).toBe(0)
  })

  it("clears students, history, selection and filters together", () => {
    const store = useStudents()
    store.students.value = [createStudent("student-1", "张三", "20260001")]
    store.history.value = [
      { id: "history-1", studentId: "student-1", studentName: "张三", pickedAt: "2026-06-01T00:00:00.000Z" },
    ]
    store.selectedStudent.value = store.students.value[0]
    store.setFilters({ keyword: "张", grade: "", department: "", major: "", className: "", course: "", tag: "" })

    store.clearStudents()

    expect(store.students.value).toEqual([])
    expect(store.history.value).toEqual([])
    expect(store.selectedStudent.value).toBeNull()
    expect(store.filters.value.keyword).toBe("")
  })

  it("records more than 100 history rows and syncs counts", () => {
    const store = useStudents()
    store.students.value = [createStudent("student-1", "张三", "20260001")]
    vi.setSystemTime(new Date("2026-06-01T00:00:00.000Z"))

    for (let index = 0; index < 120; index += 1) {
      store.recordPick(store.students.value[0])
    }
    vi.useRealTimers()

    expect(store.history.value).toHaveLength(120)
    expect(store.students.value[0].pickCount).toBe(120)
  })

  it("deletes a history row and reduces the matching pick count", () => {
    const store = useStudents()
    store.students.value = [createStudent("student-1", "张三", "20260001")]
    store.recordPick(store.students.value[0])
    store.recordPick(store.students.value[0])

    store.deleteHistoryRecord(store.history.value[0].id)

    expect(store.history.value).toHaveLength(1)
    expect(store.students.value[0].pickCount).toBe(1)
  })
})
