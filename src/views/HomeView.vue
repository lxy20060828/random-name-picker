<script setup lang="ts">
import { ElMessage } from "element-plus"
import DailyQuoteCard from "@/components/DailyQuoteCard.vue"
import HistoryPanel from "@/components/HistoryPanel.vue"
import NameWheel from "@/components/NameWheel.vue"
import StatsPanel from "@/components/StatsPanel.vue"
import StudentList from "@/components/StudentList.vue"
import { useStudentStore } from "@/composables/useStudentStore"

const store = useStudentStore()

function handlePicked(studentIdLike: { id: string }): void {
  const student = store.students.value.find((item) => item.id === studentIdLike.id)
  if (!student) return

  store.recordPick(student)
  ElMessage.success(`本次点名：${student.name}`)
}

function handleClearHistory(): void {
  if (window.confirm("确定清空点名记录吗？")) {
    store.clearHistory()
  }
}

function handleDeleteHistoryRecord(id: string): void {
  store.deleteHistoryRecord(id)
  ElMessage.success("点名记录已删除")
}

function handleDeleteStudent(id: string): void {
  if (window.confirm("确定删除该学生吗？关联点名记录也会同步删除。")) {
    store.deleteStudent(id)
  }
}

function handleResetPickCounts(): void {
  if (window.confirm("确定清空全部点名历史并重置所有学生的点名次数吗？")) {
    store.resetPickCounts()
    ElMessage.success("点名历史已清空，点名次数已重置")
  }
}
</script>

<template>
  <main class="container page-grid">
    <div class="main-column">
      <NameWheel
        :students="store.filteredStudents.value"
        :selected-student="store.selectedStudent.value"
        :scope-label="store.activeFilterSummary.value"
        @preview="store.selectedStudent.value = $event"
        @picked="handlePicked"
      />
      <StatsPanel :students="store.filteredStudents.value" :history="store.history.value" />
    </div>

    <aside class="side-column">
      <DailyQuoteCard />
      <StudentList
        :students="store.filteredStudents.value"
        :total-count="store.students.value.length"
        @clear-students="store.clearStudents"
        @delete="handleDeleteStudent"
        @update="store.updateStudent"
        @reset-pick-counts="handleResetPickCounts"
      />
      <HistoryPanel
        :history="store.history.value"
        @clear="handleClearHistory"
        @delete-record="handleDeleteHistoryRecord"
      />
    </aside>
  </main>
</template>
