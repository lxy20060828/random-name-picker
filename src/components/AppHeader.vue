<script setup lang="ts">
import { House, List, Promotion, User } from "@element-plus/icons-vue"

defineProps<{
  studentCount: number
}>()
</script>

<template>
  <header class="app-header">
    <div class="container header-inner">
      <RouterLink class="brand" to="/" aria-label="返回随机点名首页">
        <span class="brand-icon"><el-icon><User /></el-icon></span>
        <span>
          <strong>随机点名器</strong>
          <small>共 <b>{{ studentCount }}</b> 名学生</small>
        </span>
      </RouterLink>

      <nav class="header-actions" aria-label="主导航">
        <RouterLink class="nav-link" to="/">
          <el-icon><House /></el-icon>
          首页
        </RouterLink>
        <RouterLink class="nav-link" to="/picker">
          <el-icon><Promotion /></el-icon>
          点名
        </RouterLink>
        <RouterLink class="nav-link" to="/history">
          <el-icon><List /></el-icon>
          记录
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
