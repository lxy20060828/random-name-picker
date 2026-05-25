<script setup lang="ts">
import { computed, reactive, ref } from "vue"
import { Delete, Edit, Plus, RefreshLeft, Search, Upload, User } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import AddStudentDialog from "@/components/AddStudentDialog.vue"
import ImportStudentDialog from "@/components/ImportStudentDialog.vue"
import { useStudentStore } from "@/composables/useStudentStore"
import type { Student, StudentDraft } from "@/types"
import { EMPTY_FILTERS } from "@/utils/studentFilters"

const props = defineProps<{
  students: Student[]
  totalCount: number
}>()

const emit = defineEmits<{
  delete: [id: string]
  update: [id: string, draft: StudentDraft]
  resetPickCounts: []
  clearStudents: []
}>()

const keyword = ref("")
const store = useStudentStore()
const editVisible = ref(false)
const addDialogVisible = ref(false)
const importDialogVisible = ref(false)
const editingId = ref("")
const editForm = reactive({
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

const filteredStudents = computed(() => {
  return props.students
})

const filterControls = computed(() => [
  { key: "grade" as const, placeholder: "年级", options: store.filterOptions.value.grades, emptyText: "暂无年级" },
  { key: "department" as const, placeholder: "院系", options: store.filterOptions.value.departments, emptyText: "暂无院系" },
  { key: "major" as const, placeholder: "专业", options: store.filterOptions.value.majors, emptyText: "暂无专业" },
  { key: "className" as const, placeholder: "班级", options: store.filterOptions.value.classes, emptyText: "暂无班级" },
  { key: "course" as const, placeholder: "课程", options: store.filterOptions.value.courses, emptyText: "暂无课程" },
  { key: "tag" as const, placeholder: "标签", options: store.filterOptions.value.tags, emptyText: "暂无标签" },
])

const hasActiveFilters = computed(() =>
  Object.entries(store.filters.value).some(([key, value]) => key !== "keyword" && Boolean(value)) ||
  Boolean(store.filters.value.keyword.trim()),
)

function openEdit(student: Student): void {
  editingId.value = student.id
  editForm.name = student.name
  editForm.studentNo = student.studentNo
  editForm.grade = student.grade ?? ""
  editForm.department = student.department ?? ""
  editForm.major = student.major ?? ""
  editForm.classes = student.classes.join("、")
  editForm.courses = student.courses.join("、")
  editForm.tags = student.tags.join("、")
  editForm.note = student.note ?? ""
  editVisible.value = true
}

function splitInput(value: string): string[] {
  return value
    .split(/[、,，/|；;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function submitEdit(): void {
  if (!editForm.name.trim()) {
    ElMessage.warning("姓名不能为空")
    return
  }

  emit("update", editingId.value, {
    name: editForm.name,
    studentNo: editForm.studentNo,
    grade: editForm.grade,
    department: editForm.department,
    major: editForm.major,
    classes: splitInput(editForm.classes),
    courses: splitInput(editForm.courses),
    tags: splitInput(editForm.tags),
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

function updateKeyword(value: string): void {
  store.setFilters({ ...store.filters.value, keyword: value })
}

function updateFilter(key: "grade" | "department" | "major" | "className" | "course" | "tag", value: string): void {
  store.setFilters({ ...store.filters.value, [key]: value })
}

function resetFilters(): void {
  keyword.value = ""
  store.setFilters({ ...EMPTY_FILTERS })
}

function studentSubtitle(student: Student): string {
  return [
    student.studentNo,
    student.grade,
    student.department,
    student.major,
    [...student.classes, ...student.courses].slice(0, 3).join(" / "),
  ]
    .filter(Boolean)
    .join(" · ")
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
        <small>{{ students.length }} / {{ totalCount }} 人</small>
        <span class="student-tools" aria-label="学生名单操作">
          <el-button class="tool-icon-button" :icon="Plus" circle title="添加学生" @click="addDialogVisible = true" />
          <el-button class="tool-icon-button" :icon="Upload" circle title="批量导入" @click="importDialogVisible = true" />
          <el-button class="tool-icon-button danger" :icon="Delete" circle title="清空名单" @click="confirmClearStudents" />
        </span>
      </span>
    </div>

    <el-input
      v-model="keyword"
      class="search-input"
      :prefix-icon="Search"
      placeholder="搜索姓名、学号、年级、专业、班级或课程"
      clearable
      @input="updateKeyword"
    />

    <div class="student-filter-grid">
      <el-select
        v-for="control in filterControls"
        :key="control.key"
        :model-value="store.filters.value[control.key]"
        clearable
        :disabled="control.options.length === 0"
        :placeholder="control.options.length === 0 ? control.emptyText : control.placeholder"
        @change="updateFilter(control.key, String($event || ''))"
      >
        <el-option v-for="item in control.options" :key="item" :label="item" :value="item" />
        <template #empty>
          <span class="select-empty-text">{{ control.emptyText }}</span>
        </template>
      </el-select>
    </div>
    <div class="filter-summary">
      <span>{{ store.activeFilterSummary.value }}</span>
      <el-button v-if="hasActiveFilters" class="ghost-button" size="small" @click="resetFilters">重置筛选</el-button>
    </div>

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
              <small v-if="student.pickCount > 0 || studentSubtitle(student)">
                <span v-if="student.pickCount > 0">{{ student.pickCount }}次</span>
                <span v-if="studentSubtitle(student)">{{ studentSubtitle(student) }}</span>
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
      <el-form-item label="年级">
        <el-input v-model="editForm.grade" />
      </el-form-item>
      <el-form-item label="院系">
        <el-input v-model="editForm.department" />
      </el-form-item>
      <el-form-item label="专业">
        <el-input v-model="editForm.major" />
      </el-form-item>
      <el-form-item label="班级">
        <el-input v-model="editForm.classes" placeholder="多个用顿号分隔" />
      </el-form-item>
      <el-form-item label="课程">
        <el-input v-model="editForm.courses" placeholder="多个用顿号分隔" />
      </el-form-item>
      <el-form-item label="标签">
        <el-input v-model="editForm.tags" placeholder="多个用顿号分隔" />
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
