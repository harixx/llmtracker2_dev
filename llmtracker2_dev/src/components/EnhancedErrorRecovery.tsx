import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  Database, 
  Key, 
  Settings,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ErrorRecoveryProps {
  error?: Error | null;
  onRetry?: () => void;
  context?: string;
}

interface SystemCheck {
  id: string;
  name: string;
  status: 'checking' | 'passed' | 'failed' | 'warning';
  message: string;
  action?: () => void;
  actionLabel?: string;
}

export const EnhancedErrorRecovery: React.FC<ErrorRecoveryProps> = ({ 
  error, 
  onRetry,
  context = 'application' 
}) => {
  const { user, session } = useAuth();
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([]);

  const runSystemDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    const checks: SystemCheck[] = [
      {
        id: 'network',
        name: 'Network Connection',
        status: 'checking',
        message: 'Checking internet connectivity...'
      },
      {
        id: 'auth',
        name: 'Authentication Status',
        status: 'checking',
        message: 'Verifying authentication...'
      },
      {
        id: 'database',
        name: 'Database Connection',
        status: 'checking',
        message: 'Testing database connectivity...'
      },
      {
        id: 'edge-functions',
        name: 'Edge Functions',
        status: 'checking',
        message: 'Checking edge function availability...'
      }
    ];

    setSystemChecks(checks);

    // Network check
    try {
      await fetch('https://httpbin.org/get', { method: 'GET', mode: 'no-cors' });
      checks[0] = { ...checks[0], status: 'passed', message: 'Network connection is working' };
    } catch (error) {
      checks[0] = { 
        ...checks[0], 
        status: 'failed', 
        message: 'Network connection failed. Check your internet connection.',
        action: () => window.location.reload(),
        actionLabel: 'Retry'
      };
    }

    // Auth check
    if (user && session) {
      checks[1] = { ...checks[1], status: 'passed', message: 'User authenticated successfully' };
    } else {
      checks[1] = { 
        ...checks[1], 
        status: 'warning', 
        message: 'User not authenticated',
        action: () => window.location.href = '/auth',
        actionLabel: 'Sign In'
      };
    }

    // Database check
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) throw error;
      checks[2] = { ...checks[2], status: 'passed', message: 'Database connection successful' };
    } catch (error) {
      checks[2] = { 
        ...checks[2], 
        status: 'failed', 
        message: 'Database connection failed. Service may be temporarily unavailable.',
        action: () => window.location.reload(),
        actionLabel: 'Retry'
      };
    }

    // Edge functions check
    try {
      const { error } = await supabase.functions.invoke('ai-analysis', { 
        body: { prompt: 'test', type: 'test', maxTokens: 10 }
      });
      // We expect this to fail due to missing API key, but it shows the function is accessible
      if (error && error.message.includes('OpenAI API key not configured')) {
        checks[3] = { 
          ...checks[3], 
          status: 'warning', 
          message: 'Edge functions accessible but API keys not configured',
          action: () => window.location.href = '/settings',
          actionLabel: 'Configure'
        };
      } else if (error && error.message.includes('Network error')) {
        checks[3] = { 
          ...checks[3], 
          status: 'failed', 
          message: 'Edge functions not accessible',
          action: () => window.location.reload(),
          actionLabel: 'Retry'
        };
      } else {
        checks[3] = { ...checks[3], status: 'passed', message: 'Edge functions working correctly' };
      }
    } catch (error) {
      checks[3] = { 
        ...checks[3], 
        status: 'failed', 
        message: 'Edge functions test failed',
        action: () => window.location.reload(),
        actionLabel: 'Retry'
      };
    }

    setSystemChecks([...checks]);
    setIsRunningDiagnostics(false);

    // Show summary toast
    const failedChecks = checks.filter(c => c.status === 'failed').length;
    const warningChecks = checks.filter(c => c.status === 'warning').length;
    
    if (failedChecks === 0 && warningChecks === 0) {
      toast({
        title: "System Diagnostics Complete",
        description: "All systems are operational",
      });
    } else if (failedChecks > 0) {
      toast({
        title: "Issues Detected",
        description: `${failedChecks} critical issues and ${warningChecks} warnings found`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Minor Issues Detected",
        description: `${warningChecks} warnings found - system mostly operational`,
      });
    }
  };

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: SystemCheck['status']) => {
    switch (status) {
      case 'checking':
        return <Badge variant="secondary">Checking</Badge>;
      case 'passed':
        return <Badge className="bg-green-100 text-green-800">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getErrorSuggestions = (error: Error) => {
    const message = error.message.toLowerCase();
    const suggestions = [];

    if (message.includes('network') || message.includes('fetch')) {
      suggestions.push({
        title: 'Network Issue',
        description: 'Check your internet connection and try again',
        action: () => window.location.reload(),
        actionLabel: 'Reload Page'
      });
    }

    if (message.includes('auth') || message.includes('unauthorized')) {
      suggestions.push({
        title: 'Authentication Issue',
        description: 'You may need to sign in again',
        action: () => window.location.href = '/auth',
        actionLabel: 'Sign In'
      });
    }

    if (message.includes('api key') || message.includes('openai')) {
      suggestions.push({
        title: 'API Configuration',
        description: 'OpenAI API key may not be configured properly',
        action: () => window.location.href = '/settings',
        actionLabel: 'Configure API'
      });
    }

    if (message.includes('rate limit') || message.includes('quota')) {
      suggestions.push({
        title: 'Rate Limit Exceeded',
        description: 'Wait a moment before trying again or upgrade your plan',
        action: () => window.location.href = '/subscription',
        actionLabel: 'View Plans'
      });
    }

    return suggestions;
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-semibold">Error in {context}</div>
              <div className="text-sm">{error.message}</div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Error Recovery Tools
          </CardTitle>
          <CardDescription>
            Use these tools to diagnose and fix common issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Operation
              </Button>
            )}
            <Button 
              onClick={runSystemDiagnostics} 
              disabled={isRunningDiagnostics}
              variant="outline"
            >
              {isRunningDiagnostics ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Run Diagnostics
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
          </div>

          {/* Error-specific suggestions */}
          {error && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Suggested Actions:</h4>
              <div className="space-y-2">
                {getErrorSuggestions(error).map((suggestion, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{suggestion.title}</div>
                      <div className="text-xs text-muted-foreground">{suggestion.description}</div>
                    </div>
                    <Button size="sm" onClick={suggestion.action}>
                      {suggestion.actionLabel}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      {systemChecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              System Diagnostics
            </CardTitle>
            <CardDescription>
              Current status of system components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemChecks.map((check) => (
                <div key={check.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <div className="font-medium text-sm">{check.name}</div>
                      <div className="text-xs text-muted-foreground">{check.message}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(check.status)}
                    {check.action && (
                      <Button size="sm" variant="outline" onClick={check.action}>
                        {check.actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Help */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Need More Help?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            If the issue persists, try these additional steps:
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground ml-4">
            <li>• Clear your browser cache and cookies</li>
            <li>• Try using a different browser or incognito mode</li>
            <li>• Check if the issue occurs on other devices</li>
            <li>• Ensure your browser is up to date</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};