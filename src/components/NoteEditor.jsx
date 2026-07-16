import React, { useState, useEffect, useRef } from 'react';
import { useNotes } from '../context/NotesContext';
import styles from './NoteEditor.module.css';
import {
  ChevronLeft,
  Pin,
  Star,
  Archive,
  ArchiveRestore,
  Trash2,
  Palette,
  Check,
  RotateCcw,
  Notebook
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NoteEditor = () => {
  const {
    notes,
    currentNoteId,
    setCurrentNoteId,
    updateNote,
    deleteNote,
    pinNote,
    favoriteNote,
    archiveNote,
    restoreNote,
    deletePermanently
  } = useNotes();

  const note = notes.find((n) => n.id === currentNoteId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteColor, setNoteColor] = useState('default');
  const [savingStatus, setSavingStatus] = useState('idle'); // idle | saving | saved
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef(null);

  // Sync editor states when selected note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setNoteColor(note.color || 'default');
      setSavingStatus('idle');
    } else {
      setTitle('');
      setContent('');
      setNoteColor('default');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNoteId]);

  // Refs to keep track of latest state for cleanup effect
  const latestTitle = useRef(title);
  const latestContent = useRef(content);
  const latestColor = useRef(noteColor);
  const initialTitle = useRef('');
  const initialContent = useRef('');
  const initialColor = useRef('default');

  useEffect(() => {
    latestTitle.current = title;
  }, [title]);

  useEffect(() => {
    latestContent.current = content;
  }, [content]);

  useEffect(() => {
    latestColor.current = noteColor;
  }, [noteColor]);

  useEffect(() => {
    if (note) {
      initialTitle.current = note.title || '';
      initialContent.current = note.content || '';
      initialColor.current = note.color || 'default';
    }
  }, [currentNoteId, note]);

  // Final save with timestamp update on navigation away/active note change
  useEffect(() => {
    const activeId = currentNoteId;
    return () => {
      if (!activeId) return;

      const titleChanged = latestTitle.current !== initialTitle.current;
      const contentChanged = latestContent.current !== initialContent.current;
      const colorChanged = latestColor.current !== initialColor.current;

      if (titleChanged || contentChanged || colorChanged) {
        updateNote(activeId, {
          title: latestTitle.current,
          content: latestContent.current,
          color: latestColor.current
        }, true);
      }
    };
  }, [currentNoteId, updateNote]);

  // Debounced auto-save effect (saves content without updating updatedAt timestamp to prevent jumping in list)
  useEffect(() => {
    if (!note) return;
    
    // Check if anything actually changed
    const titleChanged = title !== (note.title || '');
    const contentChanged = content !== (note.content || '');
    const colorChanged = noteColor !== (note.color || 'default');
    
    if (!titleChanged && !contentChanged && !colorChanged) return;

    setSavingStatus('saving');
    
    const delayDebounceFn = setTimeout(() => {
      updateNote(note.id, {
        title,
        content,
        color: noteColor
      }, false);
      setSavingStatus('saved');
      
      // Clear saved indicator after 2 seconds
      const statusResetFn = setTimeout(() => {
        setSavingStatus('idle');
      }, 2000);
      
      return () => clearTimeout(statusResetFn);
    }, 600);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, noteColor, note?.id]);

  // Close color picker dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!note) {
    return (
      <div className={styles.noNote}>
        <div className={styles.noNoteIcon}>
          <Notebook size={64} className="text-muted-foreground" />
        </div>
        <h3 className={styles.noNoteTitle}>No note selected</h3>
        <p style={{ fontSize: '14px', maxWidth: '280px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Select an existing note from the list, or create a brand new note to start writing.
        </p>
      </div>
    );
  }

  // Count metrics
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBack = () => {
    // Save immediately before exiting if saving
    if (savingStatus === 'saving') {
      updateNote(note.id, { title, content, color: noteColor });
    }
    setCurrentNoteId(null);
  };

  const colors = [
    { name: 'default', label: 'Default' },
    { name: 'red', label: 'Red' },
    { name: 'orange', label: 'Orange' },
    { name: 'yellow', label: 'Yellow' },
    { name: 'green', label: 'Green' },
    { name: 'blue', label: 'Blue' },
    { name: 'purple', label: 'Purple' },
    { name: 'pink', label: 'Pink' }
  ];

  const handleTrash = () => {
    if (note.isTrash) {
      if (confirm('Permanently delete this note? This action is irreversible.')) {
        deletePermanently(note.id);
      }
    } else {
      deleteNote(note.id);
    }
  };

  const editorClass = `${styles.editor} ${styles[`color_${noteColor}`]} ${currentNoteId ? styles.editorActive : ''}`;

  return (
    <div className={editorClass}>
      {/* Editor Header Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button
            onClick={handleBack}
            className={styles.backBtn}
            title="Go back to list"
            aria-label="Go back to list"
          >
            <ChevronLeft size={20} />
          </button>
          
          {savingStatus === 'saving' && (
            <span className={styles.saveIndicator} style={{ color: 'var(--text-muted)' }}>
              <span className="animate-pulse">Saving...</span>
            </span>
          )}
          {savingStatus === 'saved' && (
            <span className={styles.saveIndicator}>
              <Check size={14} />
              <span>Saved</span>
            </span>
          )}
        </div>

        <div className={styles.toolbarRight}>
          {note.isTrash ? (
            <>
              <button
                onClick={() => restoreNote(note.id)}
                className={styles.actionBtn}
                title="Restore note"
                aria-label="Restore note"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={handleTrash}
                className={styles.actionBtn}
                style={{ color: '#EF4444' }}
                title="Delete permanently"
                aria-label="Delete permanently"
              >
                <Trash2 size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => pinNote(note.id)}
                className={`${styles.actionBtn} ${note.isPinned ? styles.pinActive : ''}`}
                title={note.isPinned ? 'Unpin note' : 'Pin note'}
                aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
              >
                <Pin size={18} fill={note.isPinned ? 'currentColor' : 'none'} />
              </button>

              <button
                onClick={() => favoriteNote(note.id)}
                className={`${styles.actionBtn} ${note.isFavorite ? styles.favActive : ''}`}
                title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                aria-label={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star size={18} fill={note.isFavorite ? 'currentColor' : 'none'} />
              </button>

              <button
                onClick={() => archiveNote(note.id)}
                className={styles.actionBtn}
                title={note.isArchived ? 'Unarchive note' : 'Archive note'}
                aria-label={note.isArchived ? 'Unarchive note' : 'Archive note'}
              >
                {note.isArchived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
              </button>

              <div className={styles.colorPickerContainer} ref={colorPickerRef}>
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className={`${styles.actionBtn} ${showColorPicker ? styles.actionBtnActive : ''}`}
                  title="Change note color"
                  aria-label="Change note color"
                >
                  <Palette size={18} />
                </button>
                
                <AnimatePresence>
                  {showColorPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={styles.colorDropdown}
                    >
                      {colors.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => {
                            setNoteColor(c.name);
                            setShowColorPicker(false);
                          }}
                          className={`${styles.colorDot} ${styles[`dot_${c.name}`]} ${
                            noteColor === c.name ? styles.colorDotActive : ''
                          }`}
                          title={c.label}
                          aria-label={`Set color to ${c.label}`}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={handleTrash}
                className={styles.actionBtn}
                title="Move to trash"
                aria-label="Move to trash"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor Text Inputs */}
      <div className={styles.editorBody}>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Note"
          className={styles.titleInput}
          rows={1}
          aria-label="Note Title"
          style={{ height: 'auto', overflowY: 'hidden' }}
          onInput={(e) => {
            // Auto grow input
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your thoughts..."
          className={styles.contentArea}
          aria-label="Note Content"
        />
      </div>

      {/* Editor Footer */}
      <div className={styles.footer}>
        <span className={styles.timestamp}>
          {note.updatedAt ? `Last edited ${formatDate(note.updatedAt)}` : `Created ${formatDate(note.createdAt)}`}
        </span>
        <div className={styles.stats}>
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
