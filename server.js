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

app.post('/notes', (req, res) => {
    db.collection('User List')
        .doc(req.body.userId)
        .collection('folders')
        .doc(req.body.folderId)
        .set({
            "folder_name": req.body.folderName
        })

    db.collection('User List')
        .doc(req.body.userId)
        .collection('notes')
        .doc(req.body.noteId)
        .set({
            "note_name": req.body.noteName,
            "content": req.body.content,
            "folder_id": req.body.folderId
        });

    res.json({
        message: "Updated Database"
    });
});

app.post('/user', (req, res) => {
    db.collection('User List')
        .doc(req.body.userId)
        .set({
            "name": req.body.name,
            "email": req.body.email
        });
    res.json({
        message: "Database ready"
    });
});

app.post('/notesList', (req, res) => {
    let notes = {};
    db.collection('User List')
        .doc(req.body.userId)
        .collection('notes')
        .get()
        .then(snapshot => {
            snapshot.forEach(note => {
                notes[note.id] = note.data();
            });
            res.json(notes);
        })
        .catch(err => console.log(err)); 
});