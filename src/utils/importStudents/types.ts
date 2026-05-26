export type RowValue = string | number | boolean | null | undefined

export interface ColumnMap {
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

export interface ContextFields {
  grade?: string
  department?: string
  major?: string
  className?: string
  course?: string
  tag?: string
}

export type XlsxModule = typeof import("xlsx")
