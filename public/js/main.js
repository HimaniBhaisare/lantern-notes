const socket = io();

const loadingScreen = document.getElementById('loadingScreen')
const textEditor = document.getElementById('textEditor');
const preview = document.getElementById('preview');
const modalContainer = document.getElementById("modalContainer");
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
const loginError = document.getElementById("loginError");
const signupError = document.getElementById("signupError");
const fpError = document.getElementById("fpError");

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
        openLoggedinWindow();
    else
        openLoginWindow();
}

function openLoggedinWindow() {
    notesListWindow.style.display = "none";
    signupWindow.style.display = "none";
    loginWindow.style.display = "none";
    fpWindow.style.display = "none";
    loggedinWindow.style.display = "flex";
}

function openLoginWindow() {
    notesListWindow.style.display = "none";
    loggedinWindow.style.display = "none";
    signupWindow.style.display = "none";
    fpWindow.style.display = "none";
    loginWindow.style.display = "flex";
}

function openSignupWindow() {
    notesListWindow.style.display = "none";
    loggedinWindow.style.display = "none";
    loginWindow.style.display = "none";
    fpWindow.style.display = "none";
    signupWindow.style.display = "flex";
}

function openFpWindow() {
    notesListWindow.style.display = "none";
    loggedinWindow.style.display = "none";
    signupWindow.style.display = "none";
    loginWindow.style.display = "none";
    fpWindow.style.display = "flex";
}

function openNotesList() {
    openModalContainer();
    loggedinWindow.style.display = "none";
    loginWindow.style.display = "none";
    fpWindow.style.display = "none";
    signupWindow.style.display = "none";
    notesListWindow.style.display = "flex";
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