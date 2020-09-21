const defaultNote = {
    "noteId": null,
    "folderId": "folder-0099a9be-11e0-4429-afc3-ef50e3a43668",
    "noteName": noteNameBox.textContent,
    "content": textEditor.textContent
};

let fetchedNotes = [];

let localNote = getLocalStorageNote();
if (localNote)
    loadNoteToWindow(localNote);
else
    setLocalStorageNote(defaultNote);

socket.on('userSession', (session) => {
    let currentNote = getLocalStorageNote();
    if(currentNote.noteId == session.note.noteId)
        loadNoteToWindow(session.note);
    fetchNotes();
});

function loadNoteToWindow(note) {
    noteNameBox.value = note.noteName;
    textEditor.value = note.content;
    renderPreview(note.content);
}

function getLocalStorageNote() {
    return JSON.parse(window.localStorage.getItem("currentNote"));
}

function setLocalStorageNote(note) {
    window.localStorage.setItem("currentNote", JSON.stringify(note));
}

function getLocalStorageUser() {
    return JSON.parse(window.localStorage.getItem("currentUser"));
}

function setLocalStorageUser(user) {
    window.localStorage.setItem("currentUser", JSON.stringify(user));
}

async function syncNotes(btn) {
    let currentUser = getLocalStorageUser();
    if (currentUser && currentUser.emailVerified) {
        let icon = btn.querySelector('i');
        icon.classList.toggle("fa-spin");
        //  Update the db
        let currentNote = getLocalStorageNote();
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "userId": currentUser.uid, "note": currentNote })
        };
        await fetch('/notes', options);

        let userSession = {
            'userId' : currentUser.uid,
            'note' : currentNote
        }
        socket.emit('userSession', userSession);

        icon.classList.toggle("fa-spin");
    }
    else if (currentUser && !currentUser.emailVerified) {
        alert("Verify email to sync notes to your account.");
    }
    else if (!currentUser) {
        alert("Login first to sync notes!");
    }
}

noteNameBox.addEventListener('focusin', e => {
    //  Show scrollbar if inside the box
    e.target.style.overflowX = "auto";
});

noteNameBox.addEventListener('focusout', e => {
    //  Hide the scrollbar and scroll to beginning
    e.target.style.overflowX = "hidden";
    e.target.scrollLeft = 0;
    //  Update local storage if there's a name change
    let currentNote = getLocalStorageNote();
    if (e.target.value != currentNote.noteName) {
        currentNote.noteName = e.target.value;
        setLocalStorageNote(currentNote);

        //  Update in collabs
        let currentSession = getLocalStorageSession();
        if(currentSession.sessionId && currentSession.active) {
            currentSession.noteName = currentNote.noteName;
            setLocalStorageSession(currentSession);
            socket.emit('collabSession', currentSession);
        }

        //  Sync the name change
        syncNotes(syncButton)
            .then(() => fetchNotes());
    }
});

async function createNewNote() {
    let currentUser = getLocalStorageUser();
    if (currentUser && currentUser.emailVerified) {
        //  Sync the current note before creating a new note.
        await syncNotes(syncButton);
        //  Create new note from default template and update local storage
        let newNote = defaultNote;
        newNote.noteId = "note-" + uuidv4();
        loadNoteToWindow(newNote);
        setLocalStorageNote(newNote);
        //  Sync the new note
        await syncNotes(syncButton);
        //  and re-fetch the notes list.
        await fetchNotes();
    }
    else if (currentUser && !currentUser.emailVerified) {
        alert("Verify email to create new notes!");
    }
    else if (!currentUser) {
        alert("Login first to create new notes!");
    }
}

async function deleteNote(noteToDelete) {
    if(fetchedNotes.length == 1) {
        modalContainer.style.display = "none";
        await createNewNote();
        fetchedNotes.push(getLocalStorageNote());
    }
    
    let currentNote = getLocalStorageNote();
    let currentUser = getLocalStorageUser();

    if(currentNote.noteId == noteToDelete.noteId) {
        for(i = 0; i < fetchedNotes.length; i++) {
            if(fetchedNotes[i].noteId == noteToDelete.noteId) {
                if(i == 0) {
                    await switchNotes(fetchedNotes[i+1]);
                }
                else if(i == fetchedNotes.length - 1) {
                    await switchNotes(fetchedNotes[i-1]);
                }
                else {
                    await switchNotes(fetchedNotes[i+1]);
                }
            }
        }
    }

    let options = {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({ userId: currentUser.uid, noteId: noteToDelete.noteId })
    }
    await fetch('/deleteNote', options);
    await fetchNotes();
}

async function switchNotes(note) {
    let currentNote = getLocalStorageNote();
    if(currentNote.content != defaultNote.content || currentNote.noteName != defaultNote.noteName) {
        //  Sync the current note before switching
        await syncNotes(syncButton);
    }
    modalContainer.style.display = "none";
    loadNoteToWindow(note);
    setLocalStorageNote(note);
    await fetchNotes();
}

async function fetchNotes() {
    let currentUser = getLocalStorageUser();
    notesListContent.innerHTML = '';

    if (currentUser && currentUser.emailVerified) {
        let options = {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({ userId: currentUser.uid })
        }
        let res = await fetch('/notesList', options);
        let notes = await res.json();
        let keys = Object.keys(notes);
        fetchedNotes = [];
        keys.forEach(key => {
            let noteListItem = document.createElement("li");
            
            if(key == getLocalStorageNote().noteId)
                noteListItem.setAttribute("class", "notes-list-item current-note");
            else
                noteListItem.setAttribute("class", "notes-list-item");

            let notesListItemText = document.createElement("span");
            notesListItemText.setAttribute("class", "notes-list-item-text");
            notesListItemText.textContent = notes[key].noteName;

            let delButton = document.createElement("i");
            delButton.setAttribute("class", "fa fa-trash del-button");

            noteListItem.addEventListener("mouseover", () => delButton.style.color = "#ffffff");
            noteListItem.addEventListener("mouseout", () => delButton.style.color = "#d4d4d4");

            noteListItem.appendChild(notesListItemText);
            noteListItem.appendChild(delButton);

            let note = notes[key];
            note.noteId = key;  //  The note.data() recieved from server does not contain noteId attribute
            noteListItem.addEventListener("click", () => switchNotes(note));
            notesListContent.appendChild(noteListItem);

            fetchedNotes.push(note);
            delButton.addEventListener("click", (e) => {
                e.stopPropagation();
                deleteNote(note)
            });
        });
    }
    else {
        //  Notes list when not logged in or verified.
        let emptyListSpan = document.createElement("span");
        emptyListSpan.setAttribute("class", "empty-list-span");
        if (currentUser && !currentUser.emailVerified) {
            emptyListSpan.textContent = "Verify email to sync your notes";
        }
        else if (!currentUser) {
            emptyListSpan.textContent = "Login to view your notes";
        }
        notesListContent.appendChild(emptyListSpan);
    }
}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}