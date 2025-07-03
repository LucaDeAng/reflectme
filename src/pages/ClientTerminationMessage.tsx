import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useNavigate } from 'react-router-dom';

interface TherapistInfo {
  full_name: string;
  email: string;
  phone?: string;
  city: string;
  state: string;
  session_rate_min?: number;
  session_rate_max?: number;
  profile_image_url?: string;
}

export function ClientTerminationMessage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [therapistInfo, setTherapistInfo] = useState<TherapistInfo | null>(null);
  const [terminationReason, setTerminationReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkTerminationStatus();
    }
  }, [user]);

  const checkTerminationStatus = async () => {
    setIsLoading(true);
    try {
      // Check if user has a terminated relationship
      const { data: relationship, error } = await supabase
        .from('therapist_client_relationships')
        .select(`
          status,
          termination_reason,
          therapist_id,
          therapist_profiles!therapist_id (
            full_name,
            email,
            phone,
            city,
            state,
            session_rate_min,
            session_rate_max,
            profile_image_url
          )
        `)
        .eq('client_id', user?.id)
        .eq('status', 'terminated')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (relationship) {
        setTherapistInfo(relationship.therapist_profiles);
        setTerminationReason(relationship.termination_reason || '');
      } else {
        // No terminated relationship found, redirect to dashboard
        navigate('/client');
      }
    } catch (error) {
      console.error('Error checking termination status:', error);
      navigate('/client');
    } finally {
      setIsLoading(false);
    }
  };

  const contactTherapist = (method: 'email' | 'phone') => {
    if (!therapistInfo) return;

    if (method === 'email' && therapistInfo.email) {
      const subject = encodeURIComponent('Request to Reconnect - Therapy Sessions');
      const body = encodeURIComponent(
        `Hello ${therapistInfo.full_name},\n\n` +
        `I would like to discuss reconnecting for therapy sessions. ` +
        `Could we schedule a time to talk about continuing our therapeutic relationship?\n\n` +
        `Thank you,\n` +
        `${user?.user_metadata?.full_name || 'Client'}`
      );
      window.open(`mailto:${therapistInfo.email}?subject=${subject}&body=${body}`);
    } else if (method === 'phone' && therapistInfo.phone) {
      window.open(`tel:${therapistInfo.phone}`);
    }
  };

  const getProfileImage = (imageUrl?: string, name?: string) => {
    return imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '')}&background=e5e7eb&color=374151&size=200`;
  };

  const formatPriceRange = (min?: number, max?: number) => {
    if (!min || !max) return 'Contact for pricing';
    return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!therapistInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              No Issues Found
            </h2>
            <p className="text-gray-600 mb-6">
              Your therapy relationship appears to be active. You can continue using Zentia normally.
            </p>
            <Button onClick={() => navigate('/client')} className="w-full">
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Therapy Relationship Paused
          </h1>
          <p className="text-gray-600">
            Please reconnect with your therapist to continue using Zentia's full features
          </p>
        </div>

        {/* Reason Card */}
        {terminationReason && (
          <Card className="p-6 mb-6 bg-orange-50 border-orange-200">
            <h3 className="text-lg font-semibold text-orange-800 mb-2">
              📋 Status Update
            </h3>
            <p className="text-orange-700">
              {terminationReason}
            </p>
          </Card>
        )}

        {/* Therapist Information */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            👨‍⚕️ Your Therapist
          </h3>
          
          <div className="flex items-start space-x-4">
            <img
              src={getProfileImage(therapistInfo.profile_image_url, therapistInfo.full_name)}
              alt={therapistInfo.full_name}
              className="w-20 h-20 rounded-full object-cover"
            />
            <div className="flex-1">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                {therapistInfo.full_name}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                📍 {therapistInfo.city}, {therapistInfo.state}
              </p>
              <p className="text-sm text-gray-600 mb-3">
                💰 {formatPriceRange(therapistInfo.session_rate_min, therapistInfo.session_rate_max)}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => contactTherapist('email')}
                  className="flex-1"
                >
                  📧 Send Email
                </Button>
                {therapistInfo.phone && (
                  <Button
                    onClick={() => contactTherapist('phone')}
                    variant="outline"
                    className="flex-1"
                  >
                    📞 Call Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* What to Do Next */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🚀 What to Do Next
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Contact Your Therapist</h4>
                <p className="text-sm text-gray-600">
                  Reach out using the contact options above to discuss resuming your therapy sessions.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Schedule a Session</h4>
                <p className="text-sm text-gray-600">
                  Book a therapy session to reactivate your full access to Zentia's AI companion and tools.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Resume Your Journey</h4>
                <p className="text-sm text-gray-600">
                  Once reconnected, you'll regain full access to personalized AI support and therapy tools.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Alternative Options */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            💡 Alternative Options
          </h3>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Find a New Therapist</h4>
              <p className="text-sm text-blue-700 mb-2">
                If you'd prefer to work with someone new, browse our directory of verified therapists.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/therapists')}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Browse Therapists
              </Button>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Use Self-Help Tools</h4>
              <p className="text-sm text-blue-700 mb-2">
                Access limited self-help resources while you decide on your next steps.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/client')}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Limited Access
              </Button>
            </div>
          </div>
        </Card>

        {/* Support Contact */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@zentia.app" className="text-blue-600 hover:underline">
              support@zentia.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 