import { inject } from "vue"
import type { StudentStore } from "@/types/store"

export function useStudentStore(): StudentStore {
  const store = inject<StudentStore>("studentStore")

  if (!store) {
    throw new Error("Student store is not provided.")
  }

  return store
}
