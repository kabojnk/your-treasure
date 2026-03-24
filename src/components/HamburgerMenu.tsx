import { useState } from 'react';
import type { FieldGuide } from '../lib/types';
import '../styles/hamburger.css';

interface HamburgerMenuProps {
  fieldGuides: FieldGuide[];
  activeFieldGuideId: string | null;
  onSelectFieldGuide: (id: string) => void;
  onAddFieldGuide: () => void;
  onEditFieldGuide: () => void;
  onDeleteFieldGuide: () => void;
  canDelete: boolean;
  onSignOut: () => void;
}

export function HamburgerMenu({
  fieldGuides,
  activeFieldGuideId,
  onSelectFieldGuide,
  onAddFieldGuide,
  onEditFieldGuide,
  onDeleteFieldGuide,
  canDelete,
  onSignOut,
}: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSelect = (id: string) => {
    onSelectFieldGuide(id);
    setOpen(false);
    setConfirmDelete(false);
  };

  const handleAdd = () => {
    onAddFieldGuide();
    setOpen(false);
    setConfirmDelete(false);
  };

  const handleEdit = () => {
    onEditFieldGuide();
    setOpen(false);
    setConfirmDelete(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDeleteFieldGuide();
    setOpen(false);
    setConfirmDelete(false);
  };

  return (
    <div className="hamburger-wrapper">
      <button
        className={`hamburger-btn${open ? ' open' : ''}`}
        onClick={() => { setOpen(!open); setConfirmDelete(false); }}
        aria-label="Menu"
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      {open && (
        <>
          <div className="hamburger-backdrop" onClick={() => { setOpen(false); setConfirmDelete(false); }} />
          <nav className="hamburger-panel">
            <div className="hamburger-section hamburger-section-love">
              Made with love, from me to you, chickadee &lt;3
            </div>

            {/* Mobile: Edit Field Guide section at top */}
            <div className="hamburger-section hamburger-section-edit-mobile">
              <button className="hamburger-edit-btn" onClick={handleEdit}>
                Edit Field Guide
              </button>
              {canDelete && (
                <div className="hamburger-delete-area">
                  {confirmDelete ? (
                    <div className="hamburger-delete-confirm">
                      <span>Delete this field guide?</span>
                      <button className="hamburger-confirm-yes" onClick={handleDelete}>
                        Yes, delete
                      </button>
                      <button className="hamburger-confirm-no" onClick={() => setConfirmDelete(false)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button className="hamburger-delete-btn" onClick={handleDelete}>
                      Delete Field Guide
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="hamburger-section hamburger-section-guides">
              <div className="hamburger-section-label">Field Guides</div>
              {fieldGuides.map((guide) => (
                <button
                  key={guide.id}
                  className={`hamburger-guide-item${guide.id === activeFieldGuideId ? ' active' : ''}`}
                  onClick={() => handleSelect(guide.id)}
                >
                  <span
                    className="hamburger-guide-avatar"
                    style={{ backgroundColor: guide.color }}
                  >
                    {guide.image_url ? (
                      <img src={guide.image_url} alt="" />
                    ) : (
                      <span>{guide.name.charAt(0).toUpperCase()}</span>
                    )}
                  </span>
                  <span className="hamburger-guide-info">
                    <span className="hamburger-guide-name">{guide.name}</span>
                    {guide.date && (
                      <span className="hamburger-guide-date">
                        {new Date(guide.date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </span>
                </button>
              ))}
              <button className="hamburger-add-btn" onClick={handleAdd}>
                + New Field Guide
              </button>
            </div>

            {/* Mobile: Sign out at bottom */}
            <div className="hamburger-section hamburger-section-signout-mobile">
              <button className="hamburger-signout-btn" onClick={onSignOut}>
                Sign Out
              </button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
