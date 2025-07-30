import { supabase } from '@/integrations/supabase/client';
import { HistoricalSnapshot, TrendCalculation, TrackingSchedule, CompetitorTrendData } from '@/types/historical';

export class HistoricalTrackingService {
  // Create historical snapshot from API response
  static async createSnapshot(data: {
    projectId: string;
    keywordId: string;
    competitorName: string;
    position: number;
    mentionCount: number;
    sentimentScore: number;
    marketShare: number;
    dataSource: 'api_response' | 'manual' | 'scheduled';
    metadata?: Record<string, any>;
  }): Promise<HistoricalSnapshot> {
    const snapshot: Omit<HistoricalSnapshot, 'id' | 'created_at'> = {
      project_id: data.projectId,
      keyword_id: data.keywordId,
      competitor_name: data.competitorName,
      position: data.position,
      mention_count: data.mentionCount,
      sentiment_score: data.sentimentScore,
      market_share: data.marketShare,
      snapshot_date: new Date().toISOString(),
      data_source: data.dataSource,
      metadata: data.metadata || {}
    };

    // In a real implementation, this would insert into the historical_snapshots table
    // For demo purposes, we'll simulate the creation
    const createdSnapshot: HistoricalSnapshot = {
      ...snapshot,
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };

    return createdSnapshot;
  }

  // Get historical data for trend analysis
  static async getHistoricalData(
    projectId: string,
    keywordId?: string,
    timeRange: '7d' | '30d' | '90d' | '1y' = '30d',
    competitors?: string[]
  ): Promise<CompetitorTrendData[]> {
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days[timeRange]);

    // In a real implementation, this would query the historical_snapshots table
    // For demo purposes, we'll generate sample data
    const sampleCompetitors = competitors || ['Competitor A', 'Competitor B', 'Competitor C'];
    
