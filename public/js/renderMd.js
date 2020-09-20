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

function renderPreview(mdText) {
    const html = converter.makeHtml(mdText);
    preview.innerHTML = html;
    preview.querySelectorAll('pre code').forEach(block => {
        hljs.highlightBlock(block);
    });
}

//  Handling tab key press
textEditor.addEventListener('keydown', e => {
    if (e.keyCode == 9 || e.key == 9 || e.keyIdentifier == 9 || e.code == 9) {
        let mdText = e.target.value;
        let start = textEditor.selectionStart;
        let end = textEditor.selectionEnd;
        e.target.value = mdText.substring(0, start) + "\t" + mdText.substring(end);
        textEditor.selectionStart = textEditor.selectionEnd = start + 1;
        e.preventDefault();
    }
});

textEditor.addEventListener('keyup', e => {
    let mdText = e.target.value;
    renderPreview(mdText);

    let currentSession = getLocalStorageSession();
    if(currentSession.active) {
        currentSession.content = mdText;
        setLocalStorageSession(currentSession);
        socket.emit('collabSession', currentSession);
    }

    let currentNote = getLocalStorageNote();
    currentNote.content = mdText;
    setLocalStorageNote(currentNote);
});

socket.on('collabSession', (session) => {
    if(session.active) {
        // if new collaborator is joining, connect them.
        if(!session.adminId) {
            let currentSession = getLocalStorageSession();
            currentSession.userList.push(session.userList[0]);
            socket.emit('collabSession', currentSession);
            setLocalStorageSession(currentSession);
        }
        else {
            let currentNote = getLocalStorageNote();
            currentNote.noteName = session.noteName;
            currentNote.content = session.content;
            loadNoteToWindow(currentNote);
            setLocalStorageNote(currentNote);
            setLocalStorageSession(session);
        }
    }
    else {
        alert("Owner has ended the session!");
        //  will have to delete the current note and open the new collab window
        setLocalStorageSession(defaultSession);
    }
});