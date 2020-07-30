const express = require('express');
const app = express();

app.use(require('./temp_hum-obf'));
app.use(require('./sensores'));
app.use(require('./read_files'));

module.exports = app;