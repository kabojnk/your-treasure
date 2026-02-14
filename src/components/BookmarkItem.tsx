import type { Bookmark } from '../lib/types';

interface BookmarkItemProps {
  bookmark: Bookmark;
  activeTags: Set<string>;
  onTagClick: (tag: string) => void;
  onClick: () => void;
}

export function BookmarkItem({ bookmark, activeTags, onTagClick, onClick }: BookmarkItemProps) {
  const borderColor = bookmark.color || '#000000';
  const initial = bookmark.name ? bookmark.name.charAt(0).toUpperCase() : '?';

  return (
    <div className="bookmark-item" onClick={onClick}>
      {bookmark.thumbnail_url ? (
        <img
          src={bookmark.thumbnail_url}
          alt={bookmark.name}
          className="bookmark-item-thumb"
          style={{ border: `3px solid ${borderColor}` }}
          onError={(e) => {
            // Hide broken image, show placeholder instead
            (e.target as HTMLImageElement).style.display = 'none';
            const next = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
            if (next) next.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className="bookmark-item-thumb-placeholder"
        style={{
          border: `3px solid ${borderColor}`,
          backgroundColor: borderColor,
          display: bookmark.thumbnail_url ? 'none' : 'flex',
        }}
      >
        {initial}
      </div>

      <div className="bookmark-item-body">
        <div className="bookmark-item-name">{bookmark.name}</div>
        {bookmark.description && (
          <div className="bookmark-item-desc">{bookmark.description}</div>
        )}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="bookmark-item-tags">
            {bookmark.tags.map((t) => (
              <button
                key={t.id}
                className={`bookmark-item-tag ${activeTags.has(t.tag) ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick(t.tag);
                }}
              >
                {t.tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
