import { useState, useCallback } from 'react';
import { createRateLimiter } from '@/lib/validation';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  key?: string;
}

export const useRateLimit = ({ maxRequests, windowMs, key = 'default' }: RateLimitConfig) => {
  const [isLimited, setIsLimited] = useState(false);
  const rateLimiter = createRateLimiter(maxRequests, windowMs);

  const checkLimit = useCallback((customKey?: string): boolean => {
    const limitKey = customKey || key;
    const canProceed = rateLimiter(limitKey);
    setIsLimited(!canProceed);
    return canProceed;
  }, [rateLimiter, key]);

  return { isLimited, checkLimit };
};