    return sampleCompetitors.map((competitor, index) => {
      const data = this.generateSampleHistoricalData(startDate, new Date(), competitor, index);
      const currentPosition = data[data.length - 1]?.position || 1;
      const previousPosition = data[data.length - 8]?.position || currentPosition;
      const positionChange = previousPosition - currentPosition; // Negative means improvement
      
      return {
        competitor,
        data,
        currentPosition,
        positionChange,
        trendDirection: positionChange > 0 ? 'up' : positionChange < 0 ? 'down' : 'stable'
      };
    });
  }

  // Calculate trend metrics
  static async calculateTrendMetrics(
    projectId: string,
    keywordId: string,
    competitorName: string,
    timeRange: '7d' | '30d' | '90d' = '30d'
  ): Promise<TrendCalculation[]> {
    // Get historical data for calculations
    const historicalData = await this.getHistoricalData(projectId, keywordId, timeRange, [competitorName]);
    const competitorData = historicalData[0];

    if (!competitorData || competitorData.data.length < 2) {
      return [];
    }

    const trends: Omit<TrendCalculation, 'id' | 'created_at'>[] = [
      {
        project_id: projectId,
        keyword_id: keywordId,
        competitor_name: competitorName,
        metric_type: 'position_velocity',
        time_period: timeRange === '7d' ? 'daily' : timeRange === '30d' ? 'weekly' : 'monthly',
        trend_value: this.calculatePositionVelocity(competitorData.data),
        confidence_score: 0.85,
        calculation_date: new Date().toISOString(),
        raw_data: { dataPoints: competitorData.data.length }
      },
      {
        project_id: projectId,
        keyword_id: keywordId,
        competitor_name: competitorName,
        metric_type: 'mention_trend',
        time_period: timeRange === '7d' ? 'daily' : timeRange === '30d' ? 'weekly' : 'monthly',
        trend_value: this.calculateMentionTrend(competitorData.data),
        confidence_score: 0.78,
        calculation_date: new Date().toISOString(),
        raw_data: { averageMentions: competitorData.data.reduce((sum, d) => sum + d.mentions, 0) / competitorData.data.length }
      },
      {
        project_id: projectId,
        keyword_id: keywordId,
        competitor_name: competitorName,
        metric_type: 'sentiment_trend',
        time_period: timeRange === '7d' ? 'daily' : timeRange === '30d' ? 'weekly' : 'monthly',
        trend_value: this.calculateSentimentTrend(competitorData.data),
        confidence_score: 0.82,
        calculation_date: new Date().toISOString(),
        raw_data: { averageSentiment: competitorData.data.reduce((sum, d) => sum + d.sentiment, 0) / competitorData.data.length }
      }
    ];

    // In real implementation, save to trend_calculations table
    return trends.map((trend, index) => ({
      ...trend,
      id: `trend_${Date.now()}_${index}`,
      created_at: new Date().toISOString()
    }));
  }

  // Setup tracking schedule for a keyword
  static async setupTrackingSchedule(
    projectId: string,
    keywordId: string,
    frequency: 'daily' | 'weekly' | 'monthly' | 'on_demand',
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<TrackingSchedule> {
    const now = new Date();
    const nextRun = new Date(now);

    // Calculate next run time based on frequency
    switch (frequency) {
      case 'daily':
        nextRun.setHours(9, 0, 0, 0); // 9 AM daily
        if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + (7 - nextRun.getDay())); // Next Sunday
        nextRun.setHours(9, 0, 0, 0);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1, 1); // First of next month
        nextRun.setHours(9, 0, 0, 0);
        break;
      case 'on_demand':
        nextRun.setFullYear(2099); // Far future for on-demand
        break;
    }

    const schedule: TrackingSchedule = {
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      project_id: projectId,
      keyword_id: keywordId,
      frequency,
      priority,
      last_run: now.toISOString(),
      next_run: nextRun.toISOString(),
      is_active: true,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    // In real implementation, save to tracking_schedules table
    return schedule;
  }

  // Helper methods for trend calculations
  private static calculatePositionVelocity(data: any[]): number {
    if (data.length < 2) return 0;
    
    const recent = data.slice(-7); // Last 7 data points
    const older = data.slice(-14, -7); // Previous 7 data points
    
    const recentAvg = recent.reduce((sum, d) => sum + d.position, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.position, 0) / older.length;
    
    return olderAvg - recentAvg; // Positive means improvement (lower position number)
  }

  private static calculateMentionTrend(data: any[]): number {
    if (data.length < 2) return 0;
    
    const recent = data.slice(-7);
    const older = data.slice(-14, -7);
    
    const recentAvg = recent.reduce((sum, d) => sum + d.mentions, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.mentions, 0) / older.length;
    
    return ((recentAvg - olderAvg) / olderAvg) * 100; // Percentage change
  }

  private static calculateSentimentTrend(data: any[]): number {
    if (data.length < 2) return 0;
    
    const recent = data.slice(-7);
    const older = data.slice(-14, -7);
    
    const recentAvg = recent.reduce((sum, d) => sum + d.sentiment, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.sentiment, 0) / older.length;
    
    return recentAvg - olderAvg; // Direct sentiment difference
  }

  // Generate sample data for demo purposes
  private static generateSampleHistoricalData(startDate: Date, endDate: Date, competitor: string, index: number) {
    const data = [];
    const current = new Date(startDate);
    const basePosition = 3 + index; // Start at different positions
    const baseMentions = 50 + (index * 20);
    const baseSentiment = 0.6 + (index * 0.1);

    while (current <= endDate) {
      // Add some realistic variation
      const dayOffset = (current.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const positionVariation = Math.sin(dayOffset * 0.1) * 2 + Math.random() * 2 - 1;
      const mentionVariation = Math.sin(dayOffset * 0.15) * 10 + Math.random() * 20 - 10;
      const sentimentVariation = Math.sin(dayOffset * 0.08) * 0.1 + Math.random() * 0.2 - 0.1;

      data.push({
        date: current.toISOString().split('T')[0],
        position: Math.max(1, Math.round(basePosition + positionVariation)),
        mentions: Math.max(0, Math.round(baseMentions + mentionVariation)),
        sentiment: Math.max(0, Math.min(1, baseSentiment + sentimentVariation)),
        competitor
      });

      current.setDate(current.getDate() + 1);
    }

    return data;
  }
}