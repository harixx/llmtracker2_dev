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
import { Crown, Clock, Zap } from 'lucide-react';

interface TrialExpiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade: () => void;
}

export const TrialExpiredDialog: React.FC<TrialExpiredDialogProps> = ({
  open,
  onOpenChange,
  onUpgrade,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <AlertDialogTitle className="text-xl">
            Your Trial Has Expired
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Your free trial period has ended. Upgrade to a paid plan to continue 
            using LLM Tracker and unlock powerful features.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Unlock Premium Features:
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                Track unlimited keywords
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                Generate unlimited reports
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                Monitor competitor performance
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                Advanced analytics and insights
              </li>
            </ul>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto">
            Continue with Limited Access
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              onClick={onUpgrade}
              className="w-full sm:w-auto gradient-primary text-white"
            >
              <Crown className="mr-2 h-4 w-4" />
              Upgrade Now
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};