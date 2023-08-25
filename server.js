require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const socket = require('socket.io');

//  Express setup
const app = express();
const port = process.env.PORT || 5000;
const server = app.listen(port, () => console.log(`Listening at http://localhost:${port}`));
app.use(express.static('public'));
app.use(express.json({ limit: '1mb' }));

const io = socket(server);

io.on('connection', (socket) => {
    socket.on('userSession', (userSession) => {
        let userId = userSession.userId;
        socket.join(userId);
        socket.to(userId).emit('userSession', userSession);
    });

    socket.on('collabSession', (currentSession) => {
        let sessionId = currentSession.sessionId;
        if(currentSession.action == "subscribe") {
            socket.join(sessionId);
            socket.to(sessionId).emit('collabSession', currentSession);
        }
        else if(currentSession.action == "unsubscribe") {
            socket.to(sessionId).emit('collabSession', currentSession);
            socket.leave(sessionId)
        }
    });
});

//  Firestore setup
admin.initializeApp({
    credential: admin.credential.cert(
        JSON.parse(Buffer.from(process.env.GOOGLE_FIREBASE_AUTH, 'base64').toString('utf-8'))
    ),
});
const db = admin.firestore();
admin.firestore().settings({
    ignoreUndefinedProperties: true,
});

async function updateNotes(userId, note) {
    let folderRef = db.collection('users').doc(userId)
        .collection('folders').doc(note.folderId);
    //  Folder name can be later set from folderMetadata if adding a folder feature
    await folderRef.set({ "folderName": "Default" });

    let notesRef = db.collection('users').doc(userId)
        .collection('notes').doc(note.noteId);
    await notesRef.set({
        "noteName": note.noteName,
        "mdContent": note.mdContent,
        "blockContent": note.blockContent,
        "noteType": note.noteType,
        "folderId": note.folderId
    });
}

async function updateUserProfile(user) {
    let userRef = db.collection('users').doc(user.userId);
    await userRef.set({
        "name": user.name,
        "email": user.email
    });
}

app.post('/notes', (req, res) => {
    updateNotes(req.body.userId, req.body.note)
        .then(() => res.json({ message: "Database updated" }))
        .catch(err => console.log(err));
});

app.post('/deleteNote', (req, res) => {
    db.collection('users').doc(req.body.userId)
        .collection('notes').doc(req.body.noteId).delete()
        .then(() => res.json({ message: "Note deleted" }))
        .catch(err => console.log(err));
});

app.post('/users', (req, res) => {
    updateUserProfile(req.body)
        .then(() => res.json({ message: "profile updated" }))
        .catch(err => console.log(err));
});

app.post('/notesList', (req, res) => {
    let notes = {};
    db.collection('users').doc(req.body.userId)
        .collection('notes').orderBy(req.body.orderBy.sortBy, req.body.orderBy.direction).get()
        .then(snapshot => {
            snapshot.forEach(note => {
                notes[note.id] = note.data();
            });
            res.json(notes);
        })
        .catch(err => console.log(err));
});