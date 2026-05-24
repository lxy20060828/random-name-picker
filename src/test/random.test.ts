import { describe, expect, it, vi } from "vitest"
import type { Student } from "@/types"
import { pickRandomStudent } from "@/utils/random"

const students: Student[] = [
  {
    id: "student-1",
    name: "张三",
    pickCount: 0,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "student-2",
    name: "李四",
    pickCount: 0,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  },
]

describe("pickRandomStudent", () => {
  it("returns null when the student list is empty", () => {
    expect(pickRandomStudent([])).toBeNull()
  })

  it("returns one student from the candidate list", () => {
    const result = pickRandomStudent(students)

    expect(result).not.toBeNull()
    expect(students).toContain(result)
  })

  it("uses the random index to select a student", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.75)

    expect(pickRandomStudent(students)?.name).toBe("李四")
    randomSpy.mockRestore()
  })
})
