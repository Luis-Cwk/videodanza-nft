'use client'

import { useRef, useEffect, useState } from 'react'
import { useAgentChat, ChatMessage } from '@/lib/hooks/useAgentChat'

interface AgentChatProps {
  onSeedSelect?: (seed: string) => void
  currentSeed: string | null
}

const SUGGESTIONS = [
  'Quiero algo melancolico, como lluvia',
  'Algo alegre con movimientos fluidos',
  'Una pieza abstracta y caotica',
  'Danza contemporanea con energia alta',
]

const TypingIndicator = () => (
  <div style={{ display: 'flex', gap: '0.25rem', padding: '0.75rem 1rem', alignItems: 'center' }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)',
        animation: `typingDot 1.4s ${i * 0.2}s infinite both`,
      }} />
    ))}
  </div>
)

const MessageBubble = ({ msg }: { msg: ChatMessage }) => {
  const isAgent = msg.role === 'agent'
  return (
    <div style={{
      display: 'flex',
      justifyContent: isAgent ? 'flex-start' : 'flex-end',
      marginBottom: '0.75rem',
    }}>
      <div style={{
        maxWidth: '85%',
        padding: '0.75rem 1rem',
        background: isAgent ? 'var(--surface)' : 'var(--accent)',
        color: isAgent ? 'var(--text)' : '#000',
        border: isAgent ? '1px solid var(--border)' : 'none',
        borderRadius: isAgent ? '0 8px 8px 8px' : '8px 0 8px 8px',
        fontSize: '0.8rem',
        lineHeight: '1.5',
        fontFamily: "'JetBrains Mono', monospace",
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.content}
      </div>
    </div>
  )
}

export function AgentChat({ onSeedSelect, currentSeed }: AgentChatProps) {
  const { messages, isLoading, suggestedSeed, error, sendMessage, clearChat } = useAgentChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (suggestedSeed && suggestedSeed !== currentSeed && onSeedSelect) {
      onSeedSelect(suggestedSeed)
    }
  }, [suggestedSeed, currentSeed, onSeedSelect])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleSuggestion = (s: string) => {
    sendMessage(s)
  }

  const hasMessages = messages.length > 0

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      border: '1px solid var(--border-bright)', background: 'var(--bg)',
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{
            fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px',
            color: 'var(--text-muted)', marginBottom: '0.25rem',
          }}>
            AGENTE CREATIVO
          </div>
          <div style={{
            fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#00ff88',
              display: 'inline-block',
            }} />
            entropiav2
          </div>
        </div>
        {hasMessages && (
          <button onClick={clearChat} style={{
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-muted)', padding: '0.3rem 0.6rem', cursor: 'pointer',
            fontSize: '0.65rem', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace",
          }}>
            Limpiar
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '1rem 1.25rem',
        minHeight: 0,
      }}>
        {!hasMessages && !isLoading && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{
              fontSize: '2rem', marginBottom: '1rem', opacity: 0.3,
            }}>
              ◈
            </div>
            <p style={{
              fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: '1.6',
              marginBottom: '1.5rem', maxWidth: '300px', margin: '0 auto 1.5rem',
            }}>
              Habla con entropiav2 para descubrir tu composicion de videodanza ideal.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => handleSuggestion(s)} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--text)', padding: '0.6rem 1rem', cursor: 'pointer',
                  fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace",
                  textAlign: 'left', transition: 'border-color 0.2s',
                }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--accent)' }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--border)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '0 8px 8px 8px',
            }}>
              <TypingIndicator />
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '0.75rem 1rem', background: 'rgba(255,68,68,0.1)',
            border: '1px solid rgba(255,68,68,0.3)', borderRadius: '4px',
            fontSize: '0.75rem', color: '#ff4444', fontFamily: "'JetBrains Mono', monospace",
          }}>
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{
        padding: '1rem 1.25rem', borderTop: '1px solid var(--border)',
        display: 'flex', gap: '0.5rem',
      }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Describe la emocion que quieres explorar..."
          disabled={isLoading}
          style={{
            flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
            color: 'var(--text)', padding: '0.75rem 1rem', fontSize: '0.8rem',
            fontFamily: "'JetBrains Mono', monospace", outline: 'none',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            background: isLoading || !input.trim() ? 'var(--surface)' : 'var(--accent)',
            color: isLoading || !input.trim() ? 'var(--text-muted)' : '#000',
            border: '1px solid var(--accent)', padding: '0.75rem 1.25rem',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
            fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap',
          }}
        >
          {isLoading ? '...' : 'Enviar'}
        </button>
      </form>

      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
