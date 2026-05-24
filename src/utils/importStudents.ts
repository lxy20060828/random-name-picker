import * as XLSX from "xlsx"
import type { ImportParseResult, Student, StudentDraft } from "@/types"

const NAME_HEADERS = ["姓名", "名字", "学生", "学生姓名", "name", "student", "studentname"]
const NO_HEADERS = ["学号", "编号", "序号", "id", "studentno", "studentid", "no"]
const CLASS_HEADERS = ["班级", "班别", "class", "classname"]
const NOTE_HEADERS = ["备注", "说明", "note", "remark"]

type RowValue = string | number | boolean | null | undefined

interface ColumnMap {
  name: number
  studentNo?: number
  className?: number
  note?: number
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

function isBlankRow(row: RowValue[]): boolean {
  return row.every((cell) => cleanCell(cell) === "")
}

function isSerialLike(value: string): boolean {
  return /^\d{1,3}$/.test(value)
}

function looksLikeName(value: string): boolean {
  if (!value) return false
  if (isSerialLike(value)) return false
  if (/^\d{6,}$/.test(value)) return false
  if (/姓名|学号|编号|班级|备注|name|student/i.test(value)) return false

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
  return (
    findHeaderIndex(headers, NAME_HEADERS) !== undefined ||
    headers.some((header) => NO_HEADERS.map(normalizeHeader).includes(header)) ||
    headers.some((header) => CLASS_HEADERS.map(normalizeHeader).includes(header))
  )
}

function scoreColumn(rows: RowValue[][], columnIndex: number): number {
  return rows.reduce((score, row) => {
    const value = cleanCell(row[columnIndex])
    if (looksLikeName(value)) return score + 2
    if (value && !isSerialLike(value)) return score + 1
    return score
  }, 0)
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
        className: findHeaderIndex(headers, CLASS_HEADERS),
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

  return {
    hasHeader: false,
    startRow: 0,
    columnMap: {
      name: bestColumn,
      studentNo: bestColumn === 0 ? 1 : 0,
    },
  }
}

function normalizeRows(rows: RowValue[][]): RowValue[][] {
  return rows.filter((row) => !isBlankRow(row))
}

export function dedupeStudents(
  incoming: StudentDraft[],
  existingStudents: Student[] = [],
): { students: StudentDraft[]; duplicateNames: string[] } {
  const seen = new Set(existingStudents.map((student) => student.name.trim()))
  const duplicateNames: string[] = []
  const students: StudentDraft[] = []

  for (const student of incoming) {
    const name = student.name.trim()
    if (!name) continue

    if (seen.has(name)) {
      duplicateNames.push(name)
      continue
    }

    seen.add(name)
    students.push({
      ...student,
      name,
      studentNo: student.studentNo?.trim() || undefined,
      className: student.className?.trim() || undefined,
      note: student.note?.trim() || undefined,
    })
  }

  return { students, duplicateNames }
}

export function parseStudentRows(rows: RowValue[][], existingStudents: Student[] = []): ImportParseResult {
  const normalizedRows = normalizeRows(rows)
  if (normalizedRows.length === 0) {
    return {
      students: [],
      skippedRows: ["文件中没有可识别的学生数据"],
      duplicateNames: [],
      hasHeader: false,
    }
  }

  const { columnMap, hasHeader, startRow } = detectColumnMap(normalizedRows)
  const drafts: StudentDraft[] = []
  const skippedRows: string[] = []

  normalizedRows.slice(startRow).forEach((row, index) => {
    const rowNumber = index + startRow + 1
    const name = cleanCell(row[columnMap.name])

    if (!name || !looksLikeName(name)) {
      skippedRows.push(`第 ${rowNumber} 行未识别到有效姓名`)
      return
    }

    drafts.push({
      name,
      studentNo: columnMap.studentNo === undefined ? undefined : cleanCell(row[columnMap.studentNo]),
      className: columnMap.className === undefined ? undefined : cleanCell(row[columnMap.className]),
      note: columnMap.note === undefined ? undefined : cleanCell(row[columnMap.note]),
    })
  })

  const { students, duplicateNames } = dedupeStudents(drafts, existingStudents)

  return {
    students,
    skippedRows,
    duplicateNames,
    detectedNameColumn: hasHeader ? cleanCell(normalizedRows[0][columnMap.name]) : `第 ${columnMap.name + 1} 列`,
    hasHeader,
  }
}

export function parseStudentText(text: string, existingStudents: Student[] = []): ImportParseResult {
  const normalizedText = text.replace(/^\uFEFF/, "")
  const lines = normalizedText.split(/\r?\n/).filter((line) => line.trim())
  const firstLineCells = (lines[0] ?? "").split(/,|，|\t/).map((cell) => cell.trim())
  const firstLineLooksLikeHeader = detectHeader(firstLineCells)
  const hasTableLikeLine =
    lines.length > 1 && (firstLineLooksLikeHeader || lines.some((line) => line.includes("\t")))
  const rows = hasTableLikeLine
    ? lines.map((line) => line.split(/,|，|\t/).map((cell) => cell.trim()))
    : normalizedText
        .split(/[\r\n、,，\t ]+/)
        .filter((name) => name.trim())
        .map((name) => [name.trim()])

  return parseStudentRows(rows, existingStudents)
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

    return parseStudentRows(rows, existingStudents)
  }

  const text = await file.text()
  return parseStudentText(text, existingStudents)
}

export function createStudentTemplateCsv(): string {
  const rows = [
    ["姓名", "学号", "班级", "备注"],
    ["张三", "20260001", "软件1班", "示例数据，可删除"],
    ["李四", "20260002", "软件1班", ""],
    ["王五", "20260003", "软件1班", ""],
  ]

  return rows.map((row) => row.join(",")).join("\n")
}

export function createStudentTemplateWorkbook(): Blob {
  const rows = [
    ["姓名", "学号", "班级", "备注"],
    ["学生01", "20260001", "软件1班", "示例数据，可删除"],
    ["学生02", "20260002", "软件1班", ""],
    ["学生03", "20260003", "软件1班", ""],
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "学生名单")
  const array = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer

  return new Blob([array], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}

export function exportStudentsCsv(students: Student[]): string {
  const rows = [
    ["姓名", "学号", "班级", "备注", "点名次数", "创建时间"],
    ...students.map((student) => [
      student.name,
      student.studentNo ?? "",
      student.className ?? "",
      student.note ?? "",
      String(student.pickCount),
      student.createdAt,
    ]),
  ]

  return rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n")
}
