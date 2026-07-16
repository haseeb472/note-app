/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isFirebaseSupported } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';

const NotesContext = createContext();

const DEFAULT_NOTES = [
  {
    id: 'welcome-note',
    title: 'Welcome to Yellow Notes! 📝',
    content: 'Yellow Notes is a premium, minimal, and lightning-fast note-taking app designed to boost your productivity.\n\nHere are a few things you can do:\n• **Pin** important notes to keep them at the top of your list.\n• Mark notes as **Favorites** for easy access.\n• **Archive** notes you want to save but keep out of sight.\n• Choose custom **Color Labels** to organize notes by category (e.g. Work, Ideas, Personal).\n\nFeel free to delete this note or start editing it to try out the editor!',
    isPinned: true,
    isFavorite: true,
    isArchived: false,
    isTrash: false,
    color: 'default',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'shortcuts-note',
    title: 'Tips & Organization 💡',
    content: 'Organizing your notes is easy with color codes and quick views:\n\n🎨 **Color Coding**:\n- Gray/Default: General ideas\n- Yellow: Priority tasks\n- Green: Goals & references\n- Blue: Work projects\n- Pink: Personal thoughts\n\n🔍 **Search & Filters**:\nUse the search bar at the top to instantly search through your titles and contents. Use the sidebar to filter notes by Favorites, Archive, or check your Trash.',
    isPinned: false,
    isFavorite: false,
    isArchived: false,
    isTrash: false,
    color: 'blue',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'ideas-note',
    title: 'Brainstorming: Project Nebula 🚀',
    content: '- Launch MVP by Q4 2026\n- Design modern dark UI\n- Integrate Framer Motion page transitions\n- Optimize for mobile touch gestures\n- Auto-save content state to Local Storage\n- Enable markdown rendering capabilities',
    isPinned: false,
    isFavorite: true,
    isArchived: false,
    isTrash: false,
    color: 'green',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export const NotesProvider = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('notes-app-theme');
    if (savedTheme) return savedTheme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Auth States
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState(() => {
    if (!isFirebaseSupported) return 'offline';
    return localStorage.getItem('notes-app-authmode') || null; // null triggers Auth gate
  });

  // Notes state (synced with either local storage or Firestore)
  const [notes, setNotes] = useState([]);

  // Active navigation view
  const [activeView, setActiveView] = useState('all'); // all, favorites, archive, trash, settings
  
  // Current active note in editor
  const [currentNoteId, setCurrentNoteId] = useState(null);

  // Search and Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt'); // updatedAt, createdAt, title

  // Settings state
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('notes-app-settings');
    return savedSettings ? JSON.parse(savedSettings) : { username: 'Aesthetic Thinker', avatarColor: '#FFD54F' };
  });

  // Sidebar toggle state (for mobile responsive design)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Apply theme class to document element on mount and change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('notes-app-theme', theme);
  }, [theme]);

  // Sync settings to local storage
  useEffect(() => {
    localStorage.setItem('notes-app-settings', JSON.stringify(settings));
  }, [settings]);

  // 1. Firebase Auth state listener
  useEffect(() => {
    if (!isFirebaseSupported) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setSettings({
          username: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          avatarColor: '#FFD54F'
        });
        localStorage.setItem('notes-app-authmode', 'firebase');
        setAuthMode('firebase');
        
        // Merge offline local notes to Firestore if any exist
        await mergeLocalNotesToCloud(firebaseUser.uid);
      } else {
        setUser(null);
        if (authMode === 'firebase') {
          setAuthMode(null);
          localStorage.removeItem('notes-app-authmode');
        }
      }
    });

    return () => unsubscribe();
  }, [authMode]);

  // 2. Load & Sync Notes based on Auth Mode
  useEffect(() => {
    let unsubscribeFirestore = () => {};

    if (authMode === 'firebase' && user) {
      // Sync from Firestore real-time
      const q = query(collection(db, 'notes'), where('userId', '==', user.uid));
      unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        const fetchedNotes = [];
        snapshot.forEach((doc) => {
          fetchedNotes.push({ id: doc.id, ...doc.data() });
        });
        setNotes(fetchedNotes);
        
        // Auto select first note if nothing is selected yet
        if (fetchedNotes.length > 0 && !currentNoteId) {
          const activeNotes = fetchedNotes.filter(n => !n.isTrash && !n.isArchived);
          if (activeNotes.length > 0) {
            setCurrentNoteId(activeNotes[0].id);
          }
        }
      });
    } else if (authMode === 'offline') {
      // Sync from Local Storage
      const savedNotes = localStorage.getItem('notes-app-notes');
      const localList = savedNotes ? JSON.parse(savedNotes) : DEFAULT_NOTES;
      setNotes(localList);
      
      const activeNotes = localList.filter(n => !n.isTrash && !n.isArchived);
      if (activeNotes.length > 0) {
        setCurrentNoteId(activeNotes[0].id);
      }
    } else {
      setNotes([]);
      setCurrentNoteId(null);
    }

    return () => unsubscribeFirestore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authMode, user]);

  // 3. Save notes to local storage ONLY in offline mode
  useEffect(() => {
    if (authMode === 'offline') {
      localStorage.setItem('notes-app-notes', JSON.stringify(notes));
    }
  }, [notes, authMode]);

  // Helper to merge local notes into Firestore on sign in/up
  const mergeLocalNotesToCloud = async (uid) => {
    const savedNotes = localStorage.getItem('notes-app-notes');
    if (!savedNotes) return;
    try {
      const parsed = JSON.parse(savedNotes);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const batch = writeBatch(db);
        parsed.forEach((note) => {
          // Exclude default notes to prevent cloud pollution unless modified
          const docRef = doc(db, 'notes', note.id);
          batch.set(docRef, {
            ...note,
            userId: uid,
            updatedAt: note.updatedAt || new Date().toISOString()
          });
        });
        await batch.commit();
        localStorage.removeItem('notes-app-notes');
      }
    } catch (e) {
      console.error('Error merging offline notes to cloud:', e);
    }
  };

  // Toggle Theme
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Auth Operations
  const login = async (email, password) => {
    if (!isFirebaseSupported) return;
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email, password, username) => {
    if (!isFirebaseSupported) return;
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: username });
    setSettings({ username, avatarColor: '#FFD54F' });
  };

  const loginOffline = () => {
    localStorage.setItem('notes-app-authmode', 'offline');
    setAuthMode('offline');
  };

  const logout = async () => {
    if (authMode === 'firebase') {
      await signOut(auth);
      localStorage.removeItem('notes-app-authmode');
      setUser(null);
    }
    setAuthMode(null);
    setNotes([]);
    setCurrentNoteId(null);
  };

  // Create new note
  const createNote = async () => {
    const newNote = {
      title: '',
      content: '',
      isPinned: false,
      isFavorite: false,
      isArchived: activeView === 'archive',
      isTrash: false,
      color: 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newId = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (authMode === 'firebase' && user) {
      try {
        await setDoc(doc(db, 'notes', newId), {
          ...newNote,
          userId: user.uid
        });
      } catch (e) {
        console.error('Error creating note in Firestore:', e);
      }
    } else {
      const fullNote = { id: newId, ...newNote };
      setNotes(prev => [fullNote, ...prev]);
    }

    setCurrentNoteId(newId);
    if (activeView === 'trash' || activeView === 'settings') {
      setActiveView('all');
    }
    setIsSidebarOpen(false);
  };

  // Update note details
  const updateNote = async (id, fields) => {
    if (authMode === 'firebase' && user) {
      try {
        await updateDoc(doc(db, 'notes', id), {
          ...fields,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error('Error updating note in Firestore:', e);
      }
    } else {
      setNotes(prev =>
        prev.map(note =>
          note.id === id
            ? {
                ...note,
                ...fields,
                updatedAt: new Date().toISOString()
              }
            : note
        )
      );
    }
  };

  // Move note to trash
  const deleteNote = async (id) => {
    if (authMode === 'firebase' && user) {
      try {
        await updateDoc(doc(db, 'notes', id), {
          isTrash: true,
          isPinned: false,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error('Error moving note to trash in Firestore:', e);
      }
    } else {
      setNotes(prev =>
        prev.map(note =>
          note.id === id
            ? { ...note, isTrash: true, isPinned: false }
            : note
        )
      );
    }

    // Adjust selected note if deleting current
    if (currentNoteId === id) {
      const remaining = notes.filter(n => n.id !== id && !n.isTrash && !n.isArchived);
      setCurrentNoteId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Pin / Unpin note
  const pinNote = async (id) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    if (authMode === 'firebase' && user) {
      try {
        await updateDoc(doc(db, 'notes', id), {
          isPinned: !note.isPinned,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error('Error pinning note in Firestore:', e);
      }
    } else {
      setNotes(prev =>
        prev.map(n => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
      );
    }
  };

  // Favorite / Unfavorite note
  const favoriteNote = async (id) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    if (authMode === 'firebase' && user) {
      try {
        await updateDoc(doc(db, 'notes', id), {
          isFavorite: !note.isFavorite,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error('Error updating favorite status in Firestore:', e);
      }
    } else {
      setNotes(prev =>
        prev.map(n => (n.id === id ? { ...n, isFavorite: !n.isFavorite } : n))
      );
    }
  };

  // Archive / Unarchive note
  const archiveNote = async (id) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    if (authMode === 'firebase' && user) {
      try {
        await updateDoc(doc(db, 'notes', id), {
          isArchived: !note.isArchived,
          isPinned: false,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error('Error archiving note in Firestore:', e);
      }
    } else {
      setNotes(prev =>
        prev.map(n =>
          n.id === id
            ? { ...n, isArchived: !n.isArchived, isPinned: false }
            : n
        )
      );
    }

    if (currentNoteId === id) {
      const remaining = notes.filter(n => n.id !== id && !n.isTrash && !n.isArchived);
      setCurrentNoteId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Restore note from Trash/Archive
  const restoreNote = async (id) => {
    if (authMode === 'firebase' && user) {
      try {
        await updateDoc(doc(db, 'notes', id), {
          isTrash: false,
          isArchived: false,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error('Error restoring note in Firestore:', e);
      }
    } else {
      setNotes(prev =>
        prev.map(note =>
          note.id === id ? { ...note, isTrash: false, isArchived: false } : note
        )
      );
    }
    setCurrentNoteId(id);
  };

  // Permanently delete note
  const deletePermanently = async (id) => {
    if (authMode === 'firebase' && user) {
      try {
        await deleteDoc(doc(db, 'notes', id));
      } catch (e) {
        console.error('Error permanently deleting note in Firestore:', e);
      }
    } else {
      setNotes(prev => prev.filter(note => note.id !== id));
    }
    
    if (currentNoteId === id) {
      setCurrentNoteId(null);
    }
  };

  // Empty Trash
  const clearTrash = async () => {
    const trashNotes = notes.filter(n => n.isTrash);
    
    if (authMode === 'firebase' && user) {
      try {
        const batch = writeBatch(db);
        trashNotes.forEach((n) => {
          batch.delete(doc(db, 'notes', n.id));
        });
        await batch.commit();
      } catch (e) {
        console.error('Error emptying trash in Firestore:', e);
      }
    } else {
      setNotes(prev => prev.filter(note => !note.isTrash));
    }
    setCurrentNoteId(null);
  };

  // Wipe database and start over
  const wipeDatabase = async () => {
    if (authMode === 'firebase' && user) {
      try {
        const batch = writeBatch(db);
        notes.forEach((n) => {
          batch.delete(doc(db, 'notes', n.id));
        });
        await batch.commit();
      } catch (e) {
        console.error('Error clearing database in Firestore:', e);
      }
    } else {
      setNotes([]);
      localStorage.removeItem('notes-app-notes');
    }
    setCurrentNoteId(null);
    setActiveView('all');
  };

  // Import JSON notes data
  const importData = async (jsonData) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed)) {
        const validated = parsed.filter(item => item.title !== undefined && item.content !== undefined);
        if (validated.length > 0) {
          if (authMode === 'firebase' && user) {
            const batch = writeBatch(db);
            validated.forEach((n) => {
              const newId = n.id || `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const docRef = doc(db, 'notes', newId);
              batch.set(docRef, {
                title: n.title || '',
                content: n.content || '',
                isPinned: n.isPinned || false,
                isFavorite: n.isFavorite || false,
                isArchived: n.isArchived || false,
                isTrash: n.isTrash || false,
                color: n.color || 'default',
                createdAt: n.createdAt || new Date().toISOString(),
                updatedAt: n.updatedAt || new Date().toISOString(),
                userId: user.uid
              });
            });
            await batch.commit();
          } else {
            const formatted = validated.map(n => ({
              id: n.id || `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: n.title || '',
              content: n.content || '',
              isPinned: n.isPinned || false,
              isFavorite: n.isFavorite || false,
              isArchived: n.isArchived || false,
              isTrash: n.isTrash || false,
              color: n.color || 'default',
              createdAt: n.createdAt || new Date().toISOString(),
              updatedAt: n.updatedAt || new Date().toISOString()
            }));
            setNotes(formatted);
          }
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Get count stats for sidebar badges
  const getStats = () => {
    return {
      all: notes.filter(n => !n.isTrash && !n.isArchived).length,
      favorites: notes.filter(n => n.isFavorite && !n.isTrash && !n.isArchived).length,
      archive: notes.filter(n => n.isArchived && !n.isTrash).length,
      trash: notes.filter(n => n.isTrash).length
    };
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        currentNoteId,
        setCurrentNoteId,
        activeView,
        setActiveView,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        theme,
        toggleTheme,
        settings,
        setSettings,
        isSidebarOpen,
        setIsSidebarOpen,
        createNote,
        updateNote,
        deleteNote,
        pinNote,
        favoriteNote,
        archiveNote,
        restoreNote,
        deletePermanently,
        clearTrash,
        wipeDatabase,
        importData,
        stats: getStats(),
        
        // Firebase additions
        user,
        authMode,
        login,
        register,
        loginOffline,
        logout,
        isFirebaseSupported
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};
