import { supabase } from '@/integrations/supabase/client';

/**
 * Cleanup utility to prevent authentication limbo states
 */
export const cleanupAuthState = () => {
  console.log('🧹 Cleaning up authentication state...');
  
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      console.log(`🗑️ Removing localStorage key: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      console.log(`🗑️ Removing sessionStorage key: ${key}`);
      sessionStorage.removeItem(key);
    }
  });
  
  console.log('✅ Authentication state cleanup completed');
};

/**
 * Robust sign out function
 */
export const performRobustSignOut = async (): Promise<void> => {
  try {
    console.log('🚪 Performing robust sign out...');
    
    // Clean up auth state first
    cleanupAuthState();
    
    // Attempt global sign out (fallback if it fails)
    try {
      await supabase.auth.signOut({ scope: 'global' });
      console.log('✅ Global sign out successful');
    } catch (err) {
      console.warn('⚠️ Global sign out failed, but continuing with cleanup:', err);
    }
    
    // Force page reload for a clean state
    console.log('🔄 Forcing page reload for clean state...');
    window.location.href = '/auth';
  } catch (error) {
    console.error('❌ Error during robust sign out:', error);
    // Force redirect even if there's an error
    window.location.href = '/auth';
  }
};

/**
 * Enhanced sign in with proper cleanup
 */
export const performRobustSignIn = async (
  email: string, 
  password: string
): Promise<{ data: any; error: any }> => {
  try {
    console.log('🔐 Performing robust sign in...');
    
    // Clean up existing state first
    cleanupAuthState();
    
    // Attempt global sign out to clear any existing sessions
    try {
      await supabase.auth.signOut({ scope: 'global' });
      console.log('✅ Pre-signin cleanup successful');
    } catch (err) {
      console.warn('⚠️ Pre-signin cleanup failed, but continuing:', err);
    }
    
    // Wait a moment for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Sign in with email/password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Sign in error:', error);
      return { data: null, error };
    }
    
    if (data.user) {
      console.log('✅ Sign in successful, forcing page reload...');
      // Force page reload for clean state
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 100);
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error in robust sign in:', error);
    return { data: null, error };
  }
};

/**
 * Enhanced sign up with proper cleanup and redirect configuration
 */
export const performRobustSignUp = async (
  email: string, 
  password: string, 
  fullName?: string
): Promise<{ data: any; error: any }> => {
  try {
    console.log('📝 Performing robust sign up...');
    
    // Clean up existing state first
    cleanupAuthState();
    
    // Attempt global sign out to clear any existing sessions
    try {
      await supabase.auth.signOut({ scope: 'global' });
      console.log('✅ Pre-signup cleanup successful');
    } catch (err) {
      console.warn('⚠️ Pre-signup cleanup failed, but continuing:', err);
    }
    
    // Wait a moment for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get the redirect URL
    const redirectUrl = `${window.location.origin}/dashboard`;
    console.log('🔗 Using redirect URL:', redirectUrl);
    
    // Sign up with email/password and proper redirect
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: fullName ? { full_name: fullName } : undefined,
      }
    });
    
    if (error) {
      console.error('❌ Sign up error:', error);
      return { data: null, error };
    }
    
    console.log('✅ Sign up successful');
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error in robust sign up:', error);
    return { data: null, error };
  }
};

/**
 * Enhanced OAuth sign in with proper cleanup
 */
export const performRobustOAuthSignIn = async (
  provider: 'google' | 'github'
): Promise<{ data: any; error: any }> => {
  try {
    console.log(`🔐 Performing robust ${provider} OAuth sign in...`);
    
    // Clean up existing state first
    cleanupAuthState();
    
    // Attempt global sign out to clear any existing sessions
    try {
      await supabase.auth.signOut({ scope: 'global' });
      console.log('✅ Pre-OAuth cleanup successful');
    } catch (err) {
      console.warn('⚠️ Pre-OAuth cleanup failed, but continuing:', err);
    }
    
    // Wait a moment for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get the redirect URL
    const redirectUrl = `${window.location.origin}/dashboard`;
    console.log('🔗 Using OAuth redirect URL:', redirectUrl);
    
    // Sign in with OAuth provider
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      }
    });
    
    if (error) {
      console.error(`❌ ${provider} OAuth error:`, error);
      return { data: null, error };
    }
    
    console.log(`✅ ${provider} OAuth initiated successfully`);
    return { data, error: null };
  } catch (error) {
    console.error(`❌ Error in ${provider} OAuth sign in:`, error);
    return { data: null, error };
  }
};