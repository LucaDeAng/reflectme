import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getAllDemoClientUUIDs, getClientDisplayName } from '../utils/clientUtils';
import { 
  Database, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Loader, 
  BarChart3,
  Calendar,
  Users,
  Shield,
  Key,
  Info
} from 'lucide-react';

const DataSeeder: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insertedCount, setInsertedCount] = useState(0);
  const [usingServiceRole, setUsingServiceRole] = useState(false);
  const [clientMethod, setClientMethod] = useState<'service' | 'regular'>('regular');

  // Get actual demo client UUIDs from clientUtils
  const DEMO_CLIENT_UUIDS = getAllDemoClientUUIDs();

  // Check if service role key is available
  const hasServiceRoleKey = () => {
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    return serviceRoleKey && serviceRoleKey.length > 10 && !serviceRoleKey.includes('your_service_role_key');
  };

  // Create admin client with service role key for bypassing RLS
  const createAdminClient = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing service role key configuration');
    }
    
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  };

  const generateMonitoringData = () => {
    const monitoringEntries = [];
    
    console.log(`📊 Generating data for ${DEMO_CLIENT_UUIDS.length} demo clients:`, DEMO_CLIENT_UUIDS);
    
    // Generate 14 days of data for each demo client
    for (let clientIndex = 0; clientIndex < DEMO_CLIENT_UUIDS.length; clientIndex++) {
      const clientId = DEMO_CLIENT_UUIDS[clientIndex];
      const clientName = getClientDisplayName(clientId);
      
      console.log(`👤 Generating data for ${clientName} (${clientId})`);
      
      for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
        const entryDate = new Date();
        entryDate.setDate(entryDate.getDate() - dayOffset);
        
        // Generate realistic but varied data
        const baseValue = clientIndex === 0 ? 7 : 6; // Client 1 slightly higher baseline
        const variation = Math.random() * 4 - 2; // -2 to +2 variation
        
        const moodRating = Math.max(1, Math.min(10, Math.round(baseValue + variation)));
        const energyLevel = Math.max(1, Math.min(10, Math.round(baseValue + variation * 0.8)));
        const sleepQuality = Math.max(1, Math.min(10, Math.round(baseValue + variation * 0.6)));
        const sleepHours = Math.max(4, Math.min(10, baseValue - 1 + (Math.random() * 2)));
        const exerciseMinutes = Math.random() > 0.3 ? Math.round(Math.random() * 60) : 0;
        const socialInteraction = Math.random() > 0.4;
        const stressLevel = Math.max(1, Math.min(10, Math.round(8 - moodRating + Math.random() * 2)));
        
        // Minimal sample data for development testing only
        const journalEntries = [
          'Today was a productive day.',
          'Feeling grateful for progress made.',
          'Practiced self-care today.'
        ];
        
        const gratitudeNotes = [
          'Grateful for support',
          'Thankful for growth',
          'Appreciative of learning'
        ];
        
        const taskNotes = [
          'Completed daily activity',
          'Practiced wellness technique',
          'Made healthy choice'
        ];
        
        const taskRemarks = [
          'Strategy was helpful today',
          'Building consistency gradually',
          'Positive effects noticed'
        ];
        
        const entry = {
          client_id: clientId,
          entry_date: entryDate.toISOString().split('T')[0],
          mood_rating: moodRating,
          energy_level: energyLevel,
          sleep_quality: sleepQuality,
          sleep_hours: Math.round(sleepHours * 10) / 10,
          exercise_minutes: exerciseMinutes,
          social_interaction: socialInteraction,
          stress_level: stressLevel,
          journal_entry: journalEntries[Math.floor(Math.random() * journalEntries.length)],
          gratitude_note: gratitudeNotes[Math.floor(Math.random() * gratitudeNotes.length)],
          task_notes: taskNotes[Math.floor(Math.random() * taskNotes.length)],
          task_remarks: taskRemarks[Math.floor(Math.random() * taskRemarks.length)]
        };
        
        monitoringEntries.push(entry);
      }
    }
    
    return monitoringEntries;
  };

  const seedMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setUsingServiceRole(false);
      
      if (DEMO_CLIENT_UUIDS.length === 0) {
        throw new Error('No valid demo client UUIDs found. Please check clientUtils configuration.');
      }
      
      let clientToUse = supabase;
      
      // Try to use service role key if available
      if (hasServiceRoleKey()) {
        try {
          console.log('🔐 Creating admin client with service role key...');
          clientToUse = createAdminClient();
          setUsingServiceRole(true);
          setClientMethod('service');
        } catch (error) {
          console.warn('⚠️ Failed to create admin client, falling back to regular client:', error);
          clientToUse = supabase;
          setClientMethod('regular');
        }
      } else {
        console.log('📝 Using regular Supabase client (no service role key available)');
        setClientMethod('regular');
      }
      
      console.log('🚀 Generating monitoring data...');
      const entries = generateMonitoringData();
      
      console.log(`📊 Inserting ${entries.length} monitoring entries...`);
      
      // Delete existing demo data first
      console.log('🗑️ Clearing existing demo data...');
      try {
        const { error: deleteError } = await clientToUse
          .from('monitoring_entries')
          .delete()
          .in('client_id', DEMO_CLIENT_UUIDS);
        
        if (deleteError && deleteError.code !== 'PGRST116') {
          console.warn('⚠️ Warning deleting existing data:', deleteError);
        }
      } catch (deleteError) {
        console.warn('⚠️ Could not delete existing data (might not exist):', deleteError);
      }
      
      // Insert new data in batches
      const batchSize = usingServiceRole ? 10 : 5; // Smaller batches for regular client
      let totalInserted = 0;
      let failedInserts = 0;
      
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        
        console.log(`📥 Inserting batch ${i / batchSize + 1}/${Math.ceil(entries.length / batchSize)}...`);
        
        try {
          const { data, error } = await clientToUse
            .from('monitoring_entries')
            .insert(batch)
            .select();
          
          if (error) {
            console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error);
            
            if (error.message?.includes('foreign key constraint')) {
              throw new Error(`Foreign key constraint violation. One or more client UUIDs don't exist in the profiles table: ${DEMO_CLIENT_UUIDS.join(', ')}`);
            }
            
            // For regular client, try individual inserts if batch fails
            if (!usingServiceRole) {
              console.log('🔄 Trying individual inserts for failed batch...');
              for (const entry of batch) {
                try {
                  const { error: singleError } = await clientToUse
                    .from('monitoring_entries')
                    .insert([entry])
                    .select();
                  
                  if (!singleError) {
                    totalInserted++;
                  } else {
                    failedInserts++;
                    console.warn('Single entry failed:', singleError.message);
                  }
                } catch (singleErr) {
                  failedInserts++;
                  console.warn('Single entry failed:', singleErr);
                }
              }
            } else {
              throw error;
            }
          } else {
            totalInserted += batch.length;
            console.log(`✅ Inserted batch ${i / batchSize + 1} (${batch.length} entries)`);
          }
        } catch (batchError) {
          console.error(`❌ Batch ${i / batchSize + 1} failed completely:`, batchError);
          if (usingServiceRole) {
            throw batchError;
          } else {
            failedInserts += batch.length;
          }
        }
      }
      
      setInsertedCount(totalInserted);
      
      if (totalInserted > 0) {
        setSuccess(true);
        console.log(`🎉 Successfully inserted ${totalInserted} monitoring entries!`);
        if (failedInserts > 0) {
          console.log(`⚠️ ${failedInserts} entries failed to insert due to permissions`);
        }
      } else {
        throw new Error('No entries were successfully inserted. Please check RLS policies and client UUIDs.');
      }
      
      // Verify the data was inserted
      try {
        const { data: verifyData, error: verifyError } = await clientToUse
          .from('monitoring_entries')
          .select('count(*)', { count: 'exact' })
          .in('client_id', DEMO_CLIENT_UUIDS);
        
        if (!verifyError) {
          console.log(`✅ Verification: ${verifyData?.[0]?.count || 0} total entries now exist for demo clients`);
        }
      } catch (verifyError) {
        console.warn('⚠️ Could not verify data insertion:', verifyError);
      }
      
    } catch (error: any) {
      console.error('❌ Error inserting monitoring data:', error);
      
      if (error.message?.includes('foreign key constraint')) {
        setError(`Foreign key constraint error: The demo client UUIDs don't exist in the profiles table.\n\nDemo client UUIDs being used:\n${DEMO_CLIENT_UUIDS.join('\n')}\n\nPlease ensure these profiles exist in the database.`);
      } else if (error.message?.includes('service_role') || error.message?.includes('service role')) {
        setError('Service role key configuration error. Please check that VITE_SUPABASE_SERVICE_ROLE_KEY is properly set in environment variables.');
      } else if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
        setError('Row Level Security (RLS) policy is blocking insertion. Try logging in as a therapist first, or check RLS configuration.');
      } else {
        setError(error.message || 'Failed to insert monitoring data');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-neutral-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Database className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Data Seeder</h1>
                          <p className="text-neutral-600">Generate sample monitoring data for analytics testing</p>
        </motion.div>

        {/* Service Role Status */}
        {usingServiceRole && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 card p-4 bg-success-50 border-success-200"
          >
            <div className="flex items-center text-success-700">
              <Key className="w-5 h-5 mr-2" />
              <span className="text-sm">
                Using service role key with admin privileges - RLS policies will be bypassed.
              </span>
            </div>
          </motion.div>
        )}

        {/* Regular Client Warning */}
        {!hasServiceRoleKey() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 card p-4 bg-warning-50 border-warning-200"
          >
            <div className="flex items-center text-warning-700">
              <Info className="w-5 h-5 mr-2" />
              <span className="text-sm">
                Service role key not configured. Using regular client - some inserts may fail due to RLS policies.
                Set VITE_SUPABASE_SERVICE_ROLE_KEY environment variable for full admin access.
              </span>
            </div>
          </motion.div>
        )}

        {/* Client Info */}
        <div className="mb-6 card p-4 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Demo Clients Configuration</h3>
          <div className="text-sm text-blue-800">
            <p><strong>Active Demo Clients:</strong> {DEMO_CLIENT_UUIDS.length}</p>
            <p><strong>Client Method:</strong> {hasServiceRoleKey() ? 'Service Role (Admin)' : 'Regular Client'}</p>
            <div className="mt-2 space-y-1">
              {DEMO_CLIENT_UUIDS.map((uuid, index) => (
                <div key={`client-${index}-${uuid}`} className="font-mono text-xs">
                  {getClientDisplayName(uuid)}: {uuid}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6 text-center"
          >
            <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-neutral-900 mb-1">{DEMO_CLIENT_UUIDS.length} Demo Clients</h3>
            <p className="text-sm text-neutral-600">Sample data for existing profiles</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6 text-center"
          >
            <Calendar className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-neutral-900 mb-1">14 Days</h3>
            <p className="text-sm text-neutral-600">Two weeks of monitoring entries</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6 text-center"
          >
            <BarChart3 className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-neutral-900 mb-1">Rich Data</h3>
            <p className="text-sm text-neutral-600">Mood, sleep, exercise, notes & more</p>
          </motion.div>
        </div>

        {/* Main Action Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-8 text-center"
        >
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            Generate Monitoring Data
          </h2>
          
          <p className="text-neutral-600 mb-6">
            This will create {DEMO_CLIENT_UUIDS.length * 14} monitoring entries (14 days × {DEMO_CLIENT_UUIDS.length} clients) with realistic 
            mood ratings, sleep data, exercise minutes, journal entries, and task notes.
            <br />
            <strong>Method: {hasServiceRoleKey() ? 'Service Role (bypasses RLS)' : 'Regular Client (subject to RLS)'}</strong>
          </p>
          
          {!success && !loading && (
            <button
              onClick={seedMonitoringData}
              className="btn btn-primary btn-lg"
              disabled={loading || DEMO_CLIENT_UUIDS.length === 0}
            >
              <Play className="w-5 h-5 mr-2" />
              Generate Sample Data
            </button>
          )}
          
          {loading && (
            <div className="flex items-center justify-center">
              <Loader className="w-6 h-6 animate-spin text-blue-600 mr-3" />
              <span className="text-neutral-700">
                Inserting data{usingServiceRole ? ' with admin privileges' : ' with regular permissions'}...
              </span>
            </div>
          )}
          
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-success-50 border border-success-200 rounded-lg p-6"
            >
              <CheckCircle className="w-12 h-12 text-success-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-success-900 mb-2">
                Data Successfully Generated!
              </h3>
              <p className="text-success-700 mb-4">
                Inserted {insertedCount} monitoring entries for demo clients using {clientMethod === 'service' ? 'service role privileges' : 'regular client'}.
              </p>
              <div className="flex justify-center space-x-4">
                <a
                  href="/phase4-test"
                  className="btn btn-success"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics Demo
                </a>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setInsertedCount(0);
                    setUsingServiceRole(false);
                  }}
                  className="btn btn-outline"
                >
                  Generate Again
                </button>
              </div>
            </motion.div>
          )}
          
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-error-50 border border-error-200 rounded-lg p-6"
            >
              <AlertTriangle className="w-12 h-12 text-error-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-error-900 mb-2">
                Error Generating Data
              </h3>
              <div className="text-error-700 mb-4 text-left">
                <pre className="whitespace-pre-wrap text-xs bg-error-100 p-3 rounded">
                  {error}
                </pre>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  setSuccess(false);
                  setUsingServiceRole(false);
                }}
                className="btn btn-error"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Data Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 card p-6"
        >
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            What Data Will Be Generated?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-neutral-900 mb-2">Quantitative Metrics</h4>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• Mood rating (1-10 scale)</li>
                <li>• Energy level (1-10 scale)</li>
                <li>• Sleep quality (1-10 scale)</li>
                <li>• Sleep hours (4-10 hours)</li>
                <li>• Exercise minutes (0-60 minutes)</li>
                <li>• Social interaction (yes/no)</li>
                <li>• Stress level (1-10 scale)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-neutral-900 mb-2">Qualitative Data</h4>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• Journal entries with realistic content</li>
                <li>• Gratitude notes and reflections</li>
                <li>• Task completion notes</li>
                <li>• Progress remarks and observations</li>
                <li>• Coping strategy usage reports</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 card p-6 bg-blue-50 border-blue-200"
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security Information
          </h3>
          
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Service Role Key Usage:</strong> When available, this seeder uses the service role key to bypass 
              Row Level Security (RLS) policies for data insertion. This is intended for development 
              and testing purposes only.
            </p>
            <p>
              <strong>Fallback Mode:</strong> If service role key is not configured, the seeder will use 
              regular Supabase client with current user permissions. Some entries may fail due to RLS policies.
            </p>
            <p>
              <strong>Production Note:</strong> In production environments, proper authentication 
              and authorization should be used instead of bypassing RLS policies.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DataSeeder; 