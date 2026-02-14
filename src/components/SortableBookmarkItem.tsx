import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BookmarkItem } from './BookmarkItem';
import type { Bookmark } from '../lib/types';

interface SortableBookmarkItemProps {
  bookmark: Bookmark;
  activeTags: Set<string>;
  onTagClick: (tag: string) => void;
  onClick: () => void;
}

export function SortableBookmarkItem({
  bookmark,
  activeTags,
  onTagClick,
  onClick,
}: SortableBookmarkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="sortable-bookmark-item">
      <div className="drag-handle" {...listeners}>
        &#x2630;
      </div>
      <BookmarkItem
        bookmark={bookmark}
        activeTags={activeTags}
        onTagClick={onTagClick}
        onClick={onClick}
      />
    </div>
  );
}
