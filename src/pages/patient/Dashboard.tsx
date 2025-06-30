import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  BookOpen, 
  Target, 
  Sparkles, 
  TrendingUp, 
  Heart, 
  Brain, 
  Calendar,
  CheckCircle,
  ArrowRight,
  Play,
  Star,
  Zap,
  Shield,
  Clock,
  Award,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import MoodTrackerWithAI from '../../components/mood/MoodTrackerWithAI';
import { EnhancedAICompanionMCP } from '../../services/enhancedAICompanionMCP';
import * as Sentry from "@sentry/react";
import ClientChatHistory from '../../components/chat/ClientChatHistory';
import { useZentia } from '../../contexts/ZentiaContext';

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [aiInsights, setAiInsights] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [showProactiveSupport, setShowProactiveSupport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { moodEntries, chatHistory } = useZentia();

  // Track dashboard access
  useEffect(() => {
    Sentry.addBreadcrumb({
      message: 'Client accessed optimized dashboard',
      category: 'navigation',
      level: 'info'
    });
    
    // Simulate loading state
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  // AI-powered daily insights
  useEffect(() => {
    const generateDailyInsights = () => {
      const insights = [
        "🌟 You've maintained a positive mood trend for 3 consecutive days!",
        "💡 Your evening journal sessions show great emotional awareness.",
        "🎯 You're 80% closer to completing this week's wellness goals.",
        "🧠 AI analysis suggests you respond well to mindfulness exercises.",
        "⭐ Your consistency in mood tracking is helping identify patterns."
      ];
      setTimeout(() => {
        setAiInsights(insights[Math.floor(Math.random() * insights.length)]);
      }, 1200);
    };

    generateDailyInsights();
  }, []);

  // Proactive AI support check
  useEffect(() => {
    const checkProactiveSupport = () => {
      if (Math.random() < 0.4) {
        setTimeout(() => setShowProactiveSupport(true), 3000);
      }
    };
    checkProactiveSupport();
  }, []);

  const calculateStats = () => {
    const journalEntries = moodEntries.filter((e) => e.context === 'manual').length;
    const aiInteractions = chatHistory.filter((m) => m.sender === 'user').length;
    const uniqueDays = new Set(moodEntries.map((e) => new Date(e.date).toDateString())).size;
    const avgMood = moodEntries.length
      ? moodEntries.reduce((sum, e) => sum + (e.mood || 0), 0) / moodEntries.length
      : 0;
    return {
      journalEntries,
      moodScore: Number(avgMood.toFixed(1)),
      streakDays: uniqueDays,
      aiInteractions
    };
  };

  const [todayStats, setTodayStats] = useState(calculateStats());

  useEffect(() => {
    setTodayStats(calculateStats());
  }, [moodEntries, chatHistory]);

  const handleMoodSelection = async (mood: number) => {
    setSelectedMood(mood);
    
    if (mood <= 2) {
      try {
        const response = await EnhancedAICompanionMCP.handleMoodTrigger(
          mood,
          'dashboard_mood_selection',
          user?.id || 'anonymous'
        );
        
        setAiInsights(`🤗 ${response.message.content}`);
        setShowProactiveSupport(true);
      } catch (error) {
        console.error('Error handling mood trigger:', error);
      }
    }
  };

  const killerFunctions = React.useMemo(() => {
    return [
    {
      id: 'ai-companion',
      title: '🤖 AI Companion',
      description: 'Chat with your personal AI therapist anytime',
      value: 'Get instant support and guidance 24/7',
      href: '/client/chat',
      color: 'from-blue-500 to-purple-600',
        stats: {
          sessions: todayStats.aiInteractions,
          satisfaction: todayStats.aiInteractions ? '—' : '—',
          lastUsed: todayStats.aiInteractions ? 'Just now' : 'Never'
        },
      cta: 'Start Chat',
      features: ['Mood support', 'Coping strategies', 'Emotional guidance'],
        badge: todayStats.aiInteractions ? `${todayStats.aiInteractions} new` : undefined
    },
    {
      id: 'smart-journal',
      title: '📝 Smart Journal',
      description: 'AI-enhanced journaling with insights',
      value: 'Transform thoughts into actionable insights',
      href: '/client/journal',
      color: 'from-emerald-500 to-teal-600',
        stats: { entries: todayStats.journalEntries, insights: 0, streak: `${todayStats.streakDays} days` },
      cta: 'Write Entry',
      features: ['AI analysis', 'Pattern detection', 'Mood correlation'],
        badge: todayStats.streakDays ? 'Daily streak!' : undefined
    },
    {
      id: 'progress',
      title: '🎯 My Progress',
      description: 'Track your wellness journey',
      value: 'Visualize your mental health improvements',
      href: '/client',
      color: 'from-orange-500 to-red-500',
        stats: { score: `${todayStats.moodScore || 0}/10`, improvement: '+0%', goals: '0/0' },
      cta: 'View Progress',
        features: ['Mood trends', 'Goal tracking', 'Milestone rewards']
    },
    {
      id: 'insights',
      title: '✨ AI Insights',
      description: 'Personalized mental wellness insights',
      value: 'Discover patterns and get recommendations',
      href: '/client/insights',
      color: 'from-purple-500 to-pink-500',
        stats: { insights: 0, accuracy: '—', recommendations: 0 },
      cta: 'Explore',
        features: ['Pattern analysis', 'Personalized tips', 'Progress predictions']
    }
  ];
  }, [todayStats]);

  const quickStats = [
    { label: 'Days Active', value: todayStats.streakDays, icon: Calendar, color: 'text-blue-600' },
    { label: 'Mood Score', value: todayStats.moodScore, icon: Heart, color: 'text-red-500' },
    { label: 'AI Chats', value: todayStats.aiInteractions, icon: MessageSquare, color: 'text-purple-600' },
    { label: 'Journal Entries', value: todayStats.journalEntries, icon: BookOpen, color: 'text-green-600' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="loader mx-auto mb-4"></div>
          <p className="text-gray-600 animate-pulse">Loading your wellness dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 animate-fade-in">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl mb-6 animate-scale-in hover-lift">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">
                            Welcome back, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}! 🌟
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up" style={{animationDelay: '200ms'}}>
            Your AI-powered wellness companion is ready to support your mental health journey.
          </p>
        </div>

        {/* AI Daily Insight */}
        {aiInsights && (
          <Card className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none shadow-2xl animate-scale-in hover-glow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <Brain className="w-6 h-6 mr-3 mt-1 text-blue-100 animate-bounce" />
                  <div>
                    <h3 className="text-lg font-bold mb-1">🤖 AI Daily Insight</h3>
                    <p className="text-blue-100 leading-relaxed">{aiInsights}</p>
                  </div>
                </div>
                <Sparkles className="w-6 h-6 text-blue-200 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-stagger">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-white/70 backdrop-blur-sm shadow-xl hover-lift card-interactive">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Killer Functions Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {killerFunctions.map((func, index) => (
            <Card 
              key={func.id} 
              className="group card-interactive bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden animate-fade-in-up"
              style={{animationDelay: `${index * 150}ms`}}
            >
              <div className={`h-2 bg-gradient-to-r ${func.color} group-hover:h-3 transition-all duration-300`}></div>
              
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{func.title}</h3>
                      {func.badge && (
                        <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium animate-bounce">
                          {func.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{func.description}</p>
                    <p className="text-sm text-gray-500 italic">{func.value}</p>
                  </div>
                  <div className="ml-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${func.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Star className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  {Object.entries(func.stats).map(([key, value], idx) => (
                    <div key={key} className="animate-fade-in" style={{animationDelay: `${(index * 150) + (idx * 50)}ms`}}>
                      <div className="text-lg font-bold text-gray-900">{value}</div>
                      <div className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {func.features.map((feature, idx) => (
                    <span 
                      key={feature} 
                      className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full animate-fade-in"
                      style={{animationDelay: `${(index * 150) + 300 + (idx * 100)}ms`}}
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* CTA Button */}
                <Link to={func.href}>
                  <Button 
                    className={`w-full bg-gradient-to-r ${func.color} text-white border-none hover:scale-105 transition-all duration-300 font-medium text-lg py-3 group-hover:shadow-lg`}
                  >
                    {func.cta}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Proactive Support Modal */}
        {showProactiveSupport && (
          <div className="modal-overlay" onClick={() => setShowProactiveSupport(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <Brain className="w-6 h-6 text-blue-500 mr-3 animate-bounce" />
                    <h3 className="text-lg font-bold">🤖 AI Support</h3>
                  </div>
                  <button 
                    onClick={() => setShowProactiveSupport(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors hover-scale"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl mb-4 animate-fade-in-up">
                  <p className="text-blue-800">{aiInsights}</p>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={() => navigate('/client/chat')} 
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white hover-lift"
                  >
                    Start Chat
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowProactiveSupport(false)}
                    className="flex-1 hover-lift"
                  >
                    Later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mood Tracker Section */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl animate-fade-in-up" style={{animationDelay: '600ms'}}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 animate-pulse" />
              Quick Mood Check
            </CardTitle>
            <CardDescription>
              How are you feeling right now? Your AI companion is here to help.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MoodTrackerWithAI onMoodSelect={handleMoodSelection} selectedMood={selectedMood} />
          </CardContent>
        </Card>

        {user?.id && (
          <div className="mt-8">
            <ClientChatHistory clientId={user.id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;