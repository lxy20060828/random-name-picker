<script setup lang="ts">
import { reactive, watch } from "vue"
import { UserFilled } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { useStudentStore } from "@/composables/useStudentStore"
import { splitListInput } from "@/utils/listInput"

const visible = defineModel<boolean>({ required: true })
const store = useStudentStore()

const form = reactive({
  name: "",
  studentNo: "",
  grade: "",
  department: "",
  major: "",
  classes: "",
  courses: "",
  tags: "",
  note: "",
})

watch(visible, (isVisible) => {
  if (!isVisible) {
    form.name = ""
    form.studentNo = ""
    form.grade = ""
    form.department = ""
    form.major = ""
    form.classes = ""
    form.courses = ""
    form.tags = ""
    form.note = ""
  }
})

function submit(): void {
  if (!form.name.trim()) {
    ElMessage.warning("请输入学生姓名")
    return
  }

  const result = store.mergeStudentDrafts([{
    name: form.name,
    studentNo: form.studentNo,
    grade: form.grade,
    department: form.department,
    major: form.major,
    classes: splitListInput(form.classes),
    courses: splitListInput(form.courses),
    tags: splitListInput(form.tags),
    note: form.note,
  }])

  if (result.conflictRows.length || result.skippedRows.length) {
    ElMessage.warning(result.conflictRows[0] ?? result.skippedRows[0])
    return
  }

  if (result.students.length > 0) {
    ElMessage.success("添加成功")
  } else if (result.mergedCount > 0) {
    ElMessage.success("已合并到现有学生档案")
  } else {
    ElMessage.info("学生信息没有变化")
  }

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
      <el-form-item label="年级（可选）">
        <el-input v-model="form.grade" placeholder="例如：2026级" clearable />
      </el-form-item>
      <el-form-item label="院系（可选）">
        <el-input v-model="form.department" placeholder="例如：信息工程学院" clearable />
      </el-form-item>
      <el-form-item label="专业（可选）">
        <el-input v-model="form.major" placeholder="例如：软件工程" clearable />
      </el-form-item>
      <el-form-item label="班级（可选）">
        <el-input v-model="form.classes" placeholder="多个可用顿号分隔，例如：软件1班、数据结构1班" clearable />
      </el-form-item>
      <el-form-item label="课程（可选）">
        <el-input v-model="form.courses" placeholder="多个可用顿号分隔，例如：数据结构、高等数学" clearable />
      </el-form-item>
      <el-form-item label="标签（可选）">
        <el-input v-model="form.tags" placeholder="例如：一组、班委" clearable />
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
