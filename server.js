const express = require('express');
const lanternApp = express();

lanternApp.listen(5000, () => console.log("Listening in 5000"));
lanternApp.use(express.static('public'));