import { createRouter, createWebHistory } from "vue-router"
import HomeView from "@/views/HomeView.vue"
import HistoryView from "@/views/HistoryView.vue"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: { title: "随机点名" },
    },
    {
      path: "/history",
      name: "history",
      component: HistoryView,
      meta: { title: "记录统计" },
    },
  ],
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? "随机点名器")} - Vue3课堂互动工具`
})

export default router
