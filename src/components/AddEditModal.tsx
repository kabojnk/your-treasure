import { useState } from 'react';
import type { BookmarkFormData } from '../lib/types';
import '../styles/modal.css';

interface AddEditModalProps {
  mode: 'add' | 'edit';
  initialData?: Partial<BookmarkFormData>;
  allTags?: string[];
  onSave: (data: BookmarkFormData) => Promise<void>;
  onCancel: () => void;
}

const PRESET_COLORS = [
  '#FBF8CC', '#FDE4CF', '#FFCFD2', '#F1C0E8', '#CFBAF0',
  '#A3C4F3', '#90DBF4', '#8EECF5', '#98F5E1', '#B9FBC0',
];

export function AddEditModal({ mode, initialData, allTags = [], onSave, onCancel }: AddEditModalProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnail_url ?? '');
  const [weight, setWeight] = useState(initialData?.weight ?? 0);
  const [color, setColor] = useState(initialData?.color ?? '#ffffff');
  const [latitude, setLatitude] = useState<number | null>(initialData?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(initialData?.longitude ?? null);
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [thumbError, setThumbError] = useState(false);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        thumbnail_url: thumbnailUrl.trim(),
        weight,
        color,
        latitude,
        longitude,
        tags,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>{mode === 'add' ? 'Add Location' : 'Edit Location'}</h2>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Thumbnail URL + preview */}
          <div className="modal-field">
            <label>Thumbnail URL</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => { setThumbnailUrl(e.target.value); setThumbError(false); }}
                placeholder="https://..."
                style={{ flex: 1 }}
              />
              {thumbnailUrl && !thumbError ? (
                <img
                  src={thumbnailUrl}
                  alt="Preview"
                  className="modal-thumbnail-preview"
                  onError={() => setThumbError(true)}
                />
              ) : (
                <div className="modal-thumbnail-placeholder">
                  {name ? name.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="modal-field">
            <label>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Location name"
            />
          </div>

          {/* Field Notes */}
          <div className="modal-field">
            <label>Field Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this place special?"
              rows={4}
            />
          </div>

          {/* Tags */}
          <div className="modal-field">
            <label>Tags</label>
            <div className="modal-tags-container">
              {tags.map((tag) => (
                <span key={tag} className="modal-tag-chip">
                  {tag}
                  <button type="button" className="modal-tag-remove" onClick={() => handleRemoveTag(tag)}>
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="modal-tag-input-row">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Type a tag and press Enter"
              />
              <button type="button" className="modal-tag-add-btn" onClick={handleAddTag}>
                Add
              </button>
            </div>
            {allTags.filter((t) => !tags.includes(t)).length > 0 && (
              <div className="modal-tag-suggestions">
                {allTags.filter((t) => !tags.includes(t)).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="modal-tag-suggestion"
                    onClick={() => setTags([...tags, t])}
                  >
                    + {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Weight + Color row */}
          <div className="modal-field-row">
            <div className="modal-field">
              <label>Weight (sort order)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="modal-field">
              <label>Pin Color</label>
              <div className="modal-color-row">
                <input
                  type="text"
                  value={color}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (!val.startsWith('#')) val = '#' + val;
                    setColor(val);
                  }}
                  placeholder="#ffffff"
                  maxLength={7}
                  className="modal-color-hex-input"
                />
                <div
                  className="modal-color-swatch"
                  style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#ffffff' }}
                />
              </div>
              <div className="modal-color-presets">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`modal-color-preset${color.toUpperCase() === c ? ' active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c.toLowerCase())}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Lat/Lng (read-only) */}
          <div className="modal-field-row">
            <div className="modal-field">
              <label>Latitude</label>
              <input
                type="number"
                step="any"
                value={latitude ?? ''}
                onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Auto-filled"
              />
            </div>
            <div className="modal-field">
              <label>Longitude</label>
              <input
                type="number"
                step="any"
                value={longitude ?? ''}
                onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Auto-filled"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="modal-btn-save" disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : mode === 'add' ? 'Add' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
