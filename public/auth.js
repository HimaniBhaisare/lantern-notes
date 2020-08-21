// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyAaddWAT8DhMqJKKutVPJixRO1blsG_l28",
    authDomain: "lantern-notes-18e80.firebaseapp.com",
    databaseURL: "https://lantern-notes-18e80.firebaseio.com",
    projectId: "lantern-notes-18e80",
    storageBucket: "lantern-notes-18e80.appspot.com",
    messagingSenderId: "758697682218",
    appId: "1:758697682218:web:1a591eb94706fb5e2eea53",
    measurementId: "G-8P5E87BCRY"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const email = document.getElementById("email");
const pass = document.getElementById("pass");
const login = document.getElementById("login");
const signup = document.getElementById("signup");
const signout = document.getElementById("signout");

login.addEventListener("click", e => {
    let emailVal = email.value;
    let passVal = pass.value;
    let auth = firebase.auth();

    let promise = auth.signInWithEmailAndPassword(emailVal, passVal);
    promise.catch(e => console.log(e.message));
});

signup.addEventListener("click", e => {
    let emailVal = email.value;
    let passVal = pass.value;
    let auth = firebase.auth();

    let promise = auth.createUserWithEmailAndPassword(emailVal, passVal);
    promise.catch(e => console.log(e.message));
});

signout.addEventListener("click", e => {
    firebase.auth().signOut();
});

firebase.auth().onAuthStateChanged(firebaseUser => {
    if (firebaseUser) {
        console.log("logged in!");

        let options = {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "email": firebaseUser.email, "userid": firebaseUser.uid })
        }
        fetch('/user', options)
            .then(res => res.json())
            .then(value => console.log(value.message))
            .catch(err => console.log(err));
    }
    else {
        console.log("logged out");
    }
})
