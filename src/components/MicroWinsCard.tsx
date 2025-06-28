// 🎉 Micro-Wins Card Component
// Displays and celebrates patient achievements with gamification elements

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Badge component not available - using inline styles
import { toast } from 'sonner';
import { normalizeClientId, getClientDisplayName } from '@/utils/clientUtils';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Heart, Plus } from 'lucide-react';

interface MicroWin {
  id: string;
  win_text: string;
  detected_from: string;
  confidence_score: number;
  celebrated: boolean;
  detected_at: string;
}

interface MicroWinsCardProps {
  clientId?: string; // If provided, shows wins for specific client (therapist view)
  showControls?: boolean; // Show celebration controls
  limit?: number; // Number of wins to display
}

export const MicroWinsCard: React.FC<MicroWinsCardProps> = ({
  clientId,
  showControls = true,
  limit = 5
}) => {
  const { user } = useAuth();
  const { clientId: rawClientId } = useParams<{ clientId: string }>();
  const [microWins, setMicroWins] = useState<MicroWin[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebrating, setCelebrating] = useState<string | null>(null);
  
  // Normalize the client ID for database operations
  const normalizedClientId = rawClientId ? normalizeClientId(rawClientId) : null;
  const displayName = rawClientId ? getClientDisplayName(rawClientId) : 'Client';
  
  useEffect(() => {
    if (normalizedClientId) {
      fetchMicroWins();
    } else if (user?.role === 'patient') {
      // For demo purposes, create some sample micro wins for patients
      createDemoMicroWins();
    }
  }, [normalizedClientId, user]);
  
  const fetchMicroWins = async () => {
    if (!normalizedClientId) return;
    
    try {
      const { data, error } = await supabase
        .from('micro_wins')
        .select('*')
        .eq('client_id', normalizedClientId)
        .order('detected_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      setMicroWins(data || []);
      
    } catch (error) {
      console.error('Error fetching micro-wins:', error);
      toast.error('Unable to load micro-wins');
    } finally {
      setLoading(false);
    }
  };
  
  const createDemoMicroWins = () => {
    // For demo accounts, start with an empty state to encourage real usage
    setMicroWins([]);
    setLoading(false);
  };
  
  const celebrateWin = async (winId: string) => {
    try {
      setCelebrating(winId);
      
      // For demo wins (when no normalizedClientId), just update local state
      if (!normalizedClientId || winId.startsWith('demo-')) {
        // Update local state for demo
        setMicroWins(prev => prev.map(win => 
          win.id === winId ? { ...win, celebrated: true } : win
        ));
        
        // Show celebration animation/toast
        toast.success("🎉 Fantastico! Hai celebrato questo successo! Continua così!");
        
        setCelebrating(null);
        return;
      }
      
      // For real database wins
      const { error } = await supabase
        .from('micro_wins')
        .update({ celebrated: true })
        .eq('id', winId)
        .eq('client_id', normalizedClientId);
      
      if (error) throw error;
      
      // Update local state
      setMicroWins(prev => prev.map(win => 
        win.id === winId ? { ...win, celebrated: true } : win
      ));
      
      // Show celebration animation/toast
      toast.success("🎉 Great work! You celebrated this success! Keep it up!");
      
      // Log celebration event
      await supabase.from('audit_logs').insert({
        actor_id: user?.id,
        action: 'celebrate',
        object_type: 'micro_win',
        object_id: winId,
        metadata: { celebrated_at: new Date().toISOString() }
      });
      
    } catch (error) {
      console.error('Error celebrating win:', error);
      toast.error("Unable to celebrate success.");
    } finally {
      setCelebrating(null);
    }
  };
  
  const detectWinFromText = async (text: string) => {
    try {
      // For demo users without database connection
      if (!normalizedClientId) {
        const newWin: MicroWin = {
          id: `demo-${Date.now()}`,
          win_text: text,
          detected_from: 'manual',
          confidence_score: 0.85,
          celebrated: false,
          detected_at: new Date().toISOString()
        };
        
        setMicroWins(prev => [newWin, ...prev]);
        toast.success("🎉 Nuovo successo rilevato! Abbiamo identificato una micro-vittoria dalle tue parole!");
        return;
      }
      
      // For real database users
      const { data, error } = await supabase
        .rpc('detect_micro_win', {
          p_client_id: normalizedClientId,
          p_text: text,
          p_source: 'manual'
        });
      
      if (error) throw error;
      
      if (data) {
        toast.success("🎉 New success detected! We identified a new micro-win from your words!");
        fetchMicroWins(); // Refresh the list
      }
      
    } catch (error) {
      console.error('Error detecting micro-win:', error);
      toast.error("Unable to detect micro-win from text.");
    }
  };

  const addTestWin = () => {
    const testWins = [
      "I successfully completed all my daily tasks",
      "I managed to take a walk even though I didn't feel like it",
      "I called a friend to chat and felt better afterwards",
      "I cooked a healthy meal instead of ordering takeout",
      "I followed my sleep schedule for the entire week",
      "I managed to handle a stressful situation calmly",
      "I practiced gratitude and appreciated the small things"
    ];
    
    const randomWin = testWins[Math.floor(Math.random() * testWins.length)];
    detectWinFromText(randomWin);
  };
  
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.8) return 'High confidence';
    if (confidence >= 0.6) return 'Medium confidence';
    return 'Low confidence';
  };
  
  const getSourceIcon = (source: string): string => {
    switch (source) {
      case 'journal': return '📝';
      case 'chat': return '💬';
      case 'assessment_note': return '📋';
      case 'manual': return '✋';
      default: return '🎯';
    }
  };
  
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString('en-US');
  };
  
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎉 <span className="bg-gray-300 h-4 w-32 rounded"></span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 h-16 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            🎉 Micro-Wins
            {microWins.length > 0 && (
              <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                {microWins.length}
              </span>
            )}
          </span>
          {microWins.filter(w => !w.celebrated).length > 0 && (
            <span className="inline-block border border-gray-300 text-gray-600 px-2 py-1 rounded text-xs font-medium animate-pulse">
              {microWins.filter(w => !w.celebrated).length} to celebrate
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {microWins.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🌱</div>
            <p className="font-medium text-gray-700">Start your micro-wins journey!</p>
            <p className="text-sm mt-1">
              Your successes will be automatically identified from your journals and conversations.
            </p>
            <p className="text-sm mt-1 text-blue-600">
              Try adding a micro-win to get started! ⬇️
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {microWins.map((win) => (
              <div
                key={win.id}
                className={`p-4 rounded-lg border transition-all ${
                  win.celebrated 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {getSourceIcon(win.detected_from)}
                      </span>
                      <span 
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(win.confidence_score)}`}
                      >
                        {getConfidenceLabel(win.confidence_score)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatRelativeTime(win.detected_at)}
                      </span>
                    </div>
                    
                    <p className="text-gray-800 font-medium mb-2">
                      "{win.win_text}"
                    </p>
                    
                    <div className="text-sm text-gray-600">
                      Detected from: <span className="capitalize">{win.detected_from.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  {showControls && !win.celebrated && (
                    <Button
                      onClick={() => celebrateWin(win.id)}
                      disabled={celebrating === win.id}
                      variant="outline"
                      size="sm"
                      className="shrink-0 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white border-none"
                    >
                      {celebrating === win.id ? (
                        <>🔄 Celebrating...</>
                      ) : (
                        <>🎉 Celebrate!</>
                      )}
                    </Button>
                  )}
                  
                  {win.celebrated && (
                    <div className="shrink-0 flex items-center gap-1 text-green-600">
                      <span>✅</span>
                      <span className="text-sm font-medium">Celebrated</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Quick Add Manual Win */}
        {showControls && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={addTestWin}
              className="w-full text-sm hover:bg-blue-50 text-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Micro-Win
            </Button>
          </div>
        )}
        
        {/* Celebration Stats */}
        {microWins.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">{microWins.length}</div>
                <div className="text-xs text-gray-600">Total Wins</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {microWins.filter(w => w.celebrated).length}
                </div>
                <div className="text-xs text-gray-600">Celebrated</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {Math.round(microWins.reduce((sum, w) => sum + w.confidence_score, 0) / microWins.length * 100)}%
                </div>
                <div className="text-xs text-gray-600">Average Confidence</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MicroWinsCard; 