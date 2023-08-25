let fetchedNotes = [];

let localNote = getLocalNote();
if (localNote) {
  loadNoteToWindow(localNote);
} else {
  localNote = defaultNote;
  setLocalNote(defaultNote);
}

let sortListBy = JSON.parse(window.localStorage.getItem('sortBy'));
if (!sortListBy)
  window.localStorage.setItem(
    'sortBy',
    JSON.stringify({ sortBy: 'noteName', direction: 'asc' }),
  );
else {
  let sortBtn = document.getElementById('sortAlpha');
  if (sortListBy.direction == 'desc') {
    sortBtn.setAttribute(
      'class',
      'fa fa-fw fa-sort-alpha-down-alt sort-button',
    );
  }
}

socket.on('userSession', async (session) => {
  let currentNote = getLocalNote();
  if (currentNote.noteId == session.note.noteId)
    await loadNoteToWindow(session.note);
  fetchNotes();
});

async function loadNoteToWindow(note) {
  noteNameBox.value = note.noteName;
  if (!note.noteType) {
    // For old markdowns
    switchModeTo('MD');
  } else if (editorMode != note.noteType) {
    switchModeTo(note.noteType);
  }

  await blockEditor.isReady;
  blockEditor.clear();
  if (note.content && !note.mdContent) {
    note.mdContent = note.content;
  }
  if (!note.blockContent) {
    note.blockContent = await mdToNote(note.mdContent);
  } else if (note.blockContent != 'placeholder') {
    await blockEditor.blocks.render(note.blockContent);
  }

  mdEditor.value = note.mdContent;
  renderPreview(note.mdContent);
  setLocalNote(note);
}

function getLocalNote() {
  return JSON.parse(window.localStorage.getItem('currentNote'));
}

function setLocalNote(note) {
  window.localStorage.setItem('currentNote', JSON.stringify(note));
}

function getLocalUser() {
  return JSON.parse(window.localStorage.getItem('currentUser'));
}

function setLocalUser(user) {
  window.localStorage.setItem('currentUser', JSON.stringify(user));
}

async function syncNotes(btn, isAutoTrigger = true) {
  let currentUser = getLocalUser();
  if (currentUser && currentUser.emailVerified) {
    let icon = btn.querySelector('i');
    icon.classList.toggle('fa-spin');
    //  Update the db
    let currentNote = getLocalNote();
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: currentUser.uid, note: currentNote }),
    };
    await fetch('/notes', options);

    let userSession = {
      userId: currentUser.uid,
      note: currentNote,
    };
    socket.emit('userSession', userSession);

    icon.classList.toggle('fa-spin');
    savedFlag = true;
  } else if (currentUser && !currentUser.emailVerified) {
    const alert = new Alert();
    alert.display('Verify email to sync notes to your account!');
  } else if (!currentUser && !isAutoTrigger) {
    const alert = new Alert();
    alert.display('Login first to sync notes!');
  }
}

noteNameBox.addEventListener('focusin', (e) => {
  //  Show scrollbar if inside the box
  e.target.select();
  e.target.style.overflowX = 'auto';
});

noteNameBox.addEventListener('focusout', (e) => {
  //  Hide the scrollbar and scroll to beginning
  e.target.style.overflowX = 'hidden';
  e.target.scrollLeft = 0;
  //  Update local storage if there's a name change
  let currentNote = getLocalNote();
  if (e.target.value != currentNote.noteName) {
    let noteName = e.target.value.slice(0, 24);
    currentNote.noteName = noteName;
    setLocalNote(currentNote);

    //  Update in collabs
    let currentSession = getLocalSession();
    if (currentSession.sessionId && currentSession.active) {
      currentSession.noteName = currentNote.noteName;
      setLocalSession(currentSession);
      socket.emit('collabSession', currentSession);
    }

    //  Sync the name change
    syncNotes(syncButton).then(() => fetchNotes());
  }
});

async function createNewNote() {
  if (getLocalSession().active) {
    const alert = new Alert();
    alert.display(
      'You cannot create new notes during a collaborative session!',
    );
    return;
  }

  let currentUser = getLocalUser();
  if (currentUser && currentUser.emailVerified) {
    //  Sync the current note before creating a new note.
    await syncNotes(syncButton);
    //  Create new note from default template and update local storage
    let newNote = defaultNote;
    newNote.noteId = 'note-' + uuidv4();
    await loadNoteToWindow(newNote);
    setLocalNote(newNote);
    //  Sync the new note
    await syncNotes(syncButton);
    //  and re-fetch the notes list.
    await fetchNotes();
  } else if (currentUser && !currentUser.emailVerified) {
    const alert = new Alert();
    alert.display('Verify email to create new notes!');
  } else if (!currentUser) {
    const alert = new Alert();
    alert.display('Login first to create new notes!');
  }
}

