<script setup lang="ts">
import { reactive, watch } from "vue"
import { UserFilled } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { useStudentStore } from "@/composables/useStudentStore"

const visible = defineModel<boolean>({ required: true })
const store = useStudentStore()

const form = reactive({
  name: "",
  studentNo: "",
  className: "",
  note: "",
})

watch(visible, (isVisible) => {
  if (!isVisible) {
    form.name = ""
    form.studentNo = ""
    form.className = ""
    form.note = ""
  }
})

function submit(): void {
  if (!form.name.trim()) {
    ElMessage.warning("请输入学生姓名")
    return
  }

  const duplicate = store.students.value.some((student) => student.name === form.name.trim())
  if (duplicate) {
    ElMessage.warning("名单中已经存在该学生")
    return
  }

  store.addStudent({
    name: form.name,
    studentNo: form.studentNo,
    className: form.className,
    note: form.note,
  })
  ElMessage.success("添加成功")
  visible.value = false
}
</script>

<template>
  <el-dialog v-model="visible" class="dark-dialog" width="420px" align-center>
    <template #header>
      <span class="dialog-title">
        <el-icon><UserFilled /></el-icon>
        添加学生
      </span>
    </template>

    <el-form label-position="top" @submit.prevent="submit">
      <el-form-item label="学生姓名">
        <el-input v-model="form.name" placeholder="请输入学生姓名" clearable autofocus @keyup.enter="submit" />
      </el-form-item>
      <el-form-item label="学号（可选）">
        <el-input v-model="form.studentNo" placeholder="例如：20260001" clearable />
      </el-form-item>
      <el-form-item label="班级（可选）">
        <el-input v-model="form.className" placeholder="例如：软件1班" clearable />
      </el-form-item>
      <el-form-item label="备注（可选）">
        <el-input v-model="form.note" placeholder="可填写小组、职责等信息" clearable />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button class="outline-button" @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">添加</el-button>
    </template>
  </el-dialog>
</template>
