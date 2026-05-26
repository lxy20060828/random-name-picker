import { beforeEach, describe, expect, it, vi } from "vitest"

function jsonResponse(data: unknown, ok = true): Response {
  return {
    ok,
    json: async () => data,
  } as Response
}

async function loadComposable() {
  vi.resetModules()
  return import("@/composables/useDailyQuote")
}

describe("useDailyQuote API fallback order", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it("uses TianAPI first when the API key is configured", async () => {
    vi.stubEnv("VITE_TIANAPI_KEY", "free-key")
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        code: 200,
        result: {
          list: [{ content: "天行健，君子以自强不息。", author: "周易", source: "乾卦" }],
        },
      }),
    )
    vi.stubGlobal("fetch", fetchMock)
    const { useDailyQuote } = await loadComposable()
    const { quote, fetchQuote } = useDailyQuote()

    await fetchQuote()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain("apis.tianapi.com")
    expect(quote.value).toMatchObject({
      content: "天行健，君子以自强不息。",
      provider: "tianapi",
      fromApi: true,
    })
  })

  it("uses Hitokoto when TianAPI key is not configured", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        hitokoto: "保持专注。",
        from: "课堂",
        from_who: "老师",
      }),
    )
    vi.stubGlobal("fetch", fetchMock)
    const { useDailyQuote } = await loadComposable()
    const { quote, fetchQuote } = useDailyQuote()

    await fetchQuote()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain("hitokoto")
    expect(quote.value.provider).toBe("hitokoto")
    expect(quote.value.content).toBe("保持专注。")
  })

  it("falls back to Hitokoto when TianAPI fails", async () => {
    vi.stubEnv("VITE_TIANAPI_KEY", "free-key")
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ code: 100, msg: "invalid key" }))
      .mockResolvedValueOnce(jsonResponse({ hitokoto: "备用一言", from: "Hitokoto" }))
    vi.stubGlobal("fetch", fetchMock)
    const { useDailyQuote } = await loadComposable()
    const { quote, errorMessage, fetchQuote } = useDailyQuote()

    await fetchQuote()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(quote.value.provider).toBe("hitokoto")
    expect(errorMessage.value).toContain("TianAPI")
  })

  it("uses local fallback when both remote APIs fail", async () => {
    vi.stubEnv("VITE_TIANAPI_KEY", "free-key")
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"))
    vi.stubGlobal("fetch", fetchMock)
    const { useDailyQuote } = await loadComposable()
    const { quote, errorMessage, fetchQuote } = useDailyQuote()

    await fetchQuote()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(quote.value.provider).toBe("local")
    expect(quote.value.fromApi).toBe(false)
    expect(errorMessage.value).toContain("本地备用语句")
  })
})
