'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ReputationData {
  average: number
  count: number
  clients: number
  lastUpdated: number
}

export interface EvolutionEntry {
  timestamp: number
  type: 'human' | 'agent'
  action: string
  description: string
}

interface UseReputationReturn {
  reputation: ReputationData | null
  loading: boolean
  error: string | null
  evolutionLog: EvolutionEntry[]
  addEvolutionEntry: (entry: Omit<EvolutionEntry, 'timestamp'>) => void
  glitchIntensity: number
  glitchMode: 'low' | 'medium' | 'high'
}

export function useReputation(): UseReputationReturn {
  const [reputation, setReputation] = useState<ReputationData | null>(null)
  const [evolutionLog, setEvolutionLog] = useState<EvolutionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReputation = useCallback(async () => {
    try {
      const response = await fetch('/api/onchain-activity')
      if (!response.ok) throw new Error('Failed to fetch reputation')
      const data = await response.json()
      
      if (data.reputation) {
        setReputation({
          average: data.reputation.average,
          count: data.reputation.feedbackCount,
          clients: data.reputation.clients,
          lastUpdated: Date.now(),
        })
      }
    } catch (err) {
      console.error('Error fetching reputation:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReputation()
    const interval = setInterval(fetchReputation, 60000)
    return () => clearInterval(interval)
  }, [fetchReputation])

  const addEvolutionEntry = useCallback((entry: Omit<EvolutionEntry, 'timestamp'>) => {
    const newEntry: EvolutionEntry = {
      ...entry,
      timestamp: Date.now(),
    }
    setEvolutionLog(prev => [...prev, newEntry])
  }, [])

  const glitchIntensity = reputation 
    ? Math.min(1, Math.max(0, (10 - reputation.average) / 10))
    : 0.5

  const glitchMode: 'low' | 'medium' | 'high' = 
    reputation?.average && reputation.average < 3 ? 'high' :
    reputation?.average && reputation.average > 7 ? 'low' : 'medium'

  return {
    reputation,
    loading,
    error,
    evolutionLog,
    addEvolutionEntry,
    glitchIntensity,
    glitchMode,
  }
}