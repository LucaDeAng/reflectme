import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTherapy } from '../../contexts/TherapyContext';
import { Tag, X, Save, ArrowLeft, Plus, Brain } from 'lucide-react';
import { AINotesAnalysis } from '../../components/therapist/AINotesAnalysis';
import { getClientDisplayName } from '../../utils/clientUtils';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { convertToUUID } from '../../services/mcpService';

const Notes: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { getClient } = useTherapy();
  const { user } = useAuth();
  const client = getClient(clientId || '');
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [showTagPopup, setShowTagPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  if (!client && !clientId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-neutral-900">Client not found</h2>
        <button onClick={() => navigate('/therapist')} className="btn btn-primary mt-4">Return to Dashboard</button>
      </div>
    );
  }

  // Use client data if available, otherwise use clientId for display
  const displayName = client?.name || getClientDisplayName(clientId || '');
  const actualClientId = clientId || client?.id || '';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (!user?.id) {
      alert('User not authenticated');
      return;
    }

    try {
      setIsSaving(true);

      const therapistUUID = convertToUUID(user.id);
      const clientUUID = convertToUUID(actualClientId);

      // Save therapy note to Supabase
      const therapyNote = {
        therapist_id: therapistUUID,
        client_id: clientUUID,
        session_date: new Date().toISOString().split('T')[0],
        session_type: 'therapy_session',
        notes: content,
        goals: [], // Could be extracted from content
        interventions: [title], // Using title as intervention
        homework_assigned: [], // Could be extracted from content
        next_session_focus: null,
        session_rating: null,
        created_at: new Date().toISOString()
      };

      const { data: savedNote, error } = await supabase
        .from('therapy_sessions')
        .insert(therapyNote)
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving therapy note:', error);
        throw new Error(`Failed to save therapy note: ${error.message}`);
      }

      console.log('✅ Therapy note saved successfully:', savedNote);

      // Also save as a general note for backup
      const generalNote = {
        user_id: clientUUID,
        content: `${title}\n\n${content}`,
        tags: tags,
        created_at: new Date().toISOString()
      };

      const { error: noteError } = await supabase
        .from('notes')
        .insert(generalNote);

      if (noteError) {
        console.warn('⚠️ Could not save general note:', noteError);
        // Don't fail the whole operation
      }

      // Navigate back to client details
      navigate(`/therapist/client/${actualClientId}`);

    } catch (error) {
      console.error('❌ Failed to save therapy note:', error);
      alert('Failed to save therapy note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const addTagToList = () => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
      setTag('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };
  
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedText(selection.toString());
      
      // Get position for the popup
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setPopupPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 40
      });
      
      setShowTagPopup(true);
    } else {
      setShowTagPopup(false);
    }
  };
  
  const handleAddAsTag = () => {
    if (selectedText.trim() && !tags.includes(selectedText.trim())) {
      setTags([...tags, selectedText.trim()]);
      setShowTagPopup(false);
    }
  };
  
  const handleAddAsTrigger = () => {
    alert(`Added "${selectedText}" as a trigger. This would update the client's digital twin.`);
    setShowTagPopup(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(`/therapist/client/${actualClientId}`)} 
            className="p-2 rounded-full hover:bg-neutral-100 mr-3"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <h1 className="text-2xl font-bold text-neutral-900">Note di Sessione - {displayName}</h1>
        </div>

        {/* Toggle AI Analysis */}
        <button
          onClick={() => setShowAIAnalysis(!showAIAnalysis)}
          className={`btn flex items-center space-x-2 ${showAIAnalysis ? 'btn-primary' : 'btn-outline'}`}
        >
          <Brain className="w-4 h-4" />
          <span>{showAIAnalysis ? 'Nascondi Analisi AI' : 'Mostra Analisi AI'}</span>
        </button>
      </div>

      {/* AI Analysis Panel */}
      {showAIAnalysis && actualClientId && (
        <AINotesAnalysis 
          clientId={actualClientId}
          clientName={displayName}
          className="mb-6"
        />
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="client" className="label">Cliente</label>
            <div className="flex items-center px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50">
              <div className="w-8 h-8 rounded-full overflow-hidden mr-3 bg-primary-100 flex items-center justify-center">
                {client?.avatar ? (
                  <img 
                    src={client.avatar} 
                    alt={displayName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary-600 font-semibold text-sm">
                    {displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                )}
              </div>
              <span className="font-medium text-neutral-900">{displayName}</span>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="title" className="label">Titolo della Nota</label>
            <input
              type="text"
              id="title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Valutazione Iniziale, Sessione CBT, Revisione Progressi"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="content" className="label">Note di Sessione</label>
            <p className="text-sm text-neutral-500 mb-2">
              Seleziona il testo per taggarlo come trigger o strategie di coping.
            </p>
            <textarea
              id="content"
              className="textarea min-h-[300px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onMouseUp={handleTextSelection}
              placeholder="Documenta le tue osservazioni, interventi e progressi del cliente..."
              required
            ></textarea>
            
            {showTagPopup && (
              <div 
                className="absolute bg-white shadow-lg rounded-lg border border-neutral-200 p-2 z-10"
                style={{ 
                  left: `${popupPosition.x}px`, 
                  top: `${popupPosition.y}px`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleAddAsTag}
                    className="px-3 py-1 bg-primary-100 text-primary-800 rounded-md text-sm"
                  >
                    Aggiungi come Tag
                  </button>
                  <button
                    type="button"
                    onClick={handleAddAsTrigger}
                    className="px-3 py-1 bg-warning-100 text-warning-800 rounded-md text-sm"
                  >
                    Segna come Trigger
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <label className="label">Tag</label>
            <div className="flex items-center mb-2">
              <input
                type="text"
                className="input rounded-r-none"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Aggiungi tag (es. ansia, CBT, compiti)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTagToList();
                  }
                }}
              />
              <button
                type="button"
                onClick={addTagToList}
                className="bg-primary-600 text-white px-4 py-2 rounded-r-md hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((t, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/therapist/client/${actualClientId}`)}
              className="btn btn-outline"
              disabled={isSaving}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center"
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salva Nota'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Notes;