import * as XLSX from "xlsx"
import type { ImportParseResult, Student, StudentDraft } from "@/types"
import { inferGradeFromText, resolveGrade } from "@/utils/gradeInference"

const NAME_HEADERS = ["姓名", "名字", "学生", "学生姓名", "name", "student", "studentname"]
const NO_HEADERS = ["学号", "编号", "学生编号", "id", "studentno", "studentid", "no"]
const GRADE_HEADERS = ["年级", "级", "入学年份", "届", "grade", "year"]
const DEPARTMENT_HEADERS = ["院系", "学院", "系部", "院", "department", "school", "college"]
const MAJOR_HEADERS = ["专业", "专业名称", "方向", "major", "program"]
const CLASS_HEADERS = ["班级", "班别", "行政班", "教学班", "班", "class", "classname"]
const COURSE_HEADERS = ["课程", "课程名", "课程名称", "专业课", "科目", "course", "subject"]
const TAG_HEADERS = ["标签", "分组", "类别", "类型", "tag", "group", "category"]
const NOTE_HEADERS = ["备注", "说明", "note", "remark"]

type RowValue = string | number | boolean | null | undefined

interface ColumnMap {
  name: number
  studentNo?: number
  grade?: number
  department?: number
  major?: number
  className?: number
  course?: number
  tag?: number
  note?: number
}

interface ContextFields {
  grade?: string
  department?: string
  major?: string
  className?: string
  course?: string
  tag?: string
}

function normalizeHeader(value: RowValue): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()（）:_-]/g, "")
}

function cleanCell(value: RowValue): string {
  return String(value ?? "").trim()
}

