import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PlanLimits {
  projects: number;
  keywords: number;
  reports: number;
  competitors: number;
  isLoading: boolean;
}

interface Usage {
  projects: number;
  keywords: number;
  reports: number;
  competitors: number;
}

export const usePlanLimits = () => {
  const { profile } = useAuth();
  const [limits, setLimits] = useState<PlanLimits>({
    projects: 0,
    keywords: 0,
    reports: 0,
    competitors: 0,
    isLoading: true,
  });

  useEffect(() => {
    const fetchPlanLimits = async () => {
      if (!profile) {
        setLimits(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_plan_limits', {
          plan_type: profile.plan
        });

        if (error) {
          console.error('Error fetching plan limits:', error);
          setLimits(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const planLimits = data as any;
        setLimits({
          projects: planLimits.projects,
          keywords: planLimits.keywords,
          reports: planLimits.reports,
          competitors: planLimits.competitors,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error in plan limits fetch:', error);
        setLimits(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchPlanLimits();
  }, [profile]);

  const checkLimitReached = (usage: Usage, type: keyof Usage): boolean => {
    const limit = limits[type];
    return limit !== -1 && usage[type] >= limit;
  };

  const getUsagePercentage = (usage: number, limit: number): number => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((usage / limit) * 100, 100);
  };

  return {
    limits,
    checkLimitReached,
    getUsagePercentage,
  };
};