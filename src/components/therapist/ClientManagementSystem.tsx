import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { toast } from 'react-hot-toast';

interface ClientRelationship {
  id: string;
  client_id: string;
  status: 'active' | 'paused' | 'terminated';
  relationship_type: string;
  is_billable: boolean;
  last_session_date?: string;
  total_sessions: number;
  session_rate?: number;
  onboarded_at?: string;
  paused_at?: string;
  paused_reason?: string;
  terminated_at?: string;
  termination_reason?: string;
  created_at: string;
  // Client info from profiles table
  client_email?: string;
  client_name?: string;
}

interface BillingInfo {
  active_clients_count: number;
  billable_clients_count: number;
  free_clients_count: number;
  total_amount: number;
  max_free_clients: number;
}

export function ClientManagementSystem() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientRelationship[]>([]);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'pause' | 'terminate' | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (user) {
      fetchClientRelationships();
      fetchBillingInfo();
    }
  }, [user]);

  const fetchClientRelationships = async () => {
    try {
      const { data: profile } = await supabase
        .from('therapist_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) return;

      // Get client relationships with user profiles
      const { data, error } = await supabase
        .from('therapist_client_relationships')
        .select(`
          *
        `)
        .eq('therapist_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching client relationships:', error);
    }
  };

  const fetchBillingInfo = async () => {
    try {
      const { data: profile } = await supabase
        .from('therapist_profiles')
        .select('id, active_clients_count, max_free_clients')
        .eq('user_id', user?.id)
        .single();

      if (!profile) return;

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data: billing } = await supabase
        .from('therapist_billing')
        .select('*')
        .eq('therapist_id', profile.id)
        .eq('billing_month', currentMonth)
        .eq('billing_year', currentYear)
        .single();

      setBillingInfo({
        active_clients_count: profile.active_clients_count,
        billable_clients_count: billing?.billable_clients_count || 0,
        free_clients_count: billing?.free_clients_count || 0,
        total_amount: billing?.total_amount || 0,
        max_free_clients: profile.max_free_clients,
      });
    } catch (error) {
      console.error('Error fetching billing info:', error);
    }
  };

  const pauseClient = async (clientId: string, reason: string) => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for pausing the client');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('therapist_client_relationships')
        .update({
          status: 'paused',
          paused_at: new Date().toISOString(),
          paused_reason: reason,
          is_billable: false, // Stop billing when paused
        })
        .eq('id', clientId);

      if (error) throw error;

      toast.success('Client relationship paused successfully');
      setSelectedClient(null);
      setActionType(null);
      setReason('');
      fetchClientRelationships();
      fetchBillingInfo();
    } catch (error) {
      console.error('Error pausing client:', error);
      toast.error('Failed to pause client relationship');
    } finally {
      setIsLoading(false);
    }
  };

  const terminateClient = async (clientId: string, reason: string) => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for terminating the client');
      return;
    }

    const confirmTermination = window.confirm(
      'Are you sure you want to terminate this client relationship? This action cannot be undone.'
    );

    if (!confirmTermination) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('therapist_client_relationships')
        .update({
          status: 'terminated',
          terminated_at: new Date().toISOString(),
          termination_reason: reason,
          is_billable: false, // Stop billing when terminated
        })
        .eq('id', clientId);

      if (error) throw error;

      toast.success('Client relationship terminated successfully');
      setSelectedClient(null);
      setActionType(null);
      setReason('');
      fetchClientRelationships();
      fetchBillingInfo();
    } catch (error) {
      console.error('Error terminating client:', error);
      toast.error('Failed to terminate client relationship');
    } finally {
      setIsLoading(false);
    }
  };

  const reactivateClient = async (clientId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('therapist_client_relationships')
        .update({
          status: 'active',
          is_billable: true,
          paused_at: null,
          paused_reason: null,
        })
        .eq('id', clientId);

      if (error) throw error;

      toast.success('Client relationship reactivated successfully');
      fetchClientRelationships();
      fetchBillingInfo();
    } catch (error) {
      console.error('Error reactivating client:', error);
      toast.error('Failed to reactivate client relationship');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      terminated: 'bg-red-100 text-red-800',
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.active}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Billing Overview */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Billing Overview</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {billingInfo?.active_clients_count || 0}
            </div>
            <div className="text-sm text-gray-600">Active Clients</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {billingInfo?.free_clients_count || 0}
            </div>
            <div className="text-sm text-gray-600">Free Clients</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {billingInfo?.billable_clients_count || 0}
            </div>
            <div className="text-sm text-gray-600">Billable Clients</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {billingInfo ? formatCurrency(billingInfo.total_amount) : '₹0.00'}
            </div>
            <div className="text-sm text-gray-600">Monthly Bill</div>
          </div>
        </div>

        {billingInfo && billingInfo.billable_clients_count > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              📊 Billing: {billingInfo.free_clients_count} free + {billingInfo.billable_clients_count} × ₹5 = {formatCurrency(billingInfo.total_amount)}/month
            </p>
          </div>
        )}
      </Card>

      {/* Client List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Client Relationships</h3>
        
        {clients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No client relationships found.</p>
            <p className="text-sm">Start by inviting clients from the Invite tab!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <div key={client.id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        Client {client.client_id.substring(0, 8)}
                      </h4>
                      {getStatusBadge(client.status)}
                      {client.is_billable && (
                        <Badge className="bg-purple-100 text-purple-800">💰 Billable</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mt-2">
                      <div>
                        <span className="font-medium">Sessions:</span> {client.total_sessions}
                      </div>
                      <div>
                        <span className="font-medium">Rate:</span> {client.session_rate ? `₹${client.session_rate}` : 'Not set'}
                      </div>
                      <div>
                        <span className="font-medium">Joined:</span> {client.onboarded_at ? new Date(client.onboarded_at).toLocaleDateString() : 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Last Session:</span> {client.last_session_date ? new Date(client.last_session_date).toLocaleDateString() : 'None'}
                      </div>
                    </div>

                    {client.status === 'paused' && client.paused_reason && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <strong>Paused:</strong> {client.paused_reason}
                        <div className="text-xs text-yellow-600">
                          Since: {client.paused_at ? new Date(client.paused_at).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                    )}

                    {client.status === 'terminated' && client.termination_reason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                        <strong>Terminated:</strong> {client.termination_reason}
                        <div className="text-xs text-red-600">
                          On: {client.terminated_at ? new Date(client.terminated_at).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {client.status === 'active' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedClient(client.id);
                            setActionType('pause');
                          }}
                          className="text-yellow-600 hover:text-yellow-700"
                        >
                          ⏸️ Pause
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedClient(client.id);
                            setActionType('terminate');
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          🚫 Terminate
                        </Button>
                      </>
                    )}
                    
                    {client.status === 'paused' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reactivateClient(client.id)}
                        disabled={isLoading}
                        className="text-green-600 hover:text-green-700"
                      >
                        ▶️ Reactivate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Action Modal */}
      {selectedClient && actionType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {actionType === 'pause' ? '⏸️ Pause Client' : '🚫 Terminate Client'}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {actionType === 'pause' 
                ? 'Pausing a client will stop billing but preserve the relationship. You can reactivate them later.'
                : 'Terminating a client will end the relationship permanently. The client will receive a message to book sessions.'
              }
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for {actionType === 'pause' ? 'pausing' : 'terminating'}:
              </label>
              <Input
                type="text"
                placeholder={actionType === 'pause' ? 'Client requested break...' : 'Client stopped sessions...'}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedClient(null);
                  setActionType(null);
                  setReason('');
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (actionType === 'pause') {
                    pauseClient(selectedClient, reason);
                  } else {
                    terminateClient(selectedClient, reason);
                  }
                }}
                disabled={isLoading || !reason.trim()}
                className={actionType === 'pause' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {isLoading ? 'Processing...' : actionType === 'pause' ? 'Pause Client' : 'Terminate Client'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 