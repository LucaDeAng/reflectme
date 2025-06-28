import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTherapy } from '../../contexts/TherapyContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  Calendar, 
  FileText, 
  PlusCircle, 
  MessageSquare, 
  BarChart2, 
  Award, 
  ChevronRight, 
  Clock, 
  Mic, 
  User, 
  TrendingUp,
  Activity,
  Brain,
  Target,
  Heart,
  BookOpen,
  Zap,
  CheckCircle,
  Plus,
  Play,
  Star
} from 'lucide-react';
import { getClientDisplayName, getClientEmail, normalizeClientId } from '../../utils/clientUtils';
import TherapistChatHistory from '../../components/chat/TherapistChatHistory';

// Demo trend data generator
const generateTrendData = (clientId: string) => {
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const baseData = {
    'f229bd3a-f1a5-4b05-9b25-f1330c03db09': { mood: 6, anxiety: 4, depression: 3, sleep: 7 }, // Sarah Mitchell
    '00000000-0000-4000-b000-000000000002': { mood: 5, anxiety: 6, depression: 5, sleep: 6 }, // John Thompson
    '00000000-0000-4000-b000-000000000003': { mood: 3, anxiety: 8, depression: 7, sleep: 4 }, // Emily Rodriguez
    '00000000-0000-4000-b000-000000000004': { mood: 7, anxiety: 3, depression: 2, sleep: 8 }, // Michael Chen
  };
  
  const normalizedId = normalizeClientId(clientId);
  const base = baseData[normalizedId] || baseData['f229bd3a-f1a5-4b05-9b25-f1330c03db09'];
  
  return weeks.map((week, index) => ({
    week,
    mood: Math.max(1, Math.min(10, base.mood + (Math.random() - 0.5) * 2)),
    anxiety: Math.max(1, Math.min(10, base.anxiety + (Math.random() - 0.5) * 2)),
    depression: Math.max(1, Math.min(10, base.depression + (Math.random() - 0.5) * 2)),
    sleep: Math.max(1, Math.min(10, base.sleep + (Math.random() - 0.5) * 1)),
  }));
};

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
  assignedBy: string;
  assignedAt: string;
  dueDate?: string;
}

