import { describe, expect, it } from "vitest"
import type { Student } from "@/types"
import { dedupeStudents, parseStudentRows, parseStudentText } from "@/utils/importStudents"

const existing: Student[] = [
  {
    id: "student-1",
    name: "张三",
    pickCount: 0,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  },
]

describe("parseStudentImport helpers", () => {
  it("parses rows with headers and skips existing duplicates", () => {
    const result = parseStudentRows(
      [
        ["姓名", "学号", "班级", "备注"],
        ["张三", "20260001", "软件1班", ""],
        ["李四", "20260002", "软件1班", "组长"],
      ],
      existing,
    )

    expect(result.hasHeader).toBe(true)
    expect(result.detectedNameColumn).toBe("姓名")
    expect(result.students).toHaveLength(1)
    expect(result.students[0]).toMatchObject({ name: "李四", studentNo: "20260002", className: "软件1班" })
    expect(result.duplicateNames).toEqual(["张三"])
  })

  it("detects a name column without headers", () => {
    const result = parseStudentRows([
      [1, "王五", "软件2班"],
      [2, "赵六", "软件2班"],
      [3, "孙七", "软件2班"],
    ])

    expect(result.hasHeader).toBe(false)
    expect(result.detectedNameColumn).toBe("第 2 列")
    expect(result.students.map((student) => student.name)).toEqual(["王五", "赵六", "孙七"])
  })

  it("parses pasted text with common separators", () => {
    const result = parseStudentText("周八\n吴九、郑十")

    expect(result.students.map((student) => student.name)).toEqual(["周八", "吴九", "郑十"])
  })

  it("parses comma separated names when no table header exists", () => {
    const result = parseStudentText("学生01,学生02,学生03")

    expect(result.students.map((student) => student.name)).toEqual(["学生01", "学生02", "学生03"])
  })

  it("deduplicates imported students against existing and current rows", () => {
    const result = dedupeStudents([{ name: "张三" }, { name: "李四" }, { name: "李四" }], existing)

    expect(result.students.map((student) => student.name)).toEqual(["李四"])
    expect(result.duplicateNames).toEqual(["张三", "李四"])
  })
})
