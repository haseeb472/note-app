import React from 'react';
import { useNotes } from '../context/NotesContext';
import styles from './Sidebar.module.css';
import { FileText, Star, Archive, Trash2, Settings, Sun, Moon, X, Notebook, LogOut, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const {
    activeView,
    setActiveView,
    theme,
    toggleTheme,
    stats,
    settings,
    isSidebarOpen,
    setIsSidebarOpen,
    
    // Firebase additions
    user,
    authMode,
    logout
  } = useNotes();

  const menuItems = [
    { id: 'all', label: 'All Notes', icon: FileText, count: stats.all },
    { id: 'favorites', label: 'Favorites', icon: Star, count: stats.favorites },
    { id: 'archive', label: 'Archive', icon: Archive, count: stats.archive },
    { id: 'trash', label: 'Trash', icon: Trash2, count: stats.trash },
    { id: 'settings', label: 'Settings', icon: Settings, count: null }
  ];

  const getInitials = (name) => {
    if (!name) return 'YN';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const sidebarClass = `${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`;

  return (
    <>
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden backdrop-blur-sm"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 90 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={sidebarClass}>
        <button
          className={styles.closeMobileBtn}
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X size={24} />
        </button>

        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <Notebook size={18} fill="currentColor" />
          </div>
          <span className={styles.logoText}>YellowNotes</span>
        </div>

        <nav className={styles.nav}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setIsSidebarOpen(false); // Close on mobile navigation click
                }}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                whileHover={{ scale: isActive ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={styles.navItemContent}>
                  <Icon size={20} />
                  <span>{item.label}</span>
                </div>
                {item.count !== null && item.count > 0 && (
                  <span className={styles.badge}>{item.count}</span>
                )}
              </motion.button>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <motion.button
            className={styles.themeToggle}
            onClick={toggleTheme}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={20} />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={20} />
                <span>Dark Mode</span>
              </>
            )}
          </motion.button>

          {authMode === 'firebase' ? (
            <motion.button
              className={styles.themeToggle}
              onClick={logout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Log Out"
            >
              <LogOut size={20} />
              <span>Log Out</span>
            </motion.button>
          ) : (
            <motion.button
              className={styles.themeToggle}
              onClick={logout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Sign In"
            >
              <LogIn size={20} />
              <span>Connect Cloud</span>
            </motion.button>
          )}

          <div className={styles.profileCard}>
            <div className={styles.avatar}>{getInitials(settings.username)}</div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{settings.username}</span>
              <span className={styles.profileRole} style={{ fontSize: '10px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                {authMode === 'firebase' ? (user?.email || 'Cloud Account') : 'Offline Mode'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
