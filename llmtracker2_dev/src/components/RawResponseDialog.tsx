import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { BrandAnalysisResult } from '@/lib/openai';

interface RawResponseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  result: BrandAnalysisResult | null;
}

export const RawResponseDialog: React.FC<RawResponseDialogProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  if (!result) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Full Analysis: {result.keyword}</span>
            <Badge variant={result.brandMentioned ? "default" : "secondary"}>
              {result.brandMentioned ? 'Brand Found' : 'Not Found'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Complete ChatGPT analysis response for this keyword
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
          <div className="space-y-4">
            {/* Analysis Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Brand Mentioned</h4>
                <p className="font-semibold">{result.brandMentioned ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Confidence</h4>
                <p className="font-semibold">{result.confidence}%</p>
              </div>
              {result.position && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Position</h4>
                  <p className="font-semibold">#{result.position}</p>
                </div>
              )}
            </div>

            {/* Raw Response */}
            <div>
              <h4 className="font-medium mb-2">Complete Analysis</h4>
              <div className="whitespace-pre-wrap text-sm bg-background border rounded-lg p-4">
                {result.rawResponse}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};