import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { FieldGuide, FieldGuideFormData } from '../lib/types';

export function useFieldGuides(userId: string) {
  const [fieldGuides, setFieldGuides] = useState<FieldGuide[]>([]);
  const [activeFieldGuideId, setActiveFieldGuideId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFieldGuides = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('field_guides')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching field guides:', error);
      setLoading(false);
      return;
    }

    const guides = data ?? [];
    setFieldGuides(guides);

    // Auto-select first guide if none selected or current selection is gone
    if (guides.length > 0) {
      setActiveFieldGuideId((prev) => {
        if (prev && guides.some((g) => g.id === prev)) return prev;
        return guides[0].id;
      });
    } else {
      setActiveFieldGuideId(null);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchFieldGuides();
  }, [fetchFieldGuides]);

  const addFieldGuide = async (data: FieldGuideFormData) => {
    const { data: newGuide, error } = await supabase
      .from('field_guides')
      .insert({
        name: data.name,
        description: data.description || null,
        date: data.date || null,
        color: data.color,
        image_url: data.image_url || null,
        notes: data.notes || '',
        user_id: userId,
      })
      .select()
      .single();

    if (error || !newGuide) {
      throw error ?? new Error('Failed to create field guide');
    }

    await fetchFieldGuides();
    setActiveFieldGuideId(newGuide.id);
    return newGuide;
  };

  const updateFieldGuide = async (id: string, data: FieldGuideFormData) => {
    const { error } = await supabase
      .from('field_guides')
      .update({
        name: data.name,
        description: data.description || null,
        date: data.date || null,
        color: data.color,
        image_url: data.image_url || null,
        notes: data.notes || '',
      })
      .eq('id', id);

    if (error) throw error;

    await fetchFieldGuides();
  };

  const deleteFieldGuide = async (id: string) => {
    const { error } = await supabase.from('field_guides').delete().eq('id', id);
    if (error) throw error;

    await fetchFieldGuides();
  };

  const activeFieldGuide = fieldGuides.find((g) => g.id === activeFieldGuideId) ?? null;

  return {
    fieldGuides,
    activeFieldGuide,
    activeFieldGuideId,
    setActiveFieldGuideId,
    loading,
    addFieldGuide,
    updateFieldGuide,
    deleteFieldGuide,
    fetchFieldGuides,
  };
}
