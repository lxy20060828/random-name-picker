import { onMounted, ref } from "vue"
import type { Quote } from "@/types"

const FALLBACK_QUOTES: Quote[] = [
  { content: "认真准备的人，运气通常也会站在他这边。", source: "本地备用语句", fromApi: false, provider: "local" },
  {
    content: "今天的点名结果只是开始，真正重要的是把知识讲清楚。",
    source: "本地备用语句",
    fromApi: false,
    provider: "local",
  },
  { content: "保持专注，每一次回答都会让思路更清晰。", source: "本地备用语句", fromApi: false, provider: "local" },
]

const TIANAPI_KEY = import.meta.env.VITE_TIANAPI_KEY?.trim()

interface HitokotoResponse {
  hitokoto?: string
  from?: string
  from_who?: string | null
}

interface TianApiQuoteItem {
  content?: string
  famous_saying?: string
  source?: string
  author?: string
  mrname?: string
}

interface TianApiResponse {
  code?: number
  msg?: string
  result?: {
    list?: TianApiQuoteItem[]
    content?: string
    famous_saying?: string
    source?: string
    author?: string
    mrname?: string
  }
  newslist?: TianApiQuoteItem[]
}

function getFallbackQuote(): Quote {
  const index = new Date().getDate() % FALLBACK_QUOTES.length
  return FALLBACK_QUOTES[index]
}

function extractTianApiQuote(data: TianApiResponse): Quote | null {
  if (data.code !== 200 && data.code !== undefined) return null

  const item = data.result?.list?.[0] ?? data.newslist?.[0] ?? data.result
  const content = item?.content ?? item?.famous_saying
  if (!content) return null

  return {
    content,
    source: [item?.author ?? item?.mrname, item?.source].filter(Boolean).join(" · ") || "TianAPI 名言警句",
    fromApi: true,
    provider: "tianapi",
  }
}

async function fetchTianApiQuote(): Promise<Quote | null> {
  if (!TIANAPI_KEY) return null

  const params = new URLSearchParams({
    key: TIANAPI_KEY,
    num: "1",
  })
  const response = await fetch(`https://apis.tianapi.com/dictum/index?${params.toString()}`)
  if (!response.ok) {
    throw new Error("TianAPI 名言警句接口请求失败")
  }

  const quote = extractTianApiQuote((await response.json()) as TianApiResponse)
  if (!quote) {
    throw new Error("TianAPI 名言警句接口返回异常")
  }

  return quote
}

async function fetchHitokotoQuote(): Promise<Quote> {
  const response = await fetch("https://v1.hitokoto.cn/?encode=json&c=d&c=i&c=k")
  if (!response.ok) {
    throw new Error("一言接口请求失败")
  }

  const data = (await response.json()) as HitokotoResponse
  if (!data.hitokoto) {
    throw new Error("一言接口返回异常")
  }

  return {
    content: data.hitokoto,
    source: [data.from_who, data.from].filter(Boolean).join(" · ") || "Hitokoto 一言",
    fromApi: true,
    provider: "hitokoto",
  }
}

export function useDailyQuote() {
  const quote = ref<Quote>(getFallbackQuote())
  const loading = ref(false)
  const errorMessage = ref("")

  async function fetchQuote(): Promise<void> {
    loading.value = true
    errorMessage.value = ""

    try {
      const tianApiQuote = await fetchTianApiQuote()
      if (tianApiQuote) {
        quote.value = tianApiQuote
        return
      }

      quote.value = await fetchHitokotoQuote()
    } catch (error) {
      try {
        quote.value = await fetchHitokotoQuote()
        errorMessage.value = error instanceof Error ? `${error.message}，已切换到 Hitokoto` : "已切换到 Hitokoto"
      } catch (fallbackError) {
        errorMessage.value =
          fallbackError instanceof Error ? `${fallbackError.message}，已显示本地备用语句` : "已显示本地备用语句"
        quote.value = getFallbackQuote()
      }
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
