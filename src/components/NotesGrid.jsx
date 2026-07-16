import React, { useState } from 'react';
import { useNotes } from '../context/NotesContext';
import NoteCard from './NoteCard';
import styles from './NotesGrid.module.css';
import { Grid, List, Plus, SearchX, Trash2, Pin, StickyNote, Star, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotesGrid = () => {
  const {
    notes,
    activeView,
    searchQuery,
    sortBy,
    setSortBy,
    createNote,
    clearTrash
  } = useNotes();

  const [layout, setLayout] = useState('grid'); // grid | list

  // 1. Filter by View
  let filteredNotes = notes.filter((note) => {
    switch (activeView) {
      case 'all':
        return !note.isTrash && !note.isArchived;
      case 'favorites':
        return note.isFavorite && !note.isTrash && !note.isArchived;
      case 'archive':
        return note.isArchived && !note.isTrash;
      case 'trash':
        return note.isTrash;
      default:
        return false;
    }
  });

  // 2. Filter by Search Query
  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase();
    filteredNotes = filteredNotes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    );
  }

  // 3. Sort Notes
  filteredNotes.sort((a, b) => {
    if (sortBy === 'title') {
      const titleA = (a.title || 'Untitled').toLowerCase();
      const titleB = (b.title || 'Untitled').toLowerCase();
      return titleA.localeCompare(titleB);
    } else if (sortBy === 'createdAt') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else {
      // Default: updatedAt
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    }
  });

  // 4. Separate Pinned (Only relevant for 'all' and 'favorites' view)
  const showPinnedSection = activeView === 'all' || activeView === 'favorites';
  const pinnedNotes = showPinnedSection ? filteredNotes.filter((n) => n.isPinned) : [];
  const unpinnedNotes = showPinnedSection
    ? filteredNotes.filter((n) => !n.isPinned)
    : filteredNotes;

  const getViewTitle = () => {
    switch (activeView) {
      case 'all':
        return 'All Notes';
      case 'favorites':
        return 'Favorites';
      case 'archive':
        return 'Archive';
      case 'trash':
        return 'Trash';
      default:
        return 'Notes';
    }
  };

  const getEmptyStateDetails = () => {
    if (searchQuery) {
      return {
        icon: SearchX,
        title: 'No search results',
        text: 'We couldn\'t find any notes matching your search query. Try typing something else.',
        showCTA: false
      };
    }

    switch (activeView) {
      case 'favorites':
        return {
          icon: Star,
          title: 'No favorites yet',
          text: 'Mark important notes as favorites to see them collected here in one place.',
          showCTA: false
        };
      case 'archive':
        return {
          icon: Archive,
          title: 'Archive is empty',
          text: 'Archive notes you want to keep but hide from your main dashboard view.',
          showCTA: false
        };
      case 'trash':
        return {
          icon: Trash2,
          title: 'Trash is empty',
          text: 'Notes you delete will stay in the Trash folder until you empty it.',
          showCTA: false
        };
      default:
        return {
          icon: StickyNote,
          title: 'No notes here',
          text: 'Capture your thoughts, set goals, or make checklists. Create your very first note now!',
          showCTA: true
        };
    }
  };

  const emptyState = getEmptyStateDetails();
  const EmptyIcon = emptyState.icon;

  const handleEmptyTrash = () => {
    if (confirm('Are you sure you want to permanently delete all notes in the Trash? This action is permanent.')) {
      clearTrash();
    }
  };

  return (
    <div className={styles.container}>
      {/* Grid Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.titleSection}>
          <h2 className={styles.viewTitle}>{getViewTitle()}</h2>
          <span className={styles.countBadge}>{filteredNotes.length}</span>
        </div>

        <div className={styles.controls}>
          {activeView === 'trash' && filteredNotes.length > 0 && (
            <motion.button
              onClick={handleEmptyTrash}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                fontSize: '13px',
                fontWeight: '600'
              }}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 size={16} />
              <span>Empty Trash</span>
            </motion.button>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.sortSelect}
            aria-label="Sort notes"
          >
            <option value="updatedAt">Last Updated</option>
            <option value="createdAt">Date Created</option>
            <option value="title">Alphabetical</option>
          </select>

          <div className={styles.layoutToggle}>
            <button
              onClick={() => setLayout('grid')}
              className={`${styles.layoutBtn} ${layout === 'grid' ? styles.layoutBtnActive : ''}`}
              aria-label="Grid layout"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setLayout('list')}
              className={`${styles.layoutBtn} ${layout === 'list' ? styles.layoutBtnActive : ''}`}
              aria-label="List layout"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {filteredNotes.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <EmptyIcon size={32} />
          </div>
          <h3 className={styles.emptyTitle}>{emptyState.title}</h3>
          <p className={styles.emptyText}>{emptyState.text}</p>
          {emptyState.showCTA && (
            <motion.button
              onClick={createNote}
              className={styles.emptyBtn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={18} />
              <span>Create Note</span>
            </motion.button>
          )}
        </div>
      ) : (
        <div style={{ flexGrow: 1 }}>
          <motion.div layout className="relative">
            <AnimatePresence mode="popLayout">
              {/* Pinned Notes Section */}
              {pinnedNotes.length > 0 && (
                <div key="pinned-section">
                  <h4 className={styles.sectionHeader}>
                    <Pin size={12} fill="currentColor" />
                    <span>Pinned</span>
                  </h4>
                  <div className={layout === 'grid' ? styles.grid : styles.list}>
                    {pinnedNotes.map((note) => (
                      <NoteCard key={note.id} note={note} />
                    ))}
                  </div>
                  <div className={styles.divider} />
                </div>
              )}

              {/* Unpinned / Normal Notes Section */}
              {unpinnedNotes.length > 0 && (
                <div key="unpinned-section">
                  {pinnedNotes.length > 0 && (
                    <h4 className={styles.sectionHeader}>Other Notes</h4>
                  )}
                  <div className={layout === 'grid' ? styles.grid : styles.list}>
                    {unpinnedNotes.map((note) => (
                      <NoteCard key={note.id} note={note} />
                    ))}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* Floating Action Button (Only show if not in Trash view) */}
      {activeView !== 'trash' && (
        <motion.button
          onClick={createNote}
          className={styles.fab}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Create note"
          aria-label="Create note"
        >
          <Plus size={28} />
        </motion.button>
      )}
    </div>
  );
};

export default NotesGrid;
