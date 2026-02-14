import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Bookmark, BookmarkFormData, BookmarkTag } from '../lib/types';

export function useBookmarks(userId: string) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);

    const { data: bookmarkData, error: bError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('weight', { ascending: true })
      .order('created_at', { ascending: true });

    if (bError) {
      console.error('Error fetching bookmarks:', bError);
      setLoading(false);
      return;
    }

    const ids = (bookmarkData ?? []).map((b) => b.id);

    let tagData: BookmarkTag[] = [];
    if (ids.length > 0) {
      const { data, error: tError } = await supabase
        .from('bookmark_tags')
        .select('*')
        .in('bookmark_id', ids);

      if (tError) {
        console.error('Error fetching tags:', tError);
      } else {
        tagData = data ?? [];
      }
    }

    const tagsByBookmark = new Map<string, BookmarkTag[]>();
    tagData.forEach((t) => {
      const existing = tagsByBookmark.get(t.bookmark_id) ?? [];
      existing.push(t);
      tagsByBookmark.set(t.bookmark_id, existing);
    });

    const merged: Bookmark[] = (bookmarkData ?? []).map((b) => ({
      ...b,
      tags: tagsByBookmark.get(b.id) ?? [],
    }));

    setBookmarks(merged);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const addBookmark = async (data: BookmarkFormData) => {
    const { tags, ...bookmarkFields } = data;

    const { data: newBookmark, error } = await supabase
      .from('bookmarks')
      .insert({ ...bookmarkFields, user_id: userId })
      .select()
      .single();

    if (error || !newBookmark) {
      throw error ?? new Error('Failed to create bookmark');
    }

    if (tags.length > 0) {
      const { error: tagError } = await supabase
        .from('bookmark_tags')
        .insert(tags.map((tag) => ({ bookmark_id: newBookmark.id, tag })));

      if (tagError) {
        console.error('Error inserting tags:', tagError);
      }
    }

    await fetchBookmarks();
    return newBookmark;
  };

  const updateBookmark = async (id: string, data: BookmarkFormData) => {
    const { tags, ...bookmarkFields } = data;

    const { error } = await supabase
      .from('bookmarks')
      .update(bookmarkFields)
      .eq('id', id);

    if (error) throw error;

    // Replace tags: delete all existing, insert new
    await supabase.from('bookmark_tags').delete().eq('bookmark_id', id);

    if (tags.length > 0) {
      const { error: tagError } = await supabase
        .from('bookmark_tags')
        .insert(tags.map((tag) => ({ bookmark_id: id, tag })));

      if (tagError) {
        console.error('Error updating tags:', tagError);
      }
    }

    await fetchBookmarks();
  };

  const deleteBookmark = async (id: string) => {
    const { error } = await supabase.from('bookmarks').delete().eq('id', id);
    if (error) throw error;
    await fetchBookmarks();
  };

  const updateWeights = async (reorderedBookmarks: Bookmark[]) => {
    const updates = reorderedBookmarks.map((b, index) => ({
      id: b.id,
      weight: index * 10,
    }));

    for (const { id, weight } of updates) {
      await supabase.from('bookmarks').update({ weight }).eq('id', id);
    }

    await fetchBookmarks();
  };

  return {
    bookmarks,
    loading,
    fetchBookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    updateWeights,
  };
}
