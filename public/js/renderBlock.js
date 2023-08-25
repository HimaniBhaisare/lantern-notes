async function saveNotesChange(api, event) {
  if (editorMode == 'NOTE') {
    try {
      await blockEditor.isReady;
      let blockContent = await blockEditor.save();
      let currentSession = getLocalSession();
      if (currentSession.active) {
        currentSession.blockContent = blockContent;
        setLocalSession(currentSession);
        socket.emit('collabSession', currentSession);
      }

      let currentNote = getLocalNote();
      currentNote.blockContent = blockContent;
      // currentNote.noteType = editorMode;
      setLocalNote(currentNote);
      savedFlag = false;

      // Sync every 1.5 secs after an edit
      if (syncTimer) {
        clearTimeout(syncTimer);
        syncTimer = null;
      }
      syncTimer = setTimeout(() => syncNotes(syncButton), 1500);
    } catch (err) {
      console.error(err);
    }
  }
}
