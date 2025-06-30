import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Send, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Database,
  Clock,
  Sparkles,
  MessageCircle,
  Loader2
} from 'lucide-react'
import { useAiCompanion } from '../hooks/useAiCompanion'
import { useAuth } from '../contexts/AuthContext'

const AiCompanionDemo: React.FC = () => {
  const { user } = useAuth()
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    clearMessages, 
    playAudio, 
    stopAudio,
    isPlaying 
  } = useAiCompanion()
  
  const [inputMessage, setInputMessage] = useState('')
  const [ttsEnabled, setTtsEnabled] = useState(false)

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return
    
    const message = inputMessage.trim()
    setInputMessage('')
    
    await sendMessage(message, { 
      tts: ttsEnabled, 
      autoPlay: true 
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (ms: number) => {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
  }

  const exampleQuestions = [
    "What mood entries do I have?",
    "Show me my therapy sessions",
    "What coping tools are available?",
    "How are my journal entries?",
    "What progress have I made?"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
              <Brain className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            AI Companion Demo
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Ask questions about your mental health data across all platform tables
          </p>
          {user && (
            <p className="text-sm text-gray-500">
              Logged in as: {user.email}
            </p>
          )}
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat with AI
            </h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  ttsEnabled 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="text-sm">TTS</span>
              </button>
              
              {messages.length > 0 && (
                <button
                  onClick={clearMessages}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="flex space-x-3">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your mental health data..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Example Questions */}
          <div className="mb-6">
            <p className="text-gray-600 mb-3">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "What mood entries do I have?",
                "Show me my therapy sessions",
                "What coping tools are available?",
                "How are my journal entries?",
                "What progress have I made?"
              ].map((question) => (
                <button
                  key={question}
                  onClick={() => !isLoading && sendMessage(question, { tts: ttsEnabled })}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Debug Information */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">⚠️ Error Details</h3>
              <p className="text-red-700 text-sm mb-3">{error}</p>
              
              {error.includes('GEMINI_API_KEY') && (
                <div className="bg-red-100 p-3 rounded border-l-4 border-red-400">
                  <h4 className="font-semibold text-red-800">🔑 API Key Issue</h4>
                  <p className="text-red-700 text-sm mt-1">
                    The Gemini API key is not configured. Please:
                  </p>
                  <ol className="text-red-700 text-sm mt-2 ml-4 list-decimal">
                    <li>Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
                    <li>Run: <code className="bg-red-200 px-1 rounded">supabase secrets set GEMINI_API_KEY=your_key_here</code></li>
                    <li>Run: <code className="bg-red-200 px-1 rounded">supabase functions deploy chat-gemini</code></li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              )}
              
              {error.includes('401') && (
                <div className="bg-red-100 p-3 rounded border-l-4 border-red-400">
                  <h4 className="font-semibold text-red-800">🔐 Authentication Issue</h4>
                  <p className="text-red-700 text-sm mt-1">
                    Invalid or missing API key. Please check your Gemini API key configuration.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Debug Information */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">⚠️ Error Details</h3>
              <p className="text-red-700 text-sm mb-3">{error}</p>
              
              {error.includes('GEMINI_API_KEY') && (
                <div className="bg-red-100 p-3 rounded border-l-4 border-red-400">
                  <h4 className="font-semibold text-red-800">🔑 API Key Issue</h4>
                  <p className="text-red-700 text-sm mt-1">
                    The Gemini API key is not configured. Please:
                  </p>
                  <ol className="text-red-700 text-sm mt-2 ml-4 list-decimal">
                    <li>Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
                    <li>Run: <code className="bg-red-200 px-1 rounded">supabase secrets set GEMINI_API_KEY=your_key_here</code></li>
                    <li>Run: <code className="bg-red-200 px-1 rounded">supabase functions deploy chat-gemini</code></li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              )}
              
              {error.includes('401') && (
                <div className="bg-red-100 p-3 rounded border-l-4 border-red-400">
                  <h4 className="font-semibold text-red-800">🔐 Authentication Issue</h4>
                  <p className="text-red-700 text-sm mt-1">
                    Invalid or missing API key. Please check your Gemini API key configuration.
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Messages */}
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                {/* User Message */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                  <p className="text-white font-medium">{message.message}</p>
                  <p className="text-blue-100 text-xs mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>

                {/* AI Response */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      <span className="font-semibold text-gray-800">AI Response</span>
                    </div>
                    {message.audioUrl && (
                      <button
                        onClick={() => playAudio(message.audioUrl!)}
                        disabled={isPlaying}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span className="text-sm">Play</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {message.response}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Database className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-700">Tables Queried</span>
                      </div>
                      {message.tablesQueried.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {message.tablesQueried.map((table, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                            >
                              {table}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-xs">No tables queried</p>
                      )}
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-700">Processing Time</span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div>Search: {formatTime(message.processingTime.search_ms)}</div>
                        <div>Generation: {formatTime(message.processingTime.generation_ms)}</div>
                        <div className="font-medium">Total: {formatTime(message.processingTime.total_ms)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center space-x-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <div>
                  <p className="font-medium text-gray-800">AI is thinking...</p>
                  <p className="text-sm text-gray-600">Searching database and generating response</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AiCompanionDemo 