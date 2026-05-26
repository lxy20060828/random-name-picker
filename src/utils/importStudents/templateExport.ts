import type { Student } from "@/types"
import type { XlsxModule } from "@/utils/importStudents/types"

const TEMPLATE_HEADERS = ["姓名", "学号", "年级", "院系", "专业", "班级", "课程", "标签", "备注"]

export function createStudentTemplateCsv(): string {
  const rows = [
    TEMPLATE_HEADERS,
    ["张三", "20260001", "2026级", "信息工程学院", "软件工程", "软件1班", "数据结构", "一组", "示例数据，可删除"],
    ["李四", "20260002", "2026级", "信息工程学院", "软件工程", "软件1班", "数据结构", "", ""],
    ["王五", "20260003", "2026级", "信息工程学院", "计算机科学与技术", "计科1班", "高等数学", "", ""],
  ]

  return rows.map((row) => row.join(",")).join("\n")
}

export async function createStudentTemplateWorkbook(): Promise<Blob> {
  const XLSX: XlsxModule = await import("xlsx")
  const rows = [
    TEMPLATE_HEADERS,
    ["学生01", "20260001", "2026级", "信息工程学院", "软件工程", "软件1班", "数据结构", "一组", "示例数据，可删除"],
    ["学生02", "20260002", "2026级", "信息工程学院", "软件工程", "软件1班", "数据结构", "", ""],
    ["学生03", "20260003", "2026级", "信息工程学院", "计算机科学与技术", "计科1班", "高等数学", "", ""],
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "软件工程2026级名单")
  const array = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer

  return new Blob([array], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}

export function exportStudentsCsv(students: Student[]): string {
  const rows = [
    ["姓名", "学号", "年级", "院系", "专业", "班级", "课程", "标签", "备注", "点名次数", "创建时间"],
    ...students.map((student) => [
      student.name,
      student.studentNo,
      student.grade ?? "",
      student.department ?? "",
      student.major ?? "",
      student.classes.join("、"),
      student.courses.join("、"),
      student.tags.join("、"),
      student.note ?? "",
      String(student.pickCount),
      student.createdAt,
    ]),
  ]

  return rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n")
}
