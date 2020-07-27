const textEditor = document.querySelector('.text-editor');
const preview = document.querySelector('.preview');
const converter = new showdown.Converter();

const renderPreview = value => {
    const html = converter.makeHtml(value);
    preview.innerHTML = html;
}

textEditor.addEventListener('keyup', e => {
    const {value} = e.target;

    window.localStorage.setItem("markdown", value);

    renderPreview(value);
});

const storedMarkdown = window.localStorage.getItem("markdown");

if(storedMarkdown) {
    textEditor.value = storedMarkdown;
    renderPreview(storedMarkdown);
}