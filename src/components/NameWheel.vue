<script setup lang="ts">
import { onBeforeUnmount, onUpdated, ref } from "vue"
import { Promotion, UserFilled } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import type { Student } from "@/types"
import { pickRandomStudent } from "@/utils/random"

const props = defineProps<{
  students: Student[]
  selectedStudent: Student | null
  scopeLabel: string
}>()

const emit = defineEmits<{
  picked: [student: Student]
  preview: [student: Student | null]
}>()

const isSpinning = ref(false)
const animationTimer = ref<number | null>(null)
const previewStudent = ref<Student | null>(null)
const updatedCount = ref(0)

onUpdated(() => {
  updatedCount.value += 1
})

onBeforeUnmount(() => {
  if (animationTimer.value !== null) {
    window.clearInterval(animationTimer.value)
  }
})

function startPick(): void {
  if (props.students.length === 0) {
    ElMessage.warning("请先添加或导入学生名单")
    return
  }

  if (isSpinning.value) return

  isSpinning.value = true
  let elapsed = 0
  const duration = 3000
  const interval = 90

  animationTimer.value = window.setInterval(() => {
    elapsed += interval
    previewStudent.value = pickRandomStudent(props.students)
    emit("preview", previewStudent.value)

    if (elapsed >= duration) {
      if (animationTimer.value !== null) {
        window.clearInterval(animationTimer.value)
      }

      const finalStudent = pickRandomStudent(props.students)
      isSpinning.value = false

      if (finalStudent) {
        previewStudent.value = finalStudent
        emit("picked", finalStudent)
      }
    }
  }, interval)
}
</script>

<template>
  <section class="panel wheel-panel">
    <div class="wheel-scope">{{ scopeLabel }}</div>
    <div class="wheel">
      <div class="ring ring-outer" />
      <div class="ring ring-middle" />
      <div class="ring ring-inner" />
      <div class="glow" :class="{ active: isSpinning || selectedStudent }" />

      <div class="wheel-content">
        <template v-if="students.length === 0">
          <el-icon class="empty-icon"><UserFilled /></el-icon>
          <p class="muted">请先添加学生名单</p>
        </template>
        <template v-else-if="isSpinning && previewStudent">
          <p class="muted">抽取中...</p>
          <h2 class="student-name spinning">{{ previewStudent.name }}</h2>
        </template>
        <template v-else-if="selectedStudent">
          <p class="muted">恭喜！</p>
          <h2 class="student-name selected">{{ selectedStudent.name }}</h2>
          <p class="muted">已被点名 {{ selectedStudent.pickCount }} 次</p>
        </template>
        <template v-else>
          <p class="muted">准备好了吗？</p>
          <h2 class="ready-text">点击开始</h2>
        </template>
      </div>
    </div>

    <el-button class="spin-button" type="primary" size="large" :disabled="students.length === 0 || isSpinning" @click="startPick">
      <el-icon><Promotion /></el-icon>
      {{ isSpinning ? "抽取中..." : "开始点名" }}
    </el-button>

    <div v-if="students.length > 0" class="candidate-preview">
      <p class="muted">候选名单预览</p>
      <div class="chip-wrap">
        <span
          v-for="student in students.slice(0, 20)"
          :key="student.id"
          class="chip"
          :class="{ active: selectedStudent?.id === student.id && !isSpinning }"
        >
          {{ student.name }}
        </span>
        <span v-if="students.length > 20" class="chip muted-chip">+{{ students.length - 20 }} 人</span>
      </div>
    </div>
  </section>
</template>