const ClientDetails: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { getClient, addNote, addCopingStrategy } = useTherapy();
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'notes' | 'exercises' | 'chat'>('overview');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({
    title: '',
    type: 'mindfulness' as Exercise['type'],
    duration: 10,
    difficulty: 'beginner' as Exercise['difficulty'],
    description: '',
    instructions: [''],
    category: 'Daily Practice',
    dueDate: ''
  });
  
  useEffect(() => {
    if (clientId) {
      // Generate demo client info
      const normalizedId = normalizeClientId(clientId);
      const displayName = getClientDisplayName(clientId);
      const email = getClientEmail(normalizedId);
      
      setClientInfo({
        id: normalizedId,
        name: displayName,
        email: email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`,
        nextSessionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        mood: normalizedId === '00000000-0000-4000-b000-000000000003' ? 'poor' : 
              normalizedId === 'f229bd3a-f1a5-4b05-9b25-f1330c03db09' ? 'good' : 'neutral',
        lastActivity: new Date(),
        notes: [],
        copingStrategies: []
      });
      
      setTrendData(generateTrendData(clientId));
      loadClientExercises(normalizedId);
    }
  }, [clientId]);

  const loadClientExercises = (normalizedId: string) => {
    // Load mock exercises for the client
    setExercises([
      {
        id: '1',
        title: 'Morning Mindfulness Meditation',
        type: 'mindfulness',
        duration: 10,
        difficulty: 'beginner',
        description: 'Start your day with focused breathing and present-moment awareness',
        instructions: [
          'Find a comfortable seated position',
          'Close your eyes and focus on your breath',
          'When thoughts arise, gently return attention to breathing',
          'Continue for 10 minutes'
        ],
        completed: true,
        completedAt: new Date().toISOString(),
        streak: 7,
        category: 'Daily Practice',
        assignedBy: 'Dr. Therapist',
        assignedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Cognitive Restructuring Exercise',
        type: 'cbt',
        duration: 15,
        difficulty: 'intermediate',
        description: 'Challenge negative thought patterns and develop balanced thinking',
        instructions: [
          'Identify a negative thought you had today',
          'Write down evidence for and against this thought',
          'Create a more balanced, realistic alternative',
          'Practice the new thought pattern'
        ],
        completed: false,
        streak: 0,
        category: 'Cognitive Training',
        assignedBy: 'Dr. Therapist',
        assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        title: 'Gratitude Journaling',
        type: 'journaling',
        duration: 5,
        difficulty: 'beginner',
        description: 'Write down three things you\'re grateful for today',
        instructions: [
          'Set aside 5 minutes of quiet time',
          'Write down 3 specific things you\'re grateful for',
          'Include why each item is meaningful to you',
          'Reflect on the positive emotions this brings'
        ],
        completed: true,
        completedAt: new Date(Date.now() - 86400000).toISOString(),
        streak: 14,
        category: 'Emotional Wellness',
        assignedBy: 'Dr. Therapist',
        assignedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]);
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

  const addExercise = () => {
    const exercise: Exercise = {
      id: Date.now().toString(),
      title: newExercise.title,
      type: newExercise.type,
      duration: newExercise.duration,
      difficulty: newExercise.difficulty,
      description: newExercise.description,
      instructions: newExercise.instructions.filter(i => i.trim() !== ''),
      completed: false,
      streak: 0,
      category: newExercise.category,
      assignedBy: 'Dr. Therapist',
      assignedAt: new Date().toISOString(),
      dueDate: newExercise.dueDate || undefined
    };

    setExercises(prev => [exercise, ...prev]);
    setShowAddExercise(false);
    setNewExercise({
      title: '',
      type: 'mindfulness',
      duration: 10,
      difficulty: 'beginner',
      description: '',
      instructions: [''],
      category: 'Daily Practice',
      dueDate: ''
    });
  };

  const addInstruction = () => {
    setNewExercise(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setNewExercise(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
    }));
  };

  const removeInstruction = (index: number) => {
    setNewExercise(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  if (!clientInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading client details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-16 h-16 rounded-full overflow-hidden mr-4 bg-blue-100 flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{clientInfo.name}</h1>
            <p className="text-gray-500">{clientInfo.email}</p>
            <p className="text-sm text-blue-600">ID: {clientInfo.id.substring(0, 8)}...</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Link to={`/assessment/${clientId}?scale=phq9`} className="btn btn-outline">
            <FileText className="w-4 h-4 mr-2" />
            New Assessment
          </Link>
          <button className="btn btn-primary">
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Message
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {['overview', 'trends', 'notes', 'exercises', 'chat'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 px-1 text-sm font-medium border-b-2 capitalize ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 mb-1">Next Session</p>
                  <h3 className="text-lg font-bold text-gray-900">
                    {clientInfo.nextSessionDate.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-600">2:00 PM (45 min)</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 mb-1">Current Status</p>
                  <h3 className="text-lg font-bold text-gray-900">
                    {clientInfo.mood === 'good' 
                      ? 'Stable / Improving' 
                      : clientInfo.mood === 'neutral' 
                        ? 'Stable' 
                        : 'Needs Attention'}
                  </h3>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  clientInfo.mood === 'good' 
                    ? 'bg-green-100' 
                    : clientInfo.mood === 'neutral' 
                      ? 'bg-yellow-100' 
                      : 'bg-red-100'
                }`}>
                  <span className="text-xl">
                    {clientInfo.mood === 'good' 
                      ? '😊' 
                      : clientInfo.mood === 'neutral' 
                        ? '😐' 
                        : '😔'}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-600">
                    {clientInfo.mood === 'good' 
                      ? 'Improving trend' 
                      : clientInfo.mood === 'neutral' 
                        ? 'Stable trend' 
                        : 'Declining trend'}
                  </span>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 mb-1">Assessment Activity</p>
                  <h3 className="text-lg font-bold text-gray-900">Active</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <BarChart2 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center">
                  <Award className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-600">3 assessments this month</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Trends</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mood & Anxiety Chart */}
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">Mood & Anxiety Levels</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="mood" stroke="#10b981" strokeWidth={2} name="Mood" />
                    <Line type="monotone" dataKey="anxiety" stroke="#f59e0b" strokeWidth={2} name="Anxiety" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Depression & Sleep Chart */}
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">Depression & Sleep Quality</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Bar dataKey="depression" fill="#ef4444" name="Depression" />
                    <Bar dataKey="sleep" fill="#6366f1" name="Sleep Quality" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Assessment History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Assessments</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">PHQ-9 Depression Scale</p>
                  <p className="text-sm text-gray-600">Completed 2 days ago</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">Score: 9</p>
                  <p className="text-sm text-yellow-600">Mild</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">GAD-7 Anxiety Scale</p>
                  <p className="text-sm text-gray-600">Completed 1 week ago</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">Score: 12</p>
                  <p className="text-sm text-orange-600">Moderate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Session Notes</h3>
            <button className="btn btn-primary">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Note
            </button>
          </div>
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No notes available yet.</p>
            <p className="text-sm">Add your first session note to get started.</p>
          </div>
        </div>
      )}

      {activeTab === 'exercises' && (
        <div className="space-y-6">
          {/* Exercise Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{exercises.filter(e => e.completed).length}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{exercises.filter(e => !e.completed).length}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{Math.max(...exercises.map(e => e.streak), 0)}</div>
                  <div className="text-sm text-gray-600">Best Streak</div>
                </div>
                <Star className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{exercises.reduce((sum, e) => sum + e.duration, 0)}</div>
                  <div className="text-sm text-gray-600">Total Minutes</div>
                </div>
                <Activity className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Add Exercise Button */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Assigned Exercises</h3>
              <button 
                onClick={() => setShowAddExercise(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Assign New Exercise
              </button>
            </div>

            {/* Exercise List */}
            {exercises.length > 0 ? (
              <div className="space-y-4">
                {exercises.map((exercise, index) => {
                  const Icon = getExerciseIcon(exercise.type);
                  return (
                    <motion.div
                      key={exercise.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`border rounded-lg p-6 transition-all duration-200 ${
                        exercise.completed 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
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
                            <h4 className="text-lg font-semibold text-gray-900">{exercise.title}</h4>
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
                            {exercise.dueDate && (
                              <span className="text-blue-600 text-xs">
                                Due: {new Date(exercise.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {/* Instructions */}
                          <div className="mt-4">
                            <h5 className="font-medium text-gray-900 mb-2">Instructions:</h5>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                              {exercise.instructions.map((instruction, i) => (
                                <li key={i}>{instruction}</li>
                              ))}
                            </ol>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                            <p>Assigned by {exercise.assignedBy} on {new Date(exercise.assignedAt).toLocaleDateString()}</p>
                            {exercise.completedAt && (
                              <p>Completed on {new Date(exercise.completedAt).toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No exercises assigned yet.</p>
                <p className="text-sm">Click "Assign New Exercise" to get started.</p>
              </div>
            )}
          </div>

          {/* Add Exercise Modal */}
          {showAddExercise && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Assign New Exercise</h3>
                  <button 
                    onClick={() => setShowAddExercise(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={newExercise.title}
                      onChange={(e) => setNewExercise(prev => ({...prev, title: e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Exercise title"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={newExercise.type}
                        onChange={(e) => setNewExercise(prev => ({...prev, type: e.target.value as Exercise['type']}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="mindfulness">Mindfulness</option>
                        <option value="cbt">CBT</option>
                        <option value="breathing">Breathing</option>
                        <option value="journaling">Journaling</option>
                        <option value="movement">Movement</option>
                        <option value="relaxation">Relaxation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        value={newExercise.duration}
                        onChange={(e) => setNewExercise(prev => ({...prev, duration: parseInt(e.target.value) || 10}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        min="1"
                        max="120"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                      <select
                        value={newExercise.difficulty}
                        onChange={(e) => setNewExercise(prev => ({...prev, difficulty: e.target.value as Exercise['difficulty']}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <input
                        type="text"
                        value={newExercise.category}
                        onChange={(e) => setNewExercise(prev => ({...prev, category: e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="e.g. Daily Practice"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newExercise.description}
                      onChange={(e) => setNewExercise(prev => ({...prev, description: e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows={3}
                      placeholder="Brief description of the exercise"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (optional)</label>
                    <input
                      type="date"
                      value={newExercise.dueDate}
                      onChange={(e) => setNewExercise(prev => ({...prev, dueDate: e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                    {newExercise.instructions.map((instruction, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={instruction}
                          onChange={(e) => updateInstruction(index, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                          placeholder={`Step ${index + 1}`}
                        />
                        {newExercise.instructions.length > 1 && (
                          <button
                            onClick={() => removeInstruction(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addInstruction}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Step
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddExercise(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addExercise}
                    disabled={!newExercise.title.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    Assign Exercise
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'chat' && clientId && (
        <div className="mt-6">
          <TherapistChatHistory clientId={clientId} />
        </div>
      )}
    </div>
  );
};

export default ClientDetails;