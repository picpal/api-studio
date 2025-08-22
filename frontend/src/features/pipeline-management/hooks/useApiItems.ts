import { useState, useEffect } from 'react';
import { ApiItem } from '@/entities/pipeline';
import { pipelineApi } from '../api/pipelineApi';

export const useApiItems = () => {
  const [apiItems, setApiItems] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiItems = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await pipelineApi.fetchApiItems();
        setApiItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch API items');
        console.error('Error fetching API items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApiItems();
  }, []);

  return {
    apiItems,
    loading,
    error
  };
};