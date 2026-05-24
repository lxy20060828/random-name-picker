<script setup lang="ts">
import { provide } from "vue"
import AppHeader from "@/components/AppHeader.vue"
import { useStudents } from "@/composables/useStudents"

const studentStore = useStudents()
provide("studentStore", studentStore)
</script>

<template>
  <div class="app-shell">
    <AppHeader :student-count="studentStore.studentCount.value" />
    <router-view />
  </div>
</template>
