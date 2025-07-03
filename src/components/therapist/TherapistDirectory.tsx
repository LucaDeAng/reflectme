import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { useNavigate } from 'react-router-dom';

interface TherapistProfile {
  id: string;
  full_name: string;
  bio: string;
  specializations: string[];
  city: string;
  state: string;
  country: string;
  years_experience: number;
  session_rate_min?: number;
  session_rate_max?: number;
  languages: string[];
  profile_image_url?: string;
  slug: string;
  verification_status: string;
  accepts_new_clients: boolean;
  education?: string[];
  certifications?: string[];
}

interface DirectoryStats {
  profile_views: number;
  monthly_views: number;
  clients_from_directory: number;
}

export function TherapistDirectory() {
  // supabase is now imported directly
  const navigate = useNavigate();
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [filteredTherapists, setFilteredTherapists] = useState<TherapistProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    specialization: '',
    location: '',
    priceRange: '',
    language: '',
  });

  const [availableSpecializations, setAvailableSpecializations] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

  useEffect(() => {
    fetchTherapists();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, therapists]);

  const fetchTherapists = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('therapist_profiles')
        .select(`
          *,
          therapist_directory_stats (
            profile_views,
            monthly_views,
            clients_from_directory
          )
        `)
        .eq('is_public', true)
        .eq('verification_status', 'verified')
        .order('years_experience', { ascending: false });

      if (error) throw error;

      setTherapists(data || []);
      extractFilterOptions(data || []);
    } catch (error) {
      console.error('Error fetching therapists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const extractFilterOptions = (therapistsData: TherapistProfile[]) => {
    const specializations = new Set<string>();
    const locations = new Set<string>();
    const languages = new Set<string>();

    therapistsData.forEach(therapist => {
      therapist.specializations?.forEach(spec => specializations.add(spec));
      if (therapist.city && therapist.state) {
        locations.add(`${therapist.city}, ${therapist.state}`);
      }
      therapist.languages?.forEach(lang => languages.add(lang));
    });

    setAvailableSpecializations(Array.from(specializations).sort());
    setAvailableLocations(Array.from(locations).sort());
    setAvailableLanguages(Array.from(languages).sort());
  };

  const applyFilters = () => {
    let filtered = [...therapists];

    // Search filter (name, bio, specializations)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(therapist =>
        therapist.full_name.toLowerCase().includes(searchLower) ||
        therapist.bio.toLowerCase().includes(searchLower) ||
        therapist.specializations.some(spec => spec.toLowerCase().includes(searchLower))
      );
    }

    // Specialization filter
    if (filters.specialization) {
      filtered = filtered.filter(therapist =>
        therapist.specializations.includes(filters.specialization)
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(therapist =>
        `${therapist.city}, ${therapist.state}` === filters.location
      );
    }

    // Price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter(therapist => {
        if (!therapist.session_rate_min || !therapist.session_rate_max) return true;
        return therapist.session_rate_min >= min && therapist.session_rate_max <= max;
      });
    }

    // Language filter
    if (filters.language) {
      filtered = filtered.filter(therapist =>
        therapist.languages.includes(filters.language)
      );
    }

    setFilteredTherapists(filtered);
  };

  const handleProfileView = async (therapistId: string, slug: string) => {
    // Track profile view
    try {
      await supabase.rpc('increment_profile_view', { therapist_id: therapistId });
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }

    // Navigate to therapist profile
    navigate(`/therapists/${slug}`);
  };

  const formatPriceRange = (min?: number, max?: number) => {
    if (!min || !max) return 'Contact for pricing';
    return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
  };

  const getProfileImage = (imageUrl?: string) => {
    return imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent('')}&background=e5e7eb&color=374151&size=200`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Find Your Perfect Therapist
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Connect with verified, experienced mental health professionals across India. 
          Start your healing journey with personalized therapy sessions.
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <Input
              type="text"
              placeholder="Search by name or specialization..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialization
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.specialization}
              onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
            >
              <option value="">All Specializations</option>
              {availableSpecializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            >
              <option value="">All Locations</option>
              {availableLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.priceRange}
              onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
            >
              <option value="">Any Price</option>
              <option value="1000-2500">₹1,000 - ₹2,500</option>
              <option value="2500-4000">₹2,500 - ₹4,000</option>
              <option value="4000-6000">₹4,000 - ₹6,000</option>
              <option value="6000-10000">₹6,000+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.language}
              onChange={(e) => setFilters({ ...filters, language: e.target.value })}
            >
              <option value="">Any Language</option>
              {availableLanguages.map(language => (
                <option key={language} value={language}>{language}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredTherapists.length} of {therapists.length} verified therapists
          </p>
          <Button
            variant="outline"
            onClick={() => setFilters({ search: '', specialization: '', location: '', priceRange: '', language: '' })}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading therapists...</p>
        </div>
      )}

      {/* Therapist Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTherapists.map((therapist) => (
            <Card key={therapist.id} className="hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                {/* Profile Header */}
                <div className="flex items-start space-x-4 mb-4">
                  <img
                    src={getProfileImage(therapist.profile_image_url)}
                    alt={therapist.full_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {therapist.full_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      📍 {therapist.city}, {therapist.state}
                    </p>
                    <p className="text-sm text-gray-600">
                      🎓 {therapist.years_experience} years experience
                    </p>
                  </div>
                </div>

                {/* Verification Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-green-100 text-green-800">
                    ✅ Verified
                  </Badge>
                  {therapist.accepts_new_clients && (
                    <Badge className="bg-blue-100 text-blue-800">
                      📅 Accepting Clients
                    </Badge>
                  )}
                </div>

                {/* Bio */}
                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                  {therapist.bio}
                </p>

                {/* Specializations */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Specializations:</h4>
                  <div className="flex flex-wrap gap-1">
                    {therapist.specializations.slice(0, 3).map((spec, index) => (
                      <Badge key={index} className="bg-purple-100 text-purple-800 text-xs">
                        {spec}
                      </Badge>
                    ))}
                    {therapist.specializations.length > 3 && (
                      <Badge className="bg-gray-100 text-gray-600 text-xs">
                        +{therapist.specializations.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Languages */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    🗣️ {therapist.languages.join(', ')}
                  </p>
                </div>

                {/* Pricing */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900">
                    💰 {formatPriceRange(therapist.session_rate_min, therapist.session_rate_max)}
                  </p>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => handleProfileView(therapist.id, therapist.slug)}
                  className="w-full"
                  disabled={!therapist.accepts_new_clients}
                >
                  {therapist.accepts_new_clients ? '👁️ View Profile' : '❌ Not Accepting Clients'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && filteredTherapists.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No therapists found with the selected criteria.</p>
          <p className="text-gray-500 mt-2">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {/* SEO Footer */}
      <div className="mt-16 text-center bg-gray-50 p-8 rounded-lg">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Why Choose Zentia for Therapy?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">✅ Verified Professionals</h3>
            <p className="text-sm text-gray-600">
              All therapists are licensed and verified with proper credentials
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">🔒 Secure & Private</h3>
            <p className="text-sm text-gray-600">
              HIPAA-compliant platform ensuring your privacy and confidentiality
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">🤖 AI-Enhanced Care</h3>
            <p className="text-sm text-gray-600">
              Intelligent matching and personalized therapy experience
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 