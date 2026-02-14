interface TagFilterProps {
  allTags: string[];
  activeTags: Set<string>;
  onToggle: (tag: string) => void;
  onClear: () => void;
}

export function TagFilter({ allTags, activeTags, onToggle, onClear }: TagFilterProps) {
  if (allTags.length === 0) return null;

  return (
    <div className="tag-filter-bar">
      {allTags.map((tag) => (
        <button
          key={tag}
          className={`tag-filter-chip ${activeTags.has(tag) ? 'active' : ''}`}
          onClick={() => onToggle(tag)}
        >
          {tag}
        </button>
      ))}
      {activeTags.size > 0 && (
        <button className="tag-filter-clear" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}
