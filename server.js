require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');

//  Express setup
const app = express();
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening at localhost:${port}`));
app.use(express.static('public'));
app.use(express.json({ limit: '1mb' }));

//  Firestore setup
admin.initializeApp({
    credential: admin.credential.cert(
        JSON.parse(Buffer.from(process.env.GOOGLE_FIREBASE_AUTH, 'base64').toString('utf-8'))
    )
});
const db = admin.firestore();

async function createFolder(user) {
    let folderRef = db.collection('users').doc(user.userId)
        .collection('folders').doc(user.folderId);
    await folderRef.set({ "folderName": user.folderName });
    let notesRef = db.collection('users').doc(user.userId)
        .collection('notes').doc(user.noteId);
    await notesRef.set({
        "noteName": user.noteName,
        "content": user.content,
        "folderId": user.folderId
    });
    return;
}

async function updateUserProfile(user) {
    let userRef = db.collection('users').doc(user.userId);
    await userRef.set({
        "name": user.name,
        "email": user.email
    });
    return;
}

app.post('/notes', (req, res) => {
    createFolder(req.body)
        .then(() => {
            res.json({
                message: "Updated Database"
            });
        })
        .catch(err => console.log(err));
});

app.post('/user', (req, res) => {
    updateUserProfile(req.body)
        .then(() => {
            res.json({
                message: "Profile ready"
            });
        })
        .catch(err => console.log(err));
});

app.post('/switchNotes', (req, res) => {
    db.collection('users').doc(req.body.userId)
        .collection('notes').doc(req.body.noteId).get()
        .then(note => {
            res.json(note.data());
        })
        .catch(err => console.log(err));
})

app.post('/notesList', (req, res) => {
    let notes = {};
    db.collection('users').doc(req.body.userId)
        .collection('notes').get()
        .then(snapshot => {
            snapshot.forEach(note => {
                notes[note.id] = note.data();
            });
            res.json(notes);
        })
        .catch(err => console.log(err));
});