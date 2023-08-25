const converter = new showdown.Converter({
    strikethrough: true,
    tables: true,
    tasklists: true,
    smoothLivePreview: true,
    parseImgDimensions: true,
    ghMentions: true,
    simpleLineBreaks: true,
    simplifiedAutoLink: true,
    literalMidWordUnderscores: true
});

let savedFlag = true;
let syncTimer = null;

function renderPreview(mdText) {
    const html = converter.makeHtml(mdText);
    preview.innerHTML = html;
    preview.querySelectorAll('pre code').forEach(block => {
        hljs.highlightBlock(block);
    });
}

//  Handling tab key press
mdEditor.addEventListener('keydown', e => {
    if (e.keyCode == 9 || e.key == "Tab" || e.keyIdentifier == 9 || e.code == "Tab") {
        let mdText = e.target.value;
        let start = mdEditor.selectionStart;
        let end = mdEditor.selectionEnd;
        e.target.value = mdText.substring(0, start) + "\t" + mdText.substring(end);
        mdEditor.selectionStart = mdEditor.selectionEnd = start + 1;
        e.preventDefault();
    }
});

mdEditor.addEventListener('keyup', async e => {
    let mdText = e.target.value;
    renderPreview(mdText);

    let currentSession = getLocalSession();
    if(currentSession.active) {
        currentSession.mdContent = mdText;
        setLocalSession(currentSession);
        socket.emit('collabSession', currentSession);
    }

    let currentNote = getLocalNote();
    currentNote.mdContent = mdText;
    // currentNote.noteType = editorMode;
    setLocalNote(currentNote);
    savedFlag = false;

    // Sync every 1.5 secs after an edit
    if(syncTimer) {
        clearTimeout(syncTimer);
        syncTimer = null;
    }
    syncTimer = setTimeout(() => syncNotes(syncButton), 1500);
});

socket.on('collabSession', async (session) => {
    if(session.active) {
        // if new collaborator is joining, connect them.
        if(!session.adminId) {
            let currentSession = getLocalSession();
            currentSession.userList.push(session.userList[0]);
            socket.emit('collabSession', currentSession);
            setLocalSession(currentSession);

            if(session.message) {
                const alert = new Alert();
                alert.display(session.message);
            }
        }
        else {
            let currentNote = getLocalNote();
            currentNote.noteName = session.noteName;
            currentNote.mdContent = session.mdContent;
            currentNote.blockContent = session.blockContent;
            currentNote.noteType = session.noteType;
            await loadNoteToWindow(currentNote);
            setLocalNote(currentNote);
            setLocalSession(session);

            if(session.message) {
                const alert = new Alert();
                alert.display(session.message);
            }
        }
    }
    else {
        if(session.message) {
            const alert = new Alert();
            alert.display(session.message);
        }

        //  will have to delete the current note and open the new collab window
        if(!session.adminId) {
            document.getElementById('startSession').style.display = "none";
            document.getElementById('startNewSession').style.display = "block";
            document.getElementById('collabDivider').style.display = "block";
            document.getElementById('collabJoin').style.display = "block";
            document.getElementById('collabJoined').style.display = "none";

            deleteNote(getLocalNote());
            setLocalSession(defaultSession);
        }
    }
});