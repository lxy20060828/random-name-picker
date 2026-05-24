export interface Student {
  id: string
  name: string
  pickCount: number
  createdAt: string
}

export interface PickHistory {
  id: string
  studentId: string
  studentName: string
  pickedAt: string
}
