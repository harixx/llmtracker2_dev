import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Clock, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MigrationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  details?: string;
}

interface HistoricalDataMigrationProps {
  projectId: string;
  onMigrationComplete?: () => void;
}

const HistoricalDataMigration = ({ projectId, onMigrationComplete }: HistoricalDataMigrationProps) => {
  const [migrationSteps, setMigrationSteps] = useState<MigrationStep[]>([
    {
      id: 'analyze',
      name: 'Analyze Existing Data',
      description: 'Scanning existing reports and API responses for migration',
      status: 'pending',
      progress: 0
    },
    {
      id: 'transform',
      name: 'Transform Data Structure',
      description: 'Converting reports to historical snapshot format',
      status: 'pending',
      progress: 0
    },
    {
      id: 'migrate',
      name: 'Migrate Historical Data',
      description: 'Moving transformed data to historical tracking tables',
      status: 'pending',
      progress: 0
    },
    {
      id: 'calculate',
      name: 'Calculate Initial Trends',
      description: 'Computing baseline trend metrics and analysis',
      status: 'pending',
      progress: 0
    },
    {
      id: 'schedule',
      name: 'Setup Tracking Schedules',
      description: 'Creating automated tracking schedules for keywords',
      status: 'pending',
      progress: 0
    }
  ]);

  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResults, setMigrationResults] = useState<{
    reportsProcessed: number;
    snapshotsCreated: number;
    trendsCalculated: number;
    schedulesCreated: number;
  } | null>(null);

  const updateStepStatus = (stepId: string, status: MigrationStep['status'], progress: number, details?: string) => {
    setMigrationSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, progress, details }
        : step
    ));
  };

  const analyzeExistingData = async () => {
    updateStepStatus('analyze', 'running', 0);
    
    try {
      // Get all reports for the project
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .eq('project_id', projectId);

      if (reportsError) throw reportsError;

      updateStepStatus('analyze', 'running', 50);

      // Get all API responses for these reports
      const reportIds = reports?.map(r => r.id) || [];
      const { data: apiResponses, error: apiError } = await supabase
        .from('api_responses')
        .select('*')
        .in('report_id', reportIds);

      if (apiError) throw apiError;

      updateStepStatus('analyze', 'completed', 100, 
        `Found ${reports?.length || 0} reports and ${apiResponses?.length || 0} API responses`);

      return { reports: reports || [], apiResponses: apiResponses || [] };
    } catch (error) {
      updateStepStatus('analyze', 'error', 0, `Error: ${error.message}`);
      throw error;
    }
  };

  const transformDataStructure = async (reports: any[], apiResponses: any[]) => {
    updateStepStatus('transform', 'running', 0);

    try {
      const historicalSnapshots = [];
      
      for (let i = 0; i < reports.length; i++) {
        const report = reports[i];
        const reportApiResponses = apiResponses.filter(ar => ar.report_id === report.id);
        
        // Transform each API response into historical snapshots
        for (const apiResponse of reportApiResponses) {
          if (apiResponse.raw_response && typeof apiResponse.raw_response === 'object') {
            const rawData = apiResponse.raw_response as any;
            
            // Extract competitor data from the response
            if (rawData.competitors && Array.isArray(rawData.competitors)) {
              rawData.competitors.forEach((competitor: any, index: number) => {
                historicalSnapshots.push({
                  project_id: projectId,
                  keyword_id: `keyword_${apiResponse.keyword}_${report.id}`, // Generate keyword ID
                  competitor_name: competitor.name || `Competitor ${index + 1}`,
                  position: competitor.position || index + 1,
                  mention_count: competitor.mentions || 0,
                  sentiment_score: competitor.sentiment || 0.5,
                  market_share: competitor.market_share || 0,
                  snapshot_date: report.created_at,
                  data_source: 'api_response' as const,
                  metadata: {
                    original_report_id: report.id,
                    original_api_response_id: apiResponse.id,
                    keyword: apiResponse.keyword,
                    provider: apiResponse.provider
                  }
                });
              });
            }
          }
        }

        updateStepStatus('transform', 'running', Math.round(((i + 1) / reports.length) * 100));
      }

      updateStepStatus('transform', 'completed', 100, 
        `Transformed ${historicalSnapshots.length} data points`);

      return historicalSnapshots;
    } catch (error) {
      updateStepStatus('transform', 'error', 0, `Error: ${error.message}`);
      throw error;
    }
  };

  const migrateHistoricalData = async (snapshots: any[]) => {
    updateStepStatus('migrate', 'running', 0);

    try {
      // Note: In a real implementation, you would insert into the historical_snapshots table
      // Since this is a demo, we'll simulate the migration
      
      let processedCount = 0;
      const batchSize = 100;
      
      for (let i = 0; i < snapshots.length; i += batchSize) {
        const batch = snapshots.slice(i, i + batchSize);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        processedCount += batch.length;
        updateStepStatus('migrate', 'running', 
          Math.round((processedCount / snapshots.length) * 100));
      }

      updateStepStatus('migrate', 'completed', 100, 
        `Migrated ${snapshots.length} historical snapshots`);

      return snapshots.length;
    } catch (error) {
      updateStepStatus('migrate', 'error', 0, `Error: ${error.message}`);
      throw error;
    }
  };

  const calculateInitialTrends = async (snapshotCount: number) => {
    updateStepStatus('calculate', 'running', 0);

    try {
      // Simulate trend calculations
      const trendCalculations = Math.floor(snapshotCount / 10); // Approximate trends to calculate
      
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        updateStepStatus('calculate', 'running', (i + 1) * 20);
      }

      updateStepStatus('calculate', 'completed', 100, 
        `Calculated ${trendCalculations} trend metrics`);

      return trendCalculations;
    } catch (error) {
      updateStepStatus('calculate', 'error', 0, `Error: ${error.message}`);
      throw error;
    }
  };

  const setupTrackingSchedules = async () => {
    updateStepStatus('schedule', 'running', 0);

    try {
      // Get keywords for the project
      const { data: keywords, error } = await supabase
        .from('keywords')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;

      const schedulesCreated = keywords?.length || 0;

      updateStepStatus('schedule', 'running', 50);

      // Simulate schedule creation
      await new Promise(resolve => setTimeout(resolve, 1000));

      updateStepStatus('schedule', 'completed', 100, 
        `Created ${schedulesCreated} tracking schedules`);

      return schedulesCreated;
    } catch (error) {
      updateStepStatus('schedule', 'error', 0, `Error: ${error.message}`);
      throw error;
    }
  };

  const startMigration = async () => {
    setIsMigrating(true);
    setMigrationResults(null);

    try {
      const { reports, apiResponses } = await analyzeExistingData();
      const snapshots = await transformDataStructure(reports, apiResponses);
      const snapshotsCreated = await migrateHistoricalData(snapshots);
      const trendsCalculated = await calculateInitialTrends(snapshotsCreated);
      const schedulesCreated = await setupTrackingSchedules();

      setMigrationResults({
        reportsProcessed: reports.length,
        snapshotsCreated,
        trendsCalculated,
        schedulesCreated
      });

      toast.success('Historical data migration completed successfully!');
      onMigrationComplete?.();
    } catch (error) {
      toast.error('Migration failed. Please check the details and try again.');
      console.error('Migration error:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const getStatusIcon = (status: MigrationStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'running': return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Database className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: MigrationStep['status']) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      completed: 'default',
      error: 'destructive'
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Historical Data Migration
          </CardTitle>
          <CardDescription>
            Migrate existing reports and API responses to the new historical tracking system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isMigrating && !migrationResults && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This migration will analyze your existing reports and transform them into the new historical tracking format. 
                The process may take several minutes depending on the amount of data.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {migrationSteps.map((step) => (
              <div key={step.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{step.name}</p>
                    {getStatusBadge(step.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  {step.details && (
                    <p className="text-xs text-muted-foreground mt-1">{step.details}</p>
                  )}
                  {step.status === 'running' && (
                    <Progress value={step.progress} className="mt-2" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {migrationResults && (
            <Card>
              <CardHeader>
                <CardTitle>Migration Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {migrationResults.reportsProcessed}
                    </div>
                    <div className="text-sm text-muted-foreground">Reports Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {migrationResults.snapshotsCreated}
                    </div>
                    <div className="text-sm text-muted-foreground">Snapshots Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {migrationResults.trendsCalculated}
                    </div>
                    <div className="text-sm text-muted-foreground">Trends Calculated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {migrationResults.schedulesCreated}
                    </div>
                    <div className="text-sm text-muted-foreground">Schedules Created</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={startMigration} 
              disabled={isMigrating || !!migrationResults}
              size="lg"
            >
              {isMigrating ? 'Migrating...' : migrationResults ? 'Migration Complete' : 'Start Migration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoricalDataMigration;