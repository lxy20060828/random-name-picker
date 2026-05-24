<script setup lang="ts">
import { computed, reactive, ref } from "vue"
import { Delete, Edit, Plus, RefreshLeft, Search, Upload, User } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import AddStudentDialog from "@/components/AddStudentDialog.vue"
import ImportStudentDialog from "@/components/ImportStudentDialog.vue"
import type { Student, StudentDraft } from "@/types"

const props = defineProps<{
  students: Student[]
}>()

const emit = defineEmits<{
  delete: [id: string]
  update: [id: string, draft: StudentDraft]
  resetPickCounts: []
  clearStudents: []
}>()

const keyword = ref("")
const editVisible = ref(false)
const addDialogVisible = ref(false)
const importDialogVisible = ref(false)
const editingId = ref("")
const editForm = reactive({
  name: "",
  studentNo: "",
  className: "",
  note: "",
})

const filteredStudents = computed(() => {
  const value = keyword.value.trim().toLowerCase()
  if (!value) return props.students

  return props.students.filter((student) =>
    [student.name, student.studentNo, student.className, student.note]
      .filter(Boolean)
      .some((field) => field?.toLowerCase().includes(value)),
  )
})

function openEdit(student: Student): void {
  editingId.value = student.id
  editForm.name = student.name
  editForm.studentNo = student.studentNo ?? ""
  editForm.className = student.className ?? ""
  editForm.note = student.note ?? ""
  editVisible.value = true
}

function submitEdit(): void {
  if (!editForm.name.trim()) {
    ElMessage.warning("姓名不能为空")
    return
  }

  emit("update", editingId.value, {
    name: editForm.name,
    studentNo: editForm.studentNo,
    className: editForm.className,
    note: editForm.note,
  })
  ElMessage.success("学生信息已更新")
  editVisible.value = false
}

function confirmClearStudents(): void {
  if (window.confirm("确定要清空全部学生名单吗？此操作不会清空点名记录。")) {
    emit("clearStudents")
  }
}
</script>

<template>
  <section class="panel side-panel">
    <div class="panel-title">
      <span>
        <el-icon><User /></el-icon>
        学生名单
      </span>
      <span class="student-title-right">
        <small>{{ students.length }} 人</small>
        <span class="student-tools" aria-label="学生名单操作">
          <el-button class="tool-icon-button" :icon="Plus" circle title="添加学生" @click="addDialogVisible = true" />
          <el-button class="tool-icon-button" :icon="Upload" circle title="批量导入" @click="importDialogVisible = true" />
          <el-button class="tool-icon-button danger" :icon="Delete" circle title="清空名单" @click="confirmClearStudents" />
        </span>
      </span>
    </div>

    <el-input v-model="keyword" class="search-input" :prefix-icon="Search" placeholder="搜索姓名、学号或班级" clearable />

    <div v-if="students.length === 0" class="empty-state">
      <el-icon><User /></el-icon>
      <p>暂无学生</p>
      <small>点击上方按钮添加或导入</small>
    </div>

    <el-scrollbar v-else height="310px">
      <div class="student-list">
        <div v-for="(student, index) in filteredStudents" :key="student.id" class="student-row">
          <div class="student-main">
            <span class="index-badge">{{ index + 1 }}</span>
            <span class="student-info">
              <strong>{{ student.name }}</strong>
              <small v-if="student.pickCount > 0 || student.studentNo || student.className">
                <span v-if="student.pickCount > 0">{{ student.pickCount }}次</span>
                <span v-if="student.studentNo || student.className">
                  {{ student.studentNo || "无学号" }} {{ student.className || "" }}
                </span>
              </small>
            </span>
          </div>
          <div class="row-actions">
            <el-button class="ghost-button" :icon="Edit" circle size="small" @click="openEdit(student)" />
            <el-button class="ghost-button danger" :icon="Delete" circle size="small" @click="emit('delete', student.id)" />
          </div>
        </div>
      </div>
    </el-scrollbar>

    <el-button v-if="students.length" class="outline-button full-button" :icon="RefreshLeft" @click="emit('resetPickCounts')">
      重置点名次数
    </el-button>
  </section>

  <el-dialog v-model="editVisible" class="dark-dialog" width="420px" align-center title="编辑学生">
    <el-form label-position="top">
      <el-form-item label="姓名">
        <el-input v-model="editForm.name" />
      </el-form-item>
      <el-form-item label="学号">
        <el-input v-model="editForm.studentNo" />
      </el-form-item>
      <el-form-item label="班级">
        <el-input v-model="editForm.className" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="editForm.note" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button class="outline-button" @click="editVisible = false">取消</el-button>
      <el-button type="primary" @click="submitEdit">保存</el-button>
    </template>
  </el-dialog>

  <AddStudentDialog v-model="addDialogVisible" />
  <ImportStudentDialog v-model="importDialogVisible" />
</template>
