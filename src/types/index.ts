export interface Student {
  id: string
  name: string
  studentNo?: string
  className?: string
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
  className?: string
  note?: string
}

export interface ImportParseResult {
  students: StudentDraft[]
  skippedRows: string[]
  duplicateNames: string[]
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
}
