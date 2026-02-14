import { useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { useBookmarks } from '../hooks/useBookmarks';
import { useTags } from '../hooks/useTags';
import type { Bookmark, BookmarkFormData } from '../lib/types';
import { MapView } from './MapView';
import { SearchBar } from './SearchBar';
import type { PlaceData } from './SearchBar';
import { BookmarkList } from './BookmarkList';
import { BookmarkDetail } from './BookmarkDetail';
import { TagFilter } from './TagFilter';
import { AddEditModal } from './AddEditModal';
import { MusicPlayer } from './MusicPlayer';
import '../styles/layout.css';

interface LayoutProps {
  user: User;
  onSignOut: () => void;
}

type ModalState =
  | { open: false }
  | { open: true; mode: 'add'; initialData: Partial<BookmarkFormData> }
  | { open: true; mode: 'edit'; bookmarkId: string; initialData: Partial<BookmarkFormData> };

export function Layout({ user, onSignOut }: LayoutProps) {
  const {
    bookmarks,
    loading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    updateWeights,
  } = useBookmarks(user.id);
  const { allTags, activeTags, toggleTag, clearTags, filteredBookmarks } = useTags(bookmarks);

  const [selectedBookmarkId, setSelectedBookmarkId] = useState<string | null>(null);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({ open: false });

  // Search bar → open Add modal with pre-filled data
  const handlePlaceSelected = useCallback((placeData: PlaceData) => {
    // Prefer editorial summary for Field Notes; fall back to address
    const description = placeData.summary || placeData.address;

    setModalState({
      open: true,
      mode: 'add',
      initialData: {
        name: placeData.name,
        description,
        latitude: placeData.lat,
        longitude: placeData.lng,
        thumbnail_url: placeData.photoUrl ?? '',
        color: '#ffffff',
        weight: 0,
        tags: [],
      },
    });
  }, []);

  // Click bookmark in list → expand detail + zoom map
  const handleBookmarkClick = useCallback((id: string) => {
    setSelectedBookmarkId(id);
    setDetailViewOpen(true);
  }, []);

  // Click marker on map → expand detail
  const handleMarkerClick = useCallback((id: string) => {
    setSelectedBookmarkId(id);
    setDetailViewOpen(true);
  }, []);

  // Close detail → restore list + reset map zoom
  const handleCloseDetail = useCallback(() => {
    setSelectedBookmarkId(null);
    setDetailViewOpen(false);
  }, []);

  // Open edit modal from detail view
  const handleOpenEditModal = useCallback((bookmark: Bookmark) => {
    setModalState({
      open: true,
      mode: 'edit',
      bookmarkId: bookmark.id,
      initialData: {
        name: bookmark.name,
        description: bookmark.description ?? '',
        latitude: bookmark.latitude,
        longitude: bookmark.longitude,
        color: bookmark.color,
        thumbnail_url: bookmark.thumbnail_url ?? '',
        weight: bookmark.weight,
        tags: bookmark.tags?.map((t) => t.tag) ?? [],
      },
    });
  }, []);

  // Save from add modal
  const handleAdd = useCallback(
    async (data: BookmarkFormData) => {
      await addBookmark(data);
      setModalState({ open: false });
    },
    [addBookmark]
  );

  // Save from edit modal
  const handleUpdate = useCallback(
    async (data: BookmarkFormData) => {
      if (modalState.open && modalState.mode === 'edit') {
        await updateBookmark(modalState.bookmarkId, data);
        setModalState({ open: false });
      }
    },
    [modalState, updateBookmark]
  );

  // Delete from detail view
  const handleDelete = useCallback(
    async (id: string) => {
      await deleteBookmark(id);
      setSelectedBookmarkId(null);
      setDetailViewOpen(false);
    },
    [deleteBookmark]
  );

  // Drag-to-reorder
  const handleReorder = useCallback(
    (reordered: Bookmark[]) => {
      updateWeights(reordered);
    },
    [updateWeights]
  );

  return (
    <div className="layout">
      <header className="app-header">
        <div className="app-header-title">
          <img src="/bear-chickadee.png" alt="" className="app-header-logo" />
          <div>
            <h1>I'll Be Your Treasure</h1>
            <p className="app-header-subtitle">All the places we'll explore together. Let's plan it together, my chickadee. A gift to you, from your big bear</p>
          </div>
        </div>
        <button className="app-header-signout" onClick={onSignOut}>
          Sign Out
        </button>
      </header>

      <div className="layout-body">
        <div className="layout-left">
          <SearchBar onPlaceSelected={handlePlaceSelected} />
          <MapView
            bookmarks={filteredBookmarks}
            selectedBookmarkId={detailViewOpen ? selectedBookmarkId : null}
            onMarkerClick={handleMarkerClick}
            onPlaceSelected={handlePlaceSelected}
          />
        </div>

        <div className="layout-right">
          <div className="layout-right-content">
            <TagFilter
              allTags={allTags}
              activeTags={activeTags}
              onToggle={toggleTag}
              onClear={clearTags}
            />

            {loading ? (
              <div className="bookmark-list-empty">Loading locations...</div>
            ) : detailViewOpen && selectedBookmarkId ? (
              <BookmarkDetail
                bookmark={bookmarks.find((b) => b.id === selectedBookmarkId)!}
                onClose={handleCloseDetail}
                onEdit={handleOpenEditModal}
                onDelete={handleDelete}
              />
            ) : (
              <BookmarkList
                bookmarks={filteredBookmarks}
                activeTags={activeTags}
                onTagClick={toggleTag}
                onBookmarkClick={handleBookmarkClick}
                onReorder={handleReorder}
              />
            )}
          </div>

          <MusicPlayer />
        </div>
      </div>

      {modalState.open && (
        <AddEditModal
          mode={modalState.mode}
          initialData={modalState.initialData}
          allTags={allTags}
          onSave={modalState.mode === 'add' ? handleAdd : handleUpdate}
          onCancel={() => setModalState({ open: false })}
        />
      )}
    </div>
  );
}
