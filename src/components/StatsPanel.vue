<script setup lang="ts">
import { computed } from "vue"
import { DataAnalysis } from "@element-plus/icons-vue"
import type { PickHistory, Student } from "@/types"
import { getScopedStudentStats } from "@/utils/studentStats"

const props = defineProps<{
  students: Student[]
  history: PickHistory[]
}>()

const scopedStats = computed(() => getScopedStudentStats(props.students, props.history))
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
        <b>{{ scopedStats.scopedHistory.length }}</b>
        <span>点名次数</span>
      </div>
      <div class="stat-item">
        <b>{{ scopedStats.pickedStudentCount }}</b>
        <span>已点人数</span>
      </div>
      <div class="stat-item">
        <b>{{ scopedStats.averagePickCount }}</b>
        <span>人均次数</span>
      </div>
    </div>

    <div v-if="scopedStats.topStudents.length" class="top-list">
      <div v-for="student in scopedStats.topStudents" :key="student.id" class="top-row">
        <span>{{ student.name }}</span>
        <el-progress :percentage="Math.min(student.pickCount * 10, 100)" :show-text="false" />
        <small>{{ student.pickCount }}次</small>
      </div>
    </div>
  </section>
</template>
