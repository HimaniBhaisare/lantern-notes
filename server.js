const express = require('express');
const app = express();

app.listen(5000, () => console.log("Listening in 5000"));
app.use(express.static('public'));