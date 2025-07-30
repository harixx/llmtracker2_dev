import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Settings, BarChart3, Target, FileText, Crown, CreditCard } from 'lucide-react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'trial':
        return 'secondary';
      case 'basic':
        return 'default';
      case 'gold':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getPlanIcon = (plan: string) => {
    if (plan === 'gold') return <Crown className="h-3 w-3" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                LLM Tracker
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {profile && (
              <Badge variant={getPlanBadgeVariant(profile.plan)} className="flex items-center gap-1">
                {getPlanIcon(profile.plan)}
                {profile.plan?.toUpperCase() || 'TRIAL'}
              </Badge>
            )}
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{profile?.full_name || user.email}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container px-4">
          <div className="flex h-12 items-center space-x-6">
            <Button 
              variant={location.pathname === '/dashboard' ? 'default' : 'ghost'} 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => navigate('/dashboard')}
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Button>
            <Button 
              variant={location.pathname === '/projects' ? 'default' : 'ghost'} 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => navigate('/projects')}
            >
              <Target className="h-4 w-4" />
              Projects
            </Button>
            <Button 
              variant={location.pathname === '/reports' ? 'default' : 'ghost'} 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => navigate('/reports')}
            >
              <FileText className="h-4 w-4" />
              Reports
            </Button>
            <Button 
              variant={location.pathname === '/subscription' ? 'default' : 'ghost'} 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => navigate('/subscription')}
            >
              <CreditCard className="h-4 w-4" />
              Subscription
            </Button>
            <Button 
              variant={location.pathname === '/settings' ? 'default' : 'ghost'} 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container px-4 py-8">
        {children}
      </main>
    </div>
  );
};