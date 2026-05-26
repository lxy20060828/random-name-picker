export function splitListInput(value: string | undefined): string[] {
  if (!value) return []

  return value
    .split(/[、,，/|；;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function mergeUniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}
