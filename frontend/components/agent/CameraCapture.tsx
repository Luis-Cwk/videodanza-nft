'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface AgentStep {
  step: number
  action: string
  status: 'pending' | 'active' | 'done'
  message: string
}

interface CameraCaptureProps {
  onComplete: (videoBlob: Blob, cid: string) => void
}

export function CameraCapture({ onComplete }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [duration, setDuration] = useState(15)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [steps, setSteps] = useState<AgentStep[]>([])
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ cid: string; metadataCid: string } | null>(null)

  // Iniciar cámara
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 640, facingMode: 'user' },
        audio: false
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara. Permite el acceso e intenta de nuevo.')
    }
  }, [])

  // Detener cámara
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }, [stream])

  // Iniciar grabación con countdown
  const startRecording = useCallback(() => {
    setCountdown(3)
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(countdownInterval)
          // Iniciar grabación real
          if (videoRef.current && stream) {
            const mediaRecorder = new MediaRecorder(stream, {
              mimeType: 'video/webm;codecs=vp9'
            })
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                chunksRef.current.push(e.data)
              }
            }

            mediaRecorder.onstop = () => {
              const blob = new Blob(chunksRef.current, { type: 'video/webm' })
              processVideo(blob)
            }

            mediaRecorder.start(100)
            mediaRecorderRef.current = mediaRecorder
            setIsRecording(true)
            setRecordingTime(0)

            // Timer de grabación
            const timerInterval = setInterval(() => {
              setRecordingTime(prev => {
                if (prev >= duration - 1) {
                  clearInterval(timerInterval)
                  stopRecording()
                  return duration
                }
                return prev + 1
              })
            }, 1000)
          }
          return null
        }
        return prev! - 1
      })
    }, 1000)
  }, [stream, duration])

  // Detener grabación
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [])

  // Procesar video con el agente
  const processVideo = async (blob: Blob) => {
    setIsProcessing(true)
    setError(null)

    const newSteps: AgentStep[] = [
      { step: 1, action: 'capturar', status: 'pending', message: 'Video capturado' },
      { step: 2, action: 'analizar', status: 'pending', message: 'Analizando movimiento con IA...' },
      { step: 3, action: 'decidir', status: 'pending', message: 'El agente decide el estilo artístico...' },
      { step: 4, action: 'crear', status: 'pending', message: 'Aplicando estilo con StreamDiffusion en GPU...' },
      { step: 5, action: 'subir', status: 'pending', message: 'Subiendo a IPFS...' },
      { step: 6, action: 'listo', status: 'pending', message: 'Listo para mintear' },
    ]

    setSteps(newSteps)

    try {
      // Paso 1: Video capturado
      updateStep(newSteps, 1, 'done')
      setSteps([...newSteps])

      // Paso 2: Analizar movimiento (simulado por ahora)
      updateStep(newSteps, 2, 'active')
      setSteps([...newSteps])
      await new Promise(r => setTimeout(r, 1500))

      // Detectar tipo de movimiento (simplificado)
      const movementType = detectMovementType()
      const prompt = getPromptForMovement(movementType)
      updateStep(newSteps, 2, 'done', `Movimiento detectado: ${movementType}`)
      setSteps([...newSteps])

      // Paso 3: Decidir estilo
      updateStep(newSteps, 3, 'active')
      setSteps([...newSteps])
      await new Promise(r => setTimeout(r, 1000))
      updateStep(newSteps, 3, 'done', `Estilo seleccionado: ${prompt.style}`)
      setSteps([...newSteps])

      // Paso 4: Enviar a Modal GPU
      updateStep(newSteps, 4, 'active')
      setSteps([...newSteps])

      // Convertir blob a base64 para enviar
      const formData = new FormData()
      formData.append('video', blob, 'capture.webm')
      formData.append('prompt', prompt.prompt)
      formData.append('negativePrompt', prompt.negative)
      formData.append('strength', String(prompt.strength))
      formData.append('movementType', movementType)
      formData.append('style', prompt.style)
      formData.append('colorPalette', prompt.colorPalette)

      const processResp = await fetch('/api/agent/process', {
        method: 'POST',
        body: formData,
      })

      if (!processResp.ok) {
        throw new Error('Error procesando video')
      }

      const processResult = await processResp.json()
      updateStep(newSteps, 4, 'done', `Procesado en ${processResult.processingTime}s`)
      setSteps([...newSteps])

      // Paso 5: Subir a IPFS
      updateStep(newSteps, 5, 'active')
      setSteps([...newSteps])

      const uploadResp = await fetch('/api/agent/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoBase64: processResult.videoBase64,
          movementType,
          style: prompt.style,
          colorPalette: prompt.colorPalette,
        }),
      })

      if (!uploadResp.ok) {
        throw new Error('Error subiendo a IPFS')
      }

      const uploadResult = await uploadResp.json()
      updateStep(newSteps, 5, 'done', `CID: ${uploadResult.cid}`)
      setSteps([...newSteps])

      // Paso 6: Listo
      updateStep(newSteps, 6, 'done')
      setSteps([...newSteps])

      setResult({
        cid: uploadResult.cid,
        metadataCid: uploadResult.metadataCid,
      })

      onComplete(blob, uploadResult.cid)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsProcessing(false)
      stopCamera()
    }
  }

  const updateStep = (steps: AgentStep[], stepNum: number, status: AgentStep['status'], message?: string) => {
    const step = steps.find(s => s.step === stepNum)
    if (step) {
      step.status = status
      if (message) step.message = message
    }
  }

  const detectMovementType = (): string => {
    const types = ['golpear', 'flotar', 'deslizar', 'cortar', 'presionar', 'retorcer', 'sacudir', 'tocar']
    return types[Math.floor(Math.random() * types.length)]
  }

  const getPromptForMovement = (type: string) => {
    const prompts: Record<string, { prompt: string; negative: string; style: string; colorPalette: string; strength: number }> = {
      golpear: { prompt: 'explosive energy, crimson reds, sharp geometric fragments, dramatic lighting', negative: 'soft, blurry, calm', style: 'aggressive', colorPalette: 'crimson, black, gold', strength: 0.7 },
      flotar: { prompt: 'ethereal floating particles, soft ocean blues, dreamy atmosphere, translucent', negative: 'sharp, dark, aggressive', style: 'ethereal', colorPalette: 'ocean blue, white, lavender', strength: 0.5 },
      deslizar: { prompt: 'smooth silver metallic reflections, fluid mercury streams, elegant curves', negative: 'rough, chaotic', style: 'elegant', colorPalette: 'silver, white, ice blue', strength: 0.55 },
      cortar: { prompt: 'angular sharp monochrome slices, fractured glass, black and white contrast', negative: 'round, soft, colorful', style: 'brutalist', colorPalette: 'black, white, grey', strength: 0.65 },
      presionar: { prompt: 'dense heavy dark matter, deep earth tones, compressed layers, tectonic', negative: 'light, airy, floating', style: 'heavy', colorPalette: 'deep brown, obsidian, amber', strength: 0.6 },
      retorcer: { prompt: 'twisted organic sinuous textures, vine tendrils, bioluminescent organisms', negative: 'straight, geometric', style: 'organic', colorPalette: 'deep green, purple, cyan', strength: 0.55 },
      sacudir: { prompt: 'electric neon chaos, glitch art, lightning bolts, fragmented pixels', negative: 'smooth, calm, natural', style: 'digital_chaos', colorPalette: 'neon pink, electric blue, lime', strength: 0.75 },
      tocar: { prompt: 'minimal precise geometric dots, pointillism, delicate thin lines, white space', negative: 'messy, busy, chaotic', style: 'minimal', colorPalette: 'ink black, white, faint red', strength: 0.4 },
    }
    return prompts[type] || prompts.flotar
  }

  useEffect(() => {
    return () => stopCamera()
  }, [])

  return (
    <div>
      {/* Cámara */}
      <div style={{ position: 'relative', marginBottom: '4vh' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            maxWidth: '640px',
            background: '#000',
            borderRadius: '4px',
          }}
        />

        {/* Countdown overlay */}
        {countdown !== null && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '4rem',
            fontWeight: '900',
            color: '#fff',
            textShadow: '0 0 20px rgba(0,0,0,0.8)',
          }}>
            {countdown}
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div style={{
            position: 'absolute',
            top: '1vh',
            right: '1vw',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(0,0,0,0.7)',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#ff0000',
              animation: 'pulse 1s infinite',
            }} />
            <span style={{ color: '#fff', fontFamily: 'monospace' }}>
              {recordingTime}s / {duration}s
            </span>
          </div>
        )}
      </div>

      {/* Controles */}
      {!stream && (
        <button onClick={startCamera} className="btn-minimal">
          Iniciar Cámara
        </button>
      )}

      {stream && !isRecording && !isProcessing && !result && (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={startRecording} className="btn-minimal">
            Grabar ({duration}s)
          </button>
          <select
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            style={{ padding: '0.5rem', fontFamily: 'inherit' }}
          >
            <option value={10}>10s</option>
            <option value={15}>15s</option>
            <option value={20}>20s</option>
            <option value={30}>30s</option>
          </select>
        </div>
      )}

      {isRecording && (
        <button onClick={stopRecording} className="btn-minimal" style={{ background: '#ff0000', color: '#fff' }}>
          Detener
        </button>
      )}

      {/* Agent Steps */}
      {isProcessing && (
        <div style={{ marginTop: '4vh', borderTop: '1px solid #e8e8e8', paddingTop: '4vh' }}>
          <h3 style={{ marginBottom: '2vh' }}>El Agente está trabajando...</h3>
          {steps.map((step) => (
            <div key={step.step} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.5rem 0',
              opacity: step.status === 'pending' ? 0.4 : 1,
            }}>
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                background: step.status === 'done' ? '#000' : step.status === 'active' ? '#666' : '#ccc',
                color: '#fff',
              }}>
                {step.status === 'done' ? '✓' : step.step}
              </span>
              <span style={{ fontSize: '0.9rem' }}>{step.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div style={{ marginTop: '4vh', borderTop: '1px solid #e8e8e8', paddingTop: '4vh' }}>
          <h3 style={{ marginBottom: '2vh' }}>¡Listo para mintear!</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '2vh' }}>
            Video CID: <code>{result.cid}</code>
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a
              href={`https://videodanza-nft.vercel.app/mint?cid=${result.cid}`}
              className="btn-minimal"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mintear NFT
            </a>
            <button onClick={() => { setResult(null); setSteps([]); }} className="btn-minimal">
              Nueva Grabación
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ marginTop: '2vh', color: '#ff0000', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
