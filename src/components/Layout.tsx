import { useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { useBookmarks } from '../hooks/useBookmarks';
import { useFieldGuides } from '../hooks/useFieldGuides';
import { useTags } from '../hooks/useTags';
import type { Bookmark, BookmarkFormData, FieldGuideFormData } from '../lib/types';
import { MapView } from './MapView';
import { SearchBar } from './SearchBar';
import type { PlaceData } from './SearchBar';
import { BookmarkList } from './BookmarkList';
import { BookmarkDetail } from './BookmarkDetail';
import { TagFilter } from './TagFilter';
import { AddEditModal } from './AddEditModal';
import { FieldGuideModal } from './FieldGuideModal';
import { HamburgerMenu } from './HamburgerMenu';
import { FieldGuideNotes } from './FieldGuideNotes';
import { MusicPlayer } from './MusicPlayer';
import '../styles/layout.css';

interface LayoutProps {
  user: User;
  onSignOut: () => void;
}

type BookmarkModalState =
  | { open: false }
  | { open: true; mode: 'add'; initialData: Partial<BookmarkFormData> }
  | { open: true; mode: 'edit'; bookmarkId: string; initialData: Partial<BookmarkFormData> };

type FieldGuideModalState =
  | { open: false }
  | { open: true; mode: 'add' }
  | { open: true; mode: 'edit'; guideId: string; initialData: Partial<FieldGuideFormData> };

export function Layout({ user, onSignOut }: LayoutProps) {
  const {
    fieldGuides,
    activeFieldGuide,
    activeFieldGuideId,
    setActiveFieldGuideId,
    loading: guidesLoading,
    addFieldGuide,
    updateFieldGuide,
    deleteFieldGuide,
  } = useFieldGuides(user.id);

  const {
    bookmarks,
    loading: bookmarksLoading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    updateWeights,
  } = useBookmarks(user.id, activeFieldGuideId);

  const { allTags, activeTags, toggleTag, clearTags, filteredBookmarks } = useTags(bookmarks);

  const [selectedBookmarkId, setSelectedBookmarkId] = useState<string | null>(null);
  const [detailViewOpen, setDetailViewOpen] = useState(false);

  // Clear selection when switching field guides
  const handleSelectFieldGuide = useCallback((guideId: string) => {
    setSelectedBookmarkId(null);
    setDetailViewOpen(false);
    clearTags();
    setActiveFieldGuideId(guideId);
  }, [setActiveFieldGuideId, clearTags]);
  const [bookmarkModalState, setBookmarkModalState] = useState<BookmarkModalState>({ open: false });
  const [guideModalState, setGuideModalState] = useState<FieldGuideModalState>({ open: false });

  // Search bar → open Add modal with pre-filled data
  const handlePlaceSelected = useCallback((placeData: PlaceData) => {
    const description = placeData.summary || placeData.address;

    setBookmarkModalState({
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
    setBookmarkModalState({
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
      setBookmarkModalState({ open: false });
    },
    [addBookmark]
  );

  // Save from edit modal
  const handleUpdate = useCallback(
    async (data: BookmarkFormData) => {
      if (bookmarkModalState.open && bookmarkModalState.mode === 'edit') {
        await updateBookmark(bookmarkModalState.bookmarkId, data);
        setBookmarkModalState({ open: false });
      }
    },
    [bookmarkModalState, updateBookmark]
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

  // Field guide handlers
  const handleAddFieldGuide = useCallback(() => {
    setGuideModalState({ open: true, mode: 'add' });
  }, []);

  const handleEditFieldGuide = useCallback(() => {
    if (!activeFieldGuide) return;
    setGuideModalState({
      open: true,
      mode: 'edit',
      guideId: activeFieldGuide.id,
      initialData: {
        name: activeFieldGuide.name,
        description: activeFieldGuide.description ?? '',
        date: activeFieldGuide.date ?? '',
        color: activeFieldGuide.color,
        image_url: activeFieldGuide.image_url ?? '',
        notes: activeFieldGuide.notes ?? '',
      },
    });
  }, [activeFieldGuide]);

  const handleSaveFieldGuide = useCallback(
    async (data: FieldGuideFormData) => {
      if (guideModalState.open && guideModalState.mode === 'add') {
        await addFieldGuide(data);
      } else if (guideModalState.open && guideModalState.mode === 'edit') {
        await updateFieldGuide(guideModalState.guideId, data);
      }
      setGuideModalState({ open: false });
    },
    [guideModalState, addFieldGuide, updateFieldGuide]
  );

  const handleDeleteFieldGuide = useCallback(async () => {
    if (!activeFieldGuideId) return;
    await deleteFieldGuide(activeFieldGuideId);
  }, [activeFieldGuideId, deleteFieldGuide]);

  const handleUpdateNotes = useCallback(
    async (notes: string) => {
      if (!activeFieldGuide) return;
      await updateFieldGuide(activeFieldGuide.id, {
        name: activeFieldGuide.name,
        description: activeFieldGuide.description ?? '',
        date: activeFieldGuide.date ?? '',
        color: activeFieldGuide.color,
        image_url: activeFieldGuide.image_url ?? '',
        notes,
      });
    },
    [activeFieldGuide, updateFieldGuide]
  );

  const loading = guidesLoading || bookmarksLoading;
  const canDeleteFieldGuide = bookmarks.length === 0;

  return (
    <div className="layout">
      <header className="app-header">
        <div className="app-header-left">
          <HamburgerMenu
            fieldGuides={fieldGuides}
            activeFieldGuideId={activeFieldGuideId}
            onSelectFieldGuide={handleSelectFieldGuide}
            onAddFieldGuide={handleAddFieldGuide}
            onEditFieldGuide={handleEditFieldGuide}
            onDeleteFieldGuide={handleDeleteFieldGuide}
            canDelete={canDeleteFieldGuide}
            onSignOut={onSignOut}
          />
          <div className="app-header-title">
            <img src="/bear-chickadee.png" alt="" className="app-header-logo" />
            <div>
              <h1>I'll Be Your Treasure</h1>
              <p className="app-header-subtitle">
                {activeFieldGuide
                  ? `${activeFieldGuide.name}${activeFieldGuide.description ? ' — ' + activeFieldGuide.description : ''}`
                  : 'All the places we\'ll explore together'}
              </p>
            </div>
          </div>
        </div>
        <div className="app-header-right">
          <button className="app-header-edit-guide" onClick={handleEditFieldGuide}>
            Edit Field Guide
          </button>
          <button className="app-header-signout" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      </header>

      <div className="layout-body">
        <div className="layout-left">
          <SearchBar onPlaceSelected={handlePlaceSelected} />
          <MapView
            bookmarks={filteredBookmarks}
            allBookmarks={bookmarks}
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
            ) : detailViewOpen && selectedBookmarkId && bookmarks.find((b) => b.id === selectedBookmarkId) ? (
              <BookmarkDetail
                bookmark={bookmarks.find((b) => b.id === selectedBookmarkId)!}
                onClose={handleCloseDetail}
                onEdit={handleOpenEditModal}
                onDelete={handleDelete}
              />
            ) : (
              <>
                <BookmarkList
                  bookmarks={filteredBookmarks}
                  activeTags={activeTags}
                  onTagClick={toggleTag}
                  onBookmarkClick={handleBookmarkClick}
                  onReorder={handleReorder}
                />
                {activeFieldGuide && activeFieldGuide.notes && (
                  <FieldGuideNotes
                    notes={activeFieldGuide.notes}
                    onUpdateNotes={handleUpdateNotes}
                  />
                )}
              </>
            )}
          </div>

          <MusicPlayer />
        </div>
      </div>

      {bookmarkModalState.open && (
        <AddEditModal
          mode={bookmarkModalState.mode}
          initialData={bookmarkModalState.initialData}
          allTags={allTags}
          onSave={bookmarkModalState.mode === 'add' ? handleAdd : handleUpdate}
          onCancel={() => setBookmarkModalState({ open: false })}
        />
      )}

      {guideModalState.open && (
        <FieldGuideModal
          mode={guideModalState.mode}
          initialData={guideModalState.mode === 'edit' ? guideModalState.initialData : undefined}
          onSave={handleSaveFieldGuide}
          onCancel={() => setGuideModalState({ open: false })}
        />
      )}
    </div>
  );
}
