import { createClient } from '@supabase/supabase-js';
import { 
  AppError, 
  ErrorType, 
  ErrorSeverity, 
  logError 
} from '../utils/errorHandling';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced Supabase initialization with comprehensive error handling
function initializeSupabase() {
  try {
    // Check if environment variables exist
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new AppError(
        'Missing Supabase environment variables',
        ErrorType.EXTERNAL_SERVICE,
        ErrorSeverity.CRITICAL,
        { 
          hasUrl: !!supabaseUrl, 
          hasKey: !!supabaseAnonKey,
          urlType: typeof supabaseUrl,
          keyType: typeof supabaseAnonKey
        },
        'Database connection failed. Please contact support.'
      );
    }

    // Check if environment variables are still placeholder values
    if (supabaseUrl === 'your_supabase_url' || supabaseUrl.includes('your_supabase_url')) {
      throw new AppError(
        'VITE_SUPABASE_URL is not configured',
        ErrorType.EXTERNAL_SERVICE,
        ErrorSeverity.CRITICAL,
        { supabaseUrl },
        'Database configuration error. Please contact support.'
      );
    }

    if (supabaseAnonKey === 'your_supabase_anon_key' || supabaseAnonKey.includes('your_supabase_anon_key')) {
      throw new AppError(
        'VITE_SUPABASE_ANON_KEY is not configured',
        ErrorType.EXTERNAL_SERVICE,
        ErrorSeverity.CRITICAL,
        { anonKeyExists: !!supabaseAnonKey },
        'Database authentication error. Please contact support.'
      );
    }

    // Validate URL format
    try {
      const urlObject = new URL(supabaseUrl);
      
      // Additional validation for Supabase URL format
      if (!urlObject.hostname.includes('supabase')) {
        logError(new AppError(
          'Supabase URL format warning',
          ErrorType.EXTERNAL_SERVICE,
          ErrorSeverity.MEDIUM,
          { 
            url: supabaseUrl,
            hostname: urlObject.hostname,
            protocol: urlObject.protocol
          }
        ), {
          action: 'supabase_url_validation',
          component: 'supabase'
        });
      }
    } catch (urlError) {
      throw new AppError(
        `Invalid VITE_SUPABASE_URL format: "${supabaseUrl}"`,
        ErrorType.EXTERNAL_SERVICE,
        ErrorSeverity.CRITICAL,
        { 
          supabaseUrl, 
          urlError: urlError instanceof Error ? urlError.message : 'Unknown URL error'
        },
        'Invalid database URL configuration. Please contact support.'
      );
    }

    // Validate anon key format (basic validation)
    if (supabaseAnonKey.length < 30) {
      logError(new AppError(
        'Supabase anon key appears to be too short',
        ErrorType.EXTERNAL_SERVICE,
        ErrorSeverity.MEDIUM,
        { keyLength: supabaseAnonKey.length }
      ), {
        action: 'supabase_key_validation',
        component: 'supabase'
      });
    }

    // Create Supabase client with error handling
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });

    // Test connection (optional - can be enabled for health checks)
    if (process.env.NODE_ENV === 'development') {
      // Basic connectivity test in development
      client.from('profiles').select('count', { count: 'exact', head: true })
        .then(({ error }) => {
          if (error) {
            logError(new AppError(
              `Supabase connectivity test failed: ${error.message}`,
              ErrorType.DATABASE,
              ErrorSeverity.HIGH,
              { supabaseError: error }
            ), {
              action: 'supabase_connectivity_test',
              component: 'supabase'
            });
          } else {
            console.log('✅ Supabase connection test successful');
          }
        })
        .catch((error) => {
          logError(new AppError(
            `Supabase connectivity test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            ErrorType.DATABASE,
            ErrorSeverity.HIGH,
            { error: error instanceof Error ? error.message : 'Unknown' }
          ), {
            action: 'supabase_connectivity_test',
            component: 'supabase'
          });
        });
    }

    console.log('✅ Supabase client initialized successfully');
    return client;

  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError(
      `Supabase initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ErrorType.EXTERNAL_SERVICE,
      ErrorSeverity.CRITICAL,
      { 
        originalError: error instanceof Error ? error.message : 'Unknown',
        supabaseUrl: supabaseUrl || 'undefined',
        hasAnonKey: !!supabaseAnonKey
      },
      'Database initialization failed. Please contact support.'
    );

    logError(appError, {
      action: 'supabase_initialization',
      component: 'supabase'
    });

    // Re-throw the error as this is critical for app functionality
    throw appError;
  }
}

// Ensure single Supabase instance across HMR reloads
export const supabase = (globalThis as any).__supabase__ ?? initializeSupabase();
(globalThis as any).__supabase__ = supabase;

// Utility function for safe Supabase operations
export async function safeSupabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  context: { 
    action: string; 
    table?: string; 
    operation?: string;
    additionalData?: any;
  }
): Promise<{ data?: T | null; error?: AppError }> {
  try {
    const result = await operation();
    
    if (result.error) {
      const appError = new AppError(
        `Supabase ${context.operation || 'operation'} failed: ${result.error.message}`,
        ErrorType.DATABASE,
        ErrorSeverity.MEDIUM,
        { 
          supabaseError: result.error,
          table: context.table,
          ...context.additionalData
        },
        'Database operation failed. Please try again.'
      );

      logError(appError, {
        action: context.action,
        component: 'supabase',
        additionalData: {
          table: context.table,
          operation: context.operation,
          ...context.additionalData
        }
      });

      return { error: appError };
    }

    return { data: result.data };
  } catch (error) {
    const appError = new AppError(
      `Supabase operation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ErrorType.DATABASE,
      ErrorSeverity.HIGH,
      { 
        originalError: error instanceof Error ? error.message : 'Unknown',
        table: context.table,
        operation: context.operation,
        ...context.additionalData
      },
      'Database operation failed. Please check your connection and try again.'
    );

    logError(appError, {
      action: context.action,
      component: 'supabase',
      additionalData: {
        table: context.table,
        operation: context.operation,
        ...context.additionalData
      }
    });

    return { error: appError };
  }
}

// Export types for better type safety
export type SupabaseResult<T> = {
  data?: T | null;
  error?: AppError;
};

export default supabase;