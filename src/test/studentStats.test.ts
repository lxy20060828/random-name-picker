import { describe, expect, it } from "vitest"
import type { PickHistory, Student } from "@/types"
import { getScopedStudentStats, removeOrphanHistory, syncPickCountsFromHistory } from "@/utils/studentStats"

const students: Student[] = [
  {
    id: "student-1",
    name: "张三",
    studentNo: "20260001",
    classes: [],
    courses: [],
    tags: [],
    pickCount: 0,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "student-2",
    name: "李四",
    studentNo: "20260002",
    classes: [],
    courses: [],
    tags: [],
    pickCount: 0,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  },
]

describe("student stats helpers", () => {
  it("keeps all history records and syncs pick counts from history", () => {
    const history: PickHistory[] = Array.from({ length: 120 }, (_, index) => ({
      id: `history-${index}`,
      studentId: index % 2 === 0 ? "student-1" : "student-2",
      studentName: index % 2 === 0 ? "张三" : "李四",
      pickedAt: "2026-06-01T00:00:00.000Z",
    }))

    const result = syncPickCountsFromHistory(students, history)

    expect(history).toHaveLength(120)
    expect(result.find((student) => student.id === "student-1")?.pickCount).toBe(60)
    expect(result.find((student) => student.id === "student-2")?.pickCount).toBe(60)
  })

  it("removes history records that no longer point to existing students", () => {
    const history: PickHistory[] = [
      { id: "history-1", studentId: "student-1", studentName: "张三", pickedAt: "" },
      { id: "history-2", studentId: "deleted", studentName: "旧学生", pickedAt: "" },
    ]

    expect(removeOrphanHistory(history, students).map((record) => record.id)).toEqual(["history-1"])
  })

  it("resets counts to zero when history is empty", () => {
    const result = syncPickCountsFromHistory(
      students.map((student) => ({ ...student, pickCount: 10 })),
      [],
    )

    expect(result.every((student) => student.pickCount === 0)).toBe(true)
  })

  it("counts current scope statistics from scoped history only", () => {
    const history: PickHistory[] = [
      { id: "history-1", studentId: "student-1", studentName: "张三", pickedAt: "" },
      { id: "history-2", studentId: "student-1", studentName: "张三", pickedAt: "" },
      { id: "history-3", studentId: "student-2", studentName: "李四", pickedAt: "" },
      { id: "history-4", studentId: "outside", studentName: "范围外", pickedAt: "" },
    ]

    const result = getScopedStudentStats([students[1]], history)

    expect(result.scopedHistory.map((record) => record.id)).toEqual(["history-3"])
    expect(result.averagePickCount).toBe("1.0")
    expect(result.pickedStudentCount).toBe(1)
    expect(result.topStudents).toMatchObject([{ id: "student-2", pickCount: 1 }])
  })
})
