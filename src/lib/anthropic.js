async function post(body) {
  const res = await fetch('/api/anthropic', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || err.error || `API error ${res.status}`)
  }
  return res.json()
}

export async function chat(messages, system, maxTokens = 1500) {
  const data = await post({ messages, system, max_tokens: maxTokens })
  return data.content.find(b => b.type === 'text')?.text ?? ''
}

export async function chatWithSearch(messages, system, maxTokens = 2000) {
  const tools = [{ type: 'web_search_20250305', name: 'web_search' }]
  let current = [...messages]
  for (let i = 0; i < 8; i++) {
    const data = await post({ messages: current, system, max_tokens: maxTokens, tools, withSearch: true })
    const text = data.content.find(b => b.type === 'text')
    if (data.stop_reason === 'end_turn') return text?.text ?? ''
    if (data.stop_reason === 'tool_use') {
      const uses = data.content.filter(b => b.type === 'tool_use')
      current = [
        ...current,
        { role: 'assistant', content: data.content },
        { role: 'user', content: uses.map(u => ({ type: 'tool_result', tool_use_id: u.id, content: '' })) },
      ]
    } else {
      return text?.text ?? data.content.map(b => b.text ?? '').join('\n').trim()
    }
  }
  throw new Error('Exceeded maximum search iterations.')
}

export const hasKey = () => true
