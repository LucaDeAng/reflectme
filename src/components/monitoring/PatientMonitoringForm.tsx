import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { MonitoringFormData } from '../../types/monitoring';
import { 
  Droplets, 
  Sun, 
  Utensils, 
  Activity, 
  Moon, 
  Users, 
  FileText, 
  MessageSquare,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { convertToUUID } from '../../services/mcpService';

interface PatientMonitoringFormProps {
  onSubmitSuccess?: () => void;
  className?: string;
}

export const PatientMonitoringForm: React.FC<PatientMonitoringFormProps> = ({
  onSubmitSuccess,
  className = ''
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<MonitoringFormData>({
    defaultValues: {
      waterIntake: 5,
      sunlightExposure: 5,
      healthyMeals: 5,
      exerciseDuration: 'none',
      sleepHours: 7,
      socialInteractions: 5,
      taskNotes: '',
      taskRemarks: '',
      date: new Date()
    },
    mode: 'onChange'
  });

  const onSubmit = async (data: MonitoringFormData) => {
    if (!user) {
      setErrorMessage('User not authenticated');
      setSubmitStatus('error');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitStatus('idle');
      setErrorMessage('');

      const userUUID = convertToUUID(user.id);

      // Map exercise duration to minutes
      const getExerciseMinutes = (duration: string): number => {
        switch (duration) {
          case 'none': return 0;
          case 'under15': return 10;
          case 'under30': return 22;
          case 'above30': return 45;
          default: return 0;
        }
      };

      // Create monitoring entry for Supabase
      const monitoringEntry = {
        client_id: userUUID,
        mood_rating: data.waterIntake, // Using water intake as proxy for mood
        energy_level: data.sunlightExposure,
        sleep_quality: data.sleepHours,
        stress_level: Math.max(1, 11 - data.socialInteractions), // Inverse of social interactions
        anxiety_level: Math.max(1, 11 - data.healthyMeals), // Inverse of healthy meals
        sleep_hours: data.sleepHours,
        exercise_minutes: getExerciseMinutes(data.exerciseDuration),
        social_interaction: data.socialInteractions > 5,
        journal_entry: data.taskNotes || null,
        gratitude_note: data.taskRemarks || null,
        task_notes: data.taskNotes || null,
        task_remarks: data.taskRemarks || null,
        entry_date: data.date.toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };

      console.log('💾 Saving monitoring entry to Supabase:', monitoringEntry);

      // Save to Supabase monitoring_entries table
      const { data: savedEntry, error } = await supabase
        .from('monitoring_entries')
        .insert(monitoringEntry)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw new Error(`Failed to save monitoring data: ${error.message}`);
      }

      console.log('✅ Monitoring entry saved successfully:', savedEntry);

      // Also save individual mood entry for historical tracking
      const moodEntry = {
        user_id: userUUID,
        mood_score: data.waterIntake,
        trigger: data.taskNotes ? 'daily_monitoring' : null,
        notes: data.taskRemarks || null,
        created_at: new Date().toISOString()
      };

      const { error: moodError } = await supabase
        .from('mood_entries')
        .insert(moodEntry);

      if (moodError) {
        console.warn('⚠️ Could not save mood entry:', moodError);
        // Don't fail the whole operation for this
      } else {
        console.log('✅ Mood entry also saved');
      }

      setSubmitStatus('success');
      reset();
      onSubmitSuccess?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSubmitStatus('idle'), 3000);

    } catch (error) {
      console.error('❌ Error submitting monitoring form:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit monitoring data');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ScaleInput: React.FC<{
    name: keyof MonitoringFormData;
    label: string;
    icon: React.ReactNode;
    description: string;
    control: any;
    errors: any;
  }> = ({ name, label, icon, description, control, errors }) => (
    <div className="space-y-3">
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
          {icon}
        </div>
        <div>
          <label className="font-medium text-neutral-900">{label}</label>
          <p className="text-sm text-neutral-600">{description}</p>
        </div>
      </div>
      
      <Controller
        name={name}
        control={control}
        rules={{ required: `${label} is required`, min: 0, max: 10 }}
        render={({ field }) => (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-neutral-500">
              <span>Poor (0)</span>
              <span>Excellent (10)</span>
            </div>
            <div className="flex space-x-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => field.onChange(value)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                    field.value === value
                      ? 'bg-primary-600 text-white shadow-lg scale-110'
                      : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="text-center">
              <span className="text-lg font-semibold text-primary-600">
                {field.value}/10
              </span>
            </div>
          </div>
        )}
      />
      {errors[name] && (
        <p className="text-error-600 text-sm">{errors[name]?.message}</p>
      )}
    </div>
  );

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-white">
        <h2 className="text-xl font-semibold mb-2">Daily Wellness Check-in</h2>
        <p className="text-primary-100">Track your daily wellness activities and mood</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
        {/* Status Messages */}
        {submitStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-success-50 border border-success-200 rounded-lg p-4 flex items-center"
          >
            <CheckCircle className="w-5 h-5 text-success-600 mr-2" />
            <span className="text-success-800">Wellness check-in submitted successfully!</span>
          </motion.div>
        )}

        {submitStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-error-50 border border-error-200 rounded-lg p-4 flex items-center"
          >
            <AlertCircle className="w-5 h-5 text-error-600 mr-2" />
            <span className="text-error-800">{errorMessage}</span>
          </motion.div>
        )}

        {/* Date Selection */}
        <div className="space-y-3">
          <label className="font-medium text-neutral-900">Date</label>
          <Controller
            name="date"
            control={control}
            rules={{ required: 'Date is required' }}
            render={({ field }) => (
              <input
                type="date"
                value={field.value.toISOString().split('T')[0]}
                onChange={(e) => field.onChange(new Date(e.target.value))}
                className="input"
                max={new Date().toISOString().split('T')[0]}
              />
            )}
          />
        </div>

        {/* Wellness Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ScaleInput
            name="waterIntake"
            label="Water Intake"
            icon={<Droplets className="w-4 h-4 text-primary-600" />}
            description="How well did you stay hydrated today?"
            control={control}
            errors={errors}
          />

          <ScaleInput
            name="sunlightExposure"
            label="Sunlight Exposure"
            icon={<Sun className="w-4 h-4 text-primary-600" />}
            description="How much natural sunlight did you get?"
            control={control}
            errors={errors}
          />

          <ScaleInput
            name="healthyMeals"
            label="Healthy Meals"
            icon={<Utensils className="w-4 h-4 text-primary-600" />}
            description="How nutritious were your meals today?"
            control={control}
            errors={errors}
          />

          <ScaleInput
            name="sleepHours"
            label="Sleep Quality"
            icon={<Moon className="w-4 h-4 text-primary-600" />}
            description="How well did you sleep last night?"
            control={control}
            errors={errors}
          />

          <ScaleInput
            name="socialInteractions"
            label="Social Interactions"
            icon={<Users className="w-4 h-4 text-primary-600" />}
            description="How meaningful were your social connections?"
            control={control}
            errors={errors}
          />
        </div>

        {/* Exercise Duration */}
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
              <Activity className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <label className="font-medium text-neutral-900">Exercise Duration</label>
              <p className="text-sm text-neutral-600">How long did you exercise today?</p>
            </div>
          </div>
          
          <Controller
            name="exerciseDuration"
            control={control}
            rules={{ required: 'Exercise duration is required' }}
            render={({ field }) => (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'none', label: 'No Exercise' },
                  { value: 'under15', label: 'Under 15 min' },
                  { value: 'under30', label: '15-30 min' },
                  { value: 'above30', label: '30+ min' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => field.onChange(option.value)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      field.value === option.value
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-neutral-300 text-neutral-700 hover:border-primary-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          />
          {errors.exerciseDuration && (
            <p className="text-error-600 text-sm">{errors.exerciseDuration.message}</p>
          )}
        </div>

        {/* Task Notes */}
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
              <FileText className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <label className="font-medium text-neutral-900">Task Notes</label>
              <p className="text-sm text-neutral-600">Any specific tasks or goals you worked on today?</p>
            </div>
          </div>
          
          <Controller
            name="taskNotes"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                className="textarea min-h-[100px]"
                placeholder="Describe any therapeutic tasks, homework, or goals you focused on today..."
              />
            )}
          />
        </div>

        {/* Task Remarks */}
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
              <MessageSquare className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <label className="font-medium text-neutral-900">Additional Remarks</label>
              <p className="text-sm text-neutral-600">Any other thoughts or observations about your day?</p>
            </div>
          </div>
          
          <Controller
            name="taskRemarks"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                className="textarea min-h-[100px]"
                placeholder="Share any additional thoughts, feelings, or observations about your wellness today..."
              />
            )}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t border-neutral-200">
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="btn btn-primary min-w-[150px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Submit Check-in
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};