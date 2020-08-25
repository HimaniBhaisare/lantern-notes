const textEditor = document.getElementById('textEditor');
const preview = document.getElementById('preview');
const modalContainer = document.getElementById("modalContainer");
const loginWindow = document.getElementById("loginWindow");
const signupWindow = document.getElementById("signupWindow");
const loggedinWindow = document.getElementById("loggedinWindow");
const notesListWindow = document.getElementById("notesListWindow");
const notesListContent = document.getElementById("notesListContent");

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

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

const defaultFolderId = "folder-0099a9be-11e0-4429-afc3-ef50e3a43668";

function switchTheme(btn) {
    let icon = btn.querySelector('i');
    icon.classList.toggle("fa-moon");
    icon.classList.toggle("fa-sun");
    document.body.classList.toggle("dark-theme");
}

function openModalContainer() {
    modalContainer.style.display = "block";
    window.onclick = (e) => {
        if (e.target == modalContainer) {
            modalContainer.style.display = "none";
        }
    }
}

function userLoginSignup(btn) {
    openModalContainer();
    if (firebase.auth().currentUser)
        openLoggedinWindow();
    else
        openLoginWindow();
}

function openLoggedinWindow() {
    notesListWindow.style.display = "none";
    signupWindow.style.display = "none";
    loginWindow.style.display = "none";
    loggedinWindow.style.display = "flex";
}

function openLoginWindow() {
    notesListWindow.style.display = "none";
    loggedinWindow.style.display = "none";
    signupWindow.style.display = "none";
    loginWindow.style.display = "flex";
}

function openSignupWindow() {
    notesListWindow.style.display = "none";
    loggedinWindow.style.display = "none";
    loginWindow.style.display = "none";
    signupWindow.style.display = "flex";
}

function openNotesList(btn) {
    openModalContainer();
    loggedinWindow.style.display = "none";
    loginWindow.style.display = "none";
    signupWindow.style.display = "none";
    notesListWindow.style.display = "flex";
}

function createNewNote(btn) {
    let currentUser = firebase.auth().currentUser;
    let noteId = "note-" + uuidv4();
    syncNotes(document.getElementById("syncButton"))
        .then(() => {
            let currentNote = {
                "userId": currentUser.uid,
                "noteId": noteId,
                "folderId": defaultFolderId,
                "noteName": "Welcome note",
                "folderName": "Default",
                "content": textEditor.textContent
            }
            window.localStorage.setItem("currentNote", JSON.stringify(currentNote));
            textEditor.value = textEditor.textContent;
            renderPreview(textEditor.textContent);
            syncNotes(document.getElementById("syncButton"));
        })
        .catch(err => console.log(err));
}

function switchNotes(userId, noteId) {
    syncNotes(document.getElementById("syncButton"))
        .then(() => {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "userId": userId, "noteId": noteId })
            }
            fetch('/switchNotes', options)
                .then(res => res.json())
                .then(note => {
                    let currentNote = {
                        "userId": userId,
                        "noteId": noteId,
                        "folderId": note.folderId,
                        "noteName": "Welcome note",
                        "folderName": "Default",
                        "content": note.content
                    }
                    window.localStorage.setItem("currentNote", JSON.stringify(currentNote));
                    textEditor.value = note.content;
                    renderPreview(note.content);
                })
                .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
}

function fetchNotes() {
    let currentUser = firebase.auth().currentUser;
    notesListContent.innerHTML = '';

    if(!currentUser) {
        let emptyListSpan = document.createElement("span"); // Notes list when not logged in or verified.
        emptyListSpan.setAttribute("class", "empty-list-span");
        emptyListSpan.textContent = "Login or Verify email to view your notes";
        notesListContent.appendChild(emptyListSpan);
    }
    else {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: currentUser.uid })
        }
        fetch('/notesList', options)
            .then(res => res.json())
            .then(notes => {
                let keys = Object.keys(notes);
                keys.forEach(key => {
                    let noteListItem = document.createElement("li");
                    noteListItem.setAttribute("class", "notes-list-item");
                    noteListItem.textContent = notes[key].noteName;
                    noteListItem.addEventListener("click", e => switchNotes(currentUser.uid, key));
                    notesListContent.appendChild(noteListItem);
                });
            })
            .catch(err => console.log(err));
    }
}

async function syncNotes(btn) {
    let currentUser = firebase.auth().currentUser;
    if (currentUser && currentUser.emailVerified) {
        let icon = btn.querySelector('i');
        icon.classList.toggle("fa-spin");
        if (!getLocalStorage()) {
            setLocalStorage();
        }
        let currentNote = getLocalStorage();
        currentNote.userId = currentUser.uid;
        window.localStorage.setItem("currentNote", JSON.stringify(currentNote));

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentNote)
        };
        await fetch('/notes', options)
            .then(res => {
                fetchNotes();
                setTimeout(() => icon.classList.toggle("fa-spin"), 2000);
            })
            .catch(err => console.log(err));
    }
    else if (currentUser && !currentUser.emailVerified) {
        alert("Verify email to sync notes to your account.")
    }
    else if (!currentUser) {
        alert("Login first to sync notes!")
    }
    return;
}

