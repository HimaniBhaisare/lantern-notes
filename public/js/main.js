const socket = io();

const loadingScreen = document.getElementById('loadingScreen')
const mdSection = document.getElementById('mdSection');
const noteSection = document.getElementById('noteSection');
const mdEditor = document.getElementById('mdEditor');
const preview = document.getElementById('preview');
const modalContainer = document.getElementById("modalContainer");
const collabWindow = document.getElementById("collabWindow");
const loginWindow = document.getElementById("loginWindow");
const signupWindow = document.getElementById("signupWindow");
const fpWindow = document.getElementById("fpWindow");
const loggedinWindow = document.getElementById("loggedinWindow");
const notesListWindow = document.getElementById("notesListWindow");
const notesListContent = document.getElementById("notesListContent");
const noteNameBox = document.getElementById("noteNameBox");
// const switchModeButton = document.getElementById('switchModeButton');
const syncButton = document.getElementById('syncButton');
const loginButton = document.getElementById("loginButton");
const fpButton = document.getElementById("fpButton");
const signupButton = document.getElementById("signupButton");
const signoutButton = document.getElementById("signoutButton");
const copyButton = document.getElementById("copyButton");
const loginError = document.getElementById("loginError");
const signupError = document.getElementById("signupError");
const fpError = document.getElementById("fpError");
const sessionIdspan = document.getElementById("sessionIdSpan");
const mainContents = document.querySelectorAll(".main-content");

const windowList = [collabWindow, loginWindow, signupWindow,
    fpWindow, loggedinWindow, notesListWindow];
let openedWindow;

const defaultNote = {
    "noteId": null,
    "folderId": "folder-0099a9be-11e0-4429-afc3-ef50e3a43668",
    "noteName": noteNameBox.textContent,
    "mdContent": mdEditor.textContent,
    "blockContent": "placeholder",
    "noteType": "NOTE"
};

const defaultSession = {
    "sessionId" : null,
    "adminId" : null,
    "userList" : [],
    "noteName" : "Collab note",
    "mdContent" : "Waiting for owner to start collaboration...",
    "blockContent" : "placeholder",
    "noteType": "NOTE",
    "active" : false,
    "action" : null,
    "message" : null
};

const blockEditor = new EditorJS({
    holder: 'noteEditor',
    tools: {
        paragraph: {
            class: Paragraph,
            inlineToolbar: true,
            config: {
                preserveBlank: true
            }
        },
        header: {
            class: Header,
            shortcut: 'CMD+SHIFT+H',
            config: {
              placeholder: 'Enter a header',
              levels: [1, 2, 3, 4, 5, 6],
              defaultLevel: 3,
            },
            inlineToolbar: true
        },
        list: {
            class: NestedList,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered'
            },
            shortcut: 'CMD+SHIFT+8'
        },
        checklist: {
            class: Checklist,
            inlineToolbar: true,
        },
        breakLine: {
            class: BreakLine,
            inlineToolbar: true,
            shortcut: 'CMD+SHIFT+ENTER',
        },
        inlineCode: {
            class: InlineCode,
            shortcut: 'CMD+SHIFT+M',
        },
        code: {
            class: CodeTool,
            shortcut: 'CMD+SHIFT+.',
            config: {
                placeholder: 'Start typing code...\n\nTo highlight the syntax in markdown,\nmention the language name in this format: %language% in first line.'
            }
        },
        table: {
            class: Table,
            inlineToolbar: true,
            config: {
                rows: 2,
                cols: 3,
            },
        },
        warning: {
            class: Warning,
            inlineToolbar: true,
            shortcut: 'CMD+SHIFT+W',
            config: {
                titlePlaceholder: 'Title',
                messagePlaceholder: 'Message',
            },
        },
        image: SimpleImage,
        embed: Embed,
    },
    placeholder: 'Write anything...',
    autofocus: true,
    logLevel: 'ERROR',
    onChange: saveNotesChange
});

let editorMode = getLocalEditorMode();
if (!editorMode) {
    editorMode = 'NOTE';
    setLocalEditorMode(editorMode);
}
switchModeTo(editorMode);

