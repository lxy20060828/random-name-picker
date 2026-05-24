"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, FileText } from "lucide-react"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (names: string[]) => void
}

export function ImportDialog({
  open,
  onOpenChange,
  onImport,
}: ImportDialogProps) {
  const [text, setText] = useState("")

  const parseNames = (input: string): string[] => {
    // 支持多种分隔符：换行、逗号、空格、顿号
    return input
      .split(/[\n,，、\s]+/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
  }

  const names = parseNames(text)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (names.length > 0) {
      onImport(names)
      setText("")
      onOpenChange(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setText(content)
      }
      reader.readAsText(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            批量导入学生
          </DialogTitle>
          <DialogDescription>
            输入或粘贴学生名单，支持换行、逗号、空格、顿号分隔
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="names">学生名单</Label>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".txt,.csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <span className="text-sm text-primary hover:underline flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    从文件导入
                  </span>
                </label>
              </div>
              <Textarea
                id="names"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`张三\n李四\n王五\n\n或：张三, 李四, 王五`}
                className="min-h-[200px] bg-secondary border-border font-mono"
              />
            </div>
            {names.length > 0 && (
              <div className="text-sm text-muted-foreground">
                已识别 <span className="text-primary font-medium">{names.length}</span> 名学生：
                <span className="ml-2 text-foreground">
                  {names.slice(0, 5).join("、")}
                  {names.length > 5 && `...等`}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={names.length === 0}>
              导入 {names.length > 0 && `(${names.length}人)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
