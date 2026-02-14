import { useState } from 'react';
import type { Bookmark } from '../lib/types';

interface BookmarkDetailProps {
  bookmark: Bookmark;
  onClose: () => void;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
}

export function BookmarkDetail({ bookmark, onClose, onEdit, onDelete }: BookmarkDetailProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const borderColor = bookmark.color || '#000000';
  const initial = bookmark.name ? bookmark.name.charAt(0).toUpperCase() : '?';

  return (
    <div className="bookmark-detail">
      <button className="bookmark-detail-back" onClick={onClose}>
        &larr; Back to list
      </button>

      {bookmark.thumbnail_url ? (
        <img
          src={bookmark.thumbnail_url}
          alt={bookmark.name}
          className="bookmark-detail-thumb"
          style={{ border: `3px solid ${borderColor}` }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            const next = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
            if (next) next.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className="bookmark-detail-thumb-placeholder"
        style={{
          border: `3px solid ${borderColor}`,
          backgroundColor: borderColor,
          display: bookmark.thumbnail_url ? 'none' : 'flex',
        }}
      >
        {initial}
      </div>

      <h2 className="bookmark-detail-name">{bookmark.name}</h2>

      {bookmark.tags && bookmark.tags.length > 0 && (
        <div className="bookmark-detail-tags">
          {bookmark.tags.map((t) => (
            <span key={t.id} className="bookmark-detail-tag">{t.tag}</span>
          ))}
        </div>
      )}

      {bookmark.description && (
        <div className="bookmark-detail-desc">{bookmark.description}</div>
      )}

      <div className="bookmark-detail-actions">
        {confirmingDelete ? (
          <div className="bookmark-detail-delete-confirm">
            <span>Delete this location?</span>
            <button
              className="bookmark-detail-confirm-yes"
              onClick={() => onDelete(bookmark.id)}
            >
              Yes, delete
            </button>
            <button
              className="bookmark-detail-confirm-no"
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              className="bookmark-detail-delete"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete
            </button>
            <button
              className="bookmark-detail-edit"
              onClick={() => onEdit(bookmark)}
            >
              &#9998; Edit
            </button>
          </>
        )}
      </div>
    </div>
  );
}
