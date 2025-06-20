import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useTherapy } from '../../contexts/TherapyContext';
import { SpeechJournalMood } from '../../components/SpeechJournalMood';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Mic,
  Edit3,
  Trash2,
  Star,
  Heart,
  Brain,
  Clock,
  TrendingUp,
  Share2
} from 'lucide-react';

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: number;
  tags: string[];
  type: 'written' | 'voice';
}

const Journal: React.FC = () => {
  const { user } = useAuth();
  const { journalEntries, addJournalEntry } = useTherapy();
  const [newEntry, setNewEntry] = useState({ title: '', content: '', mood: 5 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<number | null>(null);
  const [showVoiceJournal, setShowVoiceJournal] = useState(false);

  const moodLabels = {
    1: '😢 Very Low',
    2: '😕 Low', 
    3: '😐 Neutral',
    4: '🙂 Good',
    5: '😊 Excellent'
  };

  const predefinedTags = [
    'grateful', 'anxious', 'excited', 'peaceful', 'stressed', 
    'hopeful', 'tired', 'energetic', 'reflective', 'motivated',
    'overwhelmed', 'content', 'creative', 'social', 'lonely'
  ];

  const handleAddEntry = () => {
    if (newEntry.title.trim() && newEntry.content.trim()) {
      addJournalEntry({
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        title: newEntry.title,
        content: newEntry.content,
        mood: newEntry.mood,
        tags: [],
        type: 'written'
      });
      setNewEntry({ title: '', content: '', mood: 5 });
      setShowAddForm(false);
    }
  };

  const handleVoiceJournalUpdate = (data: { journal: string; mood: number }) => {
    if (data.journal && data.mood > 0) {
      addJournalEntry({
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        title: 'Voice Entry',
        content: data.journal,
        mood: data.mood,
        tags: ['voice-recorded'],
        type: 'voice'
      });
    }
  };

  const filteredEntries = journalEntries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMood = selectedMoodFilter === null || entry.mood === selectedMoodFilter;
    return matchesSearch && matchesMood;
  });

  const averageMood = journalEntries.length > 0 
    ? (journalEntries.reduce((sum, entry) => sum + entry.mood, 0) / journalEntries.length).toFixed(1)
    : '0.0';

  const recentTrend = journalEntries.length >= 2 
    ? journalEntries[journalEntries.length - 1].mood - journalEntries[journalEntries.length - 2].mood
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Personal Journal</h1>
            <p className="text-gray-600">Reflect on your thoughts and feelings</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowVoiceJournal(!showVoiceJournal)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              showVoiceJournal 
                ? 'bg-purple-600 text-white' 
                : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
            }`}
          >
            <Mic className="w-4 h-4 mr-2" />
            Voice Journal
          </button>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </button>
        </div>
      </div>

      {/* Journal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Total Entries</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{journalEntries.length}</div>
          <p className="text-sm text-gray-600">entries recorded</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Average Mood</h3>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{averageMood}</div>
          <p className="text-sm text-gray-600">out of 5.0</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Trend</h3>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-900">
              {recentTrend > 0 ? '+' : ''}{recentTrend.toFixed(1)}
            </span>
            <span className={`ml-2 text-sm ${
              recentTrend > 0 ? 'text-green-600' : recentTrend < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {recentTrend > 0 ? '↗ improving' : recentTrend < 0 ? '↘ declining' : '→ stable'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Voice Journal Section */}
      {showVoiceJournal && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Voice Journal</h2>
          <SpeechJournalMood onDataUpdate={handleVoiceJournalUpdate} />
        </motion.div>
      )}

      {/* Add Entry Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Write New Entry</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entry Title
              </label>
              <input
                type="text"
                value={newEntry.title}
                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                placeholder="What's on your mind today?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Thoughts
              </label>
              <textarea
                value={newEntry.content}
                onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                placeholder="Express your thoughts and feelings freely..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Mood (1-5)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={newEntry.mood}
                  onChange={(e) => setNewEntry({ ...newEntry, mood: parseInt(e.target.value) })}
                  className="flex-grow"
                />
                <span className="text-2xl">
                  {newEntry.mood === 1 && '😢'}
                  {newEntry.mood === 2 && '😕'}
                  {newEntry.mood === 3 && '😐'}
                  {newEntry.mood === 4 && '🙂'}
                  {newEntry.mood === 5 && '😊'}
                </span>
                <span className="font-medium text-gray-700 w-24">
                  {moodLabels[newEntry.mood as keyof typeof moodLabels]}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEntry}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Save Entry
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-grow">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search your entries..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={selectedMoodFilter || ''}
                onChange={(e) => setSelectedMoodFilter(e.target.value ? parseInt(e.target.value) : null)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Moods</option>
                <option value="1">😢 Very Low</option>
                <option value="2">😕 Low</option>
                <option value="3">😐 Neutral</option>
                <option value="4">🙂 Good</option>
                <option value="5">😊 Excellent</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Journal Entries */}
      <div className="space-y-4">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-grow">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{entry.title}</h3>
                    {entry.type === 'voice' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        <Mic className="w-3 h-3 mr-1" />
                        Voice
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(entry.date).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 mr-1" />
                      Mood: {entry.mood}/5
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {entry.mood === 1 && '😢'}
                    {entry.mood === 2 && '😕'}
                    {entry.mood === 3 && '😐'}
                    {entry.mood === 4 && '🙂'}
                    {entry.mood === 5 && '😊'}
                  </span>
                </div>
              </div>

              <p className="text-gray-700 mb-4 leading-relaxed">{entry.content}</p>

              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {entry.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Entry #{filteredEntries.length - index}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center"
          >
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Entries Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedMoodFilter 
                ? "Try adjusting your search or filter criteria"
                : "Start journaling to track your thoughts and mood over time"
              }
            </p>
            {!searchTerm && !selectedMoodFilter && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <Plus className="w-5 h-5 mr-2" />
                Write Your First Entry
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Journal;