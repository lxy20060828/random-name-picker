const CHINESE_GRADE_NUMBERS: Record<string, string> = {
  "1": "一",
  "2": "二",
  "3": "三",
  "一": "一",
  "二": "二",
  "三": "三",
}

const MIDDLE_SCHOOL_GRADE_NUMBERS: Record<string, string> = {
  "1": "一",
  "2": "二",
  "3": "三",
  "7": "一",
  "8": "二",
  "9": "三",
  "一": "一",
  "二": "二",
  "三": "三",
  "七": "一",
  "八": "二",
  "九": "三",
}

function cleanText(value: string | undefined): string {
  return String(value ?? "").trim()
}

export function normalizeExplicitGrade(value: string | undefined): string | undefined {
  return cleanText(value) || undefined
}

export function inferGradeFromText(value: string | undefined): string | undefined {
  const text = cleanText(value)
  if (!text) return undefined

  const yearGradeMatch = text.match(/(19\d{2}|20\d{2})\s*级/)
  if (yearGradeMatch) return `${yearGradeMatch[1]}级`

  const yearGraduationMatch = text.match(/(19\d{2}|20\d{2})\s*届/)
  if (yearGraduationMatch) return `${yearGraduationMatch[1]}届`

  const highSchoolMatch = text.match(/高\s*([一二三123])(?:年级|级|[\(（]?\d|班|名单|学生|$)/)
  if (highSchoolMatch) {
    const grade = CHINESE_GRADE_NUMBERS[highSchoolMatch[1]]
    if (grade) return `高${grade}`
  }

  const juniorSchoolMatch = text.match(/初\s*([一二三123])(?:年级|级|[\(（]?\d|班|名单|学生|$)/)
  if (juniorSchoolMatch) {
    const grade = CHINESE_GRADE_NUMBERS[juniorSchoolMatch[1]]
    if (grade) return `初${grade}`
  }

  const middleSchoolMatch = text.match(/([七八九789])\s*年级/)
  if (middleSchoolMatch) {
    const grade = MIDDLE_SCHOOL_GRADE_NUMBERS[middleSchoolMatch[1]]
    if (grade) return `初${grade}`
  }

  return undefined
}

export function inferGradeFromTexts(values: Array<string | undefined>): string | undefined {
  const grades = new Set(values.map(inferGradeFromText).filter(Boolean))
  return grades.size === 1 ? [...grades][0] : undefined
}

export function resolveGrade(explicitGrade: string | undefined, fallbackTexts: Array<string | undefined>): string | undefined {
  return normalizeExplicitGrade(explicitGrade) ?? inferGradeFromTexts(fallbackTexts)
}
