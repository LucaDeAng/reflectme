import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EnhancedAICompanion, CopingSuggestion } from '../../services/enhancedAICompanion';
import { logMoodEntryMCP } from '../../services/mcpService';
import { useAuth } from '../../contexts/AuthContext';
import { useZentia } from '../../contexts/ZentiaContext';
import { Heart, Zap, Lightbulb, Clock } from 'lucide-react';

interface MoodTrackerWithAIProps {
  onMoodLogged?: (mood: number, trigger?: string) => void;
  className?: string;
}

const MoodTrackerWithAI: React.FC<MoodTrackerWithAIProps> = ({ onMoodLogged, className = '' }) => {
  const { user } = useAuth();
  const { addMoodEntry } = useZentia();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [trigger, setTrigger] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [suggestions, setSuggestions] = useState<CopingSuggestion[]>([]);
  const [showAISupport, setShowAISupport] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const moodLabels = [
    'Awful', 'Very Bad', 'Bad', 'Poor', 'Fair', 
    'Okay', 'Good', 'Very Good', 'Great', 'Excellent'
  ];

  const moodEmojis = [
    '😢', '😰', '😟', '🙁', '😐',
    '🙂', '😊', '😄', '😁', '🤩'
  ];

  const moodColors = [
    'bg-red-500', 'bg-red-400', 'bg-orange-400', 'bg-orange-300', 'bg-yellow-400',
    'bg-yellow-300', 'bg-green-300', 'bg-green-400', 'bg-green-500', 'bg-emerald-500'
  ];

  const handleMoodSelect = async (mood: number) => {
    setSelectedMood(mood);
    
    // If mood is low (≤ 5), immediately offer AI support
    if (mood <= 5) {
      setShowAISupport(true);
      await triggerAISupport(mood, trigger);
    }
  };

  const triggerAISupport = async (mood: number, triggerText?: string) => {
    setIsLoading(true);
    try {
      const { message, suggestions: aiSuggestions } = await EnhancedAICompanion.handleMoodTrigger(
        mood, 
        triggerText, 
        user?.id
      );
      
      setAiResponse(message.content);
      setSuggestions(aiSuggestions);
      setShowAISupport(true);
    } catch (error) {
      console.error('Error getting AI support:', error);
      setAiResponse("I'm here to support you. Would you like to talk about what you're experiencing?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedMood === null) return;

    setIsLoading(true);
    
    try {
      // Log mood to database via MCP
      if (user?.id) {
        console.log('🎭 Logging mood entry:', { userId: user.id, mood: selectedMood, trigger });
        await logMoodEntryMCP(user.id, selectedMood, trigger);
      }
      
      // Add mood to UI state for immediate display
      addMoodEntry({
        date: new Date().toISOString().split('T')[0],
        mood: selectedMood,
        trigger: trigger || undefined,
        context: 'manual',
        notes: trigger ? `Manual entry: ${trigger}` : 'Manual mood entry'
      });
      
      console.log('✅ Mood entry added to UI state');
      
      // Trigger AI support if not already triggered
      if (!showAISupport && selectedMood <= 5) {
        await triggerAISupport(selectedMood, trigger);
      }
      
      // Call parent callback
      onMoodLogged?.(selectedMood, trigger);
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Reset form after successful submission
      setSelectedMood(null);
      setTrigger('');
      setShowAISupport(false);
      setSuggestions([]);
      setAiResponse('');
      
    } catch (error) {
      console.error('❌ Error logging mood:', error);
      // Still add to UI state even if MCP fails
      addMoodEntry({
        date: new Date().toISOString().split('T')[0],
        mood: selectedMood,
        trigger: trigger || undefined,
        context: 'manual',
        notes: 'Manual entry (MCP failed)'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionAction = (suggestion: CopingSuggestion) => {
    // This could open a guided experience for the coping technique
    console.log('Starting coping technique:', suggestion.title);
    // You could navigate to a dedicated coping tools page or open a modal
  };

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-soft border border-gray-200 ${className}`}>
      {/* Success Message */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-4 p-3 bg-green-100 border border-green-200 rounded-lg"
        >
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            <span className="text-green-800 text-sm font-medium">
              Mood logged successfully! Check your insights for updated progress.
            </span>
          </div>
        </motion.div>
      )}
      {/* Mood Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Heart className="w-5 h-5 mr-2 text-red-500" />
          How are you feeling right now?
        </h3>
        
        <div className="grid grid-cols-5 gap-3 mb-4">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((mood) => (
            <motion.button
              key={mood}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleMoodSelect(mood)}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200
                ${selectedMood === mood 
                  ? `${moodColors[mood - 1]} border-gray-800 text-white shadow-lg` 
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100'
                }
              `}
            >
              <div className="text-2xl mb-1">{moodEmojis[mood - 1]}</div>
              <div className="text-xs font-medium">{mood}</div>
              <div className="text-xs opacity-80">{moodLabels[mood - 1]}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Trigger Input */}
      {selectedMood && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6"
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What's contributing to this feeling? (optional)
          </label>
          <input
            type="text"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            placeholder="e.g., work stress, relationship issues, physical discomfort..."
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </motion.div>
      )}

      {/* AI Support Panel */}
      {showAISupport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200"
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Lightbulb className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-2">AI Companion Support</h4>
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-blue-700 ml-2">Analyzing your mood...</span>
                </div>
              ) : (
                <p className="text-blue-800 text-sm leading-relaxed">{aiResponse}</p>
              )}
            </div>
          </div>

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-4 space-y-2">
              <h5 className="text-sm font-medium text-blue-900">Recommended for you:</h5>
              {suggestions.map((suggestion) => (
                <motion.button
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => handleSuggestionAction(suggestion)}
                  className="w-full text-left p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h6 className="text-sm font-medium text-blue-900">{suggestion.title}</h6>
                      <p className="text-xs text-blue-700 mt-1">{suggestion.description}</p>
                      <div className="flex items-center mt-2 space-x-3">
                        <span className="flex items-center text-xs text-blue-600">
                          <Clock className="w-3 h-3 mr-1" />
                          {suggestion.duration}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          suggestion.priority === 'high' ? 'bg-red-100 text-red-600' :
                          suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {suggestion.priority} priority
                        </span>
                      </div>
                    </div>
                    <Zap className="w-4 h-4 text-blue-500" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Submit Button */}
      {selectedMood && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-between items-center"
        >
          <div className="text-sm text-gray-600">
            Selected: <span className="font-medium">{moodLabels[selectedMood - 1]} ({selectedMood}/10)</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Logging...
              </>
            ) : (
              'Log Mood'
            )}
          </button>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-3">Need immediate support?</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => triggerAISupport(3, 'feeling anxious')}
            className="px-3 py-2 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            I'm feeling anxious
          </button>
          <button
            onClick={() => triggerAISupport(4, 'feeling sad')}
            className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            I'm feeling down
          </button>
          <button
            onClick={() => triggerAISupport(5, 'need coping tools')}
            className="px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            Show me coping tools
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoodTrackerWithAI; 