const express = require('express');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening at ${port}`));
app.use(express.static('public'));

admin.initializeApp({
    credential: admin.credential.cert(
        JSON.parse(Buffer.from(process.env.GOOGLE_FIREBASE_AUTH, 'base64').toString('utf-8')))
});
const db = admin.firestore();