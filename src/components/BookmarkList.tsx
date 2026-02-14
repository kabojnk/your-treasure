import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import type { Bookmark } from '../lib/types';
import { SortableBookmarkItem } from './SortableBookmarkItem';
import '../styles/bookmarks.css';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  activeTags: Set<string>;
  onTagClick: (tag: string) => void;
  onBookmarkClick: (id: string) => void;
  onReorder: (reordered: Bookmark[]) => void;
}

export function BookmarkList({
  bookmarks,
  activeTags,
  onTagClick,
  onBookmarkClick,
  onReorder,
}: BookmarkListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = bookmarks.findIndex((b) => b.id === active.id);
    const newIndex = bookmarks.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(bookmarks, oldIndex, newIndex);
    onReorder(reordered);
  };

  if (bookmarks.length === 0) {
    return (
      <div className="bookmark-list">
        <div className="bookmark-list-empty">
          No locations yet. Use the search bar to discover places!
        </div>
      </div>
    );
  }

  return (
    <div className="bookmark-list">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={bookmarks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {bookmarks.map((bookmark) => (
            <SortableBookmarkItem
              key={bookmark.id}
              bookmark={bookmark}
              activeTags={activeTags}
              onTagClick={onTagClick}
              onClick={() => onBookmarkClick(bookmark.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
