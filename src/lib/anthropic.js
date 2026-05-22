const MODEL = 'claude-sonnet-4-20250514'

function getKey() {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!key) throw new Error('VITE_ANTHROPIC_API_KEY is not set. Add it to .env and restart the dev server.')
  return key
}

async function post(body, withSearch = false) {
  const headers = {
    'x-api-key': getKey(),
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
    'anthropic-dangerous-direct-browser-access': 'true',
  }
  if (withSearch) headers['anthropic-beta'] = 'web-search-2025-03-05'
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: MODEL, ...body }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error ${res.status}`)
  }
  return res.json()
}

export async function chat(messages, system, maxTokens = 1500) {
  const data = await post({ max_tokens: maxTokens, system, messages })
  return data.content.find(b => b.type === 'text')?.text ?? ''
}

export async function chatWithSearch(messages, system, maxTokens = 2000) {
  const tools = [{ type: 'web_search_20250305', name: 'web_search' }]
  let current = [...messages]
  for (let i = 0; i < 8; i++) {
    const data = await post({ max_tokens: maxTokens, system, messages: current, tools }, true)
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

export const hasKey = () => !!import.meta.env.VITE_ANTHROPIC_API_KEY
