'use client'

import { useState, useCallback } from 'react'
import { EvolutionEntry } from './useReputation'

interface EvolutionLoggerState {
  tokenId: string | null
  seed: string
  entries: EvolutionEntry[]
}

const EVOLUTION_STORAGE_KEY = 'videodanza_evolution_log'

export function useEvolutionLogger() {
  const [state, setState] = useState<EvolutionLoggerState>({
    tokenId: null,
    seed: '',
    entries: [],
  })

  const loadFromStorage = useCallback((tokenId: string, seed: string) => {
    try {
      const stored = localStorage.getItem(`${EVOLUTION_STORAGE_KEY}_${tokenId}`)
      if (stored) {
        const entries = JSON.parse(stored)
        setState({ tokenId, seed, entries })
        return
      }
    } catch (e) {
      console.error('Error loading evolution log:', e)
    }
    setState({ tokenId, seed, entries: [] })
  }, [])

  const addEntry = useCallback((
    type: 'human' | 'agent',
    action: string,
    description: string
  ) => {
    setState(prev => {
      const newEntry: EvolutionEntry = {
        timestamp: Date.now(),
        type,
        action,
        description,
      }
      const newEntries = [...prev.entries, newEntry]
      
      if (prev.tokenId) {
        try {
          localStorage.setItem(
            `${EVOLUTION_STORAGE_KEY}_${prev.tokenId}`,
            JSON.stringify(newEntries)
          )
        } catch (e) {
          console.error('Error saving evolution log:', e)
        }
      }
      
      return { ...prev, entries: newEntries }
    })
  }, [])

  const getEvolutionText = useCallback((): string => {
    if (state.entries.length === 0) {
      return `Seed: ${state.seed}\nSin interacciones registradas aún.`
    }

    const lines = [
      `=== BITÁCORA DE EVOLUCIÓN ===`,
      `Token: ${state.tokenId || 'pendiente'}`,
      `Seed: ${state.seed}`,
      `Total de interacciones: ${state.entries.length}`,
      ``,
    ]

    state.entries.forEach((entry, index) => {
      const date = new Date(entry.timestamp).toISOString()
      lines.push(`${index + 1}. [${entry.type.toUpperCase()}] ${date}`)
      lines.push(`   Acción: ${entry.action}`)
      lines.push(`   ${entry.description}`)
      lines.push('')
    })

    return lines.join('\n')
  }, [state])

  const getEvolutionMetadata = useCallback((): object => {
    return {
      evolution_log: state.entries.map(entry => ({
        timestamp: new Date(entry.timestamp).toISOString(),
        entity_type: entry.type,
        action: entry.action,
        description: entry.description,
      })),
      total_interactions: state.entries.length,
      last_interaction: state.entries.length > 0 
        ? new Date(state.entries[state.entries.length - 1].timestamp).toISOString()
        : null,
    }
  }, [state])

  const clearLog = useCallback(() => {
    if (state.tokenId) {
      localStorage.removeItem(`${EVOLUTION_STORAGE_KEY}_${state.tokenId}`)
    }
    setState(prev => ({ ...prev, entries: [] }))
  }, [state.tokenId])

  return {
    state,
    loadFromStorage,
    addEntry,
    getEvolutionText,
    getEvolutionMetadata,
    clearLog,
  }
}

export function formatEvolutionForDisplay(entries: EvolutionEntry[]): React.ReactNode[] {
  if (entries.length === 0) return []

  return entries.map((entry, index) => {
    const date = new Date(entry.timestamp)
    const timeStr = date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    const dateStr = date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'short' 
    })

    return (
      <div key={index} style={{
        fontSize: '0.75rem',
        padding: '0.5rem',
        borderLeft: `2px solid ${entry.type === 'human' ? '#0066ff' : '#ff6600'}`,
        marginBottom: '0.5rem',
        opacity: 0.9,
      }}>
        <span style={{ color: '#888' }}>{dateStr} {timeStr}</span>
        <span style={{ 
          marginLeft: '0.5rem', 
          fontWeight: 'bold',
          color: entry.type === 'human' ? '#0066ff' : '#ff6600',
          fontSize: '0.65rem',
          textTransform: 'uppercase',
        }}>
          {entry.type}
        </span>
        <div style={{ marginTop: '0.25rem' }}>{entry.description}</div>
      </div>
    )
  })
}