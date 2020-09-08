function generateSessionId()
{
    const sessionId = "session-" + uuidv4();
    sessionIdspan.textContent = sessionId;
    copyButton.textContent = "Copy to clipboard ";
    const i = document.createElement("i");
    i.setAttribute("class", "fa fa-clipboard fa-fw");
    copyButton.appendChild(i);
}

function copySessionId(btn) {
    const el = document.createElement('textarea');
    el.value = sessionIdspan.textContent;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    btn.textContent = "Copied!";
}