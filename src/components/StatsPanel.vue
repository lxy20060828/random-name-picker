<script setup lang="ts">
import { computed } from "vue"
import { DataAnalysis } from "@element-plus/icons-vue"
import type { PickHistory, Student } from "@/types"

const props = defineProps<{
  students: Student[]
  history: PickHistory[]
}>()

const pickedStudentCount = computed(() => props.students.filter((student) => student.pickCount > 0).length)
const averagePickCount = computed(() => {
  if (props.students.length === 0) return "0.0"
  return (props.history.length / props.students.length).toFixed(1)
})
const topStudents = computed(() =>
  [...props.students].filter((student) => student.pickCount > 0).sort((a, b) => b.pickCount - a.pickCount).slice(0, 5),
)
</script>

<template>
  <section class="panel stats-panel">
    <div class="panel-title">
      <span>
        <el-icon><DataAnalysis /></el-icon>
        当前范围统计
      </span>
    </div>

    <div class="stats-grid">
      <div class="stat-item">
        <b>{{ students.length }}</b>
        <span>学生总数</span>
      </div>
      <div class="stat-item">
        <b>{{ history.length }}</b>
        <span>点名次数</span>
      </div>
      <div class="stat-item">
        <b>{{ pickedStudentCount }}</b>
        <span>已点人数</span>
      </div>
      <div class="stat-item">
        <b>{{ averagePickCount }}</b>
        <span>人均次数</span>
      </div>
    </div>

    <div v-if="topStudents.length" class="top-list">
      <div v-for="student in topStudents" :key="student.id" class="top-row">
        <span>{{ student.name }}</span>
        <el-progress :percentage="Math.min(student.pickCount * 10, 100)" :show-text="false" />
        <small>{{ student.pickCount }}次</small>
      </div>
    </div>
  </section>
</template>
