"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Users, Plus, Upload, Trash2, MoreVertical } from "lucide-react"

interface HeaderProps {
  studentCount: number
  onAddClick: () => void
  onImportClick: () => void
  onClearAll: () => void
}

export function Header({
  studentCount,
  onAddClick,
  onImportClick,
  onClearAll,
}: HeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">随机点名器</h1>
                <p className="text-sm text-muted-foreground">
                  共 <span className="text-primary font-medium">{studentCount}</span> 名学生
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onAddClick}
              className="hidden sm:flex"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加学生
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onImportClick}
              className="hidden sm:flex"
            >
              <Upload className="w-4 h-4 mr-2" />
              批量导入
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onAddClick}>
                  <Plus className="w-4 h-4 mr-2" />
                  添加学生
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onImportClick}>
                  <Upload className="w-4 h-4 mr-2" />
                  批量导入
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onClearAll}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  清空名单
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClearAll}
              className="hidden sm:flex text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
