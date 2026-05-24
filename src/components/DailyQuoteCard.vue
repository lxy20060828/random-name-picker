<script setup lang="ts">
import { Refresh, Sunny } from "@element-plus/icons-vue"
import { useDailyQuote } from "@/composables/useDailyQuote"

const { quote, loading, errorMessage, fetchQuote } = useDailyQuote()
</script>

<template>
  <section class="panel quote-panel">
    <div class="panel-title">
      <span>
        <el-icon><Sunny /></el-icon>
        每日一句
      </span>
      <el-button class="ghost-button" :icon="Refresh" circle size="small" :loading="loading" @click="fetchQuote" />
    </div>
    <blockquote>{{ quote.content }}</blockquote>
    <p class="muted">{{ quote.source }}</p>
    <p v-if="errorMessage" class="api-note">{{ errorMessage }}</p>
  </section>
</template>
