import React, { useState, useRef, useEffect } from 'react';
import './App.css';

/**
 * Notes app with theme mode (light/dark) support.
 */
// PUBLIC_INTERFACE
function App() {
  // Note structure: {id, title, content, lastModified}
  const [notes, setNotes] = useState(() => {
    // Try to restore from localStorage
    try {
      const stored = window.localStorage.getItem('notes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState({ title: '', content: '' });
  const [darkMode, setDarkMode] = useState(() => {
    // initial from prefers-color-scheme
    if (typeof window !== "undefined" && window.localStorage.getItem('theme-mode')) {
      return window.localStorage.getItem('theme-mode') === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const titleInputRef = useRef(null);

  // Color palettes per mode
  const colorPalette = darkMode
    ? {
        primary: '#18223c',
        secondary: '#262c32',
        accent: '#ffca28',
        bg: '#181818',
        text: '#fafafa',
        border: '#23242b',
      }
    : {
        primary: '#1976d2',
        secondary: '#424242',
        accent: '#ffca28',
        bg: '#fff',
        text: '#222',
        border: '#e0e0e0',
      };

  // Effect: toggle .dark-theme class on <body>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
    }
    try {
      window.localStorage.setItem('theme-mode', darkMode ? 'dark' : 'light');
    } catch {}
  }, [darkMode]);

  // Helpers
  function persistNotes(newNotes) {
    setNotes(newNotes);
    try {
      window.localStorage.setItem('notes', JSON.stringify(newNotes));
    } catch {}
  }

  // PUBLIC_INTERFACE
  function handleSelectNote(id) {
    setSelectedId(id);
    setEditing(false);
    const note = notes.find((n) => n.id === id);
    if (note) setNoteDraft({ title: note.title, content: note.content });
  }

  // PUBLIC_INTERFACE
  function handleCreateNote() {
    setEditing(true);
    setSelectedId(null);
    setNoteDraft({ title: '', content: '' });
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
  }

  // PUBLIC_INTERFACE
  function handleEditNote() {
    setEditing(true);
    const note = notes.find((n) => n.id === selectedId);
    if (note) {
      setNoteDraft({ title: note.title, content: note.content });
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }

  // PUBLIC_INTERFACE
  function handleDeleteNote() {
    if (selectedId == null) return;
    const newNotes = notes.filter((n) => n.id !== selectedId);
    persistNotes(newNotes);
    setSelectedId(null);
    setEditing(false);
    setNoteDraft({ title: '', content: '' });
  }

  // PUBLIC_INTERFACE
  function handleSaveNote(e) {
    e.preventDefault();
    if (!noteDraft.title.trim() && !noteDraft.content.trim()) {
      // Do not save empty note
      return;
    }
    let newNotes;
    if (selectedId == null) {
      // Create new
      const now = new Date().toISOString();
      const newNote = {
        id: Math.random().toString(36).substring(2, 10) + Date.now(),
        title: noteDraft.title.trim() || 'Untitled Note',
        content: noteDraft.content,
        lastModified: now,
      };
      newNotes = [newNote, ...notes];
      setSelectedId(newNote.id);
    } else {
      // Update
      newNotes = notes.map((n) =>
        n.id === selectedId
          ? { ...n, title: noteDraft.title.trim() || 'Untitled Note', content: noteDraft.content, lastModified: new Date().toISOString() }
          : n
      );
    }
    persistNotes(newNotes);
    setEditing(false);
  }

  // UI Elements
  function NoteList() {
    if (notes.length === 0)
      return <div className="notes-empty">No notes yet. Create a new one!</div>;
    return (
      <ul className="notes-list">
        {notes.map((n) => (
          <li
            key={n.id}
            className={'notes-list-item' + (n.id === selectedId ? ' selected' : '')}
            onClick={() => handleSelectNote(n.id)}
            tabIndex={0}
            style={{
              borderLeft: `4px solid ${
                n.id === selectedId ? colorPalette.primary : 'transparent'
              }`,
            }}
          >
            <div className="note-list-title">{n.title}</div>
            <div className="note-list-date">
              {new Date(n.lastModified).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  function NoteEditor() {
    return (
      <form className="note-editor" onSubmit={handleSaveNote}>
        <input
          ref={titleInputRef}
          className="note-title-input"
          value={noteDraft.title}
          maxLength={60}
          placeholder="Title"
          onChange={(e) => setNoteDraft((d) => ({ ...d, title: e.target.value }))}
          required
          style={{ borderColor: colorPalette.primary }}
        />
        <textarea
          className="note-content-input"
          value={noteDraft.content}
          placeholder="Your note..."
          rows={8}
          onChange={(e) => setNoteDraft((d) => ({ ...d, content: e.target.value }))}
          style={{ borderColor: colorPalette.primary }}
        />
        <div className="editor-actions">
          <button
            type="submit"
            className="btn"
            style={{
              backgroundColor: colorPalette.primary,
              color: '#fff',
              marginRight: 8,
            }}
          >
            {selectedId == null ? 'Create' : 'Save'}
          </button>
          <button
            type="button"
            className="btn"
            style={{
              backgroundColor: '#fff',
              color: colorPalette.primary,
              border: `1px solid ${colorPalette.primary}`,
            }}
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  function NoteDisplay() {
    if (selectedId == null) {
      return <div className="no-note-selected">Select a note or create a new one.</div>;
    }
    const note = notes.find((n) => n.id === selectedId);
    if (!note) return <div className="no-note-selected">Note not found.</div>;
    return (
      <div className="note-display">
        <div className="note-display-title">{note.title}</div>
        <div className="note-display-date">
          {new Date(note.lastModified).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
        <div className="note-display-content">{note.content || <span style={{color:'#888'}}>No content</span>}</div>
        <div className="note-display-actions">
          <button
            className="btn"
            style={{
              backgroundColor: colorPalette.primary,
              color: '#fff',
              marginRight: 8,
            }}
            onClick={handleEditNote}
          >
            Edit
          </button>
          <button
            className="btn"
            style={{
              backgroundColor: colorPalette.accent,
              color: '#333',
            }}
            onClick={handleDeleteNote}
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  // Responsive layout - single column on mobile, split on desktop
  return (
    <div className="app" style={{ background: colorPalette.bg, color: colorPalette.text }}>
      <nav className="navbar" style={{ background: colorPalette.primary, color: '#fff' }}>
        <div className="container" style={{ maxWidth: 1200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol" style={{ color: colorPalette.accent, marginRight: 4 }}>
                <svg width="18" height="18"><circle cx="9" cy="9" r="8" fill={colorPalette.accent}/></svg>
              </span>
              NoteEase
            </div>
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5em'
              }}>
              <button
                className="btn"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                style={{
                  backgroundColor: colorPalette.bg,
                  color: colorPalette.primary,
                  border: `1.5px solid ${colorPalette.primary}`,
                  fontWeight: 600,
                  padding: "9px 14px",
                  minWidth: 42,
                  marginRight: 6,
                }}
                onClick={() => setDarkMode((prev) => !prev)}
              >
                {darkMode ?
                  (<svg width="20" height="20" viewBox="0 0 20 20" style={{ display: "inline" }} aria-hidden>
                    <circle cx="10" cy="10" r="7.5" fill="#ffa400" stroke="none"/>
                    <circle cx="10" cy="10" r="5.5" fill={colorPalette.bg} stroke="none"/>
                  </svg>)
                  :
                  (<svg width="20" height="20" viewBox="0 0 20 20" style={{ display: "inline" }} aria-hidden>
                    <circle cx="10" cy="10" r="8" fill="#253b7a"/>
                    <circle cx="13" cy="8" r="6" fill={colorPalette.bg}/>
                  </svg>)
                }
              </button>
              <button className="btn"
                style={{
                  backgroundColor: colorPalette.accent,
                  color: colorPalette.secondary,
                  fontWeight: 600,
                  marginLeft: 4,
                }}
                onClick={handleCreateNote}
              >
                + New Note
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="notes-main-container">
          <aside className="notes-sidebar" aria-label="Notes List" style={{ borderRight: `1px solid ${colorPalette.border}` }}>
            <NoteList/>
          </aside>
          <section className="notes-editor-area">
            {editing ? (
              <NoteEditor />
            ) : (
              <NoteDisplay />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;