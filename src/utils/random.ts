import type { Student } from "@/types"

export function pickRandomStudent(students: Student[]): Student | null {
  if (students.length === 0) return null

  const randomIndex = Math.floor(Math.random() * students.length)
  return students[randomIndex]
}
