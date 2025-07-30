import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BrandTrackingResults } from '@/components/BrandTrackingResults';
import { RawResponseDialog } from '@/components/RawResponseDialog';
import { CompetitorMatrix } from '@/components/CompetitorMatrix';
import { CompetitorTable } from '@/components/CompetitorTable';
import { analyzeBrandMention, BrandAnalysisResult } from '@/lib/openai';
import { ArrowLeft, Plus, X, FileText, Save, Key } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string | null;
  brand_name: string;
  competitors?: string[] | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface Keyword {
  id: string;
  keyword: string;
  project_id: string;
  created_at: string;
}

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [brandName, setBrandName] = useState('');
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  
  // Brand tracking states
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [brandTrackingResults, setBrandTrackingResults] = useState<BrandAnalysisResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<BrandAnalysisResult | null>(null);
  const [showRawDialog, setShowRawDialog] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  
  // Context dialog states
  const [showContextDialog, setShowContextDialog] = useState(false);
  const [contextData, setContextData] = useState<{
    brand: string;
    keyword: string;
    context: string;
  } | null>(null);

  useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id]);

  const fetchProjectData = async () => {
    if (!id) return;
    
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;

      // Fetch keywords for this project
      const { data: keywordsData, error: keywordsError } = await supabase
        .from('keywords')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (keywordsError) throw keywordsError;

      setProject(projectData);
      setKeywords(keywordsData || []);
      setBrandName(projectData.brand_name);
      setCompetitors(projectData.competitors || []);
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast({
        title: "Error",
        description: "Failed to load project data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBrandName = async () => {
    if (!project || !brandName.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ brand_name: brandName })
        .eq('id', project.id);

      if (error) throw error;

      setProject(prev => prev ? { ...prev, brand_name: brandName } : null);
      toast({
        title: "Success",
        description: "Brand name updated successfully.",
      });
    } catch (error) {
      console.error('Error updating brand name:', error);
      toast({
        title: "Error",
        description: "Failed to update brand name.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddCompetitor = async () => {
    if (!project || !newCompetitor.trim()) return;

    const updatedCompetitors = [...competitors, newCompetitor.trim()];
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ competitors: updatedCompetitors })
        .eq('id', project.id);

      if (error) throw error;

      setCompetitors(updatedCompetitors);
      setNewCompetitor('');
      toast({
        title: "Success",
        description: "Competitor added successfully.",
      });
    } catch (error) {
      console.error('Error adding competitor:', error);
      toast({
        title: "Error",
        description: "Failed to add competitor.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCompetitor = async (competitorToRemove: string) => {
    if (!project) return;

    const updatedCompetitors = competitors.filter(c => c !== competitorToRemove);
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ competitors: updatedCompetitors })
        .eq('id', project.id);

      if (error) throw error;

      setCompetitors(updatedCompetitors);
      toast({
        title: "Success",
        description: "Competitor removed successfully.",
      });
    } catch (error) {
      console.error('Error removing competitor:', error);
      toast({
        title: "Error",
        description: "Failed to remove competitor.",
        variant: "destructive",
      });
    }
  };

  const handleAddKeyword = async () => {
    if (!project || !newKeyword.trim()) return;

    try {
      const { data, error } = await supabase
        .from('keywords')
        .insert([{
          keyword: newKeyword.trim(),
          project_id: project.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setKeywords(prev => [data, ...prev]);
      setNewKeyword('');
      toast({
        title: "Success",
        description: "Keyword added successfully.",
      });
    } catch (error) {
      console.error('Error adding keyword:', error);
      toast({
        title: "Error",
        description: "Failed to add keyword.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveKeyword = async (keywordId: string) => {
    try {
      const { error } = await supabase
        .from('keywords')
        .delete()
        .eq('id', keywordId);

      if (error) throw error;

      setKeywords(prev => prev.filter(k => k.id !== keywordId));
      toast({
        title: "Success",
        description: "Keyword removed successfully.",
      });
    } catch (error) {
      console.error('Error removing keyword:', error);
      toast({
        title: "Error",
        description: "Failed to remove keyword.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReport = async () => {
    if (!project || keywords.length === 0) return;

    if (!openaiApiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key to generate the report.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingReport(true);
    setBrandTrackingResults([]);

    try {
      // Create report record
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .insert({
          project_id: project.id,
          report_type: 'keyword_tracking',
          status: 'processing',
          user_id: project.user_id,
        })
        .select()
        .single();

      if (reportError) throw reportError;

      const results: BrandAnalysisResult[] = [];

      // Analyze each keyword
      for (const keyword of keywords) {
        try {
          const result = await analyzeBrandMention(
            keyword.keyword,
            brandName,
            competitors,
            openaiApiKey
          );
          
          results.push(result);
          setBrandTrackingResults([...results]); // Update UI progressively

          // Store API response
          await supabase
            .from('api_responses')
            .insert({
              report_id: reportData.id,
              keyword: keyword.keyword,
              provider: 'openai',
              raw_response: { analysis: result.rawResponse },
              response_metadata: {
                brandMentioned: result.brandMentioned,
                position: result.position,
                confidence: result.confidence,
                context: result.context,
              },
            });

        } catch (error) {
          console.error(`Error analyzing keyword ${keyword.keyword}:`, error);
          toast({
            title: "Analysis Error",
            description: `Failed to analyze keyword: ${keyword.keyword}`,
            variant: "destructive",
          });
        }
      }

      // Update report with final results
      await supabase
        .from('reports')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          results: {
            summary: {
              totalKeywords: keywords.length,
              brandMentioned: results.filter(r => r.brandMentioned).length,
              averageConfidence: results.reduce((acc, r) => acc + r.confidence, 0) / results.length,
            },
            keywords: results.map(r => ({
              keyword: r.keyword,
              brandMentioned: r.brandMentioned,
              position: r.position,
              confidence: r.confidence,
            })),
          },
        })
        .eq('id', reportData.id);

      toast({
        title: "Report Generated",
        description: `Successfully analyzed ${results.length} keywords. Brand mentioned in ${results.filter(r => r.brandMentioned).length} keywords.`,
      });

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-muted-foreground">Loading project...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
            <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Brand Name */}
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle>Brand Name</CardTitle>
              <CardDescription>
                Update your brand name for this project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Enter brand name"
                />
                <Button 
                  onClick={handleSaveBrandName}
                  disabled={saving || !brandName.trim()}
                  size="sm"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Competitors */}
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle>Competitors</CardTitle>
              <CardDescription>
                Manage your competitor list for tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={newCompetitor}
                  onChange={(e) => setNewCompetitor(e.target.value)}
                  placeholder="competitor.com"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCompetitor()}
                />
                <Button 
                  onClick={handleAddCompetitor}
                  disabled={!newCompetitor.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {competitors.map((competitor) => (
                  <Badge key={competitor} variant="secondary" className="flex items-center gap-1">
                    {competitor}
                    <button
                      onClick={() => handleRemoveCompetitor(competitor)}
                      className="ml-1 rounded-full hover:bg-destructive/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Keywords */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>Keywords ({keywords.length})</CardTitle>
            <CardDescription>
              Manage keywords you want to track for this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Enter keyword to track"
                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
              />
              <Button 
                onClick={handleAddKeyword}
                disabled={!newKeyword.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {keywords.length > 0 ? (
                keywords.map((keyword) => (
                  <div key={keyword.id} className="flex items-center justify-between p-2 rounded-md border">
                    <span className="text-sm">{keyword.keyword}</span>
                    <Button
                      onClick={() => handleRemoveKeyword(keyword.id)}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No keywords added yet. Add your first keyword above.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* API Key Input */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>OpenAI API Configuration</span>
            </CardTitle>
            <CardDescription>
              Enter your OpenAI API key to enable brand tracking analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input
                id="openai-key"
                type="password"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="sk-..."
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally and used only for this session
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Generate Report */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>Keyword Tracking Report</CardTitle>
            <CardDescription>
              Generate a comprehensive brand tracking report using ChatGPT analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleGenerateReport}
              className="gradient-primary text-white"
              disabled={keywords.length === 0 || !openaiApiKey.trim() || isGeneratingReport}
            >
              <FileText className="mr-2 h-4 w-4" />
              {isGeneratingReport ? 'Generating Report...' : 'Generate Brand Tracking Report'}
            </Button>
            {keywords.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Add some keywords before generating a report.
              </p>
            )}
            {!openaiApiKey.trim() && keywords.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Enter your OpenAI API key above to enable report generation.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Brand Tracking Results */}
        <BrandTrackingResults
          results={brandTrackingResults}
          isLoading={isGeneratingReport}
          onViewRawResponse={(result) => {
            setSelectedResult(result);
            setShowRawDialog(true);
          }}
        />

        {/* Competitor Matrix */}
        {brandTrackingResults.length > 0 && (
          <CompetitorMatrix
            results={brandTrackingResults}
            brandName={brandName}
          />
        )}

        {/* Competitor Table */}
        {brandTrackingResults.length > 0 && (
          <CompetitorTable
            results={brandTrackingResults}
            brandName={brandName}
            onViewContext={(brand, keyword, context) => {
              setContextData({ brand, keyword, context });
              setShowContextDialog(true);
            }}
          />
        )}

        {/* Raw Response Dialog */}
        <RawResponseDialog
          isOpen={showRawDialog}
          onClose={() => setShowRawDialog(false)}
          result={selectedResult}
        />

        {/* Context Dialog */}
        {contextData && (
          <RawResponseDialog
            isOpen={showContextDialog}
            onClose={() => {
              setShowContextDialog(false);
              setContextData(null);
            }}
            result={{
              keyword: contextData.keyword,
              brandMentioned: true,
              position: null,
              confidence: 100,
              context: contextData.context,
              competitors: [],
              rawResponse: `Context for ${contextData.brand} in keyword "${contextData.keyword}":\n\n${contextData.context}`,
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};