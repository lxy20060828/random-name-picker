export interface Student {
  id: string
  name: string
  studentNo: string
  grade?: string
  department?: string
  major?: string
  classes: string[]
  courses: string[]
  tags: string[]
  note?: string
  pickCount: number
  createdAt: string
  updatedAt: string
}

export interface PickHistory {
  id: string
  studentId: string
  studentName: string
  pickedAt: string
}

export interface StudentDraft {
  name: string
  studentNo?: string
  grade?: string
  department?: string
  major?: string
  classes?: string[]
  courses?: string[]
  tags?: string[]
  note?: string
}

export interface ImportParseResult {
  students: StudentDraft[]
  skippedRows: string[]
  duplicateNames: string[]
  mergedCount: number
  unchangedCount: number
  conflictRows: string[]
  inferredFields: string[]
  detectedNameColumn?: string
  hasHeader: boolean
}

export interface ImportSummary {
  imported: number
  duplicates: number
  skipped: number
}

export interface Quote {
  content: string
  source: string
  fromApi: boolean
  provider?: "tianapi" | "hitokoto" | "local"
}

export interface StudentFilters {
  keyword: string
  grade: string
  department: string
  major: string
  className: string
  course: string
  tag: string
}

export interface FilterOptions {
  grades: string[]
  departments: string[]
  majors: string[]
  classes: string[]
  courses: string[]
  tags: string[]
}
