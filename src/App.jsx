import React from 'react';
import { NotesProvider, useNotes } from './context/NotesContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NotesGrid from './components/NotesGrid';
import NoteEditor from './components/NoteEditor';
import SettingsView from './components/SettingsView';
import Auth from './components/Auth';

const AppContent = () => {
  const { activeView, authMode } = useNotes();

  if (authMode === null) {
    return <Auth />;
  }

  return (
    <>
      <Sidebar />
      <div className="mainArea">
        <Header />
        <div className="contentWrapper">
          {activeView === 'settings' ? (
            <SettingsView />
          ) : (
            <>
              <NotesGrid />
              <NoteEditor />
            </>
          )}
        </div>
      </div>
    </>
  );
};

function App() {
  return (
    <NotesProvider>
      <AppContent />
    </NotesProvider>
  );
}

export default App;
