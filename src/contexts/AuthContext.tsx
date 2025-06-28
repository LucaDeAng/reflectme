import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as Sentry from "@sentry/react";
import { setSentryUserContext, clearSentryUserContext } from '../utils/sentryUtils';
import { 
  logError, 
  AppError, 
  ErrorType, 
  ErrorSeverity, 
  withRetry, 
  safeAsync,
  getUserErrorMessage 
} from '../utils/errorHandling';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'therapist' | 'patient' | 'admin';
  avatar?: string;
  isDemo?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, role: 'therapist' | 'patient' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const mapUserWithProfile = async (authUser: User): Promise<AuthUser | null> => {
    if (!authUser) return null;

    const isDemo = authUser.email?.endsWith('@mindtwin.demo') || authUser.email?.endsWith('@zentia.app') || false;
    const role = isDemo 
      ? authUser.email?.includes('therapist') 
        ? 'therapist' 
        : authUser.email?.includes('admin') 
          ? 'admin' 
          : 'patient'
      : authUser.user_metadata?.role || 'patient';

    // For demo users, always return a valid user object (no database interactions needed)
    if (isDemo) {
      return {
        id: authUser.id,
        name: authUser.user_metadata?.name || (role === 'patient' ? 'Demo Client' : role === 'therapist' ? 'Demo Therapist' : 'Demo Admin'),
        email: authUser.email || '',
        role: role as 'therapist' | 'patient' | 'admin',
        avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${authUser.email}`,
        isDemo: true,
      };
    }

    // Check if user should have admin role based on email
    if (authUser.email?.includes('admin') || authUser.email?.includes('l.de.angelis')) {
      return {
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Admin User',
        email: authUser.email || '',
        role: 'admin',
        avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${authUser.email}`,
        isDemo: false,
      };
    }

    // For regular users, try to get profile
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Return basic user info if profile doesn't exist
        return {
          id: authUser.id,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
          role: (authUser.user_metadata?.role || role) as 'therapist' | 'patient' | 'admin',
          avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${authUser.email}`,
          isDemo: false,
        };
      }

      return {
        id: profile.id,
        name: profile.name || (profile.first_name + ' ' + profile.last_name).trim(),
        email: authUser.email || '',
        role: (authUser.user_metadata?.role || profile.role || role) as 'therapist' | 'patient' | 'admin',
        avatar: profile.avatar_url || `https://api.dicebear.com/7.x/personas/svg?seed=${authUser.email}`,
        isDemo: false,
      };
    } catch (error) {
      console.error('Error mapping user with profile:', error);
      // Always return a fallback user object instead of null
      return {
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        role: (authUser.user_metadata?.role || role) as 'therapist' | 'patient' | 'admin',
        avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${authUser.email}`,
        isDemo: false,
      };
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('🔐 Initial session check:', { 
        hasSession: !!session, 
        userEmail: session?.user?.email 
      });
      
      setSession(session);
      if (session?.user) {
        const mappedUser = await mapUserWithProfile(session.user);
        console.log('👤 Mapped user:', { 
          name: mappedUser?.name, 
          role: mappedUser?.role, 
          email: mappedUser?.email 
        });
        setUser(mappedUser);
        
        // Set Sentry user context
        if (mappedUser) {
          setSentryUserContext({
            id: mappedUser.id,
            email: mappedUser.email,
            role: mappedUser.role,
            isTherapist: mappedUser.role === 'therapist'
          });
          
          const { logger } = Sentry;
          logger.info("User authenticated", {
            role: mappedUser.role,
            isDemo: mappedUser.isDemo,
            hasEmail: !!mappedUser.email
          });
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', { 
        event, 
        userEmail: session?.user?.email,
        hasSession: !!session 
      });
      
      setSession(session);
      if (session?.user) {
        const mappedUser = await mapUserWithProfile(session.user);
        console.log('👤 User mapped after auth change:', { 
          name: mappedUser?.name, 
          role: mappedUser?.role 
        });
        setUser(mappedUser);
        
        // Set Sentry user context
        if (mappedUser) {
          setSentryUserContext({
            id: mappedUser.id,
            email: mappedUser.email,
            role: mappedUser.role,
            isTherapist: mappedUser.role === 'therapist'
          });
          
          const { logger } = Sentry;
          logger.info("User authenticated", {
            role: mappedUser.role,
            isDemo: mappedUser.isDemo,
            hasEmail: !!mappedUser.email
          });
        }
      } else {
        setUser(null);
        clearSentryUserContext();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData: any) => {
    console.log('📝 Signing up user:', { email, role: userData.role });
    
    try {
      // Validate input
      if (!email || !password || !userData.name || !userData.role) {
        throw new AppError(
          'Missing required fields for signup',
          ErrorType.VALIDATION,
          ErrorSeverity.MEDIUM,
          { email: !!email, password: !!password, name: !!userData.name, role: !!userData.role },
          'Please fill in all required fields.'
        );
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new AppError(
          'Invalid email format',
          ErrorType.VALIDATION,
          ErrorSeverity.MEDIUM,
          { email },
          'Please enter a valid email address.'
        );
      }

      // Password validation
      if (password.length < 6) {
        throw new AppError(
          'Password too short',
          ErrorType.VALIDATION,
          ErrorSeverity.MEDIUM,
          { passwordLength: password.length },
          'Password must be at least 6 characters long.'
        );
      }

      // Try to sign up with retry logic
      const signUpResult = await withRetry(async () => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: userData.name,
              role: userData.role,
            },
          },
        });

        if (error) {
          // Handle specific Supabase errors
          if (error.message.includes('User already registered')) {
            throw new AppError(
              'User already registered',
              ErrorType.AUTHENTICATION,
              ErrorSeverity.MEDIUM,
              { email },
              'An account with this email already exists. Please sign in instead.'
            );
          }
          
          if (error.message.includes('Invalid email')) {
            throw new AppError(
              error.message,
              ErrorType.VALIDATION,
              ErrorSeverity.MEDIUM,
              { email },
              'Please enter a valid email address.'
            );
          }
          
          if (error.message.includes('Password')) {
            throw new AppError(
              error.message,
              ErrorType.VALIDATION,
              ErrorSeverity.MEDIUM,
              { passwordLength: password.length },
              'Password does not meet requirements. Please try a stronger password.'
            );
          }
          
          throw new AppError(
            error.message,
            ErrorType.AUTHENTICATION,
            ErrorSeverity.HIGH,
            { supabaseError: error }
          );
        }

        return data;
      }, {
        maxAttempts: 2,
        shouldRetry: (error) => {
          // Only retry on network errors, not validation errors
          return error instanceof AppError && error.type === ErrorType.NETWORK;
        }
      });

      if (signUpResult.user) {
        // Create profile with error handling
        const { error: profileResult } = await safeAsync(async () => {
          const nameParts = (userData.name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          // Check if profile already exists
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', signUpResult.user!.id)
            .single();

          if (existingProfile) {
            console.log('Profile already exists, skipping creation');
            return;
          }

          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: signUpResult.user!.id,
                email: email,
                first_name: firstName,
                last_name: lastName,
                role: userData.role,
              },
            ]);

          if (profileError) {
            // If it's a duplicate key error, the profile might have been created by a trigger
            if (profileError.message.includes('duplicate key value')) {
              console.log('Profile already exists (duplicate key), continuing...');
              return;
            }
            
            throw new AppError(
              `Profile creation failed: ${profileError.message}`,
              ErrorType.DATABASE,
              ErrorSeverity.MEDIUM,
              { profileError, userId: signUpResult.user!.id }
            );
          }
        }, {
          action: 'create_user_profile',
          userId: signUpResult.user.id,
          additionalData: { email, role: userData.role }
        });

        if (profileResult) {
          logError(profileResult, {
            action: 'signup_profile_creation',
            userId: signUpResult.user.id,
            additionalData: { email, role: userData.role }
          });
          // Don't throw here as the user is created, just log the error
        }
      }
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(
        error instanceof Error ? error.message : 'Unknown signup error',
        ErrorType.AUTHENTICATION,
        ErrorSeverity.HIGH,
        { email, role: userData.role }
      );
      
      logError(appError, {
        action: 'user_signup',
        additionalData: { email, role: userData.role }
      });
      
      throw appError;
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Signing in user:', email);
    
    try {
      // Validate input
      if (!email || !password) {
        throw new AppError(
          'Email and password are required',
          ErrorType.VALIDATION,
          ErrorSeverity.MEDIUM,
          { email: !!email, password: !!password },
          'Please enter both email and password.'
        );
      }

      const signInResult = await withRetry(async () => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new AppError(
              'Invalid email or password',
              ErrorType.AUTHENTICATION,
              ErrorSeverity.MEDIUM,
              { email },
              'Invalid email or password. Please check your credentials and try again.'
            );
          }
          
          if (error.message.includes('Email not confirmed')) {
            throw new AppError(
              'Email not confirmed',
              ErrorType.AUTHENTICATION,
              ErrorSeverity.MEDIUM,
              { email },
              'Please check your email and click the confirmation link before signing in.'
            );
          }
          
          throw new AppError(
            error.message,
            ErrorType.AUTHENTICATION,
            ErrorSeverity.HIGH,
            { supabaseError: error, email }
          );
        }
      }, {
        maxAttempts: 2,
        shouldRetry: (error) => {
          return error instanceof AppError && error.type === ErrorType.NETWORK;
        }
      });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(
        error instanceof Error ? error.message : 'Unknown signin error',
        ErrorType.AUTHENTICATION,
        ErrorSeverity.HIGH,
        { email }
      );
      
      logError(appError, {
        action: 'user_signin',
        additionalData: { email }
      });
      
      throw appError;
    }
  };

  const signOut = async () => {
    console.log('🚪 Signing out user');
    
    try {
      const { logger } = Sentry;
      logger.info("User signing out", {
        role: user?.role,
        isDemo: user?.isDemo
      });
      
      // Check if it's a demo user
      if (user?.isDemo) {
        console.log('🎭 Demo user logout - skipping Supabase signOut');
        setUser(null);
        setSession(null);
        clearSentryUserContext();
        return;
      }
      
      // Regular user logout with retry
      await withRetry(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw new AppError(
            error.message,
            ErrorType.AUTHENTICATION,
            ErrorSeverity.MEDIUM,
            { supabaseError: error, userId: user?.id }
          );
        }
      }, {
        maxAttempts: 3,
        shouldRetry: (error) => {
          return error instanceof AppError && error.type === ErrorType.NETWORK;
        }
      });
      
      setUser(null);
      setSession(null);
      clearSentryUserContext();
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(
        error instanceof Error ? error.message : 'Unknown signout error',
        ErrorType.AUTHENTICATION,
        ErrorSeverity.MEDIUM,
        { userId: user?.id }
      );
      
      logError(appError, {
        action: 'user_signout',
        userId: user?.id
      });
      
      // Even if signout fails, clear local state
      setUser(null);
      setSession(null);
      clearSentryUserContext();
      
      // Only throw if it's a critical error
      if (appError.severity === ErrorSeverity.HIGH || appError.severity === ErrorSeverity.CRITICAL) {
        throw appError;
      }
    }
  };

  const logout = async () => {
    await signOut();
  };

  const register = async (name: string, email: string, password: string, role: 'therapist' | 'patient' | 'admin') => {
    await signUp(email, password, { name, role });
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      // Validate input
      if (!email || !password) {
        throw new AppError(
          'Email and password are required',
          ErrorType.VALIDATION,
          ErrorSeverity.MEDIUM,
          { email: !!email, password: !!password },
          'Please enter both email and password.'
        );
      }
      
      // For demo accounts, create a mock session instead of real auth
      const isDemoAccount = email.endsWith('@mindtwin.demo') || email.endsWith('@zentia.app');
      if (isDemoAccount) {
        console.log('🎭 Demo account detected - creating mock session');
        
        // Check for specific demo credentials
        let isValidDemo = false;
        let role: 'therapist' | 'patient' | 'admin' = 'patient';
        let name = 'Demo User';
        
        // Check for new Zentia demo credentials
        if (email === 'demo.therapist@zentia.app' && password === 'ZentiaDemo2024!') {
          isValidDemo = true;
          role = 'therapist';
          name = 'Demo Therapist';
        } else if (email === 'demo.client@zentia.app' && password === 'ZentiaClient2024!') {
          isValidDemo = true;
          role = 'patient';
          name = 'Demo Client';
        } else if (email === 'admin@zentia.app' && password === 'ZentiaAdmin2024!') {
          isValidDemo = true;
          role = 'admin';
          name = 'Demo Admin';
        } else if (email.endsWith('@mindtwin.demo') && password === 'demo123456') {
          // Legacy demo support
          isValidDemo = true;
          if (email.includes('therapist')) {
            role = 'therapist';
            name = 'Demo Therapist';
          } else if (email.includes('admin')) {
            role = 'admin';
            name = 'Demo Admin';
          } else {
            role = 'patient';
            name = 'Demo Client';
          }
        }
        
        if (!isValidDemo) {
          throw new AppError(
            'Invalid demo account credentials',
            ErrorType.AUTHENTICATION,
            ErrorSeverity.MEDIUM,
            { email },
            'Demo credentials are incorrect. Please check the documentation for correct demo credentials.'
          );
        }
        
        // Create mock demo user
        const mockDemoUser: AuthUser = {
          id: `demo-${role}-${Date.now()}`,
          name,
          email,
          role,
          avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(email)}`,
          isDemo: true,
        };
        
        // Set the user immediately
        setUser(mockDemoUser);
        setLoading(false);
        
        console.log('✅ Demo user logged in successfully:', mockDemoUser);
        return;
      }
      
      // For regular accounts, use normal auth
      await signIn(email, password);
      console.log('✅ Regular login successful');
      
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(
        error instanceof Error ? error.message : 'Unknown login error',
        ErrorType.AUTHENTICATION,
        ErrorSeverity.HIGH,
        { email }
      );
      
      logError(appError, {
        action: 'user_login',
        additionalData: { email }
      });
      
      throw appError;
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}