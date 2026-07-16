import React from 'react';
import { useNotes } from '../context/NotesContext';
import styles from './NoteCard.module.css';
import { Pin, Star, Archive, ArchiveRestore, Trash2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

const NoteCard = ({ note }) => {
  const {
    currentNoteId,
    setCurrentNoteId,
    pinNote,
    favoriteNote,
    archiveNote,
    deleteNote,
    restoreNote,
    deletePermanently
  } = useNotes();

  const isSelected = currentNoteId === note.id;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleCardClick = () => {
    setCurrentNoteId(note.id);
  };

  const handlePin = (e) => {
    e.stopPropagation();
    pinNote(note.id);
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    favoriteNote(note.id);
  };

  const handleArchive = (e) => {
    e.stopPropagation();
    archiveNote(note.id);
  };

  const handleTrash = (e) => {
    e.stopPropagation();
    if (note.isTrash) {
      if (confirm('Are you sure you want to permanently delete this note? This action cannot be undone.')) {
        deletePermanently(note.id);
      }
    } else {
      deleteNote(note.id);
    }
  };

  const handleRestore = (e) => {
    e.stopPropagation();
    restoreNote(note.id);
  };

  // Helper to strip markdown for preview text
  const getPlainPreview = (markdownText) => {
    if (!markdownText) return 'No additional text';
    return markdownText
      .replace(/[#*`•-]/g, '') // Strip typical markdown chars
      .replace(/\s+/g, ' ')
      .trim();
  };

  const colorClass = styles[`color_${note.color}`] || '';
  const cardClass = `${styles.card} ${colorClass} ${isSelected ? styles.activeCard : ''}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={handleCardClick}
      className={cardClass}
    >
      {/* Top color bar */}
      <div className={styles.colorBadge} />

      <div className={styles.header}>
        <h3 className={`${styles.title} ${!note.title ? styles.untitled : ''}`}>
          {note.title || 'Untitled Note'}
        </h3>
        {!note.isTrash && !note.isArchived && (
          <button
            onClick={handlePin}
            className={`${styles.pinIcon} ${note.isPinned ? styles.pinned : ''}`}
            aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin size={16} fill={note.isPinned ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      <p className={styles.content}>
        {getPlainPreview(note.content)}
      </p>

      <div className={styles.footer}>
        <span className={styles.date}>
          {formatDate(note.updatedAt || note.createdAt)}
        </span>
        <div className={styles.actions}>
          {note.isTrash ? (
            <>
              <button
                onClick={handleRestore}
                className={styles.actionBtn}
                title="Restore note"
                aria-label="Restore note"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={handleTrash}
                className={styles.actionBtn}
                style={{ color: '#EF4444' }}
                title="Delete permanently"
                aria-label="Delete permanently"
              >
                <Trash2 size={15} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleFavorite}
                className={`${styles.actionBtn} ${note.isFavorite ? styles.favActive : ''}`}
                title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                aria-label={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star size={15} fill={note.isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={handleArchive}
                className={styles.actionBtn}
                title={note.isArchived ? 'Unarchive note' : 'Archive note'}
                aria-label={note.isArchived ? 'Unarchive note' : 'Archive note'}
              >
                {note.isArchived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
              </button>
              <button
                onClick={handleTrash}
                className={styles.actionBtn}
                title="Move to trash"
                aria-label="Move to trash"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NoteCard;
