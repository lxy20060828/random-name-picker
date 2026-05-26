import { createApp } from "vue"
import {
  ElAlert,
  ElButton,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElMessage,
  ElOption,
  ElProgress,
  ElScrollbar,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElUpload,
} from "element-plus"
import "element-plus/dist/index.css"
import App from "./App.vue"
import router from "./router"
import "./styles/main.css"

const app = createApp(App)

app.use(router)
;[
  ElAlert,
  ElButton,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElOption,
  ElProgress,
  ElScrollbar,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElUpload,
].forEach((component) => {
  app.use(component)
})
app.config.globalProperties.$message = ElMessage
app.mount("#app")
