const MODEL = 'claude-sonnet-4-20250514'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' })
  }

  const { messages, system, max_tokens, tools, withSearch } = req.body

  const headers = {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  }
  if (withSearch) headers['anthropic-beta'] = 'web-search-2025-03-05'

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: max_tokens ?? 1500,
        ...(system ? { system } : {}),
        ...(tools ? { tools } : {}),
      }),
    })

    const data = await upstream.json()
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
