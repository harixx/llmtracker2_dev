import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { TrialExpiredDialog } from './TrialExpiredDialog';
import { LimitReachedDialog } from './LimitReachedDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Usage {
  projects: number;
  keywords: number;
  reports: number;
  competitors: number;
}

interface UpgradePrompterProps {
  usage: Usage;
  onLimitCheck?: (limitType: string, canProceed: boolean) => void;
}

export const UpgradePrompter: React.FC<UpgradePrompterProps> = ({ 
  usage, 
  onLimitCheck 
}) => {
  const { profile } = useAuth();
  const { isTrialExpired, daysRemaining } = useTrialStatus();
  const { limits, checkLimitReached } = usePlanLimits();
  
  const [showTrialExpired, setShowTrialExpired] = useState(false);
  const [showLimitReached, setShowLimitReached] = useState(false);
  const [limitReachedType, setLimitReachedType] = useState<'projects' | 'keywords' | 'reports' | 'competitors'>('projects');
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  // Show trial expired dialog when trial expires
  useEffect(() => {
    if (isTrialExpired && profile?.plan === 'trial') {
      setShowTrialExpired(true);
    }
  }, [isTrialExpired, profile?.plan]);

  // Check limits and notify parent component
  useEffect(() => {
    if (!onLimitCheck || limits.isLoading) return;

    const limitTypes = ['projects', 'keywords', 'reports', 'competitors'] as const;
    
    limitTypes.forEach(type => {
      const limitReached = checkLimitReached(usage, type);
      onLimitCheck(type, !limitReached);
    });
  }, [usage, limits, checkLimitReached, onLimitCheck]);

  const handleLimitReached = (limitType: 'projects' | 'keywords' | 'reports' | 'competitors') => {
    if (profile?.plan === 'trial' && isTrialExpired) {
      setShowTrialExpired(true);
    } else {
      setLimitReachedType(limitType);
      setShowLimitReached(true);
    }
  };

  const handleUpgrade = async () => {
    setIsCreatingCheckout(true);
    
    try {
      // Create checkout session (this would be your Stripe integration)
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: 'basic' } // Default to basic plan, could be made configurable
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        setShowTrialExpired(false);
        setShowLimitReached(false);
        
        toast({
          title: "Redirecting to checkout",
          description: "Opening Stripe checkout in a new tab...",
        });
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const checkProjectLimit = () => {
    if (checkLimitReached(usage, 'projects')) {
      handleLimitReached('projects');
      return false;
    }
    return true;
  };

  const checkKeywordLimit = () => {
    if (checkLimitReached(usage, 'keywords')) {
      handleLimitReached('keywords');
      return false;
    }
    return true;
  };

  const checkReportLimit = () => {
    if (checkLimitReached(usage, 'reports')) {
      handleLimitReached('reports');
      return false;
    }
    return true;
  };

  const checkCompetitorLimit = () => {
    if (checkLimitReached(usage, 'competitors')) {
      handleLimitReached('competitors');
      return false;
    }
    return true;
  };

  // Expose check methods for external use
  React.useImperativeHandle(React.createRef(), () => ({
    checkProjectLimit,
    checkKeywordLimit,
    checkReportLimit,
    checkCompetitorLimit,
  }));

  return (
    <>
      <TrialExpiredDialog
        open={showTrialExpired}
        onOpenChange={setShowTrialExpired}
        onUpgrade={handleUpgrade}
      />

      <LimitReachedDialog
        open={showLimitReached}
        onOpenChange={setShowLimitReached}
        onUpgrade={handleUpgrade}
        limitType={limitReachedType}
        currentUsage={usage[limitReachedType]}
        limit={limits[limitReachedType]}
        planName={profile?.plan || 'trial'}
      />
    </>
  );
};

// Export individual check functions for easier use
export const createLimitChecker = (upgradePrompter: React.RefObject<any>) => ({
  checkProjectLimit: () => upgradePrompter.current?.checkProjectLimit() ?? true,
  checkKeywordLimit: () => upgradePrompter.current?.checkKeywordLimit() ?? true,
  checkReportLimit: () => upgradePrompter.current?.checkReportLimit() ?? true,
  checkCompetitorLimit: () => upgradePrompter.current?.checkCompetitorLimit() ?? true,
});