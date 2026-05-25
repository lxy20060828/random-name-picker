import { describe, expect, it } from "vitest"
import type { Student } from "@/types"
import { inferGradeFromText } from "@/utils/gradeInference"
import { dedupeStudents, parseStudentRows, parseStudentText } from "@/utils/importStudents"
import { filterStudents, getFilterOptions, sanitizeFilters } from "@/utils/studentFilters"
import { createStudentFromDraft, mergeStudentDraftsWithExisting, normalizeStudent } from "@/utils/studentMerge"

const existing: Student[] = [
  {
    id: "student-1",
    name: "张三",
    studentNo: "20260001",
    classes: ["软件1班"],
    courses: [],
    tags: [],
    pickCount: 0,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  },
]

describe("parseStudentImport helpers", () => {
  it("infers school grades from class-like text without matching regular major classes", () => {
    expect(inferGradeFromText("高一(1)班")).toBe("高一")
    expect(inferGradeFromText("高1班")).toBe("高一")
    expect(inferGradeFromText("初一1班")).toBe("初一")
    expect(inferGradeFromText("七年级1班")).toBe("初一")
    expect(inferGradeFromText("2026级软件1班")).toBe("2026级")
    expect(inferGradeFromText("软件1班")).toBeUndefined()
  })

  it("parses rows with headers and skips existing duplicates", () => {
    const result = parseStudentRows(
      [
        ["姓名", "学号", "年级", "院系", "专业", "班级", "课程", "备注"],
        ["张三", "20260001", "软件1班", ""],
        ["李四", "20260002", "2026级", "信息工程学院", "软件工程", "软件1班", "数据结构", "组长"],
      ],
    )

    expect(result.hasHeader).toBe(true)
    expect(result.detectedNameColumn).toBe("姓名")
    expect(result.students).toHaveLength(2)
    expect(result.students[1]).toMatchObject({
      name: "李四",
      studentNo: "20260002",
      grade: "2026级",
      department: "信息工程学院",
      major: "软件工程",
      classes: ["软件1班"],
      courses: ["数据结构"],
    })
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
    expect(result.students.every((student) => student.studentNo === undefined)).toBe(true)
    expect(result.students.map((student) => student.classes)).toEqual([["软件2班"], ["软件2班"], ["软件2班"]])
  })

  it("detects class and real student number columns without headers", () => {
    const result = parseStudentRows([
      [1, "赵涵", "20260101", "高一(1)班"],
      [2, "黄明", "20260102", "高一(2)班"],
      [3, "赵泽", "20260103", "高一(1)班"],
    ])

    expect(result.hasHeader).toBe(false)
    expect(result.detectedNameColumn).toBe("第 2 列")
    expect(result.students).toMatchObject([
      { name: "赵涵", studentNo: "20260101", grade: "高一", classes: ["高一(1)班"] },
      { name: "黄明", studentNo: "20260102", grade: "高一", classes: ["高一(2)班"] },
      { name: "赵泽", studentNo: "20260103", grade: "高一", classes: ["高一(1)班"] },
    ])
  })

  it("parses table-like text without headers", () => {
    const result = parseStudentText("1,王五,软件2班\n2,赵六,软件2班\n3,孙七,软件2班")

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
    const result = dedupeStudents([{ name: "张三" }, { name: "李四" }, { name: "李四" }])

    expect(result.students.map((student) => student.name)).toEqual(["张三", "李四"])
    expect(result.duplicateNames).toEqual(["李四"])
  })

  it("infers class and major from source name", () => {
    const result = parseStudentRows([["赵六", "20260006"]], [], "软件工程2026级软件1班名单.xlsx")

    expect(result.students[0]).toMatchObject({
      name: "赵六",
      studentNo: "20260006",
      grade: "2026级",
      major: "软件工程",
      classes: ["软件1班"],
    })
  })

  it("infers high-school grade from source names", () => {
    const result = parseStudentRows([["赵六", "20260006"]], [], "高一名单.xlsx")

    expect(result.inferredFields).toContain("grade:高一")
    expect(result.students[0]).toMatchObject({
      name: "赵六",
      studentNo: "20260006",
      grade: "高一",
    })
  })

  it("normalizes grade from class on create, legacy load, and conflicting class merge", () => {
    expect(createStudentFromDraft({ name: "赵涵", classes: ["高一(1)班"] }).grade).toBe("高一")
    expect(createStudentFromDraft({ name: "赵涵", grade: "2026级", classes: ["高一(1)班"] }).grade).toBe("2026级")
    expect(normalizeStudent({ name: "黄明", className: "高一(2)班" }).grade).toBe("高一")
    expect(normalizeStudent({ name: "赵泽", classes: ["高一(1)班", "高二(1)班"] }).grade).toBeUndefined()

    const result = mergeStudentDraftsWithExisting(
      [
        {
          id: "student-3",
          name: "赵涵",
          studentNo: "20260101",
          classes: ["高一(1)班"],
          courses: [],
          tags: [],
          pickCount: 0,
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
      [{ name: "赵涵", studentNo: "20260101", classes: ["高二(1)班"] }],
    )

    expect(result.nextStudents[0].classes).toEqual(["高一(1)班", "高二(1)班"])
    expect(result.nextStudents[0].grade).toBeUndefined()
  })

  it("filters students by multiple university dimensions", () => {
    const students: Student[] = [
      {
        id: "1",
        name: "李四",
        studentNo: "20260002",
        grade: "2026级",
        department: "信息工程学院",
        major: "软件工程",
        classes: ["软件1班"],
        courses: ["数据结构"],
        tags: [],
        pickCount: 0,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "2",
        name: "王五",
        studentNo: "20260003",
        grade: "2026级",
        department: "信息工程学院",
        major: "网络工程",
        classes: ["网工1班"],
        courses: ["计算机网络"],
        tags: [],
        pickCount: 0,
        createdAt: "",
        updatedAt: "",
      },
    ]

    const result = filterStudents(students, {
      keyword: "",
      grade: "2026级",
      department: "信息工程学院",
      major: "软件工程",
      className: "软件1班",
      course: "数据结构",
      tag: "",
    })

    expect(result.map((student) => student.name)).toEqual(["李四"])
  })

  it("builds filter options from inferred grades and sanitizes stale selected values", () => {
    const students: Student[] = [
      createStudentFromDraft({ name: "赵涵", studentNo: "20260101", classes: ["高一(1)班"] }),
      createStudentFromDraft({ name: "黄明", studentNo: "20260102", classes: ["高一(2)班"] }),
    ]
    const options = getFilterOptions(students)

    expect(options.grades).toEqual(["高一"])
    expect(filterStudents(students, {
      keyword: "",
      grade: "高一",
      department: "",
      major: "",
      className: "",
      course: "",
      tag: "",
    })).toHaveLength(2)
    expect(sanitizeFilters({
      keyword: "",
      grade: "高二",
      department: "",
      major: "",
      className: "",
      course: "",
      tag: "",
    }, options).grade).toBe("")
  })

  it("merges a second import by student number without creating duplicates", () => {
    const result = mergeStudentDraftsWithExisting(
      [
        {
          id: "student-2",
          name: "李四",
          studentNo: "20260002",
          grade: "2026级",
          department: "信息工程学院",
          major: "软件工程",
          classes: ["软件1班"],
          courses: ["数据结构"],
          tags: [],
          pickCount: 0,
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
      [
        {
          name: "李四",
          studentNo: "20260002",
          classes: ["软件2班"],
          courses: ["高等数学"],
          tags: ["二组"],
        },
      ],
      { now: () => "2026-06-02T00:00:00.000Z", createId: (prefix = "id") => `${prefix}-new` },
    )

    expect(result.nextStudents).toHaveLength(1)
    expect(result.mergedCount).toBe(1)
    expect(result.nextStudents[0].classes).toEqual(["软件1班", "软件2班"])
    expect(result.nextStudents[0].courses).toEqual(["数据结构", "高等数学"])
    expect(result.nextStudents[0].tags).toEqual(["二组"])
  })

  it("keeps unchanged students unchanged when imported data is identical", () => {
    const result = mergeStudentDraftsWithExisting(existing, [
      {
        name: "张三",
        studentNo: "20260001",
        classes: ["软件1班"],
      },
    ])

    expect(result.nextStudents).toHaveLength(1)
    expect(result.unchangedCount).toBe(1)
    expect(result.mergedCount).toBe(0)
  })

  it("reports a conflict when the same student number has a different name", () => {
    const result = mergeStudentDraftsWithExisting(existing, [
      {
        name: "李四",
        studentNo: "20260001",
        classes: ["软件1班"],
      },
    ])

    expect(result.nextStudents).toHaveLength(1)
    expect(result.conflictRows[0]).toContain("学号 20260001")
    expect(result.nextStudents[0].name).toBe("张三")
  })

  it("only picks from the filtered candidate list", () => {
    const students: Student[] = [
      {
        id: "1",
        name: "张三",
        studentNo: "20260001",
        major: "软件工程",
        classes: ["软件1班"],
        courses: ["数据结构"],
        tags: [],
        pickCount: 0,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "2",
        name: "李四",
        studentNo: "20260002",
        major: "网络工程",
        classes: ["网工1班"],
        courses: ["计算机网络"],
        tags: [],
        pickCount: 0,
        createdAt: "",
        updatedAt: "",
      },
    ]
    const candidates = filterStudents(students, {
      keyword: "",
      grade: "",
      department: "",
      major: "网络工程",
      className: "",
      course: "计算机网络",
      tag: "",
    })

    expect(candidates).toHaveLength(1)
    expect(candidates[0].name).toBe("李四")
  })
})
