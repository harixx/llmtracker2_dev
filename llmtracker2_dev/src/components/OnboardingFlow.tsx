import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, Target, Zap, BarChart3, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

interface ProjectData {
  name: string;
  description: string;
  brand_name: string;
  competitors: string[];
}

export const OnboardingFlow: React.FC = () => {
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    description: '',
    brand_name: '',
    competitors: []
  });
  const [competitorInput, setCompetitorInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const addCompetitor = () => {
    if (competitorInput.trim() && !projectData.competitors.includes(competitorInput.trim())) {
      setProjectData(prev => ({
        ...prev,
        competitors: [...prev.competitors, competitorInput.trim()]
      }));
      setCompetitorInput('');
    }
  };

  const removeCompetitor = (competitor: string) => {
    setProjectData(prev => ({
      ...prev,
      competitors: prev.competitors.filter(c => c !== competitor)
    }));
  };

  const createProject = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: projectData.name,
          description: projectData.description || null,
          brand_name: projectData.brand_name,
          competitors: projectData.competitors.length > 0 ? projectData.competitors : null,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Project created successfully!",
        description: "You can now start tracking keywords and monitoring performance.",
      });

      // Move to completion step
      setCurrentStep(steps.length - 1);
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to LLM Tracker',
      description: 'Let\'s get you started with keyword tracking and brand monitoring',
      component: (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Welcome, {profile?.full_name || user?.email}!</h2>
              <p className="text-muted-foreground mt-2">
                LLM Tracker helps you monitor your brand presence and track keyword performance across search engines.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">Track Keywords</h3>
              <p className="text-sm text-muted-foreground">Monitor your keyword rankings</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">Monitor Competitors</h3>
              <p className="text-sm text-muted-foreground">Keep an eye on competition</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">Get intelligent insights</p>
            </div>
          </div>
          
          <Button onClick={() => setCurrentStep(1)} className="w-full gradient-primary text-white">
            Get Started
          </Button>
        </div>
      )
    },
    {
      id: 'project-setup',
      title: 'Create Your First Project',
      description: 'Set up a project to organize your keyword tracking',
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="project-name">Project Name *</Label>
              <Input
                id="project-name"
                placeholder="e.g., My Website SEO"
                value={projectData.name}
                onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="brand-name">Brand Name *</Label>
              <Input
                id="brand-name"
                placeholder="e.g., My Company"
                value={projectData.brand_name}
                onChange={(e) => setProjectData(prev => ({ ...prev, brand_name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what you're tracking..."
                value={projectData.description}
                onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setCurrentStep(0)} 
              variant="outline"
            >
              Back
            </Button>
            <Button 
              onClick={() => setCurrentStep(2)} 
              disabled={!projectData.name || !projectData.brand_name}
              className="flex-1 gradient-primary text-white"
            >
              Continue
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'competitors',
      title: 'Add Competitors (Optional)',
      description: 'Track how you compare against your competition',
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="competitor">Add Competitor</Label>
              <div className="flex gap-2">
                <Input
                  id="competitor"
                  placeholder="e.g., Competitor Name"
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
                />
                <Button onClick={addCompetitor} variant="outline">
                  Add
                </Button>
              </div>
            </div>
            
            {projectData.competitors.length > 0 && (
              <div className="space-y-2">
                <Label>Competitors:</Label>
                <div className="flex flex-wrap gap-2">
                  {projectData.competitors.map((competitor) => (
                    <Badge 
                      key={competitor} 
                      variant="secondary" 
                      className="cursor-pointer"
                      onClick={() => removeCompetitor(competitor)}
                    >
                      {competitor} ×
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Click on a competitor to remove them
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setCurrentStep(1)} 
              variant="outline"
            >
              Back
            </Button>
            <Button 
              onClick={createProject}
              disabled={isLoading}
              className="flex-1 gradient-primary text-white"
            >
              {isLoading ? 'Creating Project...' : 'Create Project'}
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'Setup Complete!',
      description: 'You\'re ready to start tracking keywords',
      component: (
        <div className="space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-green-600">All Set!</h2>
            <p className="text-muted-foreground mt-2">
              Your project has been created successfully. You can now start adding keywords and monitoring your brand presence.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full gradient-primary text-white"
            >
              Go to Dashboard
            </Button>
            <p className="text-sm text-muted-foreground">
              Start by adding keywords to track in your project
            </p>
          </div>
        </div>
      )
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Step */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep].title}</CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {steps[currentStep].component}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};