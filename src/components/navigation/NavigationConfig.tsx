import React from 'react';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  ClipboardList, 
  Activity, 
  Brain,
  MessageSquare,
  Target,
  BookOpen,
  Sparkles,
  Shield,
  Video,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Calendar,
  Heart,
  Home,
  ArrowLeft,
  HelpCircle,
  Star,
  Zap,
  Lightbulb,
  CreditCard
} from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  category?: string;
  priority?: number;
  isNew?: boolean;
  isBeta?: boolean;
  requiresPermission?: string;
  children?: NavigationItem[];
}

export interface NavigationConfig {
  title: string;
  subtitle: string;
  gradient: string;
  items: NavigationItem[];
  quickActions?: NavigationItem[];
  breadcrumbs?: boolean;
  searchEnabled?: boolean;
}

export const getTherapistNavigation = (): NavigationConfig => ({
  title: 'Zentia Therapist',
  subtitle: 'AI-Powered Practice Management',
  gradient: 'from-blue-500 to-purple-600',
  searchEnabled: true,
  breadcrumbs: true,
  items: [
    // Primary Navigation - Killer Functions
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Overview of your practice',
      href: '/therapist',
      icon: Home,
      priority: 1,
      category: 'primary'
    },
    {
      id: 'clients',
      label: 'My Clients',
      description: 'Manage client relationships',
      href: '/therapist/clients',
      icon: Users,
      badge: 3,
      priority: 1,
      category: 'primary'
    },
    {
      id: 'ai-assistant',
      label: 'AI Assistant',
      description: 'AI-powered clinical support',
      href: '/therapist/ai-toolbox',
      icon: Brain,
      priority: 1,
      category: 'primary'
    },
    {
      id: 'analytics',
      label: 'Smart Analytics',
      description: 'Progress tracking & insights',
      href: '/therapist/analytics-hub',
      icon: TrendingUp,
      priority: 1,
      category: 'primary'
    },
    {
      id: 'secure-chat',
      label: 'Secure Chat',
      description: 'HIPAA-compliant messaging',
      href: '/therapist/communication-hub',
      icon: MessageSquare,
      priority: 1,
      category: 'primary'
    },

    // Management Tools
    {
      id: 'client-management',
      label: 'Client Management',
      description: 'Comprehensive client administration',
      href: '/therapist/clients-management',
      icon: Users,
      priority: 2,
      category: 'management'
    },
    {
      id: 'task-management',
      label: 'Task Management',
      description: 'Assignments & homework tracking',
      href: '/therapist/tasks-management',
      icon: Target,
      priority: 2,
      category: 'management'
    },
    {
      id: 'assessment-management',
      label: 'Assessment Management',
      description: 'Screening & progress tools',
      href: '/therapist/assessments-management',
      icon: ClipboardList,
      priority: 2,
      category: 'management'
    },
    {
      id: 'profile-billing',
      label: 'Profile & Billing',
      description: 'Manage your public profile and subscription',
      href: '/therapist/profile-management',
      icon: CreditCard,
      priority: 2,
      category: 'management',
      isNew: true
    },

    // Clinical Tools
    {
      id: 'notes',
      label: 'Clinical Notes',
      description: 'SOAP notes & documentation',
      href: '/therapist/notes-overview',
      icon: FileText,
      priority: 2,
      category: 'clinical'
    },
    {
      id: 'case-histories',
      label: 'Case Histories',
      description: 'Client documentation & records',
      href: '/therapist/case-histories',
      icon: BookOpen,
      priority: 2,
      category: 'clinical'
    },
    {
      id: 'monitoring',
      label: 'Client Monitoring',
      description: 'Progress tracking & alerts',
      href: '/therapist/monitoring',
      icon: Activity,
      priority: 2,
      category: 'clinical'
    },

    // Advanced Features
    {
      id: 'predictive-analytics',
      label: 'Predictive Analytics',
      description: 'AI-powered outcome predictions',
      href: '/therapist/predictive-analytics',
      icon: BarChart3,
      priority: 3,
      category: 'advanced',
      isBeta: true
    },
    {
      id: 'custom-reports',
      label: 'Custom Reports',
      description: 'Generate detailed reports',
      href: '/therapist/custom-reports',
      icon: Download,
      priority: 3,
      category: 'advanced'
    },
    {
      id: 'training-support',
      label: 'Training Support',
      description: 'Professional development resources',
      href: '/therapist/training-support',
      icon: Video,
      priority: 3,
      category: 'advanced'
    },

    // Settings & Support
    {
      id: 'settings',
      label: 'Settings',
      description: 'Account & practice preferences',
      href: '/therapist/settings',
      icon: Settings,
      priority: 4,
      category: 'system'
    }
  ],
  quickActions: [
    {
      id: 'add-client',
      label: 'Add Client',
      href: '/therapist/clients-management?action=create',
      icon: Plus,
      color: 'primary'
    },
    {
      id: 'schedule-assessment',
      label: 'Schedule Assessment',
      href: '/therapist/assessments-management?action=schedule',
      icon: Calendar,
      color: 'secondary'
    },
    {
      id: 'create-note',
      label: 'Create Note',
      href: '/therapist/notes-overview?action=create',
      icon: FileText,
      color: 'success'
    }
  ]
});

