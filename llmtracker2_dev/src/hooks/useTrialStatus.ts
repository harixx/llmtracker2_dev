import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TrialStatus {
  isTrialExpired: boolean;
  daysRemaining: number;
  trialEndsAt: Date | null;
  isLoading: boolean;
}

export const useTrialStatus = (): TrialStatus => {
  const { profile, user } = useAuth();
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    isTrialExpired: false,
    daysRemaining: 0,
    trialEndsAt: null,
    isLoading: true,
  });

  useEffect(() => {
    const checkTrialStatus = async () => {
      if (!profile || !user) {
        setTrialStatus(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Check if user is on trial plan
        if (profile.plan !== 'trial') {
          setTrialStatus({
            isTrialExpired: false,
            daysRemaining: 0,
            trialEndsAt: null,
            isLoading: false,
          });
          return;
        }

        // Use the database function to check trial expiration
        const { data, error } = await supabase.rpc('is_trial_expired', {
          user_profile: profile
        });

        if (error) {
          console.error('Error checking trial status:', error);
          setTrialStatus(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const isExpired = data as boolean;
        const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
        
        let daysRemaining = 0;
        if (trialEndsAt && !isExpired) {
          const now = new Date();
          const timeDiff = trialEndsAt.getTime() - now.getTime();
          daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
        }

        setTrialStatus({
          isTrialExpired: isExpired,
          daysRemaining,
          trialEndsAt,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error in trial status check:', error);
        setTrialStatus(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkTrialStatus();
  }, [profile, user]);

  return trialStatus;
};