function splitListValue(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(/[、,，/|；;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function mergeUnique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function isBlankRow(row: RowValue[]): boolean {
  return row.every((cell) => cleanCell(cell) === "")
}

function isSerialLike(value: string): boolean {
  return /^\d{1,3}$/.test(value)
}

function looksLikeStudentNo(value: string): boolean {
  return /^[A-Za-z0-9-]{5,20}$/.test(value) && /\d/.test(value)
}

function looksLikeGrade(value: string): boolean {
  return Boolean(inferGradeFromText(value)) && !looksLikeClassName(value)
}

function looksLikeClassName(value: string): boolean {
  return Boolean(value && /班|class/i.test(value) && !detectHeader([value]))
}

function looksLikeName(value: string): boolean {
  if (!value) return false
  if (isSerialLike(value)) return false
  if (/^\d{6,}$/.test(value)) return false
  if (/姓名|学号|编号|班级|年级|院系|学院|专业|课程|备注|name|student/i.test(value)) return false

  const chineseName = /^[\u4e00-\u9fa5·]{2,8}$/.test(value)
  const sampleStudentName = /^学生\d{1,3}$/.test(value)
  const englishName = /^[A-Za-z][A-Za-z .'-]{1,40}$/.test(value)
  return chineseName || sampleStudentName || englishName
}

function findHeaderIndex(headers: string[], candidates: string[]): number | undefined {
  const normalizedCandidates = candidates.map(normalizeHeader)
  const index = headers.findIndex((header) => normalizedCandidates.includes(header))
  return index >= 0 ? index : undefined
}

function detectHeader(row: RowValue[]): boolean {
  const headers = row.map(normalizeHeader)
  const allHeaders = [
    NAME_HEADERS,
    NO_HEADERS,
    GRADE_HEADERS,
    DEPARTMENT_HEADERS,
    MAJOR_HEADERS,
    CLASS_HEADERS,
    COURSE_HEADERS,
    TAG_HEADERS,
  ].flat()
  const normalized = allHeaders.map(normalizeHeader)
  return headers.some((header) => normalized.includes(header))
}

function scoreColumn(rows: RowValue[][], columnIndex: number): number {
  return rows.reduce((score, row) => {
    const value = cleanCell(row[columnIndex])
    if (looksLikeName(value)) return score + 2
    if (value && !isSerialLike(value) && !looksLikeStudentNo(value)) return score + 1
    return score
  }, 0)
}

function scoreStudentNoColumn(rows: RowValue[][], columnIndex: number): number {
  return rows.reduce((score, row) => {
    const value = cleanCell(row[columnIndex])
    return looksLikeStudentNo(value) ? score + 2 : score
  }, 0)
}

function scoreClassColumn(rows: RowValue[][], columnIndex: number): number {
  return rows.reduce((score, row) => {
    const value = cleanCell(row[columnIndex])
    return looksLikeClassName(value) ? score + 2 : score
  }, 0)
}

function scoreGradeColumn(rows: RowValue[][], columnIndex: number): number {
  return rows.reduce((score, row) => {
    const value = cleanCell(row[columnIndex])
    return looksLikeGrade(value) ? score + 2 : score
  }, 0)
}

function detectBestColumn(
  rows: RowValue[][],
  columnCount: number,
  scorer: (rows: RowValue[][], columnIndex: number) => number,
  excludedColumns: number[],
): number | undefined {
  let bestColumn: number | undefined
  let bestScore = 0

  for (let index = 0; index < columnCount; index += 1) {
    if (excludedColumns.includes(index)) continue
    const score = scorer(rows, index)
    if (score > bestScore) {
      bestColumn = index
      bestScore = score
    }
  }

  return bestColumn
}

function detectColumnMap(rows: RowValue[][]): { columnMap: ColumnMap; hasHeader: boolean; startRow: number } {
  const firstRow = rows[0] ?? []
  const hasHeader = detectHeader(firstRow)

  if (hasHeader) {
    const headers = firstRow.map(normalizeHeader)
    const nameIndex = findHeaderIndex(headers, NAME_HEADERS)

    return {
      hasHeader: true,
      startRow: 1,
      columnMap: {
        name: nameIndex ?? 0,
        studentNo: findHeaderIndex(headers, NO_HEADERS),
        grade: findHeaderIndex(headers, GRADE_HEADERS),
        department: findHeaderIndex(headers, DEPARTMENT_HEADERS),
        major: findHeaderIndex(headers, MAJOR_HEADERS),
        className: findHeaderIndex(headers, CLASS_HEADERS),
        course: findHeaderIndex(headers, COURSE_HEADERS),
        tag: findHeaderIndex(headers, TAG_HEADERS),
        note: findHeaderIndex(headers, NOTE_HEADERS),
      },
    }
  }

  const sampleRows = rows.slice(0, 12)
  const columnCount = Math.max(...sampleRows.map((row) => row.length), 1)
  let bestColumn = 0
  let bestScore = -1

  for (let index = 0; index < columnCount; index += 1) {
    const score = scoreColumn(sampleRows, index)
    if (score > bestScore) {
      bestColumn = index
      bestScore = score
    }
  }

  const studentNo = detectBestColumn(sampleRows, columnCount, scoreStudentNoColumn, [bestColumn])
  const className = detectBestColumn(sampleRows, columnCount, scoreClassColumn, [bestColumn, studentNo ?? -1])
  const grade = detectBestColumn(sampleRows, columnCount, scoreGradeColumn, [
    bestColumn,
    studentNo ?? -1,
    className ?? -1,
  ])

  return {
    hasHeader: false,
    startRow: 0,
    columnMap: {
      name: bestColumn,
      studentNo,
      grade,
      className,
    },
  }
}

function normalizeRows(rows: RowValue[][]): RowValue[][] {
  return rows.filter((row) => !isBlankRow(row))
}

function inferContextFromName(sourceName = ""): ContextFields {
  let text = sourceName.replace(/\.[^.]+$/, "")
  const context: ContextFields = {}

  const inferredGrade = inferGradeFromText(text)
  if (inferredGrade) {
    context.grade = inferredGrade
    text = text
      .replace(/(20\d{2}|19\d{2})\s*(级|届)/, "")
      .replace(/高\s*[一二三123](?:年级|级)?/, "")
      .replace(/初\s*[一二三123](?:年级|级)?/, "")
      .replace(/[七八九789]\s*年级/, "")
  }

  const courseMatch = text.match(/([\u4e00-\u9fa5A-Za-z0-9]+(?:课程|专业课|课))/)
  if (courseMatch) context.course = courseMatch[1].replace(/名单$/, "")

  const majorMatch = text.match(/([\u4e00-\u9fa5]{2,12}(?:工程|技术|科学|管理|设计|教育|医学|法学|文学|经济学|会计|金融|英语|数学))/)
  if (majorMatch) {
    context.major = majorMatch[1]
    text = text.replace(majorMatch[1], "")
  }

  const classMatch = text.match(/([\u4e00-\u9fa5A-Za-z]{1,8}(?:\(\d+\)|（\d+）|\d+)班)/)
  if (classMatch) context.className = classMatch[1]

  const departmentMatch = text.match(/([\u4e00-\u9fa5]{2,14}(?:学院|系|系部))/)
  if (departmentMatch) context.department = departmentMatch[1]

  return context
}

function buildDraft(row: RowValue[], columnMap: ColumnMap, context: ContextFields): StudentDraft | null {
  const name = cleanCell(row[columnMap.name])
  if (!name || !looksLikeName(name)) return null

  const studentNo = columnMap.studentNo === undefined ? "" : cleanCell(row[columnMap.studentNo])
  const department =
    columnMap.department === undefined ? context.department : cleanCell(row[columnMap.department]) || context.department
  const major = columnMap.major === undefined ? context.major : cleanCell(row[columnMap.major]) || context.major
  const className =
    columnMap.className === undefined ? context.className : cleanCell(row[columnMap.className]) || context.className
  const course = columnMap.course === undefined ? context.course : cleanCell(row[columnMap.course]) || context.course
  const tag = columnMap.tag === undefined ? context.tag : cleanCell(row[columnMap.tag]) || context.tag
  const note = columnMap.note === undefined ? "" : cleanCell(row[columnMap.note])
  const explicitGrade = columnMap.grade === undefined ? context.grade : cleanCell(row[columnMap.grade]) || context.grade
  const classes = mergeUnique(splitListValue(className))

  return {
    name,
    studentNo: studentNo || undefined,
    grade: resolveGrade(explicitGrade, classes),
    department,
    major,
    classes,
    courses: mergeUnique(splitListValue(course)),
    tags: mergeUnique(splitListValue(tag)),
    note: note || undefined,
  }
}

export function dedupeStudents(
  incoming: StudentDraft[],
  existingStudents: Student[] = [],
): { students: StudentDraft[]; duplicateNames: string[] } {
  void existingStudents
  const seenKeys = new Set<string>()
  const duplicateNames: string[] = []
  const students: StudentDraft[] = []

  for (const student of incoming) {
    const name = student.name.trim()
    const key = student.studentNo?.trim() || `name:${name}`
    if (!name) continue

    if (seenKeys.has(key)) {
      duplicateNames.push(name)
      continue
    }

    seenKeys.add(key)
    students.push({
      ...student,
      name,
      studentNo: student.studentNo?.trim() || undefined,
      classes: mergeUnique(student.classes ?? []),
      courses: mergeUnique(student.courses ?? []),
      tags: mergeUnique(student.tags ?? []),
    })
  }

  return { students, duplicateNames }
}

export function parseStudentRows(
  rows: RowValue[][],
  existingStudents: Student[] = [],
  sourceName = "",
): ImportParseResult {
  const normalizedRows = normalizeRows(rows)
  if (normalizedRows.length === 0) {
    return {
      students: [],
      skippedRows: ["文件中没有可识别的学生数据"],
      duplicateNames: [],
      mergedCount: 0,
      unchangedCount: 0,
      conflictRows: [],
      inferredFields: [],
      hasHeader: false,
    }
  }

  const context = inferContextFromName(sourceName)
  const inferredFields = Object.entries(context).map(([key, value]) => `${key}:${value}`)
  const { columnMap, hasHeader, startRow } = detectColumnMap(normalizedRows)
  const drafts: StudentDraft[] = []
  const skippedRows: string[] = []

  normalizedRows.slice(startRow).forEach((row, index) => {
    const rowNumber = index + startRow + 1
    const draft = buildDraft(row, columnMap, context)

    if (!draft) {
      skippedRows.push(`第 ${rowNumber} 行未识别到有效姓名`)
      return
    }

    drafts.push(draft)
  })

  const { students, duplicateNames } = dedupeStudents(drafts, existingStudents)

  return {
    students,
    skippedRows,
    duplicateNames,
    mergedCount: 0,
    unchangedCount: 0,
    conflictRows: [],
    inferredFields,
    detectedNameColumn: hasHeader ? cleanCell(normalizedRows[0][columnMap.name]) : `第 ${columnMap.name + 1} 列`,
    hasHeader,
  }
}

export function parseStudentText(text: string, existingStudents: Student[] = [], sourceName = ""): ImportParseResult {
  const normalizedText = text.replace(/^\uFEFF/, "")
  const lines = normalizedText.split(/\r?\n/).filter((line) => line.trim())
  const hasTableLikeLine = lines.length > 1 && lines.some((line) => /,|，|\t/.test(line))
  const rows = hasTableLikeLine
    ? lines.map((line) => line.split(/,|，|\t/).map((cell) => cell.trim()))
    : normalizedText
        .split(/[\r\n、,，\t ]+/)
        .filter((name) => name.trim())
        .map((name) => [name.trim()])

  return parseStudentRows(rows, existingStudents, sourceName)
}

export async function parseStudentImport(file: File, existingStudents: Student[] = []): Promise<ImportParseResult> {
  const extension = file.name.split(".").pop()?.toLowerCase()

  if (extension === "xlsx" || extension === "xls") {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const firstSheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[firstSheetName]
    const rows = XLSX.utils.sheet_to_json<RowValue[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: "",
    })

    return parseStudentRows(rows, existingStudents, `${file.name} ${firstSheetName}`)
  }

  const text = await file.text()
  return parseStudentText(text, existingStudents, file.name)
}

export function createStudentTemplateCsv(): string {
  const rows = [
    ["姓名", "学号", "年级", "院系", "专业", "班级", "课程", "标签", "备注"],
    ["张三", "20260001", "2026级", "信息工程学院", "软件工程", "软件1班", "数据结构", "一组", "示例数据，可删除"],
    ["李四", "20260002", "2026级", "信息工程学院", "软件工程", "软件1班", "数据结构", "", ""],
    ["王五", "20260003", "2026级", "信息工程学院", "计算机科学与技术", "计科1班", "高等数学", "", ""],
  ]

  return rows.map((row) => row.join(",")).join("\n")
}

export function createStudentTemplateWorkbook(): Blob {
  const rows = [
    ["姓名", "学号", "年级", "院系", "专业", "班级", "课程", "标签", "备注"],
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
