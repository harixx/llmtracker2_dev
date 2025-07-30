import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, XCircle, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { BrandAnalysisResult } from '@/lib/openai';

interface BrandTrackingResultsProps {
  results: BrandAnalysisResult[];
  isLoading: boolean;
  onViewRawResponse: (result: BrandAnalysisResult) => void;
}

export const BrandTrackingResults: React.FC<BrandTrackingResultsProps> = ({
  results,
  isLoading,
  onViewRawResponse,
}) => {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set());

  const toggleItem = (keyword: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(keyword)) {
      newOpenItems.delete(keyword);
    } else {
      newOpenItems.add(keyword);
    }
    setOpenItems(newOpenItems);
  };

  if (isLoading) {
    return (
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Generating Brand Tracking Report</CardTitle>
          <CardDescription>
            Analyzing keywords with ChatGPT API...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                <div className="h-4 bg-muted rounded animate-pulse flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return null;
  }

  const mentionedCount = results.filter(r => r.brandMentioned).length;
  const totalCount = results.length;

  return (
    <Card className="card-gradient">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Brand Tracking Results
          <Badge variant={mentionedCount > 0 ? "default" : "secondary"}>
            {mentionedCount}/{totalCount} Keywords
          </Badge>
        </CardTitle>
        <CardDescription>
          Analysis of brand mentions across your tracked keywords
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.map((result) => {
          const isOpen = openItems.has(result.keyword);
          
          return (
            <Collapsible key={result.keyword} open={isOpen} onOpenChange={() => toggleItem(result.keyword)}>
              <div className="border rounded-lg p-4 space-y-3">
                {/* Header Row */}
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <div className="flex items-center space-x-3">
                      {result.brandMentioned ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">{result.keyword}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.brandMentioned ? 'Brand mentioned' : 'Brand not found'}
                          {result.position && ` • Position: #${result.position}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {result.confidence}% confidence
                      </Badge>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>

                {/* Expandable Content */}
                <CollapsibleContent className="space-y-3">
                  {result.context && (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <h4 className="text-sm font-medium mb-2">Context</h4>
                      <p className="text-sm text-muted-foreground">{result.context}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex space-x-2">
                      {result.brandMentioned && (
                        <Badge variant="default">Mentioned</Badge>
                      )}
                      {result.position && (
                        <Badge variant="secondary">Position: #{result.position}</Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewRawResponse(result)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Analysis
                    </Button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
};