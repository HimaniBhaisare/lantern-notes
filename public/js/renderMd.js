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
    if (e.keyCode == 9) {
        let mdText = e.target.value;
        let start = textEditor.selectionStart;
        let end = textEditor.selectionEnd;
        e.target.value = mdText.substring(0, start) + "\t" + mdText.substring(end);
        textEditor.selectionStart = textEditor.selectionEnd = start + 1;
        e.preventDefault();
    }
});

textEditor.addEventListener('keyup', e => {
    renderPreview(e.target.value);
    let currentNote = getLocalStorageNote();
    currentNote.content = e.target.value;
    setLocalStorageNote(currentNote);
});