import { inferGradeFromText } from "@/utils/gradeInference"
import type { ColumnMap, RowValue } from "@/utils/importStudents/types"

const NAME_HEADERS = ["姓名", "名字", "学生", "学生姓名", "name", "student", "studentname"]
const NO_HEADERS = ["学号", "编号", "学生编号", "id", "studentno", "studentid", "no"]
const GRADE_HEADERS = ["年级", "级", "入学年份", "届", "grade", "year"]
const DEPARTMENT_HEADERS = ["院系", "学院", "系部", "院", "department", "school", "college"]
const MAJOR_HEADERS = ["专业", "专业名称", "方向", "major", "program"]
const CLASS_HEADERS = ["班级", "班别", "行政班", "教学班", "班", "class", "classname"]
const COURSE_HEADERS = ["课程", "课程名", "课程名称", "专业课", "科目", "course", "subject"]
const TAG_HEADERS = ["标签", "分组", "类别", "类型", "tag", "group", "category"]
const NOTE_HEADERS = ["备注", "说明", "note", "remark"]

export function normalizeHeader(value: RowValue): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()（）:_-]/g, "")
}

export function cleanCell(value: RowValue): string {
  return String(value ?? "").trim()
}

export function isBlankRow(row: RowValue[]): boolean {
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

export function looksLikeName(value: string): boolean {
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

export function detectColumnMap(rows: RowValue[][]): { columnMap: ColumnMap; hasHeader: boolean; startRow: number } {
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
