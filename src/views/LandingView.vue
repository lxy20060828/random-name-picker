<script setup lang="ts">
import { Promotion } from "@element-plus/icons-vue"
</script>

<template>
  <main class="landing-page">
    <section class="container landing-hero">
      <div class="landing-orbit" aria-hidden="true">
        <span class="landing-ring landing-ring-outer" />
        <span class="landing-ring landing-ring-middle" />
        <span class="landing-ring landing-ring-inner" />
      </div>

      <div class="landing-content">
        <p class="landing-eyebrow">Vue3 课堂互动工具</p>
        <h1>随机点名器</h1>
        <p class="landing-copy">
          快速导入名单，按班级、课程和标签筛选候选学生，让课堂互动更轻松、更公平。
        </p>
        <RouterLink class="landing-start-button" to="/picker">
          <el-icon><Promotion /></el-icon>
          开始点名
        </RouterLink>
      </div>
    </section>
  </main>
</template>
