import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedAICompanion, CopingSuggestion, logJournalEntry } from '../../services/enhancedAICompanion';
import { useAuth } from '../../contexts/AuthContext';
import { PenTool, Brain, Lightbulb, TrendingUp, BookOpen, Sparkles, Target, Clock } from 'lucide-react';
import { logJournalEntryMCP, convertToUUID } from '../../services/mcpService';
import { supabase } from '../../lib/supabase';

interface JournalWithAIInsightsProps {
  onEntrySubmitted?: (content: string, insights: string[], suggestions: CopingSuggestion[]) => void;
  className?: string;
}

const JournalWithAIInsights: React.FC<JournalWithAIInsightsProps> = ({ 
  onEntrySubmitted, 
  className = '' 
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<CopingSuggestion[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const journalPrompts = [
    "What happened today that made you feel grateful?",
    "What challenge did you face and how did you handle it?",
    "What emotions did you experience most strongly today?",
    "What would you like to remember about today?",
    "How did you take care of yourself today?",
    "What pattern do you notice in your thoughts lately?",
    "What would you tell a friend going through something similar?"
  ];

  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const handlePromptSelect = (prompt: string) => {
    setSelectedPrompt(prompt);
    setContent(prompt + "\n\n");
  };

  const analyzeJournalEntry = async () => {
    if (!content.trim() || content.length < 20) {
      alert('Please write a bit more before getting AI insights (at least 20 characters).');
      return;
    }

    setIsAnalyzing(true);
    setShowAnalysis(true);
    
    try {
      const { message, insights, suggestions: aiSuggestions } = await EnhancedAICompanion.analyzeJournalEntry(
        content, 
        user?.id
      );
      
      setAiInsights(insights);
      setSuggestions(aiSuggestions);
      setAnalysisComplete(true);
      
      // Call parent callback
      onEntrySubmitted?.(content, insights, aiSuggestions);
      
    } catch (error) {
      console.error('Error analyzing journal entry:', error);
      setAiInsights(['Thank you for sharing your thoughts. Writing can be a powerful tool for self-reflection and emotional processing.']);
      setSuggestions([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveEntry = async () => {
    if (!user?.id || content.length < 10) return;

    try {
      // First analyze if not already done
      if (!analysisComplete && content.length >= 20) {
        await analyzeJournalEntry();
      }

      // Convert user ID to UUID format for database
      const userUUID = convertToUUID(user.id);
      
      // Save to Supabase using direct insert (more reliable than MCP for now)
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: userUUID,
          content: content.trim(),
          mood_score: null, // Can be set if we have mood data
          tags: [], // Can be extracted from AI insights
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving journal entry:', error);
        throw error;
      }

      console.log('✅ Journal entry saved successfully:', data);

      // Also log via MCP for backup/analytics
      await logJournalEntryMCP(userUUID, content, undefined, []);

      // Clear the form
      setContent('');
      setAiInsights([]);
      setSuggestions([]);
      setShowAnalysis(false);
      setAnalysisComplete(false);
      setSelectedPrompt(null);

    } catch (error) {
      console.error('❌ Failed to save journal entry:', error);
      // Show user-friendly error message
      alert('Failed to save journal entry. Please try again.');
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className={`bg-white rounded-2xl shadow-soft border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <PenTool className="w-6 h-6 text-purple-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">AI-Enhanced Journal</h2>
              <p className="text-sm text-gray-600">Write your thoughts and get personalized insights</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Journal Prompts */}
        {!selectedPrompt && content.length === 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Need inspiration? Try one of these prompts:</h3>
            <div className="grid grid-cols-1 gap-2">
              {journalPrompts.slice(0, 3).map((prompt, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handlePromptSelect(prompt)}
                  className="text-left p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <p className="text-sm text-purple-800">{prompt}</p>
                </motion.button>
              ))}
            </div>
            <button
              onClick={() => setSelectedPrompt('more')}
              className="mt-2 text-xs text-purple-600 hover:text-purple-700"
            >
              Show more prompts →
            </button>
          </div>
        )}

        {/* More Prompts */}
        {selectedPrompt === 'more' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6"
          >
            <div className="grid grid-cols-1 gap-2">
              {journalPrompts.slice(3).map((prompt, index) => (
                <motion.button
                  key={index + 3}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handlePromptSelect(prompt)}
                  className="text-left p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <p className="text-sm text-purple-800">{prompt}</p>
                </motion.button>
              ))}
            </div>
            <button
              onClick={() => setSelectedPrompt(null)}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700"
            >
              ← Back to writing
            </button>
          </motion.div>
        )}

        {/* Journal Editor */}
        <div className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind today? Share your thoughts, feelings, experiences, or reflections..."
            rows={8}
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          
          {/* Writing Tips */}
          {content.length > 0 && content.length < 50 && (
            <p className="mt-2 text-xs text-gray-500">
              💡 Tip: Writing more detailed entries helps the AI provide better insights
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-3">
            <button
              onClick={analyzeJournalEntry}
              disabled={isAnalyzing || content.length < 20}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Brain className="w-4 h-4 mr-2" />
              {isAnalyzing ? 'Analyzing...' : 'Get AI Insights'}
            </button>
            
            <button
              onClick={handleSaveEntry}
              disabled={content.length < 10}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Save Entry
            </button>
          </div>
          
          {content.length > 0 && (
            <button
              onClick={() => {
                setContent('');
                setSelectedPrompt(null);
                setShowAnalysis(false);
                setAnalysisComplete(false);
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* AI Analysis Panel */}
        <AnimatePresence>
          {showAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="border-t border-gray-200 pt-6"
            >
              <div className="flex items-center mb-4">
                <Brain className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">AI Insights</h3>
              </div>

              {isAnalyzing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-purple-700 ml-2">Analyzing your journal entry...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Insights */}
                  {aiInsights.length > 0 && (
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-start space-x-3">
                        <TrendingUp className="w-5 h-5 text-purple-600 mt-1" />
                        <div>
                          <h4 className="font-medium text-purple-900 mb-2">Key Insights</h4>
                          <ul className="space-y-2">
                            {aiInsights.map((insight, index) => (
                              <li key={index} className="text-sm text-purple-800 leading-relaxed">
                                • {insight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-start space-x-3">
                        <Lightbulb className="w-5 h-5 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900 mb-3">Personalized Suggestions</h4>
                          <div className="space-y-3">
                            {suggestions.map((suggestion) => (
                              <div
                                key={suggestion.id}
                                className="p-3 bg-white rounded-lg border border-blue-200"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="text-sm font-medium text-blue-900">{suggestion.title}</h5>
                                    <p className="text-xs text-blue-700 mt-1">{suggestion.description}</p>
                                    <p className="text-xs text-blue-600 mt-2 italic">{suggestion.reasoning}</p>
                                  </div>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    suggestion.priority === 'high' ? 'bg-red-100 text-red-600' :
                                    suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                    'bg-green-100 text-green-600'
                                  }`}>
                                    {suggestion.priority}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isAnalyzing && aiInsights.length === 0 && suggestions.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <p>No specific insights generated. Keep writing to get more personalized feedback!</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JournalWithAIInsights; 