export const getClientNavigation = (): NavigationConfig => ({
  title: 'Zentia Companion',
  subtitle: 'Your Wellness Journey',
  gradient: 'from-emerald-500 to-cyan-600',
  searchEnabled: true,
  breadcrumbs: true,
  items: [
    // Primary Navigation - Killer Functions
    {
      id: 'dashboard',
      label: 'My Progress',
      description: 'Track your wellness journey',
      href: '/client',
      icon: TrendingUp,
      priority: 1,
      category: 'primary'
    },
    {
      id: 'ai-companion',
      label: 'AI Companion',
      description: '24/7 emotional support',
      href: '/client/chat',
      icon: Brain,
      badge: 2,
      priority: 1,
      category: 'primary'
    },
    {
      id: 'smart-journal',
      label: 'Smart Journal',
      description: 'AI-enhanced reflection',
      href: '/client/journal',
      icon: BookOpen,
      priority: 1,
      category: 'primary'
    },
    {
      id: 'insights',
      label: 'AI Insights',
      description: 'Personalized recommendations',
      href: '/client/insights',
      icon: Sparkles,
      priority: 1,
      category: 'primary'
    },

    // Wellness Tools
    {
      id: 'monitoring',
      label: 'Mood Tracking',
      description: 'Monitor your emotional health',
      href: '/client/monitoring',
      icon: Heart,
      priority: 2,
      category: 'wellness'
    },
    {
      id: 'plan',
      label: 'My Plan',
      description: 'Treatment goals & progress',
      href: '/client/plan',
      icon: Target,
      priority: 2,
      category: 'wellness'
    },

    // Support & Resources
    {
      id: 'settings',
      label: 'Settings',
      description: 'Account preferences',
      href: '/client/settings',
      icon: Settings,
      priority: 3,
      category: 'system'
    }
  ],
  quickActions: [
    {
      id: 'mood-check',
      label: 'Mood Check-in',
      href: '/client/monitoring?action=checkin',
      icon: Heart,
      color: 'primary'
    },
    {
      id: 'journal-entry',
      label: 'New Journal Entry',
      href: '/client/journal?action=create',
      icon: BookOpen,
      color: 'secondary'
    },
    {
      id: 'chat-ai',
      label: 'Chat with AI',
      href: '/client/chat',
      icon: Brain,
      color: 'success'
    }
  ]
});

export const getNavigationByRole = (role: string): NavigationConfig => {
  switch (role) {
    case 'therapist':
      return getTherapistNavigation();
    case 'patient':
    case 'client':
      return getClientNavigation();
    default:
      return getClientNavigation();
  }
};

export const getBreadcrumbs = (pathname: string, role: string): NavigationItem[] => {
  const config = getNavigationByRole(role);
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs: NavigationItem[] = [];

  // Add home
  breadcrumbs.push({
    id: 'home',
    label: 'Home',
    href: `/${role}`,
    icon: Home
  });

  // Build breadcrumbs from path
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    if (index === 0) return; // Skip role segment
    
    currentPath += `/${segment}`;
    const matchingItem = config.items.find(item => 
      item.href === currentPath || 
      item.href.includes(segment)
    );

    if (matchingItem) {
      breadcrumbs.push({
        id: matchingItem.id,
        label: matchingItem.label,
        href: matchingItem.href,
        icon: matchingItem.icon
      });
    }
  });

  return breadcrumbs;
};

export const getSearchSuggestions = (query: string, role: string): NavigationItem[] => {
  const config = getNavigationByRole(role);
  const suggestions: NavigationItem[] = [];

  if (!query.trim()) {
    // Return popular items
    return config.items
      .filter(item => item.priority === 1)
      .slice(0, 5);
  }

  const searchTerm = query.toLowerCase();
  
  // Search in labels and descriptions
  config.items.forEach(item => {
    if (
      item.label.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm)
    ) {
      suggestions.push(item);
    }
  });

  return suggestions.slice(0, 8);
}; 