async function deleteNote(noteToDelete) {
  if (fetchedNotes.length == 1) {
    closeWindow('notesListWindow');
    await createNewNote();
    fetchedNotes.push(getLocalNote());
  }

  let currentNote = getLocalNote();
  let currentUser = getLocalUser();

  if (currentNote.noteId == noteToDelete.noteId) {
    for (i = 0; i < fetchedNotes.length; i++) {
      if (fetchedNotes[i].noteId == noteToDelete.noteId) {
        if (i == 0) {
          await switchNotes(fetchedNotes[i + 1]);
        } else if (i == fetchedNotes.length - 1) {
          await switchNotes(fetchedNotes[i - 1]);
        } else {
          await switchNotes(fetchedNotes[i + 1]);
        }
      }
    }
  }

  let options = {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      userId: currentUser.uid,
      noteId: noteToDelete.noteId,
    }),
  };
  await fetch('/deleteNote', options);
  await fetchNotes();
}

async function switchNotes(note) {
  if (!savedFlag) {
    //  Sync the current note before switching
    await syncNotes(syncButton);
  }
  closeWindow('notesListWindow');
  await loadNoteToWindow(note);
  setLocalNote(note);
  await fetchNotes();
}

async function sortByFn(btn) {
  btn.classList.toggle('fa-sort-alpha-down');
  btn.classList.toggle('fa-sort-alpha-down-alt');

  if (JSON.parse(window.localStorage.getItem('sortBy')).direction == 'asc')
    window.localStorage.setItem(
      'sortBy',
      JSON.stringify({ sortBy: 'noteName', direction: 'desc' }),
    );
  else
    window.localStorage.setItem(
      'sortBy',
      JSON.stringify({ sortBy: 'noteName', direction: 'asc' }),
    );

  await fetchNotes();
}

async function fetchNotes() {
  let currentUser = getLocalUser();
  notesListContent.innerHTML = '';

  let loader = document.getElementById('notesListLoader');

  if (currentUser && currentUser.emailVerified) {
    loader.style.display = 'block';

    let options = {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        userId: currentUser.uid,
        orderBy: JSON.parse(window.localStorage.getItem('sortBy')),
      }),
    };
    let res = await fetch('/notesList', options);
    let notes = await res.json();
    let keys = Object.keys(notes);
    fetchedNotes = [];
    keys.forEach((key) => {
      let noteListItem = document.createElement('li');

      if (key == getLocalNote().noteId)
        noteListItem.setAttribute('class', 'notes-list-item current-note');
      else noteListItem.setAttribute('class', 'notes-list-item');

      let notesListItemText = document.createElement('span');
      notesListItemText.setAttribute('class', 'notes-list-item-text');
      notesListItemText.textContent = notes[key].noteName;

      let delButton = document.createElement('i');
      delButton.setAttribute('class', 'fa fa-trash del-button');

      noteListItem.addEventListener(
        'mouseover',
        () => (delButton.style.color = 'var(--ui-window-del-button-hover)'),
      );
      noteListItem.addEventListener(
        'mouseout',
        () => (delButton.style.color = 'var(--ui-window-del-button)'),
      );

      noteListItem.appendChild(notesListItemText);
      noteListItem.appendChild(delButton);

      let note = notes[key];
      note.noteId = key; //  The note.data() recieved from server does not contain noteId attribute
      noteListItem.addEventListener('click', () => switchNotes(note));
      notesListContent.appendChild(noteListItem);

      fetchedNotes.push(note);
      delButton.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNote(note);
      });
    });
    loader.style.display = 'none';

    document.getElementById('sortAlpha').style.display = 'inline-block';
  } else {
    //  Notes list when not logged in or verified.
    let emptyListSpan = document.createElement('span');
    emptyListSpan.setAttribute('class', 'empty-list-span');
    if (currentUser && !currentUser.emailVerified) {
      emptyListSpan.textContent = 'Verify email to sync your notes';
    } else if (!currentUser) {
      emptyListSpan.textContent = 'Login to view your notes';
    }
    notesListContent.appendChild(emptyListSpan);

    document.getElementById('sortAlpha').style.display = 'none';
  }
}

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16),
  );
}
