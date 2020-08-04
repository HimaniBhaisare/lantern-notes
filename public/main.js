function loadingScreen() {
    setTimeout(() => {
        document.getElementById("loading-screen").style.display = "none";
        document.getElementById("main-page").style.display = "block";
    }, 2500);
}

const textEditor = document.querySelector('.text-editor');
const preview = document.querySelector('.preview');
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

const renderPreview = value => {
    const html = converter.makeHtml(value);
    preview.innerHTML = html;
    // highlightjs syntax highlighting for code blocks
    preview.querySelectorAll('pre code').forEach(block => {
        hljs.highlightBlock(block);
    });
}

// Handling tab key press
textEditor.addEventListener('keydown', e => {
    if (e.keyCode == 9) {
        const mdText = e.target.value;
        const start = textEditor.selectionStart;
        const end = textEditor.selectionEnd;
        e.target.value = mdText.substring(0, start) + "\t" + mdText.substring(end);
        textEditor.selectionStart = textEditor.selectionEnd = start + 1;
        e.preventDefault();
    }
});

//  Rendering markdown preview from textArea on keyup event
textEditor.addEventListener('keyup', e => {
    const mdText = e.target.value;
    window.localStorage.setItem("markdown", mdText);
    renderPreview(mdText);
});

//  Loading stored markdown
const storedMarkdown = window.localStorage.getItem("markdown");
if (storedMarkdown) {
    textEditor.value = storedMarkdown;
    renderPreview(storedMarkdown);
}

// Switch view buttons
function toggleEditMode(btn) {
    let splitBtn = btn.parentNode.querySelector('.splitMode-button');
    let readBtn = btn.parentNode.querySelector('.readMode-button');
    readBtn.style.color = splitBtn.style.color = "#a7a7a7";
    btn.style.color = "#e0bdfd";

    preview.style.display = "none";
    if(textEditor.style.display == "none") {
        textEditor.style.display = "block";
    }
}

function toggleSplitMode(btn) {
    let editBtn = btn.parentNode.querySelector('.editMode-button');
    let readBtn = btn.parentNode.querySelector('.readMode-button');
    readBtn.style.color = editBtn.style.color = "#a7a7a7";
    btn.style.color = "#e0bdfd";
    
    if(textEditor.style.display == "none") {
        textEditor.style.display = "block";
    }
    if(preview.style.display == "none") {
        preview.style.display = "block";
    }
}

function toggleReadMode(btn) {
    let editBtn = btn.parentNode.querySelector('.editMode-button');
    let splitBtn = btn.parentNode.querySelector('.splitMode-button');
    splitBtn.style.color = editBtn.style.color = "#a7a7a7";
    btn.style.color = "#e0bdfd";

    textEditor.style.display = "none";
    if(preview.style.display == "none") {
        preview.style.display = "block";
    }
}