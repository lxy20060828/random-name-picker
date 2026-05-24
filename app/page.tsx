"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/header"
import { NameWheel } from "@/components/name-wheel"
import { StudentList } from "@/components/student-list"
import { HistoryPanel } from "@/components/history-panel"
import { AddStudentDialog } from "@/components/add-student-dialog"
import { ImportDialog } from "@/components/import-dialog"
import type { Student, PickHistory } from "@/types"

const STORAGE_KEY = "random-picker-students"
const HISTORY_KEY = "random-picker-history"

export default function Home() {
  const [students, setStudents] = useState<Student[]>([])
  const [history, setHistory] = useState<PickHistory[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)

  // 从 localStorage 加载数据
  useEffect(() => {
    const savedStudents = localStorage.getItem(STORAGE_KEY)
    const savedHistory = localStorage.getItem(HISTORY_KEY)
    if (savedStudents) {
      setStudents(JSON.parse(savedStudents))
    }
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  // 保存学生数据到 localStorage
  useEffect(() => {
    if (students.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students))
    }
  }, [students])

  // 保存历史记录到 localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    }
  }, [history])

  // 添加单个学生
  const handleAddStudent = (name: string) => {
    const newStudent: Student = {
      id: Date.now().toString(),
      name,
      pickCount: 0,
      createdAt: new Date().toISOString(),
    }
    setStudents((prev) => [...prev, newStudent])
  }

  // 批量导入学生
  const handleImportStudents = (names: string[]) => {
    const newStudents: Student[] = names.map((name, index) => ({
      id: `${Date.now()}-${index}`,
      name,
      pickCount: 0,
      createdAt: new Date().toISOString(),
    }))
    setStudents((prev) => [...prev, ...newStudents])
  }

  // 删除学生
  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id))
  }

  // 清空所有学生
  const handleClearAll = () => {
    setStudents([])
    localStorage.removeItem(STORAGE_KEY)
  }

  // 随机抽取
  const handleSpin = useCallback(() => {
    if (students.length === 0 || isSpinning) return

    setIsSpinning(true)
    setSelectedStudent(null)

    // 模拟转盘动画
    const duration = 3000
    const intervalTime = 100
    let elapsed = 0

    const interval = setInterval(() => {
      elapsed += intervalTime
      const randomIndex = Math.floor(Math.random() * students.length)
      setSelectedStudent(students[randomIndex])

      if (elapsed >= duration) {
        clearInterval(interval)
        // 最终选择
        const finalIndex = Math.floor(Math.random() * students.length)
        const finalStudent = students[finalIndex]
        setSelectedStudent(finalStudent)
        setIsSpinning(false)

        // 更新被选中学生的次数
        setStudents((prev) =>
          prev.map((s) =>
            s.id === finalStudent.id ? { ...s, pickCount: s.pickCount + 1 } : s
          )
        )

        // 添加历史记录
        const newHistory: PickHistory = {
          id: Date.now().toString(),
          studentId: finalStudent.id,
          studentName: finalStudent.name,
          pickedAt: new Date().toISOString(),
        }
        setHistory((prev) => [newHistory, ...prev].slice(0, 100))
      }
    }, intervalTime)
  }, [students, isSpinning])

  // 清空历史记录
  const handleClearHistory = () => {
    setHistory([])
    localStorage.removeItem(HISTORY_KEY)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        studentCount={students.length}
        onAddClick={() => setShowAddDialog(true)}
        onImportClick={() => setShowImportDialog(true)}
        onClearAll={handleClearAll}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* 左侧：转盘区域 */}
          <div className="lg:col-span-2">
            <NameWheel
              students={students}
              isSpinning={isSpinning}
              selectedStudent={selectedStudent}
              onSpin={handleSpin}
            />
          </div>

          {/* 右侧：学生列表和历史 */}
          <div className="space-y-6">
            <StudentList
              students={students}
              onDelete={handleDeleteStudent}
            />
            <HistoryPanel
              history={history}
              onClear={handleClearHistory}
            />
          </div>
        </div>
      </main>

      <AddStudentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAddStudent}
      />

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImportStudents}
      />
    </div>
  )
}
