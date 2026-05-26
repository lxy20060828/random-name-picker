import type { ImportParseResult, Student, StudentDraft } from "@/types"
import { resolveGrade } from "@/utils/gradeInference"
import { cleanCell, detectColumnMap, isBlankRow, looksLikeName } from "@/utils/importStudents/headerDetection"
import { inferContextFromName } from "@/utils/importStudents/contextInference"
import type { ColumnMap, ContextFields, RowValue, XlsxModule } from "@/utils/importStudents/types"
import { mergeUniqueStrings, splitListInput } from "@/utils/listInput"

function normalizeRows(rows: RowValue[][]): RowValue[][] {
  return rows.filter((row) => !isBlankRow(row))
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
  const classes = mergeUniqueStrings(splitListInput(className))

  return {
    name,
    studentNo: studentNo || undefined,
    grade: resolveGrade(explicitGrade, classes),
    department,
    major,
    classes,
    courses: mergeUniqueStrings(splitListInput(course)),
    tags: mergeUniqueStrings(splitListInput(tag)),
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
      classes: mergeUniqueStrings(student.classes ?? []),
      courses: mergeUniqueStrings(student.courses ?? []),
      tags: mergeUniqueStrings(student.tags ?? []),
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
    const XLSX: XlsxModule = await import("xlsx")
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
