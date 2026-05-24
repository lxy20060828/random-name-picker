import { onMounted, ref } from "vue"
import type { Quote } from "@/types"

const FALLBACK_QUOTES: Quote[] = [
  { content: "认真准备的人，运气通常也会站在他这边。", source: "本地备用语句", fromApi: false },
  { content: "今天的点名结果只是开始，真正重要的是把知识讲清楚。", source: "本地备用语句", fromApi: false },
  { content: "保持专注，每一次回答都会让思路更清晰。", source: "本地备用语句", fromApi: false },
]

interface HitokotoResponse {
  hitokoto?: string
  from?: string
  from_who?: string | null
}

function getFallbackQuote(): Quote {
  const index = new Date().getDate() % FALLBACK_QUOTES.length
  return FALLBACK_QUOTES[index]
}

export function useDailyQuote() {
  const quote = ref<Quote>(getFallbackQuote())
  const loading = ref(false)
  const errorMessage = ref("")

  async function fetchQuote(): Promise<void> {
    loading.value = true
    errorMessage.value = ""

    try {
      const response = await fetch("https://v1.hitokoto.cn/?encode=json&c=d&c=i&c=k")
      if (!response.ok) {
        throw new Error("一言接口请求失败")
      }

      const data = (await response.json()) as HitokotoResponse
      if (!data.hitokoto) {
        throw new Error("一言接口返回异常")
      }

      quote.value = {
        content: data.hitokoto,
        source: [data.from_who, data.from].filter(Boolean).join(" · ") || "Hitokoto 一言",
        fromApi: true,
      }
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : "每日一句请求失败"
      quote.value = getFallbackQuote()
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void fetchQuote()
  })

  return {
    quote,
    loading,
    errorMessage,
    fetchQuote,
  }
}
