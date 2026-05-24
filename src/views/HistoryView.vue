<script setup lang="ts">
import { computed } from "vue"
import { Delete, Download, Timer } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import StatsPanel from "@/components/StatsPanel.vue"
import { useStudentStore } from "@/composables/useStudentStore"
import { downloadTextFile } from "@/utils/download"
import { exportStudentsCsv } from "@/utils/importStudents"

const store = useStudentStore()

const orderedHistory = computed(() => store.history.value)
const unpickedStudents = computed(() => store.students.value.filter((student) => student.pickCount === 0))

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function exportStudents(): void {
  downloadTextFile("random_picker_students.csv", exportStudentsCsv(store.students.value))
  ElMessage.success("名单已导出")
}

function deleteRecord(id: string): void {
  store.deleteHistoryRecord(id)
  ElMessage.success("点名记录已删除")
}
</script>

<template>
  <main class="container history-page">
    <section class="history-hero panel">
      <div>
        <p class="muted">记录统计</p>
        <h1>点名历史与名单数据</h1>
      </div>
      <el-button type="primary" :icon="Download" :disabled="store.students.value.length === 0" @click="exportStudents">
        导出名单
      </el-button>
    </section>

    <StatsPanel :students="store.students.value" :history="store.history.value" />

    <div class="history-layout">
      <section class="panel">
        <div class="panel-title">
          <span>
            <el-icon><Timer /></el-icon>
            全部点名记录
          </span>
          <small>{{ orderedHistory.length }} 条</small>
        </div>

        <el-empty v-if="orderedHistory.length === 0" description="暂无点名记录" />
        <el-table v-else :data="orderedHistory" class="dark-table">
          <el-table-column type="index" label="序号" width="80" />
          <el-table-column prop="studentName" label="姓名" min-width="120" />
          <el-table-column label="点名时间" min-width="180">
            <template #default="{ row }: { row: { pickedAt: string } }">
              {{ formatDateTime(row.pickedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center">
            <template #default="{ row }: { row: { id: string } }">
              <el-button class="ghost-button danger" :icon="Delete" circle size="small" @click="deleteRecord(row.id)" />
            </template>
          </el-table-column>
        </el-table>
      </section>

      <section class="panel">
        <div class="panel-title">
          <span>尚未点到</span>
          <small>{{ unpickedStudents.length }} 人</small>
        </div>

        <div v-if="unpickedStudents.length" class="chip-wrap align-start">
          <span v-for="student in unpickedStudents" :key="student.id" class="chip">{{ student.name }}</span>
        </div>
        <el-empty v-else description="所有学生都已经被点到过" />
      </section>
    </div>
  </main>
</template>
