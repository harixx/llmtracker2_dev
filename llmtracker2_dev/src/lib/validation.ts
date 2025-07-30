import { z } from 'zod';

// Project validation schemas
export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  brand_name: z.string().min(1, 'Brand name is required').max(100, 'Brand name must be less than 100 characters'),
  competitors: z.array(z.string().min(1).max(100)).max(20, 'Maximum 20 competitors allowed').optional(),
});

// Keyword validation schemas
export const keywordSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required').max(100, 'Keyword must be less than 100 characters'),
  priority: z.number().min(1).max(5).optional(),
});

// Auth validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().min(1, 'Full name is required').max(100, 'Name must be less than 100 characters').optional(),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Utility functions for sanitization
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizeArray = (array: string[]): string[] => {
  return array.map(item => sanitizeInput(item)).filter(item => item.length > 0);
};

// Rate limiting utilities
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();

  return (key: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key)!;
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    requests.set(key, recentRequests);
    
    return true;
  };
};