import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

interface Invitation {
  id: string;
  therapist_id: string;
  email: string;
  client_name?: string;
  status: string;
  expires_at: string;
  therapist_profile?: {
    full_name: string;
    bio: string;
    specializations: string[];
    city: string;
    state: string;
    profile_image_url?: string;
  };
}

export function ClientInviteAcceptance() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [clientInfo, setClientInfo] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
  });

  useEffect(() => {
    if (inviteCode) {
      fetchInvitation();
    }
  }, [inviteCode]);

  const fetchInvitation = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_invitations')
        .select(`
          *,
          therapist_profile:therapist_profiles!therapist_id (
            full_name,
            bio,
            specializations,
            city,
            state,
            profile_image_url
          )
        `)
        .eq('invitation_code', inviteCode)
        .single();

      if (error) throw error;

      setInvitation(data);
      
      // Check if invitation is expired
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      setIsExpired(now > expiresAt);

      // Pre-fill client info if available
      if (data.email) {
        setClientInfo(prev => ({ ...prev, email: data.email }));
      }
      if (data.client_name) {
        setClientInfo(prev => ({ ...prev, full_name: data.client_name }));
      }

    } catch (error) {
      console.error('Error fetching invitation:', error);
      toast.error('Invalid or expired invitation link');
    } finally {
      setIsLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!invitation) return;

    if (!clientInfo.email || !clientInfo.password || !clientInfo.full_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsAccepting(true);
    try {
      // 1. Register user if not already logged in
      let clientUserId = user?.id;
      
      if (!user) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: clientInfo.email,
          password: clientInfo.password,
          options: {
            data: {
              full_name: clientInfo.full_name,
              user_type: 'client',
            }
          }
        });

        if (authError) throw authError;
        clientUserId = authData.user?.id;
      }

      if (!clientUserId) throw new Error('Failed to create user account');

      // 2. Create therapist-client relationship
      const { error: relationshipError } = await supabase
        .from('therapist_client_relationships')
        .insert({
          therapist_id: invitation.therapist_id,
          client_id: clientUserId,
          status: 'active',
          relationship_type: 'therapy',
          is_billable: true,
          invitation_id: invitation.id,
          onboarded_at: new Date().toISOString(),
        });

      if (relationshipError) throw relationshipError;

      // 3. Update invitation status
      const { error: inviteError } = await supabase
        .from('client_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      if (inviteError) throw inviteError;

      toast.success('Successfully connected with your therapist!');
      
      // Redirect to client dashboard
      setTimeout(() => {
        navigate('/patient/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const getProfileImage = (imageUrl?: string, name?: string) => {
    return imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '')}&background=e5e7eb&color=374151&size=200`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Invalid Invitation
            </h2>
            <p className="text-gray-600 mb-6">
              This invitation link is invalid or has been used already.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Homepage
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isExpired || invitation.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Invitation Expired
            </h2>
            <p className="text-gray-600 mb-6">
              This invitation has expired or has already been used. 
              Please contact your therapist for a new invitation.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Homepage
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 You're Invited to Zentia!
          </h1>
          <p className="text-gray-600">
            Your therapist has invited you to start your mental health journey
          </p>
        </div>

        {/* Therapist Information */}
        <Card className="p-6 mb-6">
          <div className="flex items-start space-x-4">
            <img
              src={getProfileImage(invitation.therapist_profile?.profile_image_url, invitation.therapist_profile?.full_name)}
              alt={invitation.therapist_profile?.full_name}
              className="w-20 h-20 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {invitation.therapist_profile?.full_name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                📍 {invitation.therapist_profile?.city}, {invitation.therapist_profile?.state}
              </p>
              
              {invitation.therapist_profile?.specializations && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {invitation.therapist_profile.specializations.slice(0, 3).map((spec, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800 text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-sm text-gray-700 line-clamp-2">
                {invitation.therapist_profile?.bio}
              </p>
            </div>
          </div>
        </Card>

        {/* Registration Form */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Complete Your Registration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={clientInfo.full_name}
                onChange={(e) => setClientInfo({ ...clientInfo, full_name: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={clientInfo.email}
                onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                disabled={!!invitation.email}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+91 98765 43210"
                value={clientInfo.phone}
                onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
              />
            </div>
            
            {!user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <Input
                  type="password"
                  placeholder="Create a secure password"
                  value={clientInfo.password}
                  onChange={(e) => setClientInfo({ ...clientInfo, password: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 6 characters
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">What happens next?</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>✅ You'll be connected with {invitation.therapist_profile?.full_name}</li>
              <li>✅ Access to secure messaging and session booking</li>
              <li>✅ AI-powered mental health insights and tools</li>
              <li>✅ Private and confidential therapy sessions</li>
            </ul>
          </div>

          <Button
            onClick={acceptInvitation}
            disabled={isAccepting || !clientInfo.email || !clientInfo.full_name || (!user && !clientInfo.password)}
            className="w-full mt-6"
          >
            {isAccepting ? 'Connecting...' : '🚀 Accept Invitation & Start Journey'}
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
            By accepting, you agree to our Terms of Service and Privacy Policy
          </p>
        </Card>

        {/* Security Notice */}
        <Card className="p-4 mt-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="text-blue-600 text-xl">🔒</div>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Your Privacy is Protected</h4>
              <p className="text-sm text-blue-700">
                All communications are encrypted and HIPAA-compliant. Your therapy journey is completely confidential.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 