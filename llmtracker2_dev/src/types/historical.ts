// Historical tracking database schema types
export interface HistoricalSnapshot {
  id: string;
  project_id: string;
  keyword_id: string;
  competitor_name: string;
  position: number;
  mention_count: number;
  sentiment_score: number;
  market_share: number;
  snapshot_date: string;
  data_source: 'api_response' | 'manual' | 'scheduled';
  metadata: Record<string, any>;
  created_at: string;
}

export interface TrendCalculation {
  id: string;
  project_id: string;
  keyword_id: string;
  competitor_name: string;
  metric_type: 'position_velocity' | 'mention_trend' | 'sentiment_trend' | 'market_share_change';
  time_period: 'daily' | 'weekly' | 'monthly';
  trend_value: number;
  confidence_score: number;
  calculation_date: string;
  raw_data: Record<string, any>;
  created_at: string;
}

export interface TrackingSchedule {
  id: string;
  project_id: string;
  keyword_id: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'on_demand';
  priority: 'high' | 'medium' | 'low';
  last_run: string;
  next_run: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DataRetentionPolicy {
  id: string;
  project_id: string;
  data_type: 'raw_responses' | 'daily_snapshots' | 'monthly_aggregates';
  retention_days: number;
  compression_enabled: boolean;
  archive_after_days: number;
  created_at: string;
  updated_at: string;
}

// Trend analysis types
export interface TrendMetrics {
  positionVelocity: number;
  mentionTrend: number;
  competitorGap: number;
  marketShareChange: number;
  sentimentShift: number;
}

export interface HistoricalDataPoint {
  date: string;
  position: number;
  mentions: number;
  sentiment: number;
  competitor: string;
}

export interface CompetitorTrendData {
  competitor: string;
  data: HistoricalDataPoint[];
  currentPosition: number;
  positionChange: number;
  trendDirection: 'up' | 'down' | 'stable';
}