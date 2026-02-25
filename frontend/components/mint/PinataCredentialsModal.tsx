'use client'

import { useState } from 'react'

interface PinataCredentialsModalProps {
  isOpen: boolean
  onSubmit: (apiKey: string, secretKey: string) => void
  onCancel: () => void
}

export const PinataCredentialsModal = ({ isOpen, onSubmit, onCancel }: PinataCredentialsModalProps) => {
  const [apiKey, setApiKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [showKeys, setShowKeys] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (apiKey.trim() && secretKey.trim()) {
      onSubmit(apiKey, secretKey)
      setApiKey('')
      setSecretKey('')
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#fff',
          border: '1px solid #000',
          padding: '4vh 4vw',
          maxWidth: '90vw',
          width: '500px',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '2vh' }}>Credenciales de Pinata</h2>
        <p style={{ marginBottom: '3vh', fontSize: '0.9rem', color: '#666' }}>
          Se requieren credenciales de Pinata para subir la metadata del NFT a IPFS.
          <br />
          <a
            href="https://pinata.cloud"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#000', textDecoration: 'underline' }}
          >
            Obtén tus claves aquí
          </a>
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '2vh' }}>
            <label style={{ display: 'block', marginBottom: '0.5vh', fontSize: '0.85rem', fontWeight: '600' }}>
              API Key
            </label>
            <input
              type={showKeys ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Tu Pinata API Key"
              style={{
                width: '100%',
                padding: '0.8rem',
                border: '1px solid #e8e8e8',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '2vh' }}>
            <label style={{ display: 'block', marginBottom: '0.5vh', fontSize: '0.85rem', fontWeight: '600' }}>
              Secret Key
            </label>
            <input
              type={showKeys ? 'text' : 'password'}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Tu Pinata Secret Key"
              style={{
                width: '100%',
                padding: '0.8rem',
                border: '1px solid #e8e8e8',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2vh', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={showKeys}
              onChange={(e) => setShowKeys(e.target.checked)}
            />
            Mostrar claves
          </label>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              disabled={!apiKey.trim() || !secretKey.trim()}
              style={{
                flex: 1,
                padding: '0.8rem',
                background: '#000',
                color: '#fff',
                border: '1px solid #000',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Continuar
            </button>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '0.8rem',
                background: '#fff',
                color: '#000',
                border: '1px solid #000',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
