let localSession = getLocalSession();
if(localSession) {
    if(localSession.sessionId) {
        sessionIdspan.textContent = localSession.sessionId;
        let currentUser = getLocalUser();
        if(currentUser && localSession.adminId == currentUser.uid) {
            document.getElementById('startSession').style.display = "block";
            document.getElementById('startNewSession').style.display = "none";
            document.getElementById('collabDivider').style.display = "none";
            document.getElementById('collabJoin').style.display = "none";
            document.getElementById('collabJoined').style.display = "none";
        }
        else {
            document.getElementById('collabJoined').style.display = "block";
            document.getElementById('startSession').style.display = "none";
            document.getElementById('startNewSession').style.display = "none";
            document.getElementById('collabDivider').style.display = "none";
            document.getElementById('collabJoin').style.display = "none";
        }
        socket.emit('collabSession', localSession);
    }
    else {
        document.getElementById('startSession').style.display = "none";
        document.getElementById('startNewSession').style.display = "block";
        document.getElementById('collabDivider').style.display = "block";
        document.getElementById('collabJoin').style.display = "block";
        document.getElementById('collabJoined').style.display = "none";
    }
}
else
    setLocalSession(defaultSession);

function setLocalSession(session) {
    window.localStorage.setItem("session", JSON.stringify(session));
}

function getLocalSession() {
    return JSON.parse(window.localStorage.getItem("session"));
}

function startNewSession() {
    document.getElementById('startSession').style.display = "block";
    document.getElementById('startNewSession').style.display = "none";
    document.getElementById('collabDivider').style.display = "none";
    document.getElementById('collabJoin').style.display = "none";
    document.getElementById('collabJoined').style.display = "none";

    // Generate collab session id and store
    let currentUser = getLocalUser();
    let currentNote = getLocalNote();
    let sessionId = makeId(6);
    sessionIdspan.textContent = sessionId;
    let userInfo = {
        uid : currentUser.uid,
        name : currentUser.displayName
    };
    currentSession = {
        "sessionId" : sessionId,
        "adminId" : currentUser.uid,
        "userList" : [userInfo],
        "noteName" : currentNote.noteName,
        "mdContent" : currentNote.mdContent,
        "blockContent" : currentNote.blockContent,
        "noteType" : currentNote.noteType,
        "active" : true,
        "action" : "subscribe",
        "message" : null
    };

    copySessionId(document.getElementById("copyButton"));
    setLocalSession(currentSession);
    socket.emit('collabSession', currentSession);
}

function stopSession() {
    if(confirm("Are you sure you want to end this session?")) {
        document.getElementById('startSession').style.display = "none";
        document.getElementById('startNewSession').style.display = "block";
        document.getElementById('collabDivider').style.display = "block";
        document.getElementById('collabJoin').style.display = "block";
        document.getElementById('collabJoined').style.display = "none";

        let currentSession = getLocalSession();
        if(getLocalUser().uid == currentSession.adminId) {
            currentSession.adminId = null;
            currentSession.active = false;
            currentSession.action = "unsubscribe";
            currentSession.message = getLocalUser().displayName + " has stopped the collaborative session";
            socket.emit("collabSession", currentSession);
            setLocalSession(defaultSession);
        }
    }
}

function generateSessionId() {
    stopSession();
    startNewSession();
}

function copySessionId(btn) {
    const el = document.createElement('textarea');
    el.value = sessionIdspan.textContent;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    btn.textContent = "Copied!";

    setTimeout(() => {
        btn.textContent = "Copy to clipboard ";
        const i = document.createElement("i");
        i.setAttribute("class", "fa fa-clipboard fa-fw");
        btn.appendChild(i);
    }, 3000);
}

async function joinSession() {
    let sessionId = document.getElementById('collabJoinId').value;
    let currentUser = getLocalUser();
    let currentSession = {
        "sessionId" : null,
        "adminId" : null,
        "userList" : [],
        "noteName" : "Collab note",
        "mdContent" : "Waiting for owner to start collaboration...",
        "blockContent" : "placeholder",
        "noteType": editorMode,
        "active" : false,
        "action" : null,
        "message" : null
    };
    currentSession.sessionId = sessionId;
    currentSession.active = true;
    currentSession.action = "subscribe";
    currentSession.message = currentUser.displayName + " has joined the session!";
    let userInfo = {
        uid : currentUser.uid,
        name : currentUser.displayName
    };
    currentSession.userList.push(userInfo);
    await createNewNote()
    let currentNote = getLocalNote();
    currentNote.noteName  = currentSession.noteName = "Collab note";
    currentNote.mdContent = currentSession.mdContent = "Waiting for owner to start the session...";
    currentNote.blockContent = currentSession.blockContent = "placeholder";
    currentNote.noteType = currentSession.noteType = editorMode;
    await loadNoteToWindow(currentNote);
    setLocalNote(currentNote);
    setLocalSession(currentSession);
    socket.emit('collabSession', currentSession);

    document.getElementById('startSession').style.display = "none";
    document.getElementById('startNewSession').style.display = "none";
    document.getElementById('collabDivider').style.display = "none";
    document.getElementById('collabJoin').style.display = "none";
    document.getElementById('collabJoined').style.display = "block";
}

function leaveSession() {
    if(confirm("Are you sure you want to leave this session?")) {
        document.getElementById('startSession').style.display = "none";
        document.getElementById('startNewSession').style.display = "block";
        document.getElementById('collabDivider').style.display = "block";
        document.getElementById('collabJoin').style.display = "block";
        document.getElementById('collabJoined').style.display = "none";


        let currentSession = getLocalSession();
        currentSession.active = false;
        currentSession.action = "unsubscribe";
        currentSession.message = getLocalUser().displayName + " has left the session.";
        socket.emit("collabSession", currentSession);

        deleteNote(getLocalNote());
        setLocalSession(defaultSession);
        //  modify to send emit a message about user leaving the session later.
    }
}

function makeId(length) {
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}