// Hide loading screen after 2 secs
function loadingFade() {
    setTimeout(() => {
        $("#loading-screen").fadeOut(0);
    }, 1000);
}

function renderPreview(mdText) {
    const html = converter.makeHtml(mdText);
    preview.innerHTML = html;
    // highlightjs syntax highlighting for code blocks
    preview.querySelectorAll('pre code').forEach(block => {
        hljs.highlightBlock(block);
    });
}

function setLocalStorage() {
    let currentNote = window.localStorage.getItem("currentNote");
    let mdText = textEditor.value;
    if (!currentNote) {
        let noteId = "note-" + uuidv4();
        let folderId = defaultFolderId;
        currentNote = {
            "userId": null,
            "noteId": noteId,
            "folderId": folderId,
            "noteName": "Welcome note",
            "folderName": "Default",
            "content": mdText
        }
        window.localStorage.setItem("currentNote", JSON.stringify(currentNote));
    }
    else {
        currentNote = JSON.parse(currentNote);
        currentNote.content = mdText;
        window.localStorage.setItem("currentNote", JSON.stringify(currentNote));
    }
}

function getLocalStorage() {
    return JSON.parse(window.localStorage.getItem("currentNote"));
}

// Handling tab key press
textEditor.addEventListener('keydown', e => {
    if (e.keyCode == 9) {
        let mdText = e.target.value;
        let start = textEditor.selectionStart;
        let end = textEditor.selectionEnd;
        e.target.value = mdText.substring(0, start) + "\t" + mdText.substring(end);
        textEditor.selectionStart = textEditor.selectionEnd = start + 1;
        e.preventDefault();
    }
});

//  Rendering markdown preview from textArea on keyup event
textEditor.addEventListener('keyup', e => {
    setLocalStorage();
    let currentNote = getLocalStorage();
    renderPreview(currentNote.content);
});

//  Loading stored markdown
let currentNote = getLocalStorage();
if (currentNote) {
    textEditor.value = currentNote.content;
    renderPreview(currentNote.content);
}

// Switch view buttons
function toggleEditMode(btn) {
    let splitBtn = btn.parentNode.querySelector('.splitMode-button');
    let readBtn = btn.parentNode.querySelector('.readMode-button');
    readBtn.style.color = splitBtn.style.color = "#808080";
    btn.style.color = "#a972c9";

    preview.style.display = "none";
    if (textEditor.style.display == "none") {
        textEditor.style.display = "block";
    }
}

function toggleSplitMode(btn) {
    let editBtn = btn.parentNode.querySelector('.editMode-button');
    let readBtn = btn.parentNode.querySelector('.readMode-button');
    readBtn.style.color = editBtn.style.color = "#808080";
    btn.style.color = "#a972c9";

    if (textEditor.style.display == "none") {
        textEditor.style.display = "block";
    }
    if (preview.style.display == "none") {
        preview.style.display = "block";
    }
}

function toggleReadMode(btn) {
    let editBtn = btn.parentNode.querySelector('.editMode-button');
    let splitBtn = btn.parentNode.querySelector('.splitMode-button');
    splitBtn.style.color = editBtn.style.color = "#808080";
    btn.style.color = "#a972c9";

    textEditor.style.display = "none";
    if (preview.style.display == "none") {
        preview.style.display = "block";
    }
}

function downloadHtml() {
    let title = "Lantern MD";
    hTag = preview.querySelector('h1') || preview.querySelector('h2') || preview.querySelector('h3');
    if (hTag) title = hTag.textContent;
    let htmlDoc = document.implementation.createHTMLDocument(title);

    htmlDoc.head.innerHTML = document.head.innerHTML;
    htmlDoc.head.querySelector('title').textContent = title;
    htmlDoc.head.querySelectorAll('link').forEach(link => {
        if (link.rel == "icon") {
            link.remove();
        }
    });

    htmlDoc.body.innerHTML = preview.innerHTML;
    htmlDoc.body.setAttribute('class', "preview");
    htmlDoc.body.style.padding = "60px 100px";
    document.body.querySelectorAll('script').forEach(script => {
        htmlDoc.body.append(script);
    });

    let fileAsBlob = new Blob([htmlDoc.documentElement.innerHTML], { type: 'text/html' });
    let downloadLink = document.createElement("a");
    downloadLink.download = title + ".html";
    // This is specific to chrome. Will have to modify when backend is integrated
    // Firefox uses window.URL.createObjectURL
    downloadLink.href = window.webkitURL.createObjectURL(fileAsBlob);
    downloadLink.click();
}