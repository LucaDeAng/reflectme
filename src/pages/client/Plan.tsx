import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  Play, 
  MessageSquare,
  Send,
  MapPin,
  Award,
  ChevronRight,
  Star,
  Zap,
  Heart,
  Brain,
  Activity,
  Route,
  User,
  Phone,
  Video,
  Plus,
  Filter,
  Search,
  BookOpen
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CelebrationModal from '../../components/CelebrationModal';

interface Exercise {
  id: string;
  title: string;
  type: 'mindfulness' | 'cbt' | 'breathing' | 'journaling' | 'movement' | 'relaxation';
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  instructions: string[];
  completed: boolean;
  completedAt?: string;
  streak: number;
  category: string;
}

interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  dueDate: string;
  progress: number;
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  duration: number;
  type: 'individual' | 'group' | 'assessment' | 'check-in';
  therapist: {
    name: string;
    title: string;
    avatar: string;
  };
  focus: string;
  location: 'in-person' | 'video' | 'phone';
  notes?: string;
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'therapist';
  read: boolean;
}

const Plan: React.FC = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapMilestone[]>([]);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'exercises' | 'roadmap' | 'appointment' | 'messages'>('exercises');
  const [newMessage, setNewMessage] = useState('');
  const [exerciseFilter, setExerciseFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<any>(null);

  useEffect(() => {
    loadPlanData();
  }, [user]);

  const loadPlanData = async () => {
    // Load minimal demo exercises - real data will come from therapist assignments
    setExercises([
      {
        id: '1',
        title: 'Daily Check-in',
        type: 'mindfulness',
        duration: 5,
        difficulty: 'beginner',
        description: 'Quick mood and wellness assessment',
        instructions: [
          'Take a moment to notice how you\'re feeling',
          'Rate your current mood and energy',
          'Set a positive intention for today'
        ],
        completed: false,
        streak: 0,
        category: 'Daily Practice'
      }
    ]);

    // Load minimal roadmap - real data will come from therapist
    setRoadmap([
      {
        id: '1',
        title: 'Getting Started',
        description: 'Complete initial assessment and setup',
        status: 'in-progress',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        progress: 25,
        tasks: [
          { id: '1a', title: 'Complete initial assessment', completed: false },
          { id: '1b', title: 'Set wellness goals', completed: false }
        ]
      }
    ]);

    // Load next appointment - will be set by therapist
    setNextAppointment(null);

    // Load recent messages - will be populated by real conversations
    setMessages([]);
  };

  const completeExercise = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    setExercises(prev => prev.map(ex => 
      ex.id === exerciseId 
        ? { ...ex, completed: true, completedAt: new Date().toISOString(), streak: ex.streak + 1 }
        : ex
    ));
    
    if (exercise) {
      setCelebrationData({
        type: 'exercise_complete',
        title: 'Exercise Completed!',
        description: `Great job completing "${exercise.title}"! You're building healthy habits.`,
        points: exercise.duration * 5,
        streak: exercise.streak + 1
      });
      setShowCelebration(true);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      timestamp: new Date().toISOString(),
      sender: 'user',
      read: true
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const getExerciseIcon = (type: Exercise['type']) => {
    switch (type) {
      case 'mindfulness': return Brain;
      case 'cbt': return Target;
      case 'breathing': return Activity;
      case 'journaling': return BookOpen;
      case 'movement': return Zap;
      case 'relaxation': return Heart;
      default: return Target;
    }
  };

  const getStatusColor = (status: RoadmapMilestone['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'upcoming': return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredExercises = exercises.filter(exercise => {
    switch (exerciseFilter) {
      case 'completed': return exercise.completed;
      case 'pending': return !exercise.completed;
      default: return true;
    }
  });

  const completedExercises = exercises.filter(ex => ex.completed).length;
  const totalExercises = exercises.length;
  const progressPercentage = Math.round((completedExercises / totalExercises) * 100);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Celebration Modal */}
      {celebrationData && (
        <CelebrationModal
          isOpen={showCelebration}
          onClose={() => setShowCelebration(false)}
          achievement={celebrationData}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mr-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Treatment Plan</h1>
                <p className="text-gray-600 mt-1">Track your progress and stay on course</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
              <div className="text-sm text-gray-500">Overall Progress</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 mb-6"
        >
          <div className="flex space-x-2">
            {[
              { id: 'exercises', label: 'Daily Exercises', icon: Activity },
              { id: 'roadmap', label: 'Treatment Roadmap', icon: Route },
              { id: 'appointment', label: 'Next Appointment', icon: Calendar },
              { id: 'messages', label: 'Message Therapist', icon: MessageSquare }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl transition-all duration-200 ${
                  activeTab === id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content Sections */}
        <AnimatePresence mode="wait">
          {activeTab === 'exercises' && (
            <motion.div
              key="exercises"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Exercises Header */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Daily Exercises</h2>
                  <div className="flex items-center space-x-3">
                    <select
                      value={exerciseFilter}
                      onChange={(e) => setExerciseFilter(e.target.value as any)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="all">All Exercises</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Exercise Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{completedExercises}</div>
                        <div className="text-sm text-green-700">Completed Today</div>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{totalExercises - completedExercises}</div>
                        <div className="text-sm text-blue-700">Remaining</div>
                      </div>
                      <Clock className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-purple-600">7</div>
                        <div className="text-sm text-purple-700">Day Streak</div>
                      </div>
                      <Star className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>
                </div>

                {/* Exercise List */}
                <div className="space-y-4">
                  {filteredExercises.map((exercise, index) => {
                    const Icon = getExerciseIcon(exercise.type);
                    return (
                      <motion.div
                        key={exercise.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`border rounded-xl p-6 transition-all duration-200 ${
                          exercise.completed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              exercise.completed ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              {exercise.completed ? (
                                <CheckCircle className="w-6 h-6 text-green-600" />
                              ) : (
                                <Icon className="w-6 h-6 text-gray-600" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{exercise.title}</h3>
                                {exercise.streak > 0 && (
                                  <div className="flex items-center text-orange-600 bg-orange-100 px-2 py-1 rounded-full text-xs">
                                    <Star className="w-3 h-3 mr-1" />
                                    {exercise.streak} day streak
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-gray-600 mb-3">{exercise.description}</p>
                              
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="flex items-center text-gray-500">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {exercise.duration} min
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  exercise.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                                  exercise.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {exercise.difficulty}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                  {exercise.category}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="ml-4">
                            {!exercise.completed && (
                              <button
                                onClick={() => completeExercise(exercise.id)}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Start Exercise
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'roadmap' && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Treatment Roadmap</h2>
                <div className="text-sm text-gray-500">
                  {roadmap.filter(m => m.status === 'completed').length} of {roadmap.length} milestones completed
                </div>
              </div>

              <div className="space-y-6">
                {roadmap.map((milestone, index) => (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    {/* Timeline Line */}
                    {index < roadmap.length - 1 && (
                      <div className="absolute left-6 top-16 w-0.5 h-20 bg-gray-200"></div>
                    )}
                    
                    <div className="flex items-start space-x-4">
                      {/* Status Icon */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center relative z-10 ${
                        milestone.status === 'completed' ? 'bg-green-100' :
                        milestone.status === 'in-progress' ? 'bg-blue-100' :
                        'bg-gray-100'
                      }`}>
                        {milestone.status === 'completed' ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : milestone.status === 'in-progress' ? (
                          <Target className="w-6 h-6 text-blue-600" />
                        ) : (
                          <MapPin className="w-6 h-6 text-gray-600" />
                        )}
                      </div>

                      {/* Milestone Content */}
                      <div className="flex-1 bg-gray-50 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">{milestone.title}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(milestone.status)}`}>
                              {milestone.status.replace('-', ' ')}
                            </span>
                            <span className="text-sm text-gray-500">
                              Due {new Date(milestone.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-4">{milestone.description}</p>
                        
                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Progress</span>
                            <span className="text-sm font-medium text-gray-900">{milestone.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                milestone.status === 'completed' ? 'bg-green-500' :
                                milestone.status === 'in-progress' ? 'bg-blue-500' :
                                'bg-gray-400'
                              }`}
                              style={{ width: `${milestone.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Tasks */}
                        <div className="space-y-2">
                          {milestone.tasks.map((task) => (
                            <div key={task.id} className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                task.completed ? 'bg-green-100' : 'bg-gray-200'
                              }`}>
                                {task.completed && <CheckCircle className="w-3 h-3 text-green-600" />}
                              </div>
                              <span className={`text-sm ${
                                task.completed ? 'text-gray-500 line-through' : 'text-gray-700'
                              }`}>
                                {task.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'appointment' && (
            <motion.div
              key="appointment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Next Appointment</h2>
              
              {nextAppointment && (
                <div className="space-y-6">
                  {/* Appointment Overview */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center">
                          <Calendar className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{nextAppointment.focus}</h3>
                          <p className="text-gray-600">with {nextAppointment.therapist.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{nextAppointment.date}</div>
                        <div className="text-lg text-gray-600">{nextAppointment.time}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-700">{nextAppointment.duration} minutes</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {nextAppointment.location === 'video' ? (
                          <Video className="w-5 h-5 text-gray-500" />
                        ) : nextAppointment.location === 'phone' ? (
                          <Phone className="w-5 h-5 text-gray-500" />
                        ) : (
                          <MapPin className="w-5 h-5 text-gray-500" />
                        )}
                        <span className="text-gray-700 capitalize">{nextAppointment.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-700">{nextAppointment.type}</span>
                      </div>
                    </div>
                  </div>

                  {/* Therapist Info */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Therapist</h4>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h5 className="text-lg font-medium text-gray-900">{nextAppointment.therapist.name}</h5>
                        <p className="text-gray-600">{nextAppointment.therapist.title}</p>
                      </div>
                    </div>
                  </div>

                  {/* Session Notes */}
                  {nextAppointment.notes && (
                    <div className="border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Session Preparation</h4>
                      <p className="text-gray-700">{nextAppointment.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center">
                      {nextAppointment.location === 'video' ? (
                        <>
                          <Video className="w-5 h-5 mr-2" />
                          Join Video Call
                        </>
                      ) : (
                        <>
                          <Calendar className="w-5 h-5 mr-2" />
                          Add to Calendar
                        </>
                      )}
                    </button>
                    <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Message Therapist
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'messages' && (
            <motion.div
              key="messages"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Message Your Therapist</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Dr. Sarah Chen is online</span>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Responses */}
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Quick responses:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "I'm doing well with my exercises",
                    "I have a question about my homework",
                    "Can we reschedule our next session?",
                    "I'd like to discuss my progress"
                  ].map((quickResponse) => (
                    <button
                      key={quickResponse}
                      onClick={() => setNewMessage(quickResponse)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                    >
                      {quickResponse}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Plan; 