
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithGitHub: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  profile: any;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile(data);
      
      // Check subscription status after fetching profile
      await checkSubscriptionStatus();
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      
      console.log('Subscription status:', data);
      // Profile will be updated automatically by the edge function
      await refreshProfile();
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Initial session check:', session, error);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { performRobustSignIn } = await import('@/components/auth/AuthCleanup');
      const result = await performRobustSignIn(email, password);
      
      if (result.error) {
        toast({
          title: "Sign in failed",
          description: result.error.message,
          variant: "destructive",
        });
      }
      
      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    try {
      const { performRobustSignUp } = await import('@/components/auth/AuthCleanup');
      const result = await performRobustSignUp(email, password, fullName);
      
      if (result.error) {
        toast({
          title: "Sign up failed",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to complete your registration.",
        });
      }
      
      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      return { data: null, error };
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { performRobustOAuthSignIn } = await import('@/components/auth/AuthCleanup');
      const result = await performRobustOAuthSignIn('google');
      
      if (result.error) {
        toast({
          title: "Google sign in failed",
          description: result.error.message,
          variant: "destructive",
        });
      }
      
      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      return { data: null, error };
    }
  };

  const signInWithGitHub = async () => {
    setLoading(true);
    try {
      const { performRobustOAuthSignIn } = await import('@/components/auth/AuthCleanup');
      const result = await performRobustOAuthSignIn('github');
      
      if (result.error) {
        toast({
          title: "GitHub sign in failed",
          description: result.error.message,
          variant: "destructive",
        });
      }
      
      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { performRobustSignOut } = await import('@/components/auth/AuthCleanup');
      await performRobustSignOut();
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing out. Redirecting anyway...",
        variant: "destructive",
      });
      // Force redirect even if error
      window.location.href = '/auth';
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithGitHub,
      signOut,
      profile,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
