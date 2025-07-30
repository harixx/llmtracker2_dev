import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  X,
  Plus
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BulkKeywordImporterProps {
  projectId: string;
  onImportComplete: () => void;
  onClose: () => void;
}

interface KeywordEntry {
  keyword: string;
  priority: number;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export const BulkKeywordImporter: React.FC<BulkKeywordImporterProps> = ({
  projectId,
  onImportComplete,
  onClose
}) => {
  const [importMethod, setImportMethod] = useState<'text' | 'csv'>('text');
  const [textInput, setTextInput] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [keywords, setKeywords] = useState<KeywordEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; errors: number } | null>(null);

  const parseTextInput = () => {
    const lines = textInput.split('\n').filter(line => line.trim());
    const parsed: KeywordEntry[] = [];

    lines.forEach(line => {
      const parts = line.split(',').map(p => p.trim());
      const keyword = parts[0];
      const priority = parts[1] ? parseInt(parts[1]) : 1;

      if (keyword) {
        parsed.push({
          keyword,
          priority: isNaN(priority) ? 1 : Math.max(1, Math.min(10, priority)),
          status: 'pending'
        });
      }
    });

    setKeywords(parsed);
  };

  const parseCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n').filter(line => line.trim());
      const parsed: KeywordEntry[] = [];

      // Skip header if it exists
      const startIndex = lines[0]?.toLowerCase().includes('keyword') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/"/g, ''));
        const keyword = parts[0];
        const priority = parts[1] ? parseInt(parts[1]) : 1;

        if (keyword) {
          parsed.push({
            keyword,
            priority: isNaN(priority) ? 1 : Math.max(1, Math.min(10, priority)),
            status: 'pending'
          });
        }
      }

      setKeywords(parsed);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCsvFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(prev => prev.filter((_, i) => i !== index));
  };

  const updateKeywordPriority = (index: number, priority: number) => {
    setKeywords(prev => prev.map((kw, i) => 
      i === index ? { ...kw, priority: Math.max(1, Math.min(10, priority)) } : kw
    ));
  };

  const importKeywords = async () => {
    if (keywords.length === 0) {
      toast({
        title: "No keywords to import",
        description: "Please add some keywords first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    
    let successCount = 0;
    let errorCount = 0;
    const updatedKeywords = [...keywords];

    try {
      for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        
        try {
          const { error } = await supabase
            .from('keywords')
            .insert([{
              keyword: keyword.keyword,
              priority: keyword.priority,
              project_id: projectId
            }]);

          if (error) {
            if (error.code === '23505') { // Unique constraint violation
              updatedKeywords[i] = { 
                ...keyword, 
                status: 'error', 
                error: 'Keyword already exists' 
              };
            } else {
              throw error;
            }
            errorCount++;
          } else {
            updatedKeywords[i] = { ...keyword, status: 'success' };
            successCount++;
          }
        } catch (error: any) {
          updatedKeywords[i] = { 
            ...keyword, 
            status: 'error', 
            error: error.message || 'Failed to import' 
          };
          errorCount++;
        }

        setProgress(((i + 1) / keywords.length) * 100);
        setKeywords([...updatedKeywords]);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setResults({ success: successCount, errors: errorCount });

      if (successCount > 0) {
        toast({
          title: "Import completed",
          description: `Successfully imported ${successCount} keywords${errorCount > 0 ? ` (${errorCount} errors)` : ''}`,
        });
        onImportComplete();
      } else {
        toast({
          title: "Import failed",
          description: "No keywords were successfully imported",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "An unexpected error occurred during import",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "keyword,priority\nSEO optimization,5\nbrand monitoring,3\nkeyword research,8\ncompetitor analysis,7";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'keyword_import_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Template downloaded",
      description: "CSV template has been downloaded to your computer",
    });
  };

  const exportResults = () => {
    if (!results || keywords.length === 0) return;

    const csvContent = [
      'keyword,priority,status,error',
      ...keywords.map(kw => 
        `"${kw.keyword}",${kw.priority},${kw.status},"${kw.error || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'keyword_import_results.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Results exported",
      description: "Import results have been downloaded",
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Keyword Import
            </CardTitle>
            <CardDescription>
              Import multiple keywords at once using text or CSV
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Import Method Selection */}
        <div className="space-y-4">
          <Label>Import Method</Label>
          <div className="flex gap-2">
            <Button
              variant={importMethod === 'text' ? 'default' : 'outline'}
              onClick={() => setImportMethod('text')}
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Text Input
            </Button>
            <Button
              variant={importMethod === 'csv' ? 'default' : 'outline'}
              onClick={() => setImportMethod('csv')}
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              CSV Upload
            </Button>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
        </div>

        <Separator />

        {/* Input Methods */}
        {importMethod === 'text' ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text-input">Keywords (one per line)</Label>
              <Textarea
                id="text-input"
                placeholder="keyword1, priority&#10;keyword2, priority&#10;keyword3"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={8}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Format: "keyword" or "keyword, priority" (priority 1-10, default is 1)
              </p>
            </div>
            <Button onClick={parseTextInput} disabled={!textInput.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Parse Keywords
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-input">CSV File</Label>
              <Input
                id="csv-input"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                CSV should have columns: keyword, priority (optional)
              </p>
            </div>
          </div>
        )}

        {/* Keyword Preview */}
        {keywords.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Keywords to Import ({keywords.length})
                </h3>
                {!isProcessing && !results && (
                  <Button onClick={() => setKeywords([])}>
                    Clear All
                  </Button>
                )}
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing keywords...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {results && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Import completed: {results.success} successful, {results.errors} errors
                    {results.errors > 0 && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={exportResults}
                        className="ml-2 p-0 h-auto"
                      >
                        Export Results
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-4">
                {keywords.map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{keyword.keyword}</span>
                      <Badge variant="outline">Priority: {keyword.priority}</Badge>
                      {keyword.status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {keyword.status === 'error' && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-500">{keyword.error}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isProcessing && keyword.status === 'pending' && (
                        <>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={keyword.priority}
                            onChange={(e) => updateKeywordPriority(index, parseInt(e.target.value) || 1)}
                            className="w-16 h-8"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeKeyword(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        {keywords.length > 0 && !results && (
          <>
            <Separator />
            <div className="flex gap-2">
              <Button
                onClick={importKeywords}
                disabled={isProcessing || keywords.length === 0}
                className="flex-1"
              >
                {isProcessing ? 'Importing...' : `Import ${keywords.length} Keywords`}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};