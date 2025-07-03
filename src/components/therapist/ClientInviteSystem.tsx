import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'react-hot-toast';

interface Invitation {
  id: string;
  email: string;
  invitation_code: string;
  invitation_url: string;
  client_name?: string;
  status: 'pending' | 'accepted' | 'expired' | 'canceled';
  invited_at: string;
  accepted_at?: string;
  expires_at: string;
}

interface TherapistProfile {
  id: string;
  active_clients_count: number;
  max_free_clients: number;
  subscription_status: string;
}

export function ClientInviteSystem() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [therapistProfile, setTherapistProfile] = useState<TherapistProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newInvite, setNewInvite] = useState({
    email: '',
    client_name: '',
  });

  useEffect(() => {
    if (user) {
      fetchTherapistProfile();
      fetchInvitations();
    }
  }, [user]);

  const fetchTherapistProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('therapist_profiles')
        .select('id, active_clients_count, max_free_clients, subscription_status')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setTherapistProfile(data);
    } catch (error) {
      console.error('Error fetching therapist profile:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      const { data: profile } = await supabase
        .from('therapist_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('client_invitations')
        .select('*')
        .eq('therapist_id', profile.id)
        .order('invited_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const generateInvitationCode = () => {
    return 'INV-' + Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  const sendInvitation = async () => {
    if (!newInvite.email || !newInvite.client_name) {
      toast.error('Please fill in all fields');
      return;
    }

    // Check billing limits
    if (therapistProfile) {
      const willExceedLimit = therapistProfile.active_clients_count >= therapistProfile.max_free_clients;
      const isFreeTier = therapistProfile.subscription_status === 'free';
      
      if (willExceedLimit && isFreeTier) {
        const shouldProceed = window.confirm(
          `You have ${therapistProfile.active_clients_count} clients (limit: ${therapistProfile.max_free_clients} free). ` +
          'Adding more clients will incur charges of ₹5/month per additional client. Continue?'
        );
        if (!shouldProceed) return;
      }
    }

    setIsLoading(true);
    try {
      const { data: profile } = await supabase
        .from('therapist_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) throw new Error('Therapist profile not found');

      const invitationCode = generateInvitationCode();
      const invitationUrl = `${window.location.origin}/invite/${invitationCode}`;

      const { error } = await supabase
        .from('client_invitations')
        .insert({
          therapist_id: profile.id,
          email: newInvite.email,
          client_name: newInvite.client_name,
          invitation_code: invitationCode,
          invitation_url: invitationUrl,
        });

      if (error) throw error;

      toast.success('Invitation sent successfully!');
      setNewInvite({ email: '', client_name: '' });
      fetchInvitations();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('client_invitations')
        .update({ status: 'canceled' })
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Invitation canceled');
      fetchInvitations();
    } catch (error) {
      console.error('Error canceling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  const copyInvitationLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Invitation link copied to clipboard!');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      canceled: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRemainingFreeSlots = () => {
    if (!therapistProfile) return 0;
    return Math.max(0, therapistProfile.max_free_clients - therapistProfile.active_clients_count);
  };

  return (
    <div className="space-y-6">
      {/* Billing Status Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Client Management</h3>
            <p className="text-sm text-gray-600 mt-1">
              Active Clients: <span className="font-medium">{therapistProfile?.active_clients_count || 0}</span>
              {' '} • Free Slots: <span className="font-medium">{getRemainingFreeSlots()}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Current Plan</div>
            <Badge className="bg-blue-100 text-blue-800">
              {therapistProfile?.subscription_status === 'free' ? 'Freemium' : 'Paid'}
            </Badge>
          </div>
        </div>
        
        {therapistProfile && therapistProfile.active_clients_count > therapistProfile.max_free_clients && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              💰 You have {therapistProfile.active_clients_count - therapistProfile.max_free_clients} billable clients. 
              Monthly charge: ₹{(therapistProfile.active_clients_count - therapistProfile.max_free_clients) * 5}
            </p>
          </div>
        )}
      </Card>

      {/* Invite New Client */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Invite New Client</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Name
            </label>
            <Input
              type="text"
              placeholder="Enter client's full name"
              value={newInvite.client_name}
              onChange={(e) => setNewInvite({ ...newInvite, client_name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="client@example.com"
              value={newInvite.email}
              onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
            />
          </div>
        </div>

        <Button 
          onClick={sendInvitation} 
          disabled={isLoading || !newInvite.email || !newInvite.client_name}
          className="w-full md:w-auto"
        >
          {isLoading ? 'Sending...' : '📧 Send Invitation'}
        </Button>
      </Card>

      {/* Invitations List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Sent Invitations</h3>
        
        {invitations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No invitations sent yet.</p>
            <p className="text-sm">Send your first client invitation above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {invitation.client_name || 'Unknown Client'}
                      </h4>
                      {getStatusBadge(invitation.status)}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">
                      📧 {invitation.email}
                    </p>
                    
                    <p className="text-xs text-gray-500">
                      Sent: {new Date(invitation.invited_at).toLocaleDateString()} • 
                      Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                    
                    {invitation.accepted_at && (
                      <p className="text-xs text-green-600 mt-1">
                        ✅ Accepted: {new Date(invitation.accepted_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {invitation.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyInvitationLink(invitation.invitation_url)}
                        >
                          📋 Copy Link
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelInvitation(invitation.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          ❌ Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
} 