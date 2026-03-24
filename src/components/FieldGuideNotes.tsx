import { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import Markdown from 'react-markdown';
import '../styles/field-guide-notes.css';

interface FieldGuideNotesProps {
  notes: string;
  onUpdateNotes: (notes: string) => Promise<void>;
}

export function FieldGuideNotes({ notes, onUpdateNotes }: FieldGuideNotesProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes);
  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    setDraft(notes);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateNotes(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setDraft(notes);
  };

  return (
    <div className="fg-notes-section">
      <div className="fg-notes-header">
        <span className="fg-notes-label">Field Guide Notes</span>
        {!editing && (
          <button className="fg-notes-edit-btn" onClick={handleEdit}>
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="fg-notes-editor" data-color-mode="light">
          <MDEditor
            value={draft}
            onChange={(val) => setDraft(val ?? '')}
            height={200}
            preview="edit"
            visibleDragbar={false}
          />
          <div className="fg-notes-editor-actions">
            <button className="fg-notes-cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button className="fg-notes-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>
      ) : (
        <div className="fg-notes-rendered">
          <Markdown>{notes}</Markdown>
        </div>
      )}
    </div>
  );
}
