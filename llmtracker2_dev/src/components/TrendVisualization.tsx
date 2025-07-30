import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CompetitorTrendData, HistoricalDataPoint } from '@/types/historical';

interface TrendVisualizationProps {
  data: CompetitorTrendData[];
  timeRange: '7d' | '30d' | '90d' | '1y';
  metric: 'position' | 'mentions' | 'sentiment';
}

const TrendVisualization = ({ data, timeRange, metric }: TrendVisualizationProps) => {
  // Transform data for chart consumption
  const chartData = data[0]?.data.map(point => {
    const dataPoint: any = { date: point.date };
    data.forEach(competitor => {
      const competitorPoint = competitor.data.find(d => d.date === point.date);
      if (competitorPoint) {
        dataPoint[competitor.competitor] = competitorPoint[metric];
      }
    });
    return dataPoint;
  }) || [];

  const getMetricLabel = () => {
    switch (metric) {
      case 'position': return 'Position Ranking';
      case 'mentions': return 'Mention Count';
      case 'sentiment': return 'Sentiment Score';
      default: return 'Metric';
    }
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
    '#d084d0', '#ffb347', '#87ceeb', '#deb887', '#f0e68c'
  ];

  return (
    <div className="space-y-6">
      {/* Trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((competitor, index) => (
          <Card key={competitor.competitor}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {competitor.competitor}
              </CardTitle>
              {getTrendIcon(competitor.trendDirection)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{competitor.currentPosition}</div>
              <p className="text-xs text-muted-foreground">
                {competitor.positionChange > 0 ? '+' : ''}{competitor.positionChange} from last period
              </p>
              <Badge 
                variant={competitor.trendDirection === 'up' ? 'default' : 
                        competitor.trendDirection === 'down' ? 'destructive' : 'secondary'}
                className="mt-2"
              >
                {competitor.trendDirection}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{getMetricLabel()} Trends</CardTitle>
          <CardDescription>
            Historical {metric} data over the last {timeRange}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={metric === 'position' ? ['dataMin - 1', 'dataMax + 1'] : ['auto', 'auto']}
                reversed={metric === 'position'} // Lower position numbers are better
              />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: number) => [
                  metric === 'sentiment' ? value.toFixed(2) : value,
                  getMetricLabel()
                ]}
              />
              <Legend />
              {data.map((competitor, index) => (
                <Line
                  key={competitor.competitor}
                  type="monotone"
                  dataKey={competitor.competitor}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Position Change Area Chart */}
      {metric === 'position' && (
        <Card>
          <CardHeader>
            <CardTitle>Position Change Analysis</CardTitle>
            <CardDescription>
              Visualizing ranking movements over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={['dataMin - 1', 'dataMax + 1']}
                  reversed={true}
                />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [value, 'Position']}
                />
                <Legend />
                {data.map((competitor, index) => (
                  <Area
                    key={competitor.competitor}
                    type="monotone"
                    dataKey={competitor.competitor}
                    stackId="1"
                    stroke={colors[index % colors.length]}
                    fill={colors[index % colors.length]}
                    fillOpacity={0.3}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrendVisualization;