import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectDialog } from '@/components/ProjectDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Target, 
  FileText, 
  BarChart3, 
  Plus, 
  Users, 
  TrendingUp,
  Crown,
  Calendar,
  Clock
} from 'lucide-react';
import { useCompetitorStats } from '@/hooks/useCompetitorStats';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { UpgradePrompter } from '@/components/UpgradePrompter';

interface Project {
  id: string;
  name: string;
  description?: string | null;
  brand_name: string;
  competitors?: string[] | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  keywords_count?: number;
}

export const Dashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { competitorCount, loading: competitorLoading } = useCompetitorStats();
  const { isTrialExpired, daysRemaining } = useTrialStatus();
  const [stats, setStats] = useState({
    projects: 0,
    keywords: 0,
    reports: 0,
    recentReports: []
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [canCreateProject, setCanCreateProject] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch projects with keyword counts
      const { data: projectsData } = await supabase
        .from('projects')
        .select(`
          *,
          keywords (count)
        `)
        .order('created_at', { ascending: false });

      // Fetch project count
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      // Fetch keyword count
      const { count: keywordCount } = await supabase
        .from('keywords')
        .select('*', { count: 'exact', head: true });

      // Fetch report count
      const { count: reportCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });

      // Fetch recent reports
      const { data: recentReports } = await supabase
        .from('reports')
        .select(`
          id,
          report_type,
          status,
          created_at,
          projects (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      const processedProjects = (projectsData || []).map(project => ({
        ...project,
        keywords_count: project.keywords?.[0]?.count || 0
      }));

      setProjects(processedProjects);
      setStats({
        projects: projectCount || 0,
        keywords: keywordCount || 0,
        reports: reportCount || 0,
        recentReports: recentReports || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData: { name: string; description?: string; brand_name: string; competitors?: string[] }) => {
    if (!user) return;
    
    // Check if user can create projects (trial expired or limit reached)
    if (!canCreateProject) {
      return;
    }
    
    setOperationLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: projectData.name,
          description: projectData.description || null,
          brand_name: projectData.brand_name,
          competitors: projectData.competitors || null,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => [{...data, keywords_count: 0}, ...prev]);
      setStats(prev => ({ ...prev, projects: prev.projects + 1 }));
      setProjectDialogOpen(false);
      setSelectedProject(null);
      
      toast({
        title: "Project created",
        description: "Your new project has been created successfully.",
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOperationLoading(false);
    }
  };

  const handleUpdateProject = async (projectData: { name: string; description?: string; brand_name: string; competitors?: string[] }) => {
    if (!selectedProject) return;
    
    setOperationLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          name: projectData.name,
          description: projectData.description || null,
          brand_name: projectData.brand_name,
          competitors: projectData.competitors || null,
        })
        .eq('id', selectedProject.id)
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => prev.map(p => p.id === selectedProject.id ? {...data, keywords_count: p.keywords_count} : p));
      setProjectDialogOpen(false);
      setSelectedProject(null);
      
      toast({
        title: "Project updated",
        description: "Your project has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    setOperationLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete.id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      setStats(prev => ({ ...prev, projects: prev.projects - 1 }));
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      
      toast({
        title: "Project deleted",
        description: "Your project has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOperationLoading(false);
    }
  };

  const openCreateDialog = () => {
    // Check if user can create projects
    if (!canCreateProject) {
      return;
    }
    setSelectedProject(null);
    setProjectDialogOpen(true);
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setProjectDialogOpen(true);
  };

  const openDeleteDialog = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleViewProject = (project: Project) => {
    navigate(`/project/${project.id}`);
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatReportType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusBadge = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      completed: 'default',
      processing: 'secondary', 
      pending: 'outline',
      failed: 'destructive'
    };
    return variants[status] || 'outline';
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your keyword tracking performance.
          </p>
        </div>

        {/* Plan Status */}
        {profile && (
          <Card className="card-gradient">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {profile.plan === 'gold' && <Crown className="h-5 w-5 text-yellow-500" />}
                    <h3 className="text-lg font-semibold">
                      {profile.plan?.toUpperCase() || 'TRIAL'} Plan
                    </h3>
                  </div>
                   {profile.plan === 'trial' && profile.trial_ends_at && (
                     <Badge 
                       variant={isTrialExpired ? "destructive" : daysRemaining <= 3 ? "destructive" : "secondary"} 
                       className="flex items-center gap-1"
                     >
                       <Clock className="h-3 w-3" />
                       {isTrialExpired ? 'Trial Expired' : `${daysRemaining} days left`}
                     </Badge>
                   )}
                </div>
                 <Button 
                   className="gradient-primary text-white"
                   onClick={() => navigate('/subscription')}
                 >
                   {isTrialExpired ? 'Upgrade Now' : 'Upgrade Plan'}
                 </Button>
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Projects</span>
                    <span className={getUsageColor(getUsagePercentage(stats.projects, profile.projects_limit))}>
                      {stats.projects} / {profile.projects_limit}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(stats.projects, profile.projects_limit)} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Keywords</span>
                    <span className={getUsageColor(getUsagePercentage(stats.keywords, profile.keywords_limit))}>
                      {stats.keywords} / {profile.keywords_limit}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(stats.keywords, profile.keywords_limit)} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Reports</span>
                    <span className={getUsageColor(getUsagePercentage(stats.reports, profile.reports_limit))}>
                      {stats.reports} / {profile.reports_limit}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(stats.reports, profile.reports_limit)} 
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-gradient">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.projects}</div>
              <p className="text-xs text-muted-foreground">
                Active tracking projects
              </p>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Keywords</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.keywords}</div>
              <p className="text-xs text-muted-foreground">
                Being monitored
              </p>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reports}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Competitors Tracked</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {competitorLoading ? '...' : competitorCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all projects
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
              <p className="text-muted-foreground">
                Manage your keyword tracking projects
              </p>
            </div>
            <Button 
              onClick={openCreateDialog} 
              className="gradient-primary text-white"
              disabled={!canCreateProject}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onView={handleViewProject}
                  onEdit={openEditDialog}
                  onDelete={openDeleteDialog}
                />
              ))}
            </div>
          ) : (
            <Card className="card-gradient">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Create your first project to start tracking keywords and monitoring performance.
                </p>
                 <Button 
                   onClick={openCreateDialog} 
                   className="gradient-primary text-white"
                   disabled={!canCreateProject}
                 >
                   <Plus className="mr-2 h-4 w-4" />
                   Create Your First Project
                 </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions & Recent Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Get started with these common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={openCreateDialog} 
                className="w-full justify-start" 
                variant="outline"
                disabled={!canCreateProject}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Project
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                Your latest generated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
                  ))}
                </div>
              ) : stats.recentReports.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentReports.map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {formatReportType(report.report_type)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.projects?.name || 'Unknown Project'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusBadge(report.status)}>
                          {report.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-8 w-8 mb-2" />
                  <p>No reports generated yet</p>
                  <p className="text-xs">Create a project to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upgrade Prompter */}
      <UpgradePrompter 
        usage={{
          projects: stats.projects,
          keywords: stats.keywords,
          reports: stats.reports,
          competitors: competitorCount,
        }}
        onLimitCheck={(limitType, canProceed) => {
          if (limitType === 'projects') {
            setCanCreateProject(canProceed);
          }
        }}
      />

      {/* Project Dialog */}
      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        project={selectedProject}
        onSave={selectedProject ? handleUpdateProject : handleCreateProject}
        loading={operationLoading}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              "{projectToDelete?.name}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={operationLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={operationLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {operationLoading ? 'Deleting...' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};