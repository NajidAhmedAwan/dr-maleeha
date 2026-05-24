import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_QA, getChatbotQA } from '../data/chatbotQA'
import { Z_INDEX } from '../constants/zIndex'

const TEAL = '#0d9488'
const NAVY = '#0d1b2a'
const FALLBACK_REPLIES = ['Book an appointment', 'Learn about procedures']
const FALLBACK_ANSWER = "I'm not sure I caught that — try one of the options below, or book a consultation."

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '10px 14px' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.5)',
          display: 'inline-block',
          animation: 'cb-dot 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`
        }} />
      ))}
    </div>
  )
}

function BotBubble({ text, quickReplies, onQuickReply, isTyping }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg,${TEAL},#0891b2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          fontSize: '0.625rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em'
        }}>Dr</div>
        <div style={{
          background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '16px 16px 16px 4px',
          padding: isTyping ? '0 4px' : '10px 14px', fontSize: '0.875rem', lineHeight: 1.55,
          maxWidth: 280, wordBreak: 'break-word'
        }}>
          {isTyping ? <TypingDots /> : text}
        </div>
      </div>
      {!isTyping && quickReplies && quickReplies.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingLeft: 35 }}>
          {quickReplies.map(r => (
            <button key={r} onClick={() => onQuickReply(r)} style={{
              background: 'rgba(13,148,136,0.18)', color: '#5eead4', border: '1px solid rgba(13,148,136,0.4)',
              borderRadius: 100, padding: '5px 12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.15s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(13,148,136,0.32)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(13,148,136,0.18)'}
            >{r}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function UserBubble({ text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
      <div style={{
        background: TEAL, color: '#fff', borderRadius: '16px 16px 4px 16px',
        padding: '10px 14px', fontSize: '0.875rem', lineHeight: 1.55,
        maxWidth: 260, wordBreak: 'break-word'
      }}>{text}</div>
    </div>
  )
}

export default function ChatbotWidget() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      const intro = DEFAULT_QA.find(q => q.id === 'intro')
      if (intro) {
        setMessages([{ type: 'bot', text: intro.answer, quickReplies: intro.quickReplies }])
      }
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 120)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  function handleReply(text) {
    if (typing) return
    setMessages(prev => [...prev, { type: 'user', text }])
    setInput('')
    processInput(text)
  }

  function processInput(text) {
    setTyping(true)
    const delay = 600 + Math.random() * 300
    setTimeout(() => {
      setTyping(false)
      const qa = getChatbotQA()
      const match = qa.find(q => q.trigger && q.trigger.toLowerCase() === text.trim().toLowerCase())
      if (match) {
        setMessages(prev => [...prev, { type: 'bot', text: match.answer, quickReplies: match.quickReplies || [] }])
        if (match.action === 'navigate:/booking') {
          setTimeout(() => { setOpen(false); navigate('/booking') }, 400)
        }
      } else {
        setMessages(prev => [...prev, { type: 'bot', text: FALLBACK_ANSWER, quickReplies: FALLBACK_REPLIES }])
      }
    }, delay)
  }

  function handleSend() {
    const t = input.trim()
    if (!t || typing) return
    handleReply(t)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <>
      <style>{`
        @keyframes cb-dot {
          0%,80%,100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes cb-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open chat with Dr. Maleeha's assistant"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: Z_INDEX.CHATBOT_BUTTON,
          width: 56, height: 56, borderRadius: '50%',
          background: `linear-gradient(135deg,${TEAL},#0891b2)`,
          border: 'none', cursor: 'pointer', color: '#fff',
          boxShadow: '0 4px 20px rgba(13,148,136,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.375rem', transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(13,148,136,0.7)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(13,148,136,0.55)' }}
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: Z_INDEX.CHATBOT_PANEL,
          width: 'min(380px, calc(100vw - 32px))',
          height: 'min(560px, 90vh)',
          background: NAVY, borderRadius: 16,
          boxShadow: '0 16px 60px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'cb-slide-up 0.22s ease-out'
        }}>

          {/* Header */}
          <div style={{
            padding: '14px 16px', background: `linear-gradient(135deg,${TEAL},#0891b2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                border: '2px solid rgba(255,255,255,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 800, color: '#fff'
              }}>Dr</div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  Dr. Maleeha's Assistant
                </div>
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.04em' }}>
                  Usually replies instantly
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
                width: 30, height: 30, cursor: 'pointer', color: '#fff',
                fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >✕</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px 14px 6px',
            display: 'flex', flexDirection: 'column',
            scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.12) transparent'
          }}>
            {messages.map((m, i) =>
              m.type === 'user'
                ? <UserBubble key={i} text={m.text} />
                : <BotBubble key={i} text={m.text} quickReplies={m.quickReplies} onQuickReply={handleReply} />
            )}
            {typing && <BotBubble isTyping />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', gap: 8, flexShrink: 0, background: 'rgba(0,0,0,0.2)'
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message…"
              disabled={typing}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 10, padding: '9px 12px', color: '#e2e8f0', fontSize: '0.875rem',
                outline: 'none', caretColor: TEAL
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || typing}
              style={{
                background: input.trim() && !typing ? TEAL : 'rgba(255,255,255,0.1)',
                border: 'none', borderRadius: 10, width: 38, height: 38,
                cursor: input.trim() && !typing ? 'pointer' : 'default',
                color: '#fff', fontSize: '1rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s'
              }}
            >↑</button>
          </div>
        </div>
      )}
    </>
  )
}
