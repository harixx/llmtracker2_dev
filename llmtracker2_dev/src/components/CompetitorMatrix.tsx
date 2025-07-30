import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrandAnalysisResult } from '@/lib/openai';
import { CheckCircle, XCircle } from 'lucide-react';

interface CompetitorMatrixProps {
  results: BrandAnalysisResult[];
  brandName: string;
}

export const CompetitorMatrix: React.FC<CompetitorMatrixProps> = ({ results, brandName }) => {
  if (results.length === 0) return null;

  // Get all unique competitors mentioned across all keywords
  const allCompetitors = new Set<string>();
  results.forEach(result => {
    result.competitors.forEach(comp => {
      if (comp.mentioned) {
        allCompetitors.add(comp.name);
      }
    });
  });

  const competitorList = Array.from(allCompetitors);

  return (
    <Card className="card-gradient">
      <CardHeader>
        <CardTitle>Competitor Presence Matrix</CardTitle>
        <CardDescription>
          Visual overview of brand and competitor mentions across keywords
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Keyword</th>
                <th className="text-left p-3 font-medium text-primary">{brandName}</th>
                {competitorList.map(competitor => (
                  <th key={competitor} className="text-left p-3 font-medium text-muted-foreground">
                    {competitor}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.keyword} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium">{result.keyword}</td>
                  
                  {/* Brand column */}
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      {result.brandMentioned ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      {result.position && (
                        <Badge variant="default" className="text-xs">
                          #{result.position}
                        </Badge>
                      )}
                    </div>
                  </td>
                  
                  {/* Competitor columns */}
                  {competitorList.map(competitor => {
                    const competitorData = result.competitors.find(c => c.name === competitor);
                    return (
                      <td key={competitor} className="p-3">
                        <div className="flex items-center space-x-2">
                          {competitorData?.mentioned ? (
                            <CheckCircle className="h-4 w-4 text-orange-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300" />
                          )}
                          {competitorData?.position && (
                            <Badge variant="secondary" className="text-xs">
                              #{competitorData.position}
                            </Badge>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Mentioned</span>
          </div>
          <div className="flex items-center space-x-1">
            <XCircle className="h-4 w-4 text-red-500" />
            <span>Not mentioned</span>
          </div>
          <div className="flex items-center space-x-1">
            <Badge variant="outline" className="text-xs">#N</Badge>
            <span>Position</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};