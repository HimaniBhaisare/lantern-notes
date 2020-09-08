const socket = io();

const loadingScreen = document.getElementById('loadingScreen')
const textEditor = document.getElementById('textEditor');
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

// Hide loading screen after 2 secs
function loadingFade() {
    setTimeout(() => {
        loadingScreen.style.display = "none";
    }, 1000);
}

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
            loginError.textContent = "";
            signupError.textContent = "";
            fpError.textContent = "";
            modalContainer.style.display = "none";
        }
    }
}

function userLoginSignup() {
    openModalContainer();
    if (getLocalStorageUser())
        openWindow("loggedinWindow");
    else
        openWindow("loginWindow");
}

const windowList = [collabWindow, loginWindow, signupWindow,
    fpWindow, loggedinWindow, notesListWindow];
function openWindow(id) {
    windowList.forEach(window => {
        window.id === id ? window.style.display = "flex" : window.style.display = "none";
    });
}

function openNotesList() {
    openModalContainer();
    openWindow("notesListWindow");
}

function collab() {
    let currentUser = getLocalStorageUser();
    if (currentUser && currentUser.emailVerified) {
        openModalContainer();
        openWindow("collabWindow");
    }
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