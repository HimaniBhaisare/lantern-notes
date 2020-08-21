const express = require('express');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening at localhost:${port}`));
app.use(express.static('public'));
app.use(express.json({ limit: '1mb' }));

admin.initializeApp({
    credential: admin.credential.cert(
        JSON.parse(Buffer.from(process.env.GOOGLE_FIREBASE_AUTH, 'base64').toString('utf-8')))
});

const db = admin.firestore();

app.post('/notes', (req, res) => {
    db.collection('User List')
        .doc('aravind@email.com')
        .set({
            "email": "aravind@gmail.com",
            "folders": ["412342", "241343"],
            "name": "chutiyaa"
        });

    db.collection('User List')
        .doc('aravind@email.com')
        .collection('notes')
        .doc('note_id')
        .set(req.body);

    res.json({
        message: "Updated Database"
    });
});

app.post('/user', (req, res) => {
    db.collection('User List')
        .doc(req.body.userid)
        .set({
            "email": req.body.email,
            "folders": [],
            "name": "Kuku"
        });
    res.json({
        message: "User Created"
    });
});