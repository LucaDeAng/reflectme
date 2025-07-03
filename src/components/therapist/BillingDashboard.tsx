import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface BillingRecord {
  id: string;
  billing_month: number;
  billing_year: number;
  active_clients_count: number;
  billable_clients_count: number;
  free_clients_count: number;
  rate_per_client: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'waived';
  payment_date?: string;
  invoice_number?: string;
  created_at: string;
}

interface TherapistProfile {
  id: string;
  full_name: string;
  active_clients_count: number;
  max_free_clients: number;
  subscription_status: string;
  billing_email?: string;
}

export function BillingDashboard() {
  const { user } = useAuth();
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [therapistProfile, setTherapistProfile] = useState<TherapistProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBilling, setCurrentBilling] = useState<BillingRecord | null>(null);

  useEffect(() => {
    if (user) {
      fetchTherapistProfile();
      fetchBillingRecords();
      fetchCurrentBilling();
    }
  }, [user]);

  const fetchTherapistProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('therapist_profiles')
        .select('id, full_name, active_clients_count, max_free_clients, subscription_status, billing_email')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setTherapistProfile(data);
    } catch (error) {
      console.error('Error fetching therapist profile:', error);
    }
  };

  const fetchBillingRecords = async () => {
    try {
      const { data: profile } = await supabase
        .from('therapist_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('therapist_billing')
        .select('*')
        .eq('therapist_id', profile.id)
        .order('billing_year', { ascending: false })
        .order('billing_month', { ascending: false });

      if (error) throw error;
      setBillingRecords(data || []);
    } catch (error) {
      console.error('Error fetching billing records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentBilling = async () => {
    try {
      const { data: profile } = await supabase
        .from('therapist_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) return;

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data, error } = await supabase
        .from('therapist_billing')
        .select('*')
        .eq('therapist_id', profile.id)
        .eq('billing_month', currentMonth)
        .eq('billing_year', currentYear)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentBilling(data);
    } catch (error) {
      console.error('Error fetching current billing:', error);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      waived: 'bg-blue-100 text-blue-800',
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100).toFixed(2)}`;
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const calculateProjectedBilling = () => {
    if (!therapistProfile) return 0;
    
    const billableClients = Math.max(0, therapistProfile.active_clients_count - therapistProfile.max_free_clients);
    return billableClients * 500; // ₹5 per client in paise
  };

  const upgradeToPaid = async () => {
    // In a real implementation, this would integrate with a payment processor
    console.log('Upgrading to paid plan...');
    alert('Payment integration would be implemented here');
  };

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {therapistProfile?.full_name || 'Therapist'} - Billing Dashboard
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage your subscription and billing preferences
            </p>
          </div>
          <Badge className="bg-purple-100 text-purple-800 text-lg px-3 py-1">
            {therapistProfile?.subscription_status === 'free' ? '🆓 Freemium' : '💎 Premium'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {therapistProfile?.active_clients_count || 0}
            </div>
            <div className="text-sm text-gray-600">Active Clients</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {therapistProfile?.max_free_clients || 0}
            </div>
            <div className="text-sm text-gray-600">Free Clients</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {therapistProfile ? Math.max(0, therapistProfile.active_clients_count - therapistProfile.max_free_clients) : 0}
            </div>
            <div className="text-sm text-gray-600">Billable Clients</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(calculateProjectedBilling())}
            </div>
            <div className="text-sm text-gray-600">Monthly Bill</div>
          </div>
        </div>
      </Card>

      {/* Current Month Billing */}
      {currentBilling ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📅 Current Month ({getMonthName(currentBilling.billing_month)} {currentBilling.billing_year})
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900">Billing Summary</h4>
                <p className="text-sm text-gray-600">
                  {currentBilling.free_clients_count} free + {currentBilling.billable_clients_count} billable clients
                </p>
              </div>
              {getPaymentStatusBadge(currentBilling.payment_status)}
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Amount:</span>
                <div className="font-semibold">{formatCurrency(currentBilling.total_amount)}</div>
              </div>
              <div>
                <span className="text-gray-600">Rate:</span>
                <div className="font-semibold">₹{currentBilling.rate_per_client / 100}/client</div>
              </div>
              <div>
                <span className="text-gray-600">Due Date:</span>
                <div className="font-semibold">End of month</div>
              </div>
            </div>

            {currentBilling.payment_status === 'pending' && currentBilling.total_amount > 0 && (
              <div className="mt-4">
                <Button onClick={upgradeToPaid} className="bg-purple-600 hover:bg-purple-700">
                  💳 Pay Now - {formatCurrency(currentBilling.total_amount)}
                </Button>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📅 Current Month
          </h3>
          <div className="text-center py-8 text-gray-500">
            <p>No billing record for current month</p>
            <p className="text-sm">Billing will be generated at month end</p>
          </div>
        </Card>
      )}

      {/* Pricing Information */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Pricing Plan</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4 bg-white">
            <h4 className="font-semibold text-green-600 mb-2">🆓 Freemium Plan</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Up to 2 clients free</li>
              <li>✅ Basic client management</li>
              <li>✅ AI-powered insights</li>
              <li>✅ Secure messaging</li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4 bg-white">
            <h4 className="font-semibold text-purple-600 mb-2">💎 Paid Plan</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Unlimited clients</li>
              <li>✅ ₹5/month per additional client</li>
              <li>✅ Advanced analytics</li>
              <li>✅ Priority support</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Billing History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Billing History</h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading billing history...</p>
          </div>
        ) : billingRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No billing history available</p>
            <p className="text-sm">Start accepting clients to see billing records</p>
          </div>
        ) : (
          <div className="space-y-3">
            {billingRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-medium text-gray-900">
                      {getMonthName(record.billing_month)} {record.billing_year}
                    </h4>
                    {getPaymentStatusBadge(record.payment_status)}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {record.active_clients_count} clients • {record.billable_clients_count} billable
                    {record.invoice_number && ` • Invoice: ${record.invoice_number}`}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(record.total_amount)}
                  </div>
                  {record.payment_date && (
                    <div className="text-xs text-gray-500">
                      Paid: {new Date(record.payment_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Account Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Billing Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billing Email
            </label>
            <p className="text-sm text-gray-600">
              {therapistProfile?.billing_email || therapistProfile?.full_name || 'Not set'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <p className="text-sm text-gray-600">
              Not configured • <Button variant="outline" size="sm">Add Payment Method</Button>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billing Frequency
            </label>
            <p className="text-sm text-gray-600">Monthly billing at month end</p>
          </div>
        </div>
      </Card>
    </div>
  );
} 