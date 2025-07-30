import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SubscriptionManager } from '@/components/SubscriptionManager';

export const Subscription: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing preferences
          </p>
        </div>
        
        <SubscriptionManager />
      </div>
    </DashboardLayout>
  );
};