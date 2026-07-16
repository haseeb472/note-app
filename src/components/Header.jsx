import React, { useRef, useEffect } from 'react';
import { useNotes } from '../context/NotesContext';
import styles from './Header.module.css';
import { Menu, Search, Sun, Moon, Notebook, X } from 'lucide-react';
import { motion } from 'framer-motion';

const Header = () => {
  const {
    searchQuery,
    setSearchQuery,
    theme,
    toggleTheme,
    settings,
    setIsSidebarOpen,
    activeView
  } = useNotes();

  const searchInputRef = useRef(null);

  // Keyboard shortcut listener to focus search on '/'
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Focus if '/' is pressed and user is not already typing in an input/textarea
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'YN';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  // Get view display title
  const getViewTitle = () => {
    switch (activeView) {
      case 'all': return 'All Notes';
      case 'favorites': return 'Favorites';
      case 'archive': return 'Archive';
      case 'trash': return 'Trash';
      case 'settings': return 'Settings';
      default: return 'Notes';
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button
          className={styles.menuBtn}
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div className={styles.mobileLogo}>
          <div className={styles.logoIcon}>
            <Notebook size={14} fill="currentColor" />
          </div>
          <span className={styles.logoText}>YellowNotes</span>
        </div>
      </div>

      <div className={styles.searchContainer}>
        <Search size={18} className={styles.searchIcon} />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={`Search ${getViewTitle().toLowerCase()}...`}
          className={styles.searchInput}
          aria-label="Search notes"
        />
        {searchQuery ? (
          <button
            onClick={clearSearch}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', display: 'flex', color: 'rgba(26,26,26,0.6)' }}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        ) : (
          <span className={styles.shortcutHint}>/</span>
        )}
      </div>

      <div className={styles.rightSection}>
        <motion.button
          className={styles.themeToggle}
          onClick={toggleTheme}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle dark/light mode"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>

        <motion.div
          className={styles.avatar}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {getInitials(settings.username)}
        </motion.div>
      </div>
    </header>
  );
};

export default Header;
