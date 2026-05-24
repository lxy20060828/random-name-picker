"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shuffle, UserCheck } from "lucide-react"
import type { Student } from "@/types"
import { cn } from "@/lib/utils"

interface NameWheelProps {
  students: Student[]
  isSpinning: boolean
  selectedStudent: Student | null
  onSpin: () => void
}

export function NameWheel({
  students,
  isSpinning,
  selectedStudent,
  onSpin,
}: NameWheelProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-8">
        <div className="flex flex-col items-center">
          {/* 主显示区域 */}
          <div className="relative w-full max-w-md aspect-square flex items-center justify-center mb-8">
            {/* 背景圆环 */}
            <div className="absolute inset-0 rounded-full border-4 border-border" />
            <div className="absolute inset-4 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-8 rounded-full border border-primary/10" />
            
            {/* 动态光环效果 */}
            <div
              className={cn(
                "absolute inset-0 rounded-full transition-opacity duration-300",
                isSpinning
                  ? "opacity-100 animate-pulse"
                  : selectedStudent
                  ? "opacity-100"
                  : "opacity-0"
              )}
              style={{
                background: isSpinning
                  ? "radial-gradient(circle, rgba(45, 212, 191, 0.15) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(45, 212, 191, 0.2) 0%, transparent 60%)",
              }}
            />

            {/* 名字显示 */}
            <div className="relative z-10 text-center">
              {students.length === 0 ? (
                <div className="space-y-2">
                  <UserCheck className="w-16 h-16 mx-auto text-muted-foreground/50" />
                  <p className="text-muted-foreground">请先添加学生名单</p>
                </div>
              ) : selectedStudent ? (
                <div
                  className={cn(
                    "transition-all duration-200",
                    isSpinning && "animate-pulse"
                  )}
                >
                  <p className="text-sm text-muted-foreground mb-2">
                    {isSpinning ? "抽取中..." : "恭喜！"}
                  </p>
                  <h2
                    className={cn(
                      "text-5xl md:text-6xl font-bold transition-all",
                      isSpinning
                        ? "text-foreground"
                        : "text-primary"
                    )}
                  >
                    {selectedStudent.name}
                  </h2>
                  {!isSpinning && (
                    <p className="text-sm text-muted-foreground mt-3">
                      已被点名 {selectedStudent.pickCount} 次
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-muted-foreground">准备好了吗？</p>
                  <p className="text-4xl font-bold text-foreground/80">
                    点击开始
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 开始按钮 */}
          <Button
            size="lg"
            onClick={onSpin}
            disabled={students.length === 0 || isSpinning}
            className={cn(
              "px-12 py-6 text-lg font-semibold rounded-full transition-all",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isSpinning && "animate-pulse"
            )}
          >
            <Shuffle
              className={cn("w-5 h-5 mr-2", isSpinning && "animate-spin")}
            />
            {isSpinning ? "抽取中..." : "开始点名"}
          </Button>

          {/* 学生预览 */}
          {students.length > 0 && (
            <div className="mt-8 w-full">
              <p className="text-sm text-muted-foreground text-center mb-4">
                候选名单预览
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-h-32 overflow-y-auto">
                {students.slice(0, 20).map((student) => (
                  <span
                    key={student.id}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm transition-all",
                      "bg-secondary text-secondary-foreground",
                      selectedStudent?.id === student.id &&
                        !isSpinning &&
                        "bg-primary text-primary-foreground ring-2 ring-primary/50"
                    )}
                  >
                    {student.name}
                  </span>
                ))}
                {students.length > 20 && (
                  <span className="px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground">
                    +{students.length - 20} 人
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
