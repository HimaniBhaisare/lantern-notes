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