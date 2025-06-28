import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  Heart, 
  Brain, 
  Users, 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Target,
  MessageSquare,
  BarChart3,
  BookOpen,
  Calendar,
  Settings,
  Camera,
  User,
  SkipForward
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface UserProfile {
  avatar?: string;
  preferences: {
    notifications: boolean;
    reminders: boolean;
    shareProgress: boolean;
  };
  goals: string[];
  interests: string[];
}

const Welcome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    preferences: {
      notifications: true,
      reminders: true,
      shareProgress: false
    },
    goals: [],
    interests: []
  });

  const isNewUser = location.state?.newUser || false;
  const userRole = user?.role || 'patient';

  // Redirect if not a new user after 5 seconds
  useEffect(() => {
    if (!isNewUser && user) {
      const timer = setTimeout(() => {
        navigate(user.role === 'therapist' ? '/therapist' : '/client');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isNewUser, navigate, user]);

  const patientGoals = [
    'Reduce anxiety and stress',
    'Improve mood and happiness',
    'Better sleep quality',
    'Build healthy habits',
    'Strengthen relationships',
    'Increase self-confidence',
    'Manage depression',
    'Work through trauma',
    'Improve communication skills',
    'Find life purpose'
  ];

  const patientInterests = [
    'Mindfulness & Meditation',
    'Cognitive Behavioral Therapy',
    'Journaling',
    'Exercise & Movement',
    'Art & Creative Therapy',
    'Group Support',
    'Crisis Support',
    'Medication Management',
    'Relationship Counseling',
    'Career Guidance'
  ];

  const therapistInterests = [
    'AI-Assisted Notes',
    'Client Progress Tracking',
    'Treatment Planning',
    'Crisis Intervention',
    'Group Therapy Tools',
    'Assessment Tools',
    'Research & Analytics',
    'Continuing Education',
    'Supervision Tools',
    'Billing & Admin'
  ];

  const welcomeSteps: OnboardingStep[] = [
    {
      id: 'welcome',
              title: `Welcome to Your Mental Health Journey, ${user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}!`,
      subtitle: userRole === 'therapist' 
        ? 'Empowering you to provide exceptional care with AI-powered tools'
        : 'Your safe space for growth, healing, and connection',
      icon: <Heart className="w-12 h-12 text-primary-600" />,
      content: (
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-r from-primary-100 to-secondary-100 rounded-2xl p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6"
            >
              <Heart className="w-12 h-12 text-primary-600" />
            </motion.div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-3">
              {userRole === 'therapist' ? 'Transform Lives with AI' : 'You took the first step!'}
            </h3>
            <p className="text-neutral-600 leading-relaxed">
              {userRole === 'therapist'
                ? 'Join thousands of therapists using our platform to enhance their practice with AI-powered insights, streamlined documentation, and better client outcomes.'
                : 'Taking care of your mental health is one of the most important things you can do. We\'re here to support you every step of the way with personalized tools and compassionate care.'
              }
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-white border rounded-lg p-4">
              <Shield className="w-8 h-8 text-green-600 mb-2" />
              <h4 className="font-medium text-neutral-900">HIPAA Compliant</h4>
              <p className="text-sm text-neutral-600">Your privacy and security are protected</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <Brain className="w-8 h-8 text-blue-600 mb-2" />
              <h4 className="font-medium text-neutral-900">AI-Powered</h4>
              <p className="text-sm text-neutral-600">Intelligent insights and personalized care</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <Users className="w-8 h-8 text-purple-600 mb-2" />
              <h4 className="font-medium text-neutral-900">Expert Support</h4>
              <p className="text-sm text-neutral-600">Professional therapists and counselors</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <Sparkles className="w-8 h-8 text-orange-600 mb-2" />
              <h4 className="font-medium text-neutral-900">24/7 Available</h4>
              <p className="text-sm text-neutral-600">Support whenever you need it</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'features',
      title: userRole === 'therapist' ? 'Powerful Tools for Better Care' : 'Your Wellness Toolkit',
      subtitle: userRole === 'therapist' 
        ? 'Discover how AI can enhance your therapeutic practice'
        : 'Explore features designed to support your mental health journey',
      icon: <Target className="w-12 h-12 text-primary-600" />,
      content: (
        <div className="space-y-4">
          {userRole === 'therapist' ? (
            <>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 rounded-lg p-2">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900">Client Management</h4>
                    <p className="text-sm text-blue-700">AI-powered insights, progress tracking, and risk alerts</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-600 rounded-lg p-2">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900">AI Assistant</h4>
                    <p className="text-sm text-green-700">Automated notes, content generation, homework suggestions</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-600 rounded-lg p-2">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-900">Smart Analytics</h4>
                    <p className="text-sm text-purple-700">Predictive analytics and pattern detection</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-600 rounded-lg p-2">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-900">Secure Communication</h4>
                    <p className="text-sm text-orange-700">HIPAA-compliant messaging with emergency protocols</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 rounded-lg p-2">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900">AI Companion</h4>
                    <p className="text-sm text-blue-700">24/7 support with mood tracking and coping strategies</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-600 rounded-lg p-2">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900">Smart Journal</h4>
                    <p className="text-sm text-green-700">AI-enhanced journaling with pattern analysis</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-600 rounded-lg p-2">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-900">Progress Tracking</h4>
                    <p className="text-sm text-purple-700">Wellness journey with AI analytics and milestones</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-600 rounded-lg p-2">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-900">AI Insights</h4>
                    <p className="text-sm text-orange-700">Personalized recommendations and predictions</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )
    },
    {
      id: 'goals',
      title: userRole === 'therapist' ? 'What areas interest you most?' : 'What would you like to work on?',
      subtitle: userRole === 'therapist' 
        ? 'Select the features and areas you\'d like to explore first'
        : 'Choose your wellness goals to get personalized recommendations',
      icon: <Target className="w-12 h-12 text-primary-600" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(userRole === 'therapist' ? therapistInterests : patientGoals).map((goal) => (
              <button
                key={goal}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  profile.goals.includes(goal)
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
                }`}
                onClick={() => {
                  setProfile(prev => ({
                    ...prev,
                    goals: prev.goals.includes(goal)
                      ? prev.goals.filter(g => g !== goal)
                      : [...prev.goals, goal]
                  }));
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{goal}</span>
                  {profile.goals.includes(goal) && (
                    <CheckCircle className="w-5 h-5 text-primary-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-500 text-center">
            Select 3-5 {userRole === 'therapist' ? 'areas' : 'goals'} to get started (you can change these later)
          </p>
        </div>
      )
    },
    {
      id: 'preferences',
      title: 'Customize Your Experience',
      subtitle: 'Set up your preferences to make the platform work best for you',
      icon: <Settings className="w-12 h-12 text-primary-600" />,
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div>
                <h4 className="font-medium text-neutral-900">Push Notifications</h4>
                <p className="text-sm text-neutral-600">Get reminders and updates</p>
              </div>
              <button
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  profile.preferences.notifications ? 'bg-primary-600' : 'bg-neutral-300'
                }`}
                onClick={() => setProfile(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, notifications: !prev.preferences.notifications }
                }))}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    profile.preferences.notifications ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div>
                <h4 className="font-medium text-neutral-900">Daily Reminders</h4>
                <p className="text-sm text-neutral-600">
                  {userRole === 'therapist' ? 'Check-in and task reminders' : 'Mindfulness and journaling reminders'}
                </p>
              </div>
              <button
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  profile.preferences.reminders ? 'bg-primary-600' : 'bg-neutral-300'
                }`}
                onClick={() => setProfile(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, reminders: !prev.preferences.reminders }
                }))}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    profile.preferences.reminders ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            
            {userRole === 'patient' && (
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-neutral-900">Share Progress</h4>
                  <p className="text-sm text-neutral-600">Allow therapists to see your progress</p>
                </div>
                <button
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    profile.preferences.shareProgress ? 'bg-primary-600' : 'bg-neutral-300'
                  }`}
                  onClick={() => setProfile(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, shareProgress: !prev.preferences.shareProgress }
                  }))}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      profile.preferences.shareProgress ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
                </div>
              )}
          </div>
        </div>
      )
    }
  ];

  const handleComplete = () => {
    // Save profile preferences here
    console.log('Saving profile preferences:', profile);
    
    // Navigate to appropriate dashboard
    navigate(userRole === 'therapist' ? '/therapist' : '/client');
  };

  const handleSkip = () => {
    navigate(userRole === 'therapist' ? '/therapist' : '/client');
  };

  const nextStep = () => {
    if (currentStep < welcomeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // If not a new user, show a simple welcome message
  if (!isNewUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="mx-auto w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Welcome back, {user?.name}!</h1>
          <p className="text-neutral-600">Redirecting you to your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (!showOnboarding) {
    handleComplete();
    return null;
  }

  const currentStepData = welcomeSteps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">
              Step {currentStep + 1} of {welcomeSteps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center"
            >
                              <SkipForward className="w-4 h-4 mr-1" />
              Skip for now
            </button>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / welcomeSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              {currentStepData.icon}
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              {currentStepData.title}
            </h1>
            <p className="text-neutral-600">
              {currentStepData.subtitle}
            </p>
          </div>

          <div className="mb-8">
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center text-neutral-500 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </button>

            <button
              onClick={nextStep}
              className="btn btn-primary flex items-center"
            >
              {currentStep === welcomeSteps.length - 1 ? (
                <>
                  Get Started
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Welcome; 