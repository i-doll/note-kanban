import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { useNotesStore } from '../../stores';
import { useTags } from '../../hooks';
import './TagInput.css';

export function TagInput() {
  const { notes, activeNoteId, updateNote } = useNotesStore();
  const { allTags } = useTags();
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeNote = useMemo(
    () => notes.find(n => n.frontmatter.id === activeNoteId),
    [notes, activeNoteId]
  );

  const currentTags = activeNote?.frontmatter.tags || [];

  const suggestions = useMemo(() => {
    const available = allTags.filter(t => !currentTags.includes(t));
    if (!inputValue.trim()) return available;
    const query = inputValue.toLowerCase();
    return available.filter(tag => tag.toLowerCase().includes(query));
  }, [inputValue, allTags, currentTags]);

  const saveTags = useCallback(async (newTags: string[]) => {
    if (!activeNote) return;
    try {
      await updateNote({
        file_path: activeNote.file_path,
        tags: newTags,
      });
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  }, [activeNote, updateNote]);

  const addTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (!trimmedTag || currentTags.includes(trimmedTag)) return;

    const newTags = [...currentTags, trimmedTag];
    saveTags(newTags);
    setInputValue('');
    setShowDropdown(false);
    setHighlightedIndex(-1);
  }, [currentTags, saveTags]);

  const removeTag = useCallback((tagToRemove: string) => {
    const newTags = currentTags.filter(t => t !== tagToRemove);
    saveTags(newTags);
  }, [currentTags, saveTags]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        addTag(suggestions[highlightedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowDropdown(true);
      setHighlightedIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    } else if (e.key === 'Backspace' && !inputValue && currentTags.length > 0) {
      removeTag(currentTags[currentTags.length - 1]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeNote) return null;

  return (
    <div className="tag-input-container">
      <div className="tag-input-wrapper">
        <div className="tag-input-tags">
          {currentTags.map(tag => (
            <span key={tag} className="tag-chip">
              <span className="tag-chip-text">{tag}</span>
              <button
                className="tag-chip-remove"
                onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            className="tag-input-field"
            placeholder={currentTags.length === 0 ? "Add tags..." : ""}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowDropdown(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {showDropdown && suggestions.length > 0 && (
          <div ref={dropdownRef} className="tag-input-dropdown">
            {suggestions.slice(0, 8).map((tag, index) => (
              <button
                key={tag}
                className={`tag-input-suggestion ${index === highlightedIndex ? 'highlighted' : ''}`}
                onClick={() => addTag(tag)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
