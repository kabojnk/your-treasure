import { useState, useMemo } from 'react';
import type { Bookmark } from '../lib/types';

export function useTags(bookmarks: Bookmark[]) {
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    bookmarks.forEach((b) => b.tags?.forEach((t) => tagSet.add(t.tag)));
    return Array.from(tagSet).sort();
  }, [bookmarks]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const clearTags = () => setActiveTags(new Set());

  const filteredBookmarks = useMemo(() => {
    if (activeTags.size === 0) return bookmarks;
    return bookmarks.filter((b) =>
      b.tags?.some((t) => activeTags.has(t.tag))
    );
  }, [bookmarks, activeTags]);

  return { allTags, activeTags, toggleTag, clearTags, filteredBookmarks };
}
