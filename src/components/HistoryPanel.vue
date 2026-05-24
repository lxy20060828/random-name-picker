<script setup lang="ts">
import { computed } from "vue"
import { Delete, Timer } from "@element-plus/icons-vue"
import type { PickHistory } from "@/types"

const props = defineProps<{
  history: PickHistory[]
}>()

const emit = defineEmits<{
  clear: []
  deleteRecord: [id: string]
}>()

const recentHistory = computed(() => props.history.slice(0, 10))

function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
</script>

<template>
  <section class="panel side-panel">
    <div class="panel-title">
      <span>
        <el-icon><Timer /></el-icon>
        点名记录
      </span>
      <span class="title-actions">
        <small>{{ history.length }} 条</small>
        <el-button v-if="history.length" class="ghost-button danger" :icon="Delete" circle size="small" @click="emit('clear')" />
      </span>
    </div>

    <div v-if="history.length === 0" class="empty-state compact">
      <el-icon><Timer /></el-icon>
      <p>暂无记录</p>
      <small>开始点名后记录将显示在这里</small>
    </div>

    <el-scrollbar v-else height="220px">
      <div class="history-list">
        <div v-for="(record, index) in recentHistory" :key="record.id" class="history-row">
          <span class="index-badge">{{ history.length - index }}</span>
          <strong>{{ record.studentName }}</strong>
          <small>{{ formatDateTime(record.pickedAt) }}</small>
          <el-button
            class="ghost-button danger row-delete"
            :icon="Delete"
            circle
            size="small"
            title="删除这条记录"
            @click="emit('deleteRecord', record.id)"
          />
        </div>
      </div>
    </el-scrollbar>
  </section>
</template>
