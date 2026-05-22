import express from 'express'
import handler from './anthropic.js'

const app = express()
app.use(express.json({ limit: '4mb' }))
app.post('/api/anthropic', (req, res) => handler(req, res))
app.listen(3001, () => console.log('API proxy → http://localhost:3001'))
