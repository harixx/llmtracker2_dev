import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useRateLimit } from '@/hooks/useRateLimit';
import { Brain, Zap } from 'lucide-react';

interface AIAnalysisButtonProps {
  prompt: string;
  type?: 'analysis' | 'suggestion';
  onResult?: (result: string) => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
}

export const AIAnalysisButton: React.FC<AIAnalysisButtonProps> = ({
  prompt,
  type = 'analysis',
  onResult,
  disabled = false,
  variant = 'outline',
  size = 'default',
  children
}) => {
  const [loading, setLoading] = useState(false);
  const { isLimited, checkLimit } = useRateLimit({ 
    maxRequests: 10, 
    windowMs: 60000, // 1 minute
    key: 'ai-analysis' 
  });

  const handleAnalysis = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "No data to analyze",
        variant: "destructive",
      });
      return;
    }

    if (!checkLimit()) {
      toast({
        title: "Rate limit exceeded",
        description: "Please wait a moment before requesting another analysis",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: { prompt, type, maxTokens: 800 }
      });

      if (error) throw error;

      if (data?.analysis) {
        onResult?.(data.analysis);
        toast({
          title: "Analysis complete",
          description: "AI analysis has been generated successfully",
        });
      } else {
        throw new Error('No analysis returned');
      }
    } catch (error: any) {
      console.error('AI Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to generate analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAnalysis}
      disabled={disabled || loading || isLimited}
      variant={variant}
      size={size}
      className="gap-2"
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : type === 'analysis' ? (
        <Brain className="h-4 w-4" />
      ) : (
        <Zap className="h-4 w-4" />
      )}
      {children || (type === 'analysis' ? 'Analyze' : 'Get Suggestions')}
    </Button>
  );
};