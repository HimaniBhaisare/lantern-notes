const express = require('express');
const admin = require('firebase-admin');
require('dotenv').config();

admin.initializeApp({
    credential: admin.credential.cert({
        "type": process.env.FIREBASE_TYPE,
        "project_id": process.env.FIREBASE_PROJECT_ID,
        "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
        "private_key" : process.env.FIREBASE_PRIVATE_KEY,
        "client_email" : process.env.FIREBASE_CLIENT_EMAIL,
        "client_id": process.env.FIREBASE_CLIENT_ID,
        "auth_uri": process.env.FIREBASE_AUTH_URI,
        "token_uri": process.env.FIREBASE_TOKEN_URI,
        "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL
    })
});
const db = admin.firestore();

data = {
    name: "Himani",
    animal: "Donkey"
};

db.collection('sampleDocs').doc('animals').update(data).then(() => {
    console.log('data added');
});

const app = express();
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening at ${port}`));
app.use(express.static('public'));