import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, AlertTriangle, Target, BarChart3, FileText, Users } from 'lucide-react';

interface LimitReachedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade: () => void;
  limitType: 'projects' | 'keywords' | 'reports' | 'competitors';
  currentUsage: number;
  limit: number;
  planName: string;
}

const limitConfig = {
  projects: {
    icon: Target,
    title: 'Project Limit Reached',
    description: 'You\'ve reached your project limit for the {plan} plan.',
    feature: 'projects',
  },
  keywords: {
    icon: BarChart3,
    title: 'Keyword Limit Reached',
    description: 'You\'ve reached your keyword tracking limit for the {plan} plan.',
    feature: 'keywords',
  },
  reports: {
    icon: FileText,
    title: 'Report Limit Reached',
    description: 'You\'ve reached your monthly report generation limit for the {plan} plan.',
    feature: 'reports',
  },
  competitors: {
    icon: Users,
    title: 'Competitor Tracking Unavailable',
    description: 'Competitor tracking is not available on the {plan} plan.',
    feature: 'competitor tracking',
  },
};

export const LimitReachedDialog: React.FC<LimitReachedDialogProps> = ({
  open,
  onOpenChange,
  onUpgrade,
  limitType,
  currentUsage,
  limit,
  planName,
}) => {
  const config = limitConfig[limitType];
  const Icon = config.icon;
  const usagePercentage = limit > 0 ? (currentUsage / limit) * 100 : 100;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <AlertDialogTitle className="text-xl">
            {config.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {config.description.replace('{plan}', planName.toUpperCase())}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                Current Usage
              </span>
              <Badge variant="destructive">
                {currentUsage} / {limit === -1 ? '∞' : limit}
              </Badge>
            </div>
            {limit > 0 && (
              <Progress value={usagePercentage} className="h-2" />
            )}
          </div>

          {/* Upgrade Benefits */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Upgrade to unlock:</h4>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <span>Basic Plan</span>
                <Badge variant="outline">
                  {limitType === 'projects' ? '3' : 
                   limitType === 'keywords' ? '25' : 
                   limitType === 'reports' ? '15' : '1 competitor'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                <span className="flex items-center gap-1">
                  <Crown className="h-3 w-3 text-yellow-600" />
                  Gold Plan
                </span>
                <Badge className="bg-yellow-600 text-white">
                  {limitType === 'projects' ? '10' : 
                   limitType === 'keywords' ? '50' : 
                   limitType === 'reports' ? '50' : 'Unlimited'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto">
            Continue with Current Plan
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              onClick={onUpgrade}
              className="w-full sm:w-auto gradient-primary text-white"
            >
              <Crown className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};