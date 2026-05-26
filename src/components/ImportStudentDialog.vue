<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { Download, Upload } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import type { ImportParseResult } from "@/types"
import { useStudentStore } from "@/composables/useStudentStore"
import { createStudentTemplateWorkbook, parseStudentImport, parseStudentText } from "@/utils/importStudents"
import { downloadBlobFile } from "@/utils/download"
import { mergeStudentDraftsWithExisting } from "@/utils/studentMerge"

const visible = defineModel<boolean>({ required: true })
const store = useStudentStore()
const text = ref("")
const fileName = ref("")
const parseResult = ref<ImportParseResult | null>(null)
const parsing = ref(false)

const previewNames = computed(() => parseResult.value?.students.slice(0, 8).map((student) => student.name) ?? [])
const canImport = computed(() => (parseResult.value?.students.length ?? 0) > 0)
const previewMerge = computed(() => {
  if (!parseResult.value) return null
  return mergeStudentDraftsWithExisting(store.students.value, parseResult.value.students)
})

watch(text, (value) => {
  if (!value.trim()) {
    parseResult.value = null
    return
  }
  parseResult.value = parseStudentText(value, store.students.value)
})

watch(visible, (isVisible) => {
  if (!isVisible) {
    text.value = ""
    fileName.value = ""
    parseResult.value = null
    parsing.value = false
  }
})

async function handleFileChange(uploadFile: { raw?: File; name: string }): Promise<void> {
  const file = uploadFile.raw
  if (!file) return

  parsing.value = true
  fileName.value = file.name

  try {
    parseResult.value = await parseStudentImport(file, store.students.value)
    text.value = ""
    ElMessage.success("文件解析完成")
  } catch {
    ElMessage.error("文件解析失败，请检查格式是否为 xlsx、xls、csv 或 txt")
  } finally {
    parsing.value = false
  }
}

function submit(): void {
  if (!parseResult.value || parseResult.value.students.length === 0) {
    ElMessage.warning("没有可导入的学生")
    return
  }

  const mergeResult = store.mergeStudentDrafts(parseResult.value.students)
  const message = `新增 ${mergeResult.students.length} 人，合并 ${mergeResult.mergedCount} 人，未变化 ${mergeResult.unchangedCount} 人`
  if (mergeResult.conflictRows.length || mergeResult.skippedRows.length) {
    ElMessage.warning(`${message}，有 ${mergeResult.conflictRows.length + mergeResult.skippedRows.length} 条需检查`)
  } else {
    ElMessage.success(message)
  }
  visible.value = false
}

async function downloadTemplate(): Promise<void> {
  downloadBlobFile("students_import_template.xlsx", await createStudentTemplateWorkbook())
}
</script>

<template>
  <el-dialog v-model="visible" class="dark-dialog import-dialog" width="620px" align-center>
    <template #header>
      <span class="dialog-title">
        <el-icon><Upload /></el-icon>
        批量导入学生
      </span>
    </template>

    <div class="import-helper">
      <p>支持 Excel、CSV、TXT。推荐表头：姓名、学号、年级、院系、专业、班级、课程、标签；仅姓名必填。</p>
      <el-button class="outline-button" size="small" :icon="Download" @click="downloadTemplate">
        下载模板
      </el-button>
    </div>

    <el-upload
      class="upload-box"
      drag
      :auto-upload="false"
      :show-file-list="false"
      accept=".xlsx,.xls,.csv,.txt"
      :on-change="handleFileChange"
    >
      <el-icon class="upload-icon"><Upload /></el-icon>
      <div class="el-upload__text">拖入文件或点击选择</div>
      <template #tip>
        <div class="upload-tip">可自动识别表头，也支持只有姓名的一列名单。</div>
      </template>
    </el-upload>

    <el-input
      v-model="text"
      class="import-textarea"
      type="textarea"
      :rows="7"
      placeholder="也可以直接粘贴名单：&#10;张三&#10;李四&#10;王五&#10;&#10;或：姓名,学号,年级,院系,专业,班级,课程,标签&#10;张三,20260001,2026级,信息工程学院,软件工程,软件1班,数据结构,一组"
    />

    <div v-if="parsing" class="status-line">正在解析文件...</div>
    <div v-else-if="parseResult" class="import-result">
      <div>
        已识别 <b>{{ parseResult.students.length }}</b> 名学生
        <span v-if="fileName">（{{ fileName }}）</span>
      </div>
      <div class="muted">
        姓名列：{{ parseResult.detectedNameColumn || "未识别" }}；
        推断字段 {{ parseResult.inferredFields.length }} 个；
        重复跳过 {{ parseResult.duplicateNames.length }} 条；
        无效行 {{ parseResult.skippedRows.length }} 条
      </div>
      <div v-if="previewMerge" class="muted">
        预计新增 {{ previewMerge.students.length }} 人；
        合并 {{ previewMerge.mergedCount }} 人；
        未变化 {{ previewMerge.unchangedCount }} 人；
        需检查 {{ previewMerge.conflictRows.length + previewMerge.skippedRows.length }} 条
      </div>
      <div v-if="parseResult.inferredFields.length" class="muted">
        已从文件名或工作表名推断：{{ parseResult.inferredFields.join("，") }}
      </div>
      <div v-if="previewNames.length" class="name-preview">
        <span v-for="name in previewNames" :key="name">{{ name }}</span>
        <span v-if="parseResult.students.length > previewNames.length">+{{ parseResult.students.length - previewNames.length }} 人</span>
      </div>
      <el-alert
        v-if="parseResult.skippedRows.length"
        type="warning"
        :closable="false"
        show-icon
        :title="parseResult.skippedRows.slice(0, 3).join('；')"
      />
      <el-alert
        v-if="previewMerge?.conflictRows.length"
        type="warning"
        :closable="false"
        show-icon
        :title="previewMerge.conflictRows.slice(0, 3).join('；')"
      />
    </div>

    <template #footer>
      <el-button class="outline-button" @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="!canImport" @click="submit">
        导入 {{ parseResult?.students.length || 0 }} 人
      </el-button>
    </template>
  </el-dialog>
</template>