window.addEventListener('beforeunload', function (e) {
    if (!savedFlag) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Hide loading screen after 2 secs
function loadingFade() {
    setTimeout(() => {
        loadingScreen.style.display = "none";
    }, 1000);
}

let theme = window.localStorage.getItem("darkmode");
if(theme && theme == "true") {
    let btn = document.getElementById("themeSelector");
    let icon = btn.querySelector('i');
    icon.classList.toggle("fa-moon");
    icon.classList.toggle("fa-sun");
    document.body.classList.toggle("dark-theme");
}

function switchTheme(btn) {
    let icon = btn.querySelector('i');
    icon.classList.toggle("fa-moon");
    icon.classList.toggle("fa-sun");
    document.body.classList.toggle("dark-theme");

    let theme = window.localStorage.getItem("darkmode");
    if(!theme || theme == "false")
        window.localStorage.setItem("darkmode", "true");
    else
        window.localStorage.setItem("darkmode", "false");
}

function openModalContainer() {
    modalContainer.style.display = "block";
    mainContents.forEach(c => {
        c.style.filter = "blur(2px)";
    });
    window.onclick = (e) => {
        if (e.target == modalContainer) {
            if (openedWindow) {
                closeWindow(openedWindow);
            }
            closeModalContainer();
        }
    }
}

function closeModalContainer() {
    loginError.textContent = "";
    signupError.textContent = "";
    fpError.textContent = "";
    modalContainer.style.display = "none";
    mainContents.forEach(c => c.style.filter = "none");
}

function userLoginSignup() {
    if (getLocalUser()) {
        if (loggedinWindow.style.display != "none") {
            closeWindow("loggedinWindow");
        } else {
            openWindow("loggedinWindow");
        }
    }
    else {
        if (loginWindow.style.display != "none") {
            closeWindow("loginWindow");
        } else {
            openWindow("loginWindow");
        }
    }
}

function openWindow(id) {
    openedWindow = id;
    openModalContainer();
    windowList.forEach(window => {
        window.id === id ? window.style.display = "flex" : window.style.display = "none";
    });
}

function closeWindow(id) {
    closeModalContainer();
    windowList.forEach(window => {
        if (window.id === id) {
            window.style.display = "none";
        }
    });
}

async function switchModeTo(mode, isAutoTrigger = true) {
    let allowSwitch = false;
    let message = `Switching to ${mode == 'NOTE' ? 'block mode' : 'markdown mode'} might lead to formatting issues.\nAre you sure you want to continue?`;
    
    if (isAutoTrigger) {
        allowSwitch = true;
    } else {
        if (window.confirm(message)) {
            allowSwitch = true;
        } else {
            allowSwitch = false;
        }
    }
    
    if (allowSwitch) {
        if (!isAutoTrigger) {
            let currentNote = getLocalNote();
            currentNote.noteType = mode;
            if (editorMode == 'NOTE') {
                currentNote.mdContent = noteToMd(currentNote.blockContent);
            } else {
                currentNote.blockContent = await mdToNote(currentNote.mdContent);
            }
            setLocalNote(currentNote);
            syncNotes(syncButton);
        }
        editorMode = mode;
        setLocalEditorMode(mode);
        if (defaultNote) {
            defaultNote.noteType = editorMode;
        }
        if (defaultSession) {
            defaultSession.noteType = editorMode;
        }
        if (mode == 'NOTE') {
            mdSection.style.display = "none";
            noteSection.style.display = "flex";
        } else {
            mdSection.style.display = "flex";
            noteSection.style.display = "none";
        }
    }
}

function openNotesList() {
    if (notesListWindow.style.display != "none") {
        closeWindow("notesListWindow");
    } else {
        if(getLocalSession().active) {
            const alert = new Alert();
            alert.display("You cannot access other notes during a collaborative session!");
            return;
        }
        openWindow("notesListWindow");
    }
}

function collab() {
    let currentUser = getLocalUser();
    if (currentUser && currentUser.emailVerified) {
        if (collabWindow.style.display != "none") {
            closeWindow("collabWindow");
        } else {
            openWindow("collabWindow");
        }
    }
    else if (currentUser && !currentUser.emailVerified) {
        const alert = new Alert();
        alert.display("Verify email to collaborate with others!");
    }
    else if (!currentUser) {
        const alert = new Alert();
        alert.display("Login to collaborate with others!");
    }
}

// Switch view buttons
function toggleEditMode(btn) {
    let splitBtn = btn.parentNode.querySelector('.splitMode-button');
    let readBtn = btn.parentNode.querySelector('.readMode-button');
    readBtn.style.color = splitBtn.style.color = "#808080";
    btn.style.color = "#a972c9";

    preview.style.display = "none";
    if (mdEditor.style.display == "none") {
        mdEditor.style.display = "block";
    }
}

function toggleSplitMode(btn) {
    let editBtn = btn.parentNode.querySelector('.editMode-button');
    let readBtn = btn.parentNode.querySelector('.readMode-button');
    readBtn.style.color = editBtn.style.color = "#808080";
    btn.style.color = "#a972c9";

    if (mdEditor.style.display == "none") {
        mdEditor.style.display = "block";
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

    mdEditor.style.display = "none";
    if (preview.style.display == "none") {
        preview.style.display = "block";
    }
}

function getLocalEditorMode() {
    return window.localStorage.getItem("editorMode");
}

function setLocalEditorMode(mode) {
    window.localStorage.setItem("editorMode", mode);
}
