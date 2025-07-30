import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { projectSchema, sanitizeInput, sanitizeArray } from '@/lib/validation';
import { toast } from '@/hooks/use-toast';

interface ProjectFormData {
  name: string;
  description?: string;
  brand_name: string;
  competitors?: string[];
}

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: any;
  onSave: (project: ProjectFormData) => void;
  loading?: boolean;
}

export const ProjectDialog: React.FC<ProjectDialogProps> = ({
  open,
  onOpenChange,
  project,
  onSave,
  loading = false,
}) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: project?.name || '',
    description: project?.description || '',
    brand_name: project?.brand_name || '',
    competitors: project?.competitors || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const sanitizedData = {
        name: sanitizeInput(formData.name),
        description: formData.description ? sanitizeInput(formData.description) : undefined,
        brand_name: sanitizeInput(formData.brand_name),
        competitors: formData.competitors ? sanitizeArray(formData.competitors) : undefined,
      };
      
      const validatedData = projectSchema.parse(sanitizedData);
      onSave(validatedData as ProjectFormData);
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || 'Please check your input';
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleCompetitorsChange = (value: string) => {
    const competitorsArray = value.split(',').map(c => c.trim()).filter(c => c);
    setFormData(prev => ({
      ...prev,
      competitors: competitorsArray,
    }));
  };

  React.useEffect(() => {
    if (open) {
      setFormData({
        name: project?.name || '',
        description: project?.description || '',
        brand_name: project?.brand_name || '',
        competitors: project?.competitors || [],
      });
    }
  }, [open, project]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {project ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
          <DialogDescription>
            {project 
              ? 'Update your project settings and configuration.'
              : 'Create a new project to track keywords and monitor performance.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter project description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-name">Brand Name</Label>
            <Input
              id="brand-name"
              value={formData.brand_name}
              onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
              placeholder="Enter brand name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="competitors">Competitors (comma-separated)</Label>
            <Input
              id="competitors"
              value={formData.competitors?.join(', ') || ''}
              onChange={(e) => handleCompetitorsChange(e.target.value)}
              placeholder="competitor1.com, competitor2.com"
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (project ? 'Update Project' : 'Create Project')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};