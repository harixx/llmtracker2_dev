import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCompetitorStats = () => {
  const [competitorCount, setCompetitorCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompetitorCount = async () => {
      try {
        const { data: projects } = await supabase
          .from('projects')
          .select('competitors');

        if (projects) {
          const allCompetitors = projects
            .flatMap(project => project.competitors || [])
            .filter((competitor, index, arr) => arr.indexOf(competitor) === index);
          
          setCompetitorCount(allCompetitors.length);
        }
      } catch (error) {
        console.error('Error fetching competitor stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitorCount();
  }, []);

  return { competitorCount, loading };
};