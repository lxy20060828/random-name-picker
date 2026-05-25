import type { FilterOptions, Student, StudentFilters } from "@/types"

export const EMPTY_FILTERS: StudentFilters = {
  keyword: "",
  grade: "",
  department: "",
  major: "",
  className: "",
  course: "",
  tag: "",
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  )
}

function includesText(value: string | undefined, keyword: string): boolean {
  return Boolean(value?.toLowerCase().includes(keyword))
}

export function getFilterOptions(students: Student[]): FilterOptions {
  return {
    grades: uniqueSorted(students.flatMap((student) => (student.grade ? [student.grade] : []))),
    departments: uniqueSorted(students.flatMap((student) => (student.department ? [student.department] : []))),
    majors: uniqueSorted(students.flatMap((student) => (student.major ? [student.major] : []))),
    classes: uniqueSorted(students.flatMap((student) => student.classes)),
    courses: uniqueSorted(students.flatMap((student) => student.courses)),
    tags: uniqueSorted(students.flatMap((student) => student.tags)),
  }
}

export function filterStudents(students: Student[], filters: StudentFilters): Student[] {
  const keyword = filters.keyword.trim().toLowerCase()

  return students.filter((student) => {
    const matchesKeyword =
      !keyword ||
      includesText(student.name, keyword) ||
      includesText(student.studentNo, keyword) ||
      includesText(student.grade, keyword) ||
      includesText(student.department, keyword) ||
      includesText(student.major, keyword) ||
      student.classes.some((className) => includesText(className, keyword)) ||
      student.courses.some((course) => includesText(course, keyword)) ||
      student.tags.some((tag) => includesText(tag, keyword)) ||
      includesText(student.note, keyword)

    return (
      matchesKeyword &&
      (!filters.grade || student.grade === filters.grade) &&
      (!filters.department || student.department === filters.department) &&
      (!filters.major || student.major === filters.major) &&
      (!filters.className || student.classes.includes(filters.className)) &&
      (!filters.course || student.courses.includes(filters.course)) &&
      (!filters.tag || student.tags.includes(filters.tag))
    )
  })
}

export function sanitizeFilters(filters: StudentFilters, options: FilterOptions): StudentFilters {
  return {
    ...filters,
    grade: options.grades.includes(filters.grade) ? filters.grade : "",
    department: options.departments.includes(filters.department) ? filters.department : "",
    major: options.majors.includes(filters.major) ? filters.major : "",
    className: options.classes.includes(filters.className) ? filters.className : "",
    course: options.courses.includes(filters.course) ? filters.course : "",
    tag: options.tags.includes(filters.tag) ? filters.tag : "",
  }
}

export function describeFilters(filters: StudentFilters, candidateCount: number): string {
  const selected = [
    filters.grade,
    filters.department,
    filters.major,
    filters.className,
    filters.course,
    filters.tag,
  ].filter(Boolean)

  if (selected.length === 0 && !filters.keyword.trim()) {
    return `当前范围：全部学生 / ${candidateCount}人`
  }

  if (filters.keyword.trim()) {
    selected.unshift(`关键词：${filters.keyword.trim()}`)
  }

  return `当前范围：${selected.join(" / ")} / ${candidateCount}人`
}
