function downloadHtml() {
    let htmlString = mdToHtml();
    let fileAsBlob = new Blob([htmlString], { type: 'text/html' });
    let downloadLink = document.createElement("a");
    downloadLink.download = title + ".html";
    // This is specific to chrome. Will have to modify when backend is integrated
    // Firefox uses window.URL.createObjectURL
    downloadLink.href = window.webkitURL.createObjectURL(fileAsBlob);
    downloadLink.click();
}

function mdToHtml() {
    let title = "Lantern.io note";
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
    return htmlDoc.documentElement.innerHTML;
}