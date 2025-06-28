import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Heart, 
  Target, 
  Star, 
  Calendar,
  Sparkles,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useZentia } from '../../contexts/ZentiaContext';
import MoodTrendChart from '../../components/charts/MoodTrendChart';

const Insights: React.FC = () => {
  const { user } = useAuth();
  const { getProgressData, sessionRecaps, moodEntries } = useZentia();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 Insights page mounted');
    console.log('📊 Mood entries:', moodEntries.length);
    console.log('📈 Progress data:', getProgressData().length);
    
    // Simple timeout to simulate loading
    setTimeout(() => {
      setLoading(false);
      console.log('✅ Insights loaded');
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading your insights...</p>
        </div>
      </div>
    );
  }

  const progressData = getProgressData();
  const recentMood = progressData.length > 0 
    ? progressData.reduce((sum, entry) => sum + entry.mood, 0) / progressData.length 
    : 6;
  const wellnessScore = Math.round((recentMood / 10) * 100);
  const streakDays = Math.max(1, moodEntries.length);

  // Calculate mood trend (% change) comparing last 7 days vs previous 7 days
  const moodTrend = useMemo(() => {
    if (progressData.length < 8) return 0;
    const recent = progressData.slice(-7);
    const previous = progressData.slice(-14, -7);
    const recentAvg = recent.reduce((sum, e) => sum + e.mood, 0) / recent.length;
    const prevAvg = previous.reduce((sum, e) => sum + e.mood, 0) / previous.length;
    if (prevAvg === 0) return 0;
    return ((recentAvg - prevAvg) / prevAvg) * 100;
  }, [progressData]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">


      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl">
            <Brain className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-neutral-800 mb-2">Your Mental Health Insights</h1>
        <p className="text-xl text-neutral-600">Track your progress and celebrate your journey</p>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wellness Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500 rounded-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-green-700">{wellnessScore}%</span>
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-1">Wellness Score</h3>
          <p className="text-green-600 text-sm">Based on your recent mood entries</p>
          <div className="mt-4 bg-green-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${wellnessScore}%` }}
            ></div>
          </div>
        </motion.div>

        {/* Mood Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className={`text-2xl font-bold ${moodTrend >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
              {moodTrend >= 0 ? '+' : ''}{moodTrend.toFixed(1)}%
            </span>
          </div>
          <h3 className="text-lg font-semibold text-blue-800 mb-1">Mood Trend</h3>
          <p className="text-blue-600 text-sm">
            {moodTrend >= 0 ? 'Improving' : 'Declining'} over the past week
          </p>
          <div className="mt-4 flex items-center text-blue-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="text-sm">{moodTrend >= 0 ? 'Positive trajectory' : 'Needs attention'}</span>
          </div>
        </motion.div>

        {/* Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-6 border border-purple-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-purple-700">{streakDays}</span>
          </div>
          <h3 className="text-lg font-semibold text-purple-800 mb-1">Day Streak</h3>
          <p className="text-purple-600 text-sm">Consecutive days of tracking</p>
          <div className="mt-4 flex items-center text-purple-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">Keep it up!</span>
          </div>
        </motion.div>
      </div>

      {/* AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl p-8 border border-yellow-200"
      >
        <div className="flex items-center mb-6">
          <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl mr-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-orange-800">AI Insights</h2>
            <p className="text-orange-600">Personalized observations about your progress</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-orange-200">
          <p className="text-gray-800 text-lg leading-relaxed">
            Great job maintaining your mental health tracking routine! Your consistency shows real commitment to your wellbeing. 
            With a wellness score of {wellnessScore}% and a {streakDays}-day streak, you're building healthy habits that will serve you well. 
            Keep focusing on the positive trends and remember that every day of tracking is a step toward better self-awareness.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <h4 className="font-semibold text-orange-800 mb-2 flex items-center">
              <Star className="w-4 h-4 mr-2" />
              Strengths
            </h4>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>• Consistent tracking habits</li>
              <li>• Self-awareness development</li>
              <li>• Positive trend maintenance</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <h4 className="font-semibold text-orange-800 mb-2 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Next Steps
            </h4>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>• Continue daily mood tracking</li>
              <li>• Explore coping strategies</li>
              <li>• Celebrate small wins</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Progress Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl p-8 border border-gray-200"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-500 rounded-lg mr-3">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Mood Trends</h2>
              <p className="text-gray-600">Your mood patterns over time</p>
            </div>
          </div>
        </div>
        <MoodTrendChart data={progressData} />
      </motion.div>


    </div>
  );
};

export default Insights; 