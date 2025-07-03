import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../contexts/ZentiaContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ClientInviteSystem } from '../../components/therapist/ClientInviteSystem';
import { ClientManagementSystem } from '../../components/therapist/ClientManagementSystem';
import { BillingDashboard } from '../../components/therapist/BillingDashboard';
import { toast } from 'react-hot-toast';

interface TherapistProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  bio: string;
  specializations: string[];
  city: string;
  state: string;
  years_experience: number;
  session_rate_min?: number;
  session_rate_max?: number;
  languages: string[];
  education?: string[];
  certifications?: string[];
  license_number?: string;
  license_state?: string;
  website_url?: string;
  linkedin_url?: string;
  is_public: boolean;
  accepts_new_clients: boolean;
  verification_status: string;
  active_clients_count: number;
  max_free_clients: number;
  subscription_status: string;
  slug: string;
}

const activeTab = {
  profile: 'Profile',
  invite: 'Invite Clients', 
  manage: 'Manage Clients',
  billing: 'Billing',
  referrals: 'Referrals'
};

export function TherapistProfileManagement() {
  const { supabase, user } = useSupabase();
  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState('profile');
  const [directoryStats, setDirectoryStats] = useState({
    profile_views: 0,
    monthly_views: 0,
    clients_from_directory: 0,
    conversion_rate: 0,
  });

  const specializations = [
    'Anxiety Disorders',
    'Depression',
    'Trauma Therapy',
    'PTSD',
    'Couples Therapy',
    'Family Therapy',
    'Child Psychology',
    'Adolescent Therapy',
    'Addiction Counseling',
    'CBT',
    'DBT',
    'EMDR',
    'Mindfulness',
    'Stress Management',
    'Eating Disorders',
    'Grief Counseling',
    'Career Counseling',
    'Life Coaching'
  ];

  const languages = [
    'English',
    'Hindi',
    'Tamil',
    'Telugu',
    'Bengali',
    'Marathi',
    'Gujarati',
    'Kannada',
    'Malayalam',
    'Punjabi',
    'Urdu'
  ];

  const indianStates = [
    'Maharashtra',
    'Delhi',
    'Karnataka',
    'Gujarat',
    'Tamil Nadu',
    'West Bengal',
    'Rajasthan',
    'Madhya Pradesh',
    'Uttar Pradesh',
    'Kerala',
    'Punjab',
    'Haryana'
  ];

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchDirectoryStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('therapist_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile(data);
      } else {
        // Create initial profile
        const newProfile = {
          user_id: user?.id,
          full_name: user?.user_metadata?.full_name || '',
          email: user?.email || '',
          bio: '',
          specializations: [],
          city: '',
          state: '',
          years_experience: 0,
          languages: ['English'],
          is_public: false,
          accepts_new_clients: true,
        };

        const { data: created, error: createError } = await supabase
          .from('therapist_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) throw createError;
        setProfile(created);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDirectoryStats = async () => {
    try {
      const { data: profile } = await supabase
        .from('therapist_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('therapist_directory_stats')
        .select('*')
        .eq('therapist_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setDirectoryStats(data);
      }
    } catch (error) {
      console.error('Error fetching directory stats:', error);
    }
  };

  const updateProfile = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('therapist_profiles')
        .update(profile)
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSpecialization = (spec: string) => {
    if (!profile) return;
    
    const newSpecs = profile.specializations.includes(spec)
      ? profile.specializations.filter(s => s !== spec)
      : [...profile.specializations, spec];
    
    setProfile({ ...profile, specializations: newSpecs });
  };

  const toggleLanguage = (lang: string) => {
    if (!profile) return;
    
    const newLangs = profile.languages.includes(lang)
      ? profile.languages.filter(l => l !== lang)
      : [...profile.languages, lang];
    
    setProfile({ ...profile, languages: newLangs });
  };

  const copyReferralLink = () => {
    if (!profile?.slug) return;
    
    const referralUrl = `${window.location.origin}/therapists/${profile.slug}`;
    navigator.clipboard.writeText(referralUrl);
    toast.success('Referral link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Profile Setup Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please complete your therapist profile to start using the platform.
            </p>
            <Button onClick={fetchProfile}>
              Create Profile
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Therapist Dashboard
        </h1>
        <p className="text-gray-600">
          Manage your profile, clients, and billing from one place
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {profile.active_clients_count}
          </div>
          <div className="text-sm text-gray-600">Active Clients</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {directoryStats.profile_views}
          </div>
          <div className="text-sm text-gray-600">Profile Views</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {directoryStats.clients_from_directory}
          </div>
          <div className="text-sm text-gray-600">Clients from Directory</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {profile.verification_status === 'verified' ? '✅' : '⏳'}
          </div>
          <div className="text-sm text-gray-600">
            {profile.verification_status === 'verified' ? 'Verified' : 'Pending'}
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {Object.entries(activeTab).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCurrentTab(key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {currentTab === 'profile' && (
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <Input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <Input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <Input
                  type="number"
                  min="0"
                  value={profile.years_experience}
                  onChange={(e) => setProfile({ ...profile, years_experience: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell potential clients about your approach, experience, and specialties..."
              />
            </div>
          </Card>

          {/* Location */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <Input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                >
                  <option value="">Select State</option>
                  {indianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Specializations */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Specializations</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {specializations.map(spec => (
                <label key={spec} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={profile.specializations.includes(spec)}
                    onChange={() => toggleSpecialization(spec)}
                    className="rounded"
                  />
                  <span className="text-sm">{spec}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Languages */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Languages</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {languages.map(lang => (
                <label key={lang} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={profile.languages.includes(lang)}
                    onChange={() => toggleLanguage(lang)}
                    className="rounded"
                  />
                  <span className="text-sm">{lang}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Pricing */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Pricing</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rate (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={profile.session_rate_min || ''}
                  onChange={(e) => setProfile({ ...profile, session_rate_min: parseInt(e.target.value) || undefined })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Rate (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={profile.session_rate_max || ''}
                  onChange={(e) => setProfile({ ...profile, session_rate_max: parseInt(e.target.value) || undefined })}
                />
              </div>
            </div>
          </Card>

          {/* Directory Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Directory Settings</h3>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={profile.is_public}
                  onChange={(e) => setProfile({ ...profile, is_public: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Show my profile in public directory</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={profile.accepts_new_clients}
                  onChange={(e) => setProfile({ ...profile, accepts_new_clients: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Currently accepting new clients</span>
              </label>
            </div>
          </Card>

          <Button onClick={updateProfile} disabled={isSaving} className="w-full md:w-auto">
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      )}

      {currentTab === 'invite' && <ClientInviteSystem />}
      {currentTab === 'manage' && <ClientManagementSystem />}
      {currentTab === 'billing' && <BillingDashboard />}

      {currentTab === 'referrals' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 Your Referral Profile</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-800 mb-2">Public Profile URL</h4>
              <div className="flex items-center space-x-3">
                <code className="flex-1 text-sm bg-white p-2 rounded border">
                  {window.location.origin}/therapists/{profile.slug}
                </code>
                <Button size="sm" onClick={copyReferralLink}>
                  📋 Copy
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {directoryStats.profile_views}
                </div>
                <div className="text-sm text-gray-600">Total Views</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {directoryStats.monthly_views}
                </div>
                <div className="text-sm text-gray-600">This Month</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {directoryStats.clients_from_directory}
                </div>
                <div className="text-sm text-gray-600">Clients Acquired</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {directoryStats.conversion_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Conversion Rate</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 SEO Benefits</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-800 mb-2">What you get:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✅ Professional profile on zentia.app</li>
                  <li>✅ SEO-optimized page for Google ranking</li>
                  <li>✅ Local search visibility in your city</li>
                  <li>✅ Specialization-based client matching</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-green-800 mb-2">How to improve:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>📝 Complete your profile with detailed bio</li>
                  <li>🎯 Add relevant specializations</li>
                  <li>📷 Upload professional profile photo</li>
                  <li>⭐ Encourage client reviews</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 