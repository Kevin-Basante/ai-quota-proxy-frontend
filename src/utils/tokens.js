const CHARACTERS_PER_TOKEN = 4
const AVERAGE_COMPLETION_TOKENS = 62

export function estimateTokens(text) {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return Math.ceil(trimmed.length / CHARACTERS_PER_TOKEN)
}

export function estimateRequest(text) {
  const prompt = estimateTokens(text)
  return { prompt, completion: prompt ? AVERAGE_COMPLETION_TOKENS : 0, total: prompt ? prompt + AVERAGE_COMPLETION_TOKENS : 0 }
}
