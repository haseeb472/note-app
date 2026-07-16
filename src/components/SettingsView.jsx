import React, { useState, useRef } from 'react';
import { useNotes } from '../context/NotesContext';
import styles from './SettingsView.module.css';
import { User, BarChart2, Database, Download, Upload, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';


const SettingsView = () => {
  const {
    notes,
    settings,
    setSettings,
    wipeDatabase,
    importData
  } = useNotes();

  const [username, setUsername] = useState(settings.username);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message: '' }
  const fileInputRef = useRef(null);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      showFeedback('error', 'Username cannot be empty');
      return;
    }
    setSettings((prev) => ({ ...prev, username: username.trim() }));
    showFeedback('success', 'Profile updated successfully!');
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(notes, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `yellow_notes_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showFeedback('success', 'Notes database exported successfully!');
    } catch {
      showFeedback('error', 'Failed to export notes database.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (content) {
        const success = importData(content);
        if (success) {
          showFeedback('success', 'Notes database imported successfully!');
        } else {
          showFeedback('error', 'Invalid file format. Please upload a valid Yellow Notes JSON backup file.');
        }
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = '';
  };

  const handleWipeDatabase = () => {
    if (confirm('CAUTION: This will permanently delete ALL notes and restore default settings. This action cannot be undone. Are you sure?')) {
      wipeDatabase();
      setUsername('Aesthetic Thinker');
      showFeedback('success', 'All notes deleted and settings reset.');
    }
  };

  // Compute statistics
  const totalNotes = notes.length;
  const activeNotes = notes.filter((n) => !n.isTrash && !n.isArchived).length;
  const pinnedNotes = notes.filter((n) => n.isPinned && !n.isTrash && !n.isArchived).length;
  const favoriteNotes = notes.filter((n) => n.isFavorite && !n.isTrash && !n.isArchived).length;
  const archivedNotes = notes.filter((n) => n.isArchived && !n.isTrash).length;
  const deletedNotes = notes.filter((n) => n.isTrash).length;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Settings</h2>

      {feedback && (
        <div className={`${styles.alert} ${feedback.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Profile Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <User size={20} />
          <span>Profile Configuration</span>
        </h3>
        <form onSubmit={handleSaveProfile}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="username">
              Display Name
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
              placeholder="e.g. John Doe"
            />
          </div>
          <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
            Save Changes
          </button>
        </form>
      </section>

      {/* Statistics Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <BarChart2 size={20} />
          <span>Notes Analytics</span>
        </h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{totalNotes}</span>
            <span className={styles.statLabel}>Total Saved</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{activeNotes}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{pinnedNotes}</span>
            <span className={styles.statLabel}>Pinned</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{favoriteNotes}</span>
            <span className={styles.statLabel}>Favorites</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{archivedNotes}</span>
            <span className={styles.statLabel}>Archived</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{deletedNotes}</span>
            <span className={styles.statLabel}>In Trash</span>
          </div>
        </div>
      </section>

      {/* Database Management Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Database size={20} />
          <span>Backup & Database Tools</span>
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
          Export your notes as a portable JSON file to back up your data or import notes from a previous backup. 
          Use the Factory Reset tool to wipe local storage clean.
        </p>
        <div className={styles.btnGroup}>
          <button onClick={handleExport} className={`${styles.btn} ${styles.btnOutline}`}>
            <Download size={16} />
            <span>Export Notes</span>
          </button>
          
          <button onClick={handleImportClick} className={`${styles.btn} ${styles.btnOutline}`}>
            <Upload size={16} />
            <span>Import Notes</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className={styles.fileInput}
            aria-label="Upload JSON notes backup"
          />

          <button onClick={handleWipeDatabase} className={`${styles.btn} ${styles.btnDanger}`}>
            <Trash2 size={16} />
            <span>Factory Reset</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default SettingsView;
