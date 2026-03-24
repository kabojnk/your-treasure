import { useState, useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import type { FieldGuideFormData } from '../lib/types';
import { uploadToBunny } from '../lib/bunnyUpload';
import '../styles/modal.css';
import '../styles/field-guide-modal.css';

interface FieldGuideModalProps {
  mode: 'add' | 'edit';
  initialData?: Partial<FieldGuideFormData>;
  onSave: (data: FieldGuideFormData) => Promise<void>;
  onCancel: () => void;
}

const PRESET_COLORS = [
  '#FBF8CC', '#FDE4CF', '#FFCFD2', '#F1C0E8', '#CFBAF0',
  '#A3C4F3', '#90DBF4', '#8EECF5', '#98F5E1', '#B9FBC0',
];

export function FieldGuideModal({ mode, initialData, onSave, onCancel }: FieldGuideModalProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [date, setDate] = useState(initialData?.date ?? '');
  const [color, setColor] = useState(initialData?.color ?? '#A3C4F3');
  const [imageUrl, setImageUrl] = useState(initialData?.image_url ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToBunny(file);
      setImageUrl(url);
      setImageError(false);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed. You can paste a URL instead.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        date,
        color,
        image_url: imageUrl.trim(),
        notes,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card fg-modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>{mode === 'add' ? 'New Field Guide' : 'Edit Field Guide'}</h2>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Image + Name row */}
          <div className="fg-image-name-row">
            <div className="fg-image-upload">
              <div
                className="fg-image-preview"
                style={{
                  backgroundColor: /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#A3C4F3',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {imageUrl && !imageError ? (
                  <img
                    src={imageUrl}
                    alt="Field guide"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span className="fg-image-placeholder-text">
                    {uploading ? '...' : '+'}
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => { setImageUrl(e.target.value); setImageError(false); }}
                placeholder="Or paste image URL"
                className="fg-image-url-input"
              />
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
              placeholder="e.g., PNW Trip"
            />
          </div>

          {/* Description */}
          <div className="modal-field">
            <label>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description"
            />
          </div>

          {/* Date + Color row */}
          <div className="modal-field-row">
            <div className="modal-field">
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="modal-field">
              <label>Color</label>
              <div className="modal-color-row">
                <input
                  type="text"
                  value={color}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (!val.startsWith('#')) val = '#' + val;
                    setColor(val);
                  }}
                  placeholder="#A3C4F3"
                  maxLength={7}
                  className="modal-color-hex-input"
                />
                <div
                  className="modal-color-swatch"
                  style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#A3C4F3' }}
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

          {/* Notes (Markdown Editor) */}
          <div className="modal-field fg-notes-field" data-color-mode="light">
            <label>Notes</label>
            <MDEditor
              value={notes}
              onChange={(val) => setNotes(val ?? '')}
              height={200}
              preview="edit"
              visibleDragbar={false}
            />
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="modal-btn-save" disabled={saving || uploading || !name.trim()}>
              {saving ? 'Saving...' : mode === 'add' ? 'Create' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
