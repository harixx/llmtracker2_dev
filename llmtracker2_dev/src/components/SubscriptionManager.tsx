import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Crown, 
  Check, 
  Settings, 
  CreditCard, 
  Calendar, 
  Zap,
  Target,
  BarChart3,
  FileText,
  Users
} from 'lucide-react';

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  current?: boolean;
}

export const SubscriptionManager: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);

  const plans: Plan[] = [
    {
      id: 'trial',
      name: 'Trial',
      price: 'Free',
      period: '14 days',
      description: 'Perfect for getting started',
      current: profile?.plan === 'trial',
      features: [
        { name: 'Projects', included: true, limit: '1' },
        { name: 'Keywords tracking', included: true, limit: '10' },
        { name: 'Monthly reports', included: true, limit: '5' },
        { name: 'Competitor tracking', included: false },
        { name: 'Advanced analytics', included: false },
        { name: 'Priority support', included: false },
      ],
    },
    {
      id: 'basic',
      name: 'Basic',
      price: '$19',
      period: 'month',
      description: 'Great for small businesses',
      current: profile?.plan === 'basic',
      features: [
        { name: 'Projects', included: true, limit: '3' },
        { name: 'Keywords tracking', included: true, limit: '25' },
        { name: 'Monthly reports', included: true, limit: '15' },
        { name: 'Competitor tracking', included: true, limit: '1' },
        { name: 'Advanced analytics', included: true },
        { name: 'Email support', included: true },
      ],
    },
    {
      id: 'gold',
      name: 'Gold',
      price: '$49',
      period: 'month',
      description: 'Perfect for growing teams',
      current: profile?.plan === 'gold',
      popular: true,
      features: [
        { name: 'Projects', included: true, limit: '10' },
        { name: 'Keywords tracking', included: true, limit: '50' },
        { name: 'Monthly reports', included: true, limit: '50' },
        { name: 'Competitor tracking', included: true, limit: 'Unlimited' },
        { name: 'Advanced analytics', included: true },
        { name: 'Priority support', included: true },
      ],
    },
  ];

  const handleUpgrade = async (planId: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: planId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to checkout",
          description: "Opening Stripe checkout in a new tab...",
        });
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to create checkout session.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setManagingSubscription(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Opening subscription portal",
          description: "Redirecting to Stripe customer portal...",
        });
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Portal Error",
        description: error.message || "Failed to open subscription portal.",
        variant: "destructive",
      });
    } finally {
      setManagingSubscription(false);
    }
  };

  const getTrialDaysRemaining = () => {
    if (!profile?.trial_ends_at) return 0;
    const now = new Date();
    const trialEnd = new Date(profile.trial_ends_at);
    const timeDiff = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  };

  return (
    <div className="space-y-8">
      {/* Current Plan Status */}
      {profile && (
        <Card className="card-gradient">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {profile.plan === 'gold' && <Crown className="h-5 w-5 text-yellow-500" />}
                  Current Plan: {profile.plan?.toUpperCase() || 'TRIAL'}
                </CardTitle>
                <CardDescription>
                  {profile.plan === 'trial' && profile.trial_ends_at && (
                    <>Trial expires in {getTrialDaysRemaining()} days</>
                  )}
                  {profile.plan !== 'trial' && profile.plan_expires_at && (
                    <>Next billing: {new Date(profile.plan_expires_at).toLocaleDateString()}</>
                  )}
                </CardDescription>
              </div>
              {profile.plan !== 'trial' && (
                <Button 
                  onClick={handleManageSubscription}
                  disabled={managingSubscription}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {managingSubscription ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Settings className="h-4 w-4" />
                  )}
                  Manage Subscription
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>Projects: {profile.projects_limit === -1 ? '∞' : profile.projects_limit}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span>Keywords: {profile.keywords_limit === -1 ? '∞' : profile.keywords_limit}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Reports: {profile.reports_limit === -1 ? '∞' : profile.reports_limit}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Competitors: Available</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Selection */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Choose Your Plan</h2>
          <p className="text-muted-foreground">
            Select the perfect plan for your keyword tracking needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''} ${plan.current ? 'ring-2 ring-primary' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {plan.current && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="secondary">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center gap-2">
                  {plan.name === 'Gold' && <Crown className="h-5 w-5 text-yellow-500" />}
                  {plan.name}
                </CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">
                    {plan.price}
                    {plan.price !== 'Free' && (
                      <span className="text-base font-normal text-muted-foreground">
                        /{plan.period}
                      </span>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className={`flex-shrink-0 ${feature.included ? 'text-green-500' : 'text-muted-foreground'}`}>
                        <Check className="h-4 w-4" />
                      </div>
                      <span className={feature.included ? '' : 'text-muted-foreground line-through'}>
                        {feature.name}
                        {feature.limit && feature.included && (
                          <span className="text-muted-foreground"> ({feature.limit})</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <Separator />

                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isLoading || plan.current}
                  className={`w-full ${plan.popular ? 'gradient-primary text-white' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : plan.current ? (
                    'Current Plan'
                  ) : plan.id === 'trial' ? (
                    'Start Free Trial'
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Upgrade to {plan.name}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};