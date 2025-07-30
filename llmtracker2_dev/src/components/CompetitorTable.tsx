import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BrandAnalysisResult, CompetitorMention } from '@/lib/openai';
import { CheckCircle, XCircle, ChevronDown, ChevronRight, Eye } from 'lucide-react';

interface CompetitorTableProps {
  results: BrandAnalysisResult[];
  brandName: string;
  onViewContext: (brand: string, keyword: string, context: string) => void;
}

export const CompetitorTable: React.FC<CompetitorTableProps> = ({ 
  results, 
  brandName, 
  onViewContext 
}) => {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  if (results.length === 0) return null;

  const toggleRow = (keyword: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(keyword)) {
      newExpanded.delete(keyword);
    } else {
      newExpanded.add(keyword);
    }
    setExpandedRows(newExpanded);
  };

  // Calculate competitor statistics
  const competitorStats = new Map<string, { mentioned: number; totalKeywords: number; positions: number[] }>();
  
  results.forEach(result => {
    result.competitors.forEach(comp => {
      if (!competitorStats.has(comp.name)) {
        competitorStats.set(comp.name, { mentioned: 0, totalKeywords: 0, positions: [] });
      }
      const stats = competitorStats.get(comp.name)!;
      stats.totalKeywords++;
      if (comp.mentioned) {
        stats.mentioned++;
        if (comp.position) {
          stats.positions.push(comp.position);
        }
      }
    });
  });

  return (
    <div className="space-y-6">
      {/* Competitor Performance Summary */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Competitor Performance Summary</CardTitle>
          <CardDescription>
            Overall performance comparison across all tracked keywords
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Mentions</TableHead>
                <TableHead>Coverage %</TableHead>
                <TableHead>Avg Position</TableHead>
                <TableHead>Best Position</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Your brand row */}
              <TableRow className="bg-primary/5">
                <TableCell className="font-medium text-primary">{brandName} (You)</TableCell>
                <TableCell>
                  <Badge variant="default">
                    {results.filter(r => r.brandMentioned).length}/{results.length}
                  </Badge>
                </TableCell>
                <TableCell>
                  {Math.round((results.filter(r => r.brandMentioned).length / results.length) * 100)}%
                </TableCell>
                <TableCell>
                  {(() => {
                    const positions = results.filter(r => r.position).map(r => r.position!);
                    return positions.length > 0 
                      ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length)
                      : 'N/A';
                  })()}
                </TableCell>
                <TableCell>
                  {(() => {
                    const positions = results.filter(r => r.position).map(r => r.position!);
                    return positions.length > 0 ? Math.min(...positions) : 'N/A';
                  })()}
                </TableCell>
              </TableRow>
              
              {/* Competitor rows */}
              {Array.from(competitorStats.entries())
                .sort(([,a], [,b]) => b.mentioned - a.mentioned)
                .map(([competitor, stats]) => (
                  <TableRow key={competitor}>
                    <TableCell className="font-medium">{competitor}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {stats.mentioned}/{stats.totalKeywords}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {Math.round((stats.mentioned / stats.totalKeywords) * 100)}%
                    </TableCell>
                    <TableCell>
                      {stats.positions.length > 0 
                        ? Math.round(stats.positions.reduce((a, b) => a + b, 0) / stats.positions.length)
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {stats.positions.length > 0 ? Math.min(...stats.positions) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Keyword Analysis */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Detailed Keyword Analysis</CardTitle>
          <CardDescription>
            Competitor mentions and rankings for each keyword
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {results.map((result) => {
            const isExpanded = expandedRows.has(result.keyword);
            const mentionedCompetitors = result.competitors.filter(c => c.mentioned);
            
            return (
              <Collapsible 
                key={result.keyword} 
                open={isExpanded} 
                onOpenChange={() => toggleRow(result.keyword)}
              >
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                      <div className="flex items-center space-x-3">
                        <div className="text-left">
                          <div className="font-medium">{result.keyword}</div>
                          <div className="text-sm text-muted-foreground">
                            {result.brandMentioned ? (
                              <span className="text-green-600">Your brand mentioned</span>
                            ) : (
                              <span className="text-red-600">Your brand not found</span>
                            )}
                            {mentionedCompetitors.length > 0 && (
                              <span className="ml-2">• {mentionedCompetitors.length} competitors found</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {result.confidence}% confidence
                        </Badge>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="p-4 pt-0 border-t bg-muted/20">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Brand</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Context</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Your brand row */}
                          <TableRow className="bg-primary/5">
                            <TableCell className="font-medium text-primary">
                              {brandName} (You)
                            </TableCell>
                            <TableCell>
                              {result.brandMentioned ? (
                                <div className="flex items-center space-x-1">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-green-600">Mentioned</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span className="text-red-600">Not found</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {result.position ? (
                                <Badge variant="default">#{result.position}</Badge>
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="text-sm text-muted-foreground truncate">
                                {result.context || 'No context available'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {result.context && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onViewContext(brandName, result.keyword, result.context)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                          
                          {/* Competitor rows */}
                          {result.competitors.map((competitor) => (
                            <TableRow key={competitor.name}>
                              <TableCell className="font-medium">
                                {competitor.name}
                              </TableCell>
                              <TableCell>
                                {competitor.mentioned ? (
                                  <div className="flex items-center space-x-1">
                                    <CheckCircle className="h-4 w-4 text-orange-500" />
                                    <span className="text-orange-600">Mentioned</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1">
                                    <XCircle className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-500">Not found</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {competitor.position ? (
                                  <Badge variant="secondary">#{competitor.position}</Badge>
                                ) : (
                                  'N/A'
                                )}
                              </TableCell>
                              <TableCell className="max-w-xs">
                                <div className="text-sm text-muted-foreground truncate">
                                  {competitor.context || 'No context available'}
                                </div>
                              </TableCell>
                              <TableCell>
                                {competitor.context && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onViewContext(competitor.name, result.keyword, competitor.context)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};