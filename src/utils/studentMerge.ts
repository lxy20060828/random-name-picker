import type { ImportParseResult, Student, StudentDraft } from "@/types"
import { inferGradeFromTexts, resolveGrade } from "@/utils/gradeInference"
import { createId } from "@/utils/id"

export type LegacyStudent = Partial<Student> & { className?: string }

interface MergeOptions {
  now?: () => string
  createId?: (prefix?: string) => string
}

export interface StudentMergeResult extends ImportParseResult {
  nextStudents: Student[]
}

function currentIso(options: MergeOptions): string {
  return options.now?.() ?? new Date().toISOString()
}

export function normalizeList(values: string[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))]
}

export function normalizeStudent(raw: LegacyStudent, options: MergeOptions = {}): Student {
  const currentTime = currentIso(options)
  const classes = normalizeList([...(raw.classes ?? []), raw.className ?? ""])
  const grade = resolveGrade(raw.grade, classes)

  return {
    id: raw.id ?? (options.createId ?? createId)("student"),
    name: raw.name?.trim() ?? "",
    studentNo: raw.studentNo?.trim() ?? "",
    grade,
    department: raw.department?.trim() || undefined,
    major: raw.major?.trim() || undefined,
    classes,
    courses: normalizeList(raw.courses),
    tags: normalizeList(raw.tags),
    note: raw.note?.trim() || undefined,
    pickCount: raw.pickCount ?? 0,
    createdAt: raw.createdAt ?? currentTime,
    updatedAt: raw.updatedAt ?? currentTime,
  }
}

export function mergeStudentProfiles(target: Student, incoming: Student, options: MergeOptions = {}): Student {
  const classes = normalizeList([...target.classes, ...incoming.classes])

  return {
    ...target,
    studentNo: target.studentNo || incoming.studentNo,
    grade: resolveMergedGrade(target, incoming, classes),
    department: target.department || incoming.department,
    major: target.major || incoming.major,
    classes,
    courses: normalizeList([...target.courses, ...incoming.courses]),
    tags: normalizeList([...target.tags, ...incoming.tags]),
    note: target.note || incoming.note,
    updatedAt: currentIso(options),
  }
}

export function createStudentFromDraft(draft: StudentDraft, options: MergeOptions = {}): Student {
  const currentTime = currentIso(options)
  const classes = normalizeList(draft.classes)
  const grade = resolveGrade(draft.grade, classes)

  return {
    id: (options.createId ?? createId)("student"),
    name: draft.name.trim(),
    studentNo: draft.studentNo?.trim() || "",
    grade,
    department: draft.department?.trim() || undefined,
    major: draft.major?.trim() || undefined,
    classes,
    courses: normalizeList(draft.courses),
    tags: normalizeList(draft.tags),
    note: draft.note?.trim() || undefined,
    pickCount: 0,
    createdAt: currentTime,
    updatedAt: currentTime,
  }
}

function isSameProfile(left: Student, right: Student): boolean {
  return (
    left.name === right.name &&
    left.studentNo === right.studentNo &&
    left.grade === right.grade &&
    left.department === right.department &&
    left.major === right.major &&
    left.note === right.note &&
    left.classes.join("|") === right.classes.join("|") &&
    left.courses.join("|") === right.courses.join("|") &&
    left.tags.join("|") === right.tags.join("|")
  )
}

function profileConflictMessages(existing: Student, incoming: Student): string[] {
  const subject = incoming.studentNo ? `学号 ${incoming.studentNo}` : `学生 ${incoming.name}`
  const fields: Array<[label: string, oldValue: string | undefined, newValue: string | undefined]> = [
    ["年级", existing.grade, incoming.grade],
    ["院系", existing.department, incoming.department],
    ["专业", existing.major, incoming.major],
  ]

  return fields
    .filter(([, oldValue, newValue]) => Boolean(oldValue && newValue && oldValue !== newValue))
    .map(([label, oldValue, newValue]) => `${subject} 的${label}不一致，已保留 ${oldValue}，导入值为 ${newValue}`)
}

function isGradeInferredFromClasses(student: Student): boolean {
  return Boolean(student.grade && inferGradeFromTexts(student.classes) === student.grade)
}

function resolveMergedGrade(existing: Student, incoming: Student, mergedClasses: string[]): string | undefined {
  const inferredFromMergedClasses = inferGradeFromTexts(mergedClasses)
  const existingGradeLooksInferred = isGradeInferredFromClasses(existing)
  const incomingGradeLooksInferred = isGradeInferredFromClasses(incoming)

  if (
    existing.grade &&
    incoming.grade &&
    existing.grade !== incoming.grade &&
    existingGradeLooksInferred &&
    incomingGradeLooksInferred
  ) {
    return inferredFromMergedClasses
  }

  return existing.grade || incoming.grade || inferredFromMergedClasses
}

export function mergeStudentDraftsWithExisting(
  existingStudents: Student[],
  drafts: StudentDraft[],
  options: MergeOptions = {},
): StudentMergeResult {
  const result: StudentMergeResult = {
    nextStudents: existingStudents.map((student) => normalizeStudent(student, options)),
    students: [],
    skippedRows: [],
    duplicateNames: [],
    mergedCount: 0,
    unchangedCount: 0,
    conflictRows: [],
    inferredFields: [],
    hasHeader: true,
  }

  for (const draft of drafts) {
    if (!draft.name.trim()) continue

    const incoming = createStudentFromDraft(draft, options)
    const byNoIndex = incoming.studentNo
      ? result.nextStudents.findIndex((student) => student.studentNo === incoming.studentNo)
      : -1
    const byNameIndexes = result.nextStudents
      .map((student, index) => ({ student, index }))
      .filter(({ student }) => student.name === incoming.name)
    const existingIndex = byNoIndex >= 0 ? byNoIndex : byNameIndexes.length === 1 ? byNameIndexes[0].index : -1

    if (!incoming.studentNo && byNameIndexes.length > 1) {
      result.skippedRows.push(`${incoming.name} 无学号且姓名重复，已跳过`)
      continue
    }

    if (existingIndex < 0) {
      result.nextStudents.push(incoming)
      result.students.push(draft)
      continue
    }

    const existing = result.nextStudents[existingIndex]
    if (incoming.studentNo && existing.name !== incoming.name) {
      result.conflictRows.push(`学号 ${incoming.studentNo} 已属于 ${existing.name}，导入姓名为 ${incoming.name}`)
      continue
    }

    result.conflictRows.push(...profileConflictMessages(existing, incoming))

    const merged = mergeStudentProfiles(existing, incoming, options)

    if (isSameProfile(existing, merged)) {
      result.unchangedCount += 1
    } else {
      result.nextStudents[existingIndex] = merged
      result.mergedCount += 1
    }
  }

  return result
}
