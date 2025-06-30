import { useState, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface ChatMessage {
  id: string
  message: string
  response: string
  timestamp: Date
  tablesQueried: string[]
  processingTime: {
    embedding_ms: number
    search_ms: number
    generation_ms: number
    total_ms: number
  }
  audioUrl?: string
}

interface UseAiCompanionOptions {
  tts?: boolean
  autoPlay?: boolean
}

interface UseAiCompanionReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (message: string, options?: UseAiCompanionOptions) => Promise<void>
  clearMessages: () => void
  playAudio: (audioUrl: string) => Promise<void>
  stopAudio: () => void
  isPlaying: boolean
}

export const useAiCompanion = (): UseAiCompanionReturn => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const sendMessage = useCallback(async (
    message: string, 
    options: UseAiCompanionOptions = {}
  ) => {
    if (!message.trim()) {
      setError('Message cannot be empty')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('Sending message to AI companion:', message)
      
      // Get a valid bearer token (session or fallback to anon key)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY

      // Call the chat-gemini edge function with auth header
      const { data, error: functionError } = await supabase.functions.invoke('chat-gemini', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: {
          message: message.trim(),
          tts: options.tts || false,
          user_id: user?.id
        }
      })

      if (functionError) {
        throw new Error(`AI companion error: ${functionError.message}`)
      }

      if (!data) {
        throw new Error('No response received from AI companion')
      }

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        message: message.trim(),
        response: data.text,
        timestamp: new Date(),
        tablesQueried: data.tables_queried || [],
        processingTime: data.processing_time || {
          embedding_ms: 0,
          search_ms: 0,
          generation_ms: 0,
          total_ms: 0
        },
        audioUrl: data.audioUrl
      }

      setMessages(prev => [...prev, newMessage])

      // Auto-play audio if available and requested
      if (newMessage.audioUrl && options.autoPlay) {
        try {
          await playAudio(newMessage.audioUrl)
        } catch (audioError) {
          console.warn('Failed to auto-play audio:', audioError)
        }
      }

      console.log('AI companion response received:', {
        responseLength: data.text?.length,
        tablesQueried: data.tables_queried?.length,
        processingTime: data.processing_time?.total_ms,
        hasAudio: !!data.audioUrl
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('AI companion error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    stopAudio()
  }, [])

  const playAudio = useCallback(async (audioUrl: string): Promise<void> => {
    try {
      // Stop any currently playing audio
      stopAudio()

      // Create new audio element
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      // Set up event listeners
      audio.addEventListener('loadstart', () => setIsPlaying(true))
      audio.addEventListener('ended', () => setIsPlaying(false))
      audio.addEventListener('error', () => {
        setIsPlaying(false)
        console.error('Audio playback error')
      })

      // Play the audio
      await audio.play()
      
    } catch (error) {
      setIsPlaying(false)
      console.error('Failed to play audio:', error)
      throw error
    }
  }, [])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setIsPlaying(false)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    playAudio,
    stopAudio,
    isPlaying
  }
}

export default useAiCompanion 