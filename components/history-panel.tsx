"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, Trash2 } from "lucide-react"
import type { PickHistory } from "@/types"

interface HistoryPanelProps {
  history: PickHistory[]
  onClear: () => void
}

export function HistoryPanel({ history, onClear }: HistoryPanelProps) {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    if (isToday) return "今天"
    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="w-4 h-4 text-primary" />
          点名记录
          <span className="ml-auto flex items-center gap-2">
            <span className="text-sm font-normal text-muted-foreground">
              {history.length} 条
            </span>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-muted-foreground hover:text-destructive"
                onClick={onClear}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无记录</p>
            <p className="text-xs mt-1">开始点名后记录将显示在这里</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-2">
              {history.map((record, index) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                      {history.length - index}
                    </span>
                    <span className="text-foreground font-medium">
                      {record.studentName}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(record.pickedAt)} {formatTime(record.pickedAt)}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
