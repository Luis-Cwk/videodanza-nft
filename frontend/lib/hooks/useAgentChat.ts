import { useState, useCallback, useRef } from 'react'

export interface ChatMessage {
  role: 'user' | 'agent'
  content: string
  timestamp: number
}

export interface AgentState {
  messages: ChatMessage[]
  isLoading: boolean
  contextId: string | null
  suggestedSeed: string | null
  error: string | null
}

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || 'https://my-agent-tau.vercel.app'

function extractSeed(text: string): string | null {
  const patterns = [
    /["']([^"']*seed[^"']*)["']/gi,
    /["']([^"']{8,})["']/gi,
    /semilla[:\s]+["']?([^"'\n,]{3,})["']?/gi,
    /seed[:\s]+["']?([^"'\n,]{3,})["']?/gi,
  ]
  for (const pattern of patterns) {
    const match = pattern.exec(text)
    if (match && match[1]) {
      const seed = match[1].trim().replace(/["']/g, '')
      if (seed.length >= 3 && seed.length < 100) return seed
    }
  }
  return null
}

export function useAgentChat() {
  const [state, setState] = useState<AgentState>({
    messages: [],
    isLoading: false,
    contextId: null,
    suggestedSeed: null,
    error: null,
  })

  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || state.isLoading) return

    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isLoading: true,
      error: null,
    }))

    try {
      const response = await fetch(`${AGENT_URL}/a2a`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abort.signal,
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'message/send',
          params: {
            message: { role: 'user', parts: [{ type: 'text', text }] },
            configuration: state.contextId ? { contextId: state.contextId } : undefined,
          },
          id: Date.now(),
        }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()

      if (data.error) throw new Error(data.error.message)

      const agentParts = data.result?.messages?.find((m: any) => m.role === 'agent')?.parts
      const agentText = agentParts?.[0]?.text || 'Sin respuesta del agente'
      const newContextId = data.result?.contextId || state.contextId

      const agentMsg: ChatMessage = { role: 'agent', content: agentText, timestamp: Date.now() }
      const extractedSeed = extractSeed(agentText)

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, agentMsg],
        isLoading: false,
        contextId: newContextId,
        suggestedSeed: extractedSeed || prev.suggestedSeed,
      }))
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Error de conexion con el agente',
      }))
    }
  }, [state.isLoading, state.contextId])

  const clearChat = useCallback(() => {
    abortRef.current?.abort()
    setState({
      messages: [],
      isLoading: false,
      contextId: null,
      suggestedSeed: null,
      error: null,
    })
  }, [])

  const setSeed = useCallback((seed: string) => {
    setState(prev => ({ ...prev, suggestedSeed: seed }))
  }, [])

  return { ...state, sendMessage, clearChat, setSeed }
}
