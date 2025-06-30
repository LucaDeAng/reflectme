/**
 * Centralized Demo Account Management
 * Handles all demo account credentials and validation
 */

export interface DemoAccount {
  email: string;
  password: string;
  name: string;
  role: 'therapist' | 'patient' | 'admin';
}

export const DEMO_ACCOUNTS = {
  THERAPIST: {
    email: 'demo.therapist@zentia.app',
    password: 'ZentiaDemo2024!',
    name: 'Dr. Sarah Wilson',
    role: 'therapist' as const
  },
  CLIENT: {
    email: 'demo.client@zentia.app', 
    password: 'ZentiaClient2024!',
    name: 'Alex Johnson',
    role: 'patient' as const
  },
  ADMIN: {
    email: 'admin@zentia.app',
    password: 'ZentiaAdmin2024!',
    name: 'System Administrator',
    role: 'admin' as const
  },
  // Legacy support
  LEGACY_THERAPIST: {
    email: 'demotherapist@mindtwin.demo',
    password: 'demo123456',
    name: 'Demo Therapist (Legacy)',
    role: 'therapist' as const
  },
  LEGACY_CLIENT: {
    email: 'democlient@mindtwin.demo',
    password: 'demo123456',
    name: 'Demo Client (Legacy)',
    role: 'patient' as const
  }
} as const;

/**
 * Validates demo account credentials
 */
export const validateDemoCredentials = (email: string, password: string): DemoAccount | null => {
  return Object.values(DEMO_ACCOUNTS).find(
    account => account.email === email && account.password === password
  ) || null;
};

/**
 * Checks if an email is a demo account
 */
export const isDemoEmail = (email: string): boolean => {
  return email.endsWith('@zentia.app') || email.endsWith('@mindtwin.demo');
};

/**
 * Gets demo account by role
 */
export const getDemoAccountByRole = (role: 'therapist' | 'patient' | 'admin'): DemoAccount => {
  switch (role) {
    case 'therapist':
      return DEMO_ACCOUNTS.THERAPIST;
    case 'patient':
      return DEMO_ACCOUNTS.CLIENT;
    case 'admin':
      return DEMO_ACCOUNTS.ADMIN;
    default:
      return DEMO_ACCOUNTS.CLIENT;
  }
};

/**
 * Creates demo user object for authentication
 */
export const createDemoUser = (account: DemoAccount) => ({
  id: `demo-${account.role}-${Date.now()}`,
  name: account.name,
  email: account.email,
  role: account.role,
  avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(account.email)}`,
  isDemo: true